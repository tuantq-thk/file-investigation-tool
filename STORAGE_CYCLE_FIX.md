# White screen fix: circular module dependency

Root cause: `investigation.ts` re-exported functions from `investigations/storage.ts`, while `storage.ts` imported `STORAGE_KEY` from `investigation.ts`. `BACKUP_KEY` was evaluated before `STORAGE_KEY` initialization (JavaScript temporal dead zone).

Fix: `STORAGE_KEY` now lives in `investigations/storage.ts`, alongside `BACKUP_KEY`. `investigation.ts` re-exports the key for compatibility. The key string remains `fit-investigations-v1`; no stored sessions are migrated, removed, or rewritten by this patch.

Validation: inspect import graph and run `npm run build` then `npm run tauri dev` on a machine with dependencies. Verify opening app with existing sessions, Investigations, creating sessions, and backup restore. Full runtime validation not performed in this environment.
