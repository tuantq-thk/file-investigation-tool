# MVP hardening status (v0.4.3 RC)

## Implemented in this iteration
- Session creation uses a controlled dialog; Rust validates the folder at submit time. Active session switches only after localStorage persistence succeeds. Session storage errors stay visible.
- File-open failures now propagate into scan diagnostics rather than silently returning no matches.
- Per-file match cap is explicitly flagged in response (`perFileTruncated`) and Markdown report. More than 500 matches in a file is recorded as incomplete.
- Mode help `?` exposes brief usage hints. Expanded bilingual guide includes investigation workflow, scan diagnostics, privacy and troubleshooting.
- Mobile-width CSS guard and updated app version.

## Unresolved release blockers — NO-GO
- No Cargo toolchain and no npm dependencies in this environment. Rust build, TypeScript build and Tauri end-to-end tests are **not verified**.
- Streaming scanner, true backend cancellation, comprehensive architecture modularization, storage migration/backup, CSP hardening, symlink/race-proof export, lockfiles and multi-OS smoke tests are NOT implemented.
- No measured benchmark on large PHP/Laravel repositories.
- `SearchResponse` still returns a large synchronous payload; search coverage and file encoding limitations need further validation.
- Do not publish as MVP until clean builds and manual release gates pass.

## Local verification
1. `npm install` then `npm run build`.
2. `cargo test --manifest-path src-tauri/Cargo.toml`.
3. `npm run tauri dev`; choose source, create session via dialog, close/reopen app, confirm persistence.
4. Search a readable corpus containing >500 matching lines and confirm incomplete result warning.
5. Search unreadable file and inspect `read_error` details (OS/root privileges may affect repro).
6. Export Markdown outside source; verify evidence and scan diagnostics.
7. Repeat on macOS, Windows and Linux before release.
