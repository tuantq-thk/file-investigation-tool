use super::ExportRequest;

pub(super) fn render_markdown(request: &ExportRequest) -> String {
    let r = &request.result;
    let mut out = String::new();
    out.push_str("# File Investigation Report\n\n");
    out.push_str("## Summary\n\n");
    out.push_str(&format!("- **Source:** `{}`\n", escape_ticks(&r.root)));
    out.push_str(&format!("- **Mode:** `{}`\n", r.mode));
    if !r.query.is_empty() { out.push_str(&format!("- **Query:** `{}`\n", escape_ticks(&r.query))); }
    out.push_str(&format!("- **Files scanned:** {}\n- **Files skipped:** {}\n- **Files matched:** {}\n- **Matches:** {}\n- **Elapsed:** {} ms\n", r.files_scanned, r.files_skipped, r.files_matched, r.matches.len(), r.elapsed_ms));
    for (reason, count) in &r.skipped_reasons { out.push_str(&format!("- **Skipped ({reason}):** {count}\n")); }
    if r.truncated { out.push_str("- **Warning:** Incomplete results: safety limit or per-file limit reached.\n"); }
    out.push_str(&format!("- **Files with per-file truncation:** {}\n", r.per_file_truncated));
    for issue in &r.scan_issues { out.push_str(&format!("- **Scan issue [{}]:** {} — {}\n", issue.reason, issue.path, issue.message)); }
    if !request.search.ignored_dirs.is_empty() { out.push_str(&format!("- **Ignored directories:** {}\n", request.search.ignored_dirs.join(", "))); }
    out.push_str("\n## Results\n\n");

    let mut last_path = String::new();
    for m in &r.matches {
        if m.relative_path != last_path {
            if !last_path.is_empty() { out.push('\n'); }
            out.push_str(&format!("### `{}`\n\n", escape_ticks(&m.relative_path)));
            last_path = m.relative_path.clone();
        }
        if let Some(line_no) = m.line_number { out.push_str(&format!("**Line {}**\n\n", line_no)); }
        if let Some(line) = &m.line {
            if request.include_context && (!m.before.is_empty() || !m.after.is_empty()) {
                out.push_str("```text\n");
                for v in &m.before { out.push_str(v); out.push('\n'); }
                out.push_str(line); out.push('\n');
                for v in &m.after { out.push_str(v); out.push('\n'); }
                out.push_str("```\n\n");
            } else {
                out.push_str("```text\n"); out.push_str(line); out.push_str("\n```\n\n");
            }
        }
    }
    out
}

pub(super) fn render_text(request: &ExportRequest) -> String {
    let r = &request.result;
    let mut out = String::new();
    out.push_str("FILE INVESTIGATION REPORT\n=========================\n\n");
    out.push_str(&format!("Source: {}\nMode: {}\nQuery: {}\nFiles scanned: {}\nFiles skipped: {}\nFiles matched: {}\nMatches: {}\nElapsed: {} ms\nIgnored: {}\n\n", r.root, r.mode, r.query, r.files_scanned, r.files_skipped, r.files_matched, r.matches.len(), r.elapsed_ms, request.search.ignored_dirs.join(", ")));
    for m in &r.matches {
        out.push_str(&format!("{}{}\n", m.relative_path, m.line_number.map(|n| format!(":{n}")).unwrap_or_default()));
        if request.include_context {
            for v in &m.before { out.push_str(&format!("  | {v}\n")); }
        }
        if let Some(line) = &m.line { out.push_str(&format!("  > {line}\n")); }
        if request.include_context {
            for v in &m.after { out.push_str(&format!("  | {v}\n")); }
        }
        out.push('\n');
    }
    out
}

fn escape_ticks(value: &str) -> String { value.replace('`', "\\`") }
