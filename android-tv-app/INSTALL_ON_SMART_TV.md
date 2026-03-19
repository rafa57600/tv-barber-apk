# Install BarberSHOP TV APK on Android/Google TV

This guide is for direct installation (sideload). Google Play publishing is not required.

## Final APK files

- Debug APK: `android-tv-app/app/build/outputs/apk/debug/app-debug.apk`
- Release APK: `android-tv-app/app/build/outputs/apk/release/app-release.apk`

Use `app-release.apk` for owner devices.

## Before installing

1. On TV, enable Developer Options:
   - `Settings -> Device Preferences -> About -> Build` (press OK 7 times)
2. Enable debugging:
   - `Settings -> Developer options -> USB debugging` (or Wireless debugging)
3. Keep TV and your computer on the same network (for wireless ADB).

## Install via ADB (recommended)

From `android-tv-app` folder.

### Windows

```bat
"C:\Users\silok\AppData\Local\Android\Sdk\platform-tools\adb.exe" connect <TV_IP>:5555
"C:\Users\silok\AppData\Local\Android\Sdk\platform-tools\adb.exe" install -r app\build\outputs\apk\release\app-release.apk
"C:\Users\silok\AppData\Local\Android\Sdk\platform-tools\adb.exe" shell monkey -p com.barbershop.tv -c android.intent.category.LEANBACK_LAUNCHER 1
```

Or use helper script:

```bat
install-tv.bat <TV_IP>
```

### macOS/Linux

```bash
adb connect <TV_IP>:5555
adb install -r app/build/outputs/apk/release/app-release.apk
adb shell monkey -p com.barbershop.tv -c android.intent.category.LEANBACK_LAUNCHER 1
```

## Install from USB (no ADB)

1. Copy `app-release.apk` to USB.
2. Plug USB into TV.
3. Open a file manager app on TV.
4. Select APK and install.
5. Allow "Install unknown apps" for that file manager if prompted.

## Quick verify after install

- App opens from TV launcher as `BarberSHOP TV`.
- Screen loads TV setup page (`/tv/setup`).
- Admin QR is shown first and TV unlocks only after admin approval.
- Spotify QR is shown next, then TV opens `/tv/display2`.
- Remote arrows / Enter work in the app.
- Spotify audio starts after account connection via QR (`/api/spotify/auth`).
- `/admin/remote` controls work (change track, mute, next, previous, forward).
- `BACK` can close/skip overlays and `MEDIA_PLAY` can open Spotify login flow on Display2.

## Update later

Install newer APK over existing app (keeps package id):

```bash
adb install -r app/build/outputs/apk/release/app-release.apk
```
