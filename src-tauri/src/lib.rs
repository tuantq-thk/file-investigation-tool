mod report;
use report::{render_markdown, render_text};
use chrono::{DateTime, Utc};
use regex::{Regex, RegexBuilder};
use serde::{Deserialize, Serialize};
use std::{
    collections::HashSet,
    fs::{self, File},
    io::{BufRead, BufReader, Write},
    collections::VecDeque,
    path::{Path, PathBuf},
    time::{Duration, Instant, SystemTime},
};
use walkdir::{DirEntry, WalkDir};

const MAX_RESULTS: usize = 20_000;
const MAX_TEXT_FILE_BYTES: u64 = 8 * 1024 * 1024;
const IMAGE_EXTENSIONS: &[&str] = &["png", "jpg", "jpeg", "gif", "svg", "webp", "bmp", "ico", "avif"];

#[derive(Debug, Deserialize, Serialize, Clone)]
#[serde(rename_all = "camelCase")]
struct SearchRequest {
    root: String,
    mode: String,
    query: String,
    extensions: Vec<String>,
    ignored_dirs: Vec<String>,
    case_sensitive: bool,
    exact_match: bool,
    context_lines: usize,
    min_size_mb: Option<f64>,
    recent_days: Option<u64>,
}

#[derive(Debug, Deserialize, Serialize, Clone)]
#[serde(rename_all = "camelCase")]
struct SearchMatch {
    path: String,
    relative_path: String,
    line_number: Option<usize>,
    line: Option<String>,
    before: Vec<String>,
    after: Vec<String>,
    file_size: u64,
    modified_at: Option<String>,
}

#[derive(Debug, Deserialize, Serialize, Clone)]
#[serde(rename_all = "camelCase")]
struct SearchResponse {
    root: String,
    mode: String,
    query: String,
    files_scanned: usize,
    files_skipped: usize,
    skipped_reasons: std::collections::BTreeMap<String, usize>,
    scan_issues: Vec<ScanIssue>,
    scan_issues_truncated: bool,
    files_matched: usize,
    matches: Vec<SearchMatch>,
    elapsed_ms: u128,
    truncated: bool,
    per_file_truncated: usize,
}

#[derive(Debug, Deserialize, Serialize, Clone)]
#[serde(rename_all = "camelCase")]
struct ScanIssue { reason: String, path: String, message: String }

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct ExportRequest {
    output_path: String,
    format: String,
    search: SearchRequest,
    result: SearchResponse,
    include_context: bool,
}

#[tauri::command]
fn validate_source_folder(path: String) -> Result<String, String> {
    Ok(canonical_dir(&path)?.to_string_lossy().into_owned())
}

#[tauri::command]
fn search_files(request: SearchRequest) -> Result<SearchResponse, String> {
    let started = Instant::now();
    let root = canonical_dir(&request.root)?;
    let ignored: HashSet<String> = request.ignored_dirs.iter().map(|v| v.to_ascii_lowercase()).collect();
    let extensions: HashSet<String> = request.extensions.iter().map(|v| normalize_ext(v)).filter(|v| !v.is_empty()).collect();
    let matcher = build_matcher(&request)?;

    let mut files_scanned = 0usize;
    let mut files_skipped = 0usize;
    let mut skipped_reasons = std::collections::BTreeMap::<String, usize>::new();
    let mut skip = |reason: &str| { files_skipped += 1; *skipped_reasons.entry(reason.to_string()).or_default() += 1; };
    let mut scan_issues = Vec::<ScanIssue>::new();
    let mut scan_issues_truncated = false;
    let mut add_issue = |reason: &str, path: String, message: String| {
        if scan_issues.len() < 100 { scan_issues.push(ScanIssue { reason: reason.into(), path, message }); }
        else { scan_issues_truncated = true; }
    };
    let mut matched_files = HashSet::new();
    let mut matches = Vec::new();
    let mut truncated = false;
    let mut per_file_truncated = 0usize;

    let walker = WalkDir::new(&root)
        .follow_links(false)
        .into_iter()
        .filter_entry(|entry| should_visit(entry, &ignored, &root));

    for item in walker {
        let entry = match item {
            Ok(v) => v,
            Err(e) => { add_issue("walk_error", e.path().map(|p| p.display().to_string()).unwrap_or_else(|| "(unknown)".into()), e.to_string()); skip("walk_error"); continue; },
        };
        if !entry.file_type().is_file() {
            continue;
        }
        let path = entry.path();
        let metadata = match entry.metadata() {
            Ok(v) => v,
            Err(e) => { add_issue("metadata_error", path.display().to_string(), e.to_string()); skip("metadata_error"); continue; },
        };
        files_scanned += 1;

        if !mode_accepts_file(&request, path, &extensions, &metadata) {
            skip("filter");
            continue;
        }

        let relative = relative_path(&root, path);
        let modified_at = metadata.modified().ok().map(system_time_iso);

        match request.mode.as_str() {
            "filename" | "extension" | "images" | "large_files" | "recent_files" | "empty_files" => {
                if file_level_match(&request, path, &metadata, matcher.as_ref()) {
                    matched_files.insert(relative.clone());
                    matches.push(SearchMatch {
                        path: path.to_string_lossy().to_string(),
                        relative_path: relative,
                        line_number: None,
                        line: Some(file_summary(path, &metadata)),
                        before: vec![],
                        after: vec![],
                        file_size: metadata.len(),
                        modified_at,
                    });
                }
            }
            _ => {
                if metadata.len() > MAX_TEXT_FILE_BYTES { skip("oversized"); continue; }
                if likely_binary(path) { skip("binary_extension"); continue; }
                let file_matches = match search_text_file(path, &root, &request, &metadata, matcher.as_ref(), modified_at) {
                    Ok(v) => v,
                    Err(e) => { add_issue("read_error", relative.clone(), e.to_string()); skip("read_error"); continue; }
                };
                if file_matches.len() > 500 {
                    per_file_truncated += 1;
                    truncated = true;
                    add_issue("per_file_limit", relative.clone(), "More than 500 matching lines; only first 500 returned".into());
                }
                if !file_matches.is_empty() {
                    matched_files.insert(relative);
                    matches.extend(file_matches.into_iter().take(500));
                }
            }
        }

        if matches.len() >= MAX_RESULTS {
            matches.truncate(MAX_RESULTS);
            truncated = true;
            break;
        }
    }

    Ok(SearchResponse {
        root: root.to_string_lossy().to_string(),
        mode: request.mode.clone(),
        query: request.query.clone(),
        files_scanned,
        files_skipped,
        skipped_reasons,
        scan_issues,
        scan_issues_truncated,
        files_matched: matched_files.len(),
        matches,
        elapsed_ms: started.elapsed().as_millis(),
        truncated,
        per_file_truncated,
    })
}

#[tauri::command]
fn export_report(request: ExportRequest) -> Result<String, String> {
    let root = canonical_dir(&request.search.root)?;
    let output = absolute_output_path(&request.output_path)?;

    if path_is_inside(&output, &root) || (output.exists() && output.canonicalize().map(|p| p.starts_with(&root)).unwrap_or(false)) {
        return Err("Read-only protection: reports cannot be written inside the investigated source folder. Choose another location.".into());
    }

    if let Some(parent) = output.parent() {
        if !parent.exists() {
            return Err("The selected export directory does not exist.".into());
        }
    }

    if !request.format.eq_ignore_ascii_case("md") && !request.format.eq_ignore_ascii_case("txt") { return Err("Unsupported report format".into()); }
    let body = if request.format.eq_ignore_ascii_case("md") {
        render_markdown(&request)
    } else {
        render_text(&request)
    };

    // create_new prevents overwriting existing files and following an existing symlink.
    let mut file = fs::OpenOptions::new().write(true).create_new(true).open(&output)
        .map_err(|e| format!("Could not create report (choose a new filename): {e}"))?;
    file.write_all(body.as_bytes()).map_err(|e| format!("Could not export report: {e}"))?;
    Ok(output.to_string_lossy().to_string())
}

#[tauri::command]
fn export_investigation(root: String, output_path: String, body: String) -> Result<String, String> {
    if body.len() > 4_000_000 { return Err("Report exceeds 4 MB safety limit.".into()); }
    let root = canonical_dir(&root)?;
    let output = absolute_output_path(&output_path)?;
    if output.extension().and_then(|v| v.to_str()).map(|v| !v.eq_ignore_ascii_case("md") && !v.eq_ignore_ascii_case("txt")).unwrap_or(true) {
        return Err("Investigation reports must use the .md or .txt extension.".into());
    }
    if path_is_inside(&output, &root) || (output.exists() && output.canonicalize().map(|p| p.starts_with(&root)).unwrap_or(false)) {
        return Err("Read-only protection: choose a report destination outside the source folder.".into());
    }
    if !output.parent().map(|p| p.is_dir()).unwrap_or(false) { return Err("Export directory does not exist.".into()); }
    let mut file = fs::OpenOptions::new().write(true).create_new(true).open(&output)
        .map_err(|e| format!("Could not create report (choose a new filename): {e}"))?;
    file.write_all(body.as_bytes()).map_err(|e| format!("Could not write report: {e}"))?;
    Ok(output.to_string_lossy().to_string())
}

fn canonical_dir(value: &str) -> Result<PathBuf, String> {
    let path = PathBuf::from(value);
    let canonical = path.canonicalize().map_err(|_| "Source folder does not exist or cannot be read.".to_string())?;
    if !canonical.is_dir() {
        return Err("Selected source must be a directory.".into());
    }
    Ok(canonical)
}

fn absolute_output_path(value: &str) -> Result<PathBuf, String> {
    let path = PathBuf::from(value);
    if !path.is_absolute() { return Err("Export path must be absolute".into()); }
    let filename = path.file_name().ok_or("Export filename is missing")?;
    let parent = path.parent().ok_or("Export parent is missing")?;
    let canonical_parent = parent.canonicalize().map_err(|e| format!("Cannot resolve export directory: {e}"))?;
    if !canonical_parent.is_dir() { return Err("Export parent must be a directory".into()); }
    Ok(canonical_parent.join(filename))
}

fn path_is_inside(output: &Path, root: &Path) -> bool {
    let parent = output.parent().unwrap_or(output);
    match parent.canonicalize() {
        Ok(normalized_parent) => normalized_parent.starts_with(root),
        Err(_) => true, // Fail closed if the parent cannot be resolved.
    }
}

fn should_visit(entry: &DirEntry, ignored: &HashSet<String>, root: &Path) -> bool {
    if entry.path() == root || !entry.file_type().is_dir() {
        return true;
    }
    let name = entry.file_name().to_string_lossy().to_ascii_lowercase();
    !ignored.contains(&name)
}

fn normalize_ext(value: &str) -> String {
    value.trim().trim_start_matches('.').to_ascii_lowercase()
}

fn extension(path: &Path) -> String {
    path.extension().and_then(|x| x.to_str()).unwrap_or("").to_ascii_lowercase()
}

fn mode_accepts_file(request: &SearchRequest, path: &Path, extensions: &HashSet<String>, metadata: &fs::Metadata) -> bool {
    if request.mode == "images" {
        return IMAGE_EXTENSIONS.contains(&extension(path).as_str());
    }
    if request.mode == "empty_files" {
        return metadata.len() == 0;
    }
    if request.mode == "large_files" || request.mode == "recent_files" || request.mode == "filename" || request.mode == "extension" {
        return extensions.is_empty() || extensions.contains(&extension(path));
    }
    extensions.is_empty() || extensions.contains(&extension(path))
}

fn build_matcher(request: &SearchRequest) -> Result<Option<Regex>, String> {
    let pattern = match request.mode.as_str() {
        "regex" => request.query.clone(),
        "php_symbol" => {
            let q = regex::escape(request.query.trim());
            format!(r"(?x)\b(?:function|class|interface|trait|enum)\s+{q}\b|\b{q}\s*\(")
        }
        "todo" => r"\b(?:TODO|FIXME|HACK|XXX)\b".to_string(),
        "text" | "filename" => {
            let q = regex::escape(request.query.trim());
            if request.exact_match { format!(r"\b{q}\b") } else { q }
        }
        _ => return Ok(None),
    };

    RegexBuilder::new(&pattern)
        .case_insensitive(!request.case_sensitive && request.mode != "todo")
        .build()
        .map(Some)
        .map_err(|e| format!("Invalid search pattern: {e}"))
}

fn file_level_match(request: &SearchRequest, path: &Path, metadata: &fs::Metadata, matcher: Option<&Regex>) -> bool {
    match request.mode.as_str() {
        "filename" => matcher.map(|m| m.is_match(&path.file_name().unwrap_or_default().to_string_lossy())).unwrap_or(false),
        "extension" => {
            if !request.query.trim().is_empty() {
                extension(path) == normalize_ext(&request.query)
            } else if !request.extensions.is_empty() {
                request.extensions.iter().any(|e| normalize_ext(e) == extension(path))
            } else {
                true
            }
        }
        "images" => true,
        "large_files" => metadata.len() as f64 >= request.min_size_mb.unwrap_or(10.0).max(0.0) * 1024.0 * 1024.0,
        "recent_files" => {
            let cutoff = SystemTime::now().checked_sub(Duration::from_secs(request.recent_days.unwrap_or(7) * 86_400));
            match (cutoff, metadata.modified().ok()) {
                (Some(c), Some(m)) => m >= c,
                _ => false,
            }
        }
        "empty_files" => metadata.len() == 0,
        _ => false,
    }
}

fn search_text_file(
    path: &Path,
    root: &Path,
    request: &SearchRequest,
    metadata: &fs::Metadata,
    matcher: Option<&Regex>,
    modified_at: Option<String>,
) -> Result<Vec<SearchMatch>, String> {
    let file = File::open(path).map_err(|e| format!("open {}: {e}", path.display()))?;
    let regex = match matcher { Some(v) => v, None => return Ok(vec![]) };
    let context = request.context_lines.min(10);
    let mut out = Vec::new();
    let mut before: VecDeque<String> = VecDeque::with_capacity(context);
    let mut pending: Vec<(SearchMatch, usize)> = Vec::new();
    let mut line_number = 0usize;
    for line in BufReader::new(file).lines() {
        let line = line.map_err(|e| format!("read {}: {e}", path.display()))?;
        line_number += 1;
        for (matched, remaining) in pending.iter_mut() {
            if *remaining > 0 { matched.after.push(line.clone()); *remaining -= 1; }
        }
        let mut idx = 0;
        while idx < pending.len() {
            if pending[idx].1 == 0 { out.push(pending.remove(idx).0); }
            else { idx += 1; }
        }
        if regex.is_match(&line) {
            let matched = SearchMatch {
                path: path.to_string_lossy().to_string(),
                relative_path: relative_path(root, path),
                line_number: Some(line_number), line: Some(line.clone()),
                before: before.iter().cloned().collect(), after: Vec::new(),
                file_size: metadata.len(), modified_at: modified_at.clone(),
            };
            pending.push((matched, context));
        }
        if context > 0 {
            before.push_back(line);
            if before.len() > context { before.pop_front(); }
        }
        // Read the 501st match to signal per-file truncation accurately.
        if out.len() + pending.len() > 500 { break; }
    }
    out.extend(pending.into_iter().map(|(matched, _)| matched));

    Ok(out)
}

fn likely_binary(path: &Path) -> bool {
    matches!(extension(path).as_str(), "zip" | "gz" | "7z" | "rar" | "pdf" | "exe" | "dll" | "so" | "dylib" | "woff" | "woff2" | "ttf" | "mp3" | "mp4" | "mov" | "avi") || IMAGE_EXTENSIONS.contains(&extension(path).as_str())
}

fn relative_path(root: &Path, path: &Path) -> String {
    path.strip_prefix(root).unwrap_or(path).to_string_lossy().replace('\\', "/")
}

fn system_time_iso(value: SystemTime) -> String {
    let dt: DateTime<Utc> = value.into();
    dt.to_rfc3339()
}

fn file_summary(path: &Path, metadata: &fs::Metadata) -> String {
    format!("{} · {} bytes", path.file_name().unwrap_or_default().to_string_lossy(), metadata.len())
}


#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![search_files, export_report, export_investigation, validate_source_folder])
        .run(tauri::generate_context!())
        .expect("error while running File Investigation Tool");
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn extension_normalization() {
        assert_eq!(normalize_ext(" .PHP "), "php");
        assert_eq!(normalize_ext(".ts"), "ts");
    }

    #[test]
    fn text_matcher_respects_case() {
        let request = SearchRequest {
            root: String::new(), mode: "text".into(), query: "OrderService".into(),
            extensions: vec![], ignored_dirs: vec![], case_sensitive: true,
            exact_match: false, context_lines: 2, min_size_mb: None, recent_days: None,
        };
        let matcher = build_matcher(&request).unwrap().unwrap();
        assert!(matcher.is_match("OrderService"));
        assert!(!matcher.is_match("orderservice"));
    }

    #[test]
    fn root_protection_checks_path_boundaries() {
        let root = Path::new("/tmp/project");
        assert!(Path::new("/tmp/project/report.md").starts_with(root));
        assert!(!Path::new("/tmp/project-other/report.md").starts_with(root));
    }
    #[test]
    fn reject_relative_export_paths() {
        assert!(absolute_output_path("relative/report.md").is_err());
    }

    #[test]
    fn streaming_match_preserves_context() {
        let root = std::env::temp_dir().join(format!("fit-test-{}", std::process::id()));
        fs::create_dir_all(&root).unwrap();
        let path = root.join("example.php");
        fs::write(&path, "before\nneedle\nafter\n").unwrap();
        let request = SearchRequest {
            root: root.to_string_lossy().into_owned(), mode: "text".into(), query: "needle".into(),
            extensions: vec![], ignored_dirs: vec![], case_sensitive: false,
            exact_match: false, context_lines: 1, min_size_mb: None, recent_days: None,
        };
        let matcher = build_matcher(&request).unwrap().unwrap();
        let matches = search_text_file(&path, &root, &request, &fs::metadata(&path).unwrap(), Some(&matcher), None).unwrap();
        assert_eq!(matches.len(), 1);
        assert_eq!(matches[0].line_number, Some(2));
        assert_eq!(matches[0].before, vec!["before"]);
        assert_eq!(matches[0].after, vec!["after"]);
        fs::remove_dir_all(root).unwrap();
    }

}
