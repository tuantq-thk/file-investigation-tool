# Refactor notes — MVP navigation and module boundaries

- **Explore**: search, quick export, and evidence capture.
- **Investigations**: session creation, evidence review, notes, and report export. The redundant Reports tab is removed.
- **Help**: workflow documentation.
- `src/i18n/catalog.ts`: bilingual UI text and search-mode descriptions.
- `src/investigations/storage.ts`: session persistence boundary.
- `src-tauri/src/report.rs`: report rendering separated from search/command orchestration.

The refactor intentionally avoids changing Tauri command names, serialized response field names, or scan algorithms. It is a **limited structural refactor**, not the complete MVP quality gate. Rust and frontend builds must pass before release.
