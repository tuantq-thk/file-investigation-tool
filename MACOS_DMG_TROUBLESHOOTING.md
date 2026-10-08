# macOS DMG troubleshooting

The `failed to run .../bundle_dmg.sh` line is a wrapper error, not the root cause. Check the lines above it in the build log.

Try a short path without spaces, and rebuild:

```bash
mv "$HOME/Downloads/file-investigation-tool 9" "$HOME/Downloads/fit-build"
cd "$HOME/Downloads/fit-build"
npm run tauri build -- --bundles app
npm run tauri build -- --bundles dmg --verbose 2>&1 | tee dmg-build.log
```

The first command tests the .app bundle separately from DMG. If .app succeeds and DMG fails, inspect `dmg-build.log` for hdiutil, AppleScript, permission or icon errors.

This project has PNG/ICO icons only. If DMG packaging reports an icon problem, generate a proper `src-tauri/icons/icon.icns` using Tauri's icon generator and add it to `bundle.icon`. Do not treat missing icns as the proven cause without the underlying log.
