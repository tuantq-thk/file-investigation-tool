# Release Quality Gate — v0.4.0 RC

## Implemented
- Search presets, editable settings, grouped results, copy paths, quick exports.
- Session-based evidence collection with duplicate prevention, notes and status.
- Structured Markdown report with search scope, truncation and skipped-file details.
- App-local persistence; read-only source and Rust-controlled report creation.
- Sticky sidebar, dark-theme styling, inline validation messages.

## Required before v1.0.0 (not verified here)
- [ ] Install dependencies; run `npm run build` successfully.
- [ ] Run `cargo test --manifest-path src-tauri/Cargo.toml` and `npm run tauri build`.
- [ ] Test Linux, macOS and Windows artifacts and release CI.
- [ ] Test report exports outside source, inside source, through symlinked parents, existing files, and invalid paths.
- [ ] Test UTF-8 and non-UTF-8 PHP source, unreadable files, large files, deep trees, large result sets and hidden directories.
- [ ] Verify evidence persistence across restart, duplicate capture, deletion, source switching, local-storage exhaustion and report fidelity.
- [ ] Benchmark with Laravel repositories of realistic size; inspect CPU/RAM and responsiveness.

## Known limits
- Text-based PHP symbol detection is not AST reference resolution.
- Search engine currently runs to completion without cancellation/progress events.
- Source code snippets persisted in WebView local storage are not encrypted.
- Reports are snapshots, not proof of complete change-impact coverage.
- Per-file and global match limits can cause missed matches; check coverage statistics.
