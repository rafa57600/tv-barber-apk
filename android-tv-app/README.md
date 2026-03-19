# BarberSHOP Android TV App

This is a native Android TV wrapper app that opens the web display screen in fullscreen.

## What it does

- Launches directly on Android TV home (Leanback launcher).
- Opens your setup screen (`/tv/setup`) in a fullscreen WebView.
- TV startup flow: Admin QR approval -> Spotify QR login -> Display2 screen.
- Supports remote keys and maps them to the web UI:
  - `DPAD_CENTER` / `ENTER` -> open/close appointment panel.
  - `DPAD_UP` -> open panel.
  - `DPAD_DOWN` -> close panel.
  - `BACK` -> close panel.
  - `DPAD_LEFT` / `DPAD_RIGHT` -> previous/next track on Display2.
  - `MEDIA_NEXT` / `MEDIA_PREVIOUS` / `FAST_FORWARD` / `MUTE` are forwarded.
  - `MEDIA_PLAY` can trigger Spotify login shortcut in Display2.
- Retries automatically if internet connection drops.
- Keeps screen awake for long-running salon display mode.

Note: Display2 now uses Spotify Web Playback SDK. Music control is managed by `/admin/remote` (track change, mute, next, previous, forward).

## Configure URL

The TV app reads values from Gradle properties (or env var fallback).

1) Set Android TV URL locally

- Copy `android-tv-app/local.properties.example` to `android-tv-app/local.properties`.
- Set the TV setup URL:

```properties
TV_BASE_URL=https://barbershoprdv.fsp57.com/tv/setup
```

## Build in Android Studio

1. Open Android Studio.
2. Open folder `android-tv-app` as project.
3. Let Gradle sync.
4. Build APK:
   - `Build` -> `Build Bundle(s) / APK(s)` -> `Build APK(s)`
5. Install on TV (ADB, USB, or managed deployment).

## Step 3: Sign + install on Android TV

### 1) Create a release keystore (one time)

```bash
keytool -genkeypair -v -keystore keystore/barbershop-tv.jks -alias barbershop-tv -keyalg RSA -keysize 2048 -validity 3650
```

### 2) Add signing values to `android-tv-app/local.properties`

```properties
TV_BASE_URL=https://barbershoprdv.fsp57.com/tv/setup

TV_RELEASE_STORE_FILE=keystore/barbershop-tv.jks
TV_RELEASE_STORE_PASSWORD=your-store-password
TV_RELEASE_KEY_ALIAS=barbershop-tv
TV_RELEASE_KEY_PASSWORD=your-key-password
```

If signing values are missing, the build still works but release APK will use debug signing.

### 3) Build release APK

From `android-tv-app`:

```bash
./gradlew clean :app:assembleRelease
```

Windows:

```bat
gradlew.bat clean :app:assembleRelease
```

APK output:

`android-tv-app/app/build/outputs/apk/release/app-release.apk`

### 4) Install to TV with ADB

```bash
adb connect <TV_IP>:5555
adb install -r app/build/outputs/apk/release/app-release.apk
adb shell monkey -p com.barbershop.tv -c android.intent.category.LEANBACK_LAUNCHER 1
```

If wireless ADB is disabled, enable Developer Options on the TV and enable ADB debugging first.

Windows helper script:

```bat
install-tv.bat <TV_IP>
```

## Optional auto-start

If needed, add a BOOT_COMPLETED receiver later to auto-launch after reboot.

Detailed install guide: `android-tv-app/INSTALL_ON_SMART_TV.md`.
