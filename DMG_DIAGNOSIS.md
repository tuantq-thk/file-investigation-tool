# macOS DMG failure diagnosis

`failed to run bundle_dmg.sh` is only a wrapper error. A real fix requires stderr from the failing `hdiutil`/`osascript` command.

1. Build the .app without DMG: `npm run tauri build -- --bundles app`
2. Build DMG with full log: `npm run tauri build -- --bundles dmg --verbose 2>&1 | tee dmg-build.log`
3. Search the log for the *first* `hdiutil`, `osascript`, `Resource busy`, `Operation not permitted`, `No such file`, or `error:` line before `failed to run bundle_dmg.sh`.
4. If a .app is produced, use that for local smoke testing while DMG diagnosis continues. Do not label it a distributable signed build.
5. If `hdiutil` reports mount conflict, inspect `hdiutil info` and detach only the stale image associated with this project. Do not indiscriminately detach disks.
6. If the failure is an icon error, use `npm run tauri icon src-tauri/icons/icon.png` to generate `icon.icns`, then rebuild. This is conditional, not a confirmed diagnosis.

Avoid deleting existing investigation data or clearing WebView storage to fix a packaging error.
