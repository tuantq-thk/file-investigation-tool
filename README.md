# File Investigation Tool

Cross-platform **read-only source investigation** desktop application, built with Tauri 2, Rust, React, TypeScript and Vite. Author: **TuanTQ**.

## Features

- Search text, regex, filenames, extensions, PHP symbols, TODO/FIXME markers.
- Inspect images, large/recent/empty files; grouped evidence with line numbers and context.
- Optional textual PHP reference search (occurrences, **not** AST-based call graph).
- Extension presets, customizable ignored directories (`.git`, `node_modules`, `vendor`, `dist`, `build` initially checked).
- Source path input, browse and validation; light/dark themes; Vietnamese (default) / English; in-app guide.
- Export TXT or Markdown reports **outside** the source directory.

## Safety model

The scanner opens source files read-only. It never edits, renames, deletes, indexes, or caches inside the selected source. Symlink traversal is disabled. Report output is rejected if its resolved location is within the source folder. Users should still avoid selecting confidential repositories if reports may be shared externally. Search uses limits of 8 MiB per text file and 20,000 matches.

## Requirements

- Node.js 20+ (22 recommended), npm, Rust stable, platform-specific [Tauri prerequisites](https://v2.tauri.app/start/prerequisites/).
- Linux: WebKit2GTK 4.1 and additional system packages listed in `.github/workflows/release.yml`.

## Local development

```bash
npm install
npm run tauri dev
```

## Native desktop build

```bash
npm run tauri build
```

Build installers are placed under `src-tauri/target/release/bundle/`. Users install the native app and **do not need npm or a terminal**. Build on the intended OS. macOS binaries are not Apple-notarized by default; Windows builds are not code-signed by default.

## How to use

1. Browse to a source folder or paste an absolute path, then click **Validate / Kiểm tra**.
2. Choose a tool in the collapsible sidebar.
3. Enter a query or select extension presets; optionally uncheck directories you want scanned.
4. Click **Search / Tìm kiếm**. No result panel is shown until a search completes.
5. Inspect matching files and line context; export TXT/MD to a location outside the source folder.

For `get_site_link`, select **PHP symbol** to find declarations. Enable **Include references** to search text occurrences across PHP files. Text matches may include declarations, comments, strings and calls; they are **not** a verified invocation graph.

## GitHub Releases: automated cross-platform builds

1. Create a GitHub repository and push this project (including `.github/workflows/release.yml`).
2. Enable **Actions** and grant **Read and write permissions** to `GITHUB_TOKEN` under Settings → Actions → General → Workflow permissions.
3. Commit version changes in `package.json`, `src-tauri/Cargo.toml`, and `src-tauri/tauri.conf.json`.
4. Push an annotated release tag:

```bash
git add .
git commit -m "release: v0.3.1"
git tag -a v0.3.1 -m "File Investigation Tool v0.3.1"
git push origin main
git push origin v0.3.1
```

5. GitHub Actions builds on macOS, Windows and Linux, and creates a **draft** GitHub Release. Verify assets before publishing the draft. End users download installers from **Releases**, no clone required.

> Note: macOS signing/notarization and Windows code signing require certificates and additional CI secrets. Unsigned releases can trigger OS warnings. Linux distro compatibility may vary.

## Versioning / contributions

Use semantic versions (`vMAJOR.MINOR.PATCH`). Open a feature branch, submit PR, run `npm run build` and native Tauri smoke checks on your target OS, then merge to `main` and tag. Keep source read-only invariants covered in code review. See `BUILD_APP.md` for additional OS details.

## License

Copyright © 2026 TuanTQ. All rights reserved unless a separate LICENSE file is added.

## UX updates in v0.3.1

- Three task-oriented sidebar entries: content search, file discovery, file inspection. Choose specific search mode from the page selector.
- Dark theme uses neutral charcoal surfaces, restrained blue selection, and readable code highlights.
- Source verification is a compact icon adjacent to Browse; validation errors appear next to the folder field.
- Query validation errors appear next to the query input. Search/runtime errors remain in the action area.
- Removed the confusing text-reference checkbox. PHP symbol mode remains definition-oriented pattern matching; use Text search for occurrences, which are not guaranteed to be actual function calls.
- Search only reads source. Report export must target a location outside the selected source tree.

### QA before publishing

Run `npm install && npm run build && npm run tauri build` on a supported machine. Smoke-test folder validation, mode switching, each scan mode, TXT/MD exports, and dark/light UI. Native builds were not executed in the authoring environment.

## v0.4.0 RC — Investigation workflow

- **Explore:** search presets (PHP definitions, possible usages, SQL keywords, TODO, table/column, config filenames). Presets prefill editable search settings; they are not a dependency analyzer.
- **Investigations:** create an investigation tied to the currently verified source directory, collect selected search hits via **Evidence +**, annotate each item as possible/confirmed/excluded, and write findings.
- **Reports:** export a combined Markdown Evidence Report containing all recorded searches, coverage statistics, selected evidence, notes, conclusions and limitations. Quick TXT/MD exports remain available from search results.
- **Storage:** sessions and evidence excerpts are stored in the app WebView's local storage, **not in the investigated source**. Up to 20 sessions, 300 evidence items per session, 100 search runs per session, and ~2 million serialized characters overall. Delete old sessions after exporting; local app data is not encrypted and should be treated as sensitive if the source is confidential.
- **Safety:** source scanning is read-only. Both report paths are validated by Rust and must be outside the source; exports create new files only. Reports contain excerpts copied at search time, which may be stale after source changes.
- **Sidebar:** stays visible while scrolling the main content on desktop.

### Release checks still required

Run `npm install && npm run build`, `cargo test --manifest-path src-tauri/Cargo.toml`, and the Tauri desktop build on each target OS. Verify search correctness and export protection on a large real-world PHP/Laravel repository. This RC is **not** tagged v1.0.0.


## v0.4.1 RC — Session and scan diagnostics

- Creating an investigation validates the source folder directly; it no longer depends on visiting Explore or a fragile previously-verified UI state.
- Investigations and Reports expose source selection and verification in place.
- Scan diagnostics explain filter skips and expose up to 100 path-specific traversal, metadata and content-read errors. A truncated indicator appears when more than 100 errors occur.
- Product positioning is bilingual, with the three core values shown discreetly in the footer.
- Full frontend and Rust builds remain required before a production release.

### v0.4.2 RC hotfix
- Fix Rust E0277: `ScanIssue` now derives `Deserialize` because `SearchResponse` is deserialized when exporting a report.
