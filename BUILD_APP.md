# Dong goi File Investigation Tool thanh ung dung desktop

`npm run tauri dev` chi dung khi phat trien. Nguoi dung cuoi khong can Node.js, npm hay terminal sau khi ban da build ung dung.

## Build tren macOS

```bash
npm install
npm run tauri build
```

Sau khi build, xem trong:

- `src-tauri/target/release/bundle/macos/` - ung dung `.app`
- `src-tauri/target/release/bundle/dmg/` - bo cai `.dmg` (neu target kha dung)

Ban co the keo `.app` vao Applications hoac chia se `.dmg`.

## Build tren Windows

Chay tren may Windows:

```powershell
npm install
npm run tauri build
```

Output nam trong `src-tauri/target/release/bundle/`, thuong gom bo cai Windows phu hop voi toolchain Tauri hien tai.

## Build tren Linux

```bash
npm install
npm run tauri build
```

Output nam trong `src-tauri/target/release/bundle/`, tuy distro/toolchain co the co AppImage, deb hoac rpm.

## Luu y cross-platform

Tauri tao binary native. Cach on dinh nhat la build installer tren chinh he dieu hanh dich:

- macOS -> build ban macOS
- Windows -> build ban Windows
- Linux -> build ban Linux

Neu muon phat hanh ca 3 he dieu hanh tu mot repo, nen dung GitHub Actions matrix build trong phase tiep theo.

## Nguyen tac read-only

Build desktop khong thay doi invariant cua ung dung: source folder chi duoc doc. Thao tac ghi duy nhat la report `.txt`/`.md` do nguoi dung chu dong chon noi luu, va backend chan luu report vao trong source folder dang dieu tra.
