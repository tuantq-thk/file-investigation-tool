# MVP Phase Acceptance Criteria

## Phase 1 — Search core

**Goal:** reliably answer “where is this thing?” without remembering shell commands.

Acceptance:
- User chooses exactly one root folder.
- Default ignore set is checked: `.git`, `node_modules`, `vendor`, `dist`, `build`.
- Every default ignore can be unchecked.
- Text, regex, filename, extension searches return normalized relative paths.
- Content matches include line number and optional context.
- Source folder remains untouched.

## Phase 2 — File investigation

**Goal:** cover the most common investigation tasks without pretending to be a language server.

Acceptance:
- PHP symbol heuristic handles declarations and common invocations.
- Images can be listed without reading their binary payload as text.
- Large/recent/empty files are discoverable by metadata only.
- TODO/FIXME/HACK/XXX scans are available.
- Symlink traversal is disabled.

## Phase 3 — Result UX

**Goal:** optimize scanning and evidence review, not visual decoration.

Acceptance:
- Strong information hierarchy: source → query/options → summary → files → evidence.
- Results group by file and expose match count.
- Preview keeps context visually subordinate and hits visually dominant.
- Empty, error, loading states are explicit.
- UI remains bounded under excessive result sets.

## Phase 4 — Export

**Goal:** produce evidence that can be attached to tickets, reviews, or AI-assisted follow-up.

Acceptance:
- TXT and Markdown export.
- Report records source, mode, query, ignores, scan counts, elapsed time and evidence.
- Export is a deliberate user action.
- Backend blocks any export destination inside the investigated source folder.
