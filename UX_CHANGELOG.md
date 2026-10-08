# UX improvements v0.4.8 RC

- Fixed scan diagnostics padding and vertical rhythm.
- Separated destructive Delete session from report export controls.
- Added Markdown (default) and plain TXT Evidence Report formats; Rust export command allows only .md/.txt and retains create_new/read-only protections.
- Added lightweight, escaped syntax highlighting for PHP, JavaScript/TypeScript, SQL, JSON and CSS snippets. This is not a full language parser.
- Moved optional filters and ignored directories under Advanced search; mode-specific required size/time controls remain visible.
- Unified investigation picker sizing and increased code preview font.
- Preserved existing localStorage schema and Tauri command names.

## Verification

TypeScript TSX syntax transpilation and ZIP integrity were checked. Full npm build and Rust/Tauri builds remain unverified in this environment due to missing dependencies/Cargo.

## Manual QA

1. Explore: text search with default options, then expand Advanced search and change filters.
2. Large/recent files: verify numeric control is visible without expanding Advanced.
3. Investigations: create/open existing session, delete confirmation, export .md and .txt to a destination outside source.
4. Inspect PHP/JS/SQL snippets and verify syntax colors and original text content.
5. Expand scan diagnostics and check padding in light/dark themes.
6. Verify Tauri prevents report writes inside source and overwriting existing files.
