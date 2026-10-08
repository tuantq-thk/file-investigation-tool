# v0.4.9 white-screen hotfix

- Remove `queueMicrotask(setStorageFailure)` from React state initialization. Initialize session data and error atomically via a single lazy state initializer.
- Add `AppErrorBoundary` at the React root so render errors show actionable diagnostics instead of a blank window.
- Do not clear or overwrite stored investigations on startup failure.

## Verify
1. Run `npm install && npm run build && npm run tauri dev`.
2. Test startup with existing valid investigations.
3. In WebView DevTools > Application > Local Storage, back up `fit-investigations-v1`, then deliberately set invalid JSON; reload and confirm the app still renders with recovery warning. Restore the original value afterward.
4. Confirm Investigations opens, session creation works, and export still works.
5. If a startup error screen appears, share its message and DevTools Console trace.

This hotfix has not passed a complete Tauri desktop build in the current environment.
