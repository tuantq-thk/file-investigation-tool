# v0.4.9 RC — Release readiness (NOT v1.0.0)

## Implemented in this iteration
- Selecting a folder auto-validates the canonical path; manual paths retain explicit verification.
- Search has a live status and clearer incomplete/error states; text/PHP default remains.
- Users can open Create Session from search results and use Evidence + to open the session dialog.
- Invalid local session JSON no longer silently becomes a valid empty dataset; backup of previous valid snapshot is written before updates and can be restored.
- Rust text search uses bounded line buffering rather than loading the entire file, with 501st match detection.
- Export requires absolute path, canonical parent, valid format, and create_new to prevent overwrite.
- Keyboard focus visibility, small typography, and smaller Tauri min window width improved.
- Added two Rust regression tests (not executed here).

## Known incomplete release gates — do NOT mark passed
- No real backend cancellation/progress events yet; search command is still synchronous.
- No npm/Cargo lockfiles, no reproducible clean checkout build verified.
- No Rust tests run in this environment (cargo unavailable).
- No full frontend type-check (dependencies unavailable offline).
- No macOS/Windows/Linux smoke, installer, signature, artifact verification.
- No measured 10k/50k/100k benchmark; no published performance threshold.
- CSP remains null: must be designed and tested with Tauri IPC before release.
- LocalStorage backup is only a single rolling snapshot, not durable import/export recovery.
- Session creation from results requires adding evidence afterward; it does not auto-capture matches.
- UX accessibility and keyboard flows require hands-on verification.

## Manual QA steps
1. Open Explore, choose PHP folder, verify it auto-validates; search without clicking Verify.
2. Run text search; verify live status, result coverage, skipped reasons and partial warnings.
3. Click Create Session from results; create a session; use Evidence + on a result.
4. Open Investigations, confirm session, edit title/note, export MD and TXT outside source.
5. Restart app; verify session persisted; test invalid storage and recovery with a backup.
6. Attempt export inside source, to existing file, to symlink and nonexistent directory; all must fail.
7. Resize to 720px, keyboard Tab/Enter/Escape and screen reader check.
8. Run npm install && npm run build && npm run tauri build; cargo test --manifest-path src-tauri/Cargo.toml.

## Release decision
NO-GO for v1.0.0 until all gates are actually tested and passed. User checklist checkmarks are goals, not verification evidence.
