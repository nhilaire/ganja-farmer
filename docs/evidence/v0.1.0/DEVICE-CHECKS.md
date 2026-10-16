# Device checks: v0.1.0

Commit: 4d0c0bf (same as REPORT.md, eighth verification)
APK: `dist/ganja-farmer-0.1.0-universal.apk`, SHA-256 `49608556439adba677db632a51680c79edc8ae57732e026646b97163b396b030`
Target: emulator sdk_gphone64_x86_64, Android 16 (API 36), 2400x1080
Raw outputs: `raw/device-*.txt` (local, git-ignored)

| Check | Command | Result |
|---|---|---|
| App name and icon (AC-34) | `aapt2 dump badging <apk>` -> `raw/device-badging.txt` | `application-label:'Ganja Farmer'`, adaptive icon `res/BW.xml`, launchable `MainActivity` |
| No advertising ID permission | same output | permissions: INTERNET, VIBRATE, ACCESS_NETWORK_STATE, WAKE_LOCK, MODIFY_AUDIO_SETTINGS, DYNAMIC_RECEIVER_NOT_EXPORTED; no `AD_ID`, no `RECORD_AUDIO` |
| Landscape (AC-34) | `dumpsys window` while the app is in front -> `raw/device-window.txt` | `mCurrentRotation=ROTATION_90`, app bounds 2400x1080, windowing mode fullscreen |
| Fullscreen immersive (AC-34) | same output | `statusBars ... visible=false`, `navigationBars ... visible=false` |
| Background music playing (AC-42) | `logcat` media session of the app after launch -> `raw/device-music.txt` | `ExpoAudioBasicMediaSession ... state=PLAYING`, position advancing (24.4 s, then 27.5 s) |
| Version | `dumpsys package io.github.nhilaire.ganjafarmer` -> `raw/device-package.txt` | `versionName=0.1.0` |
| Cold start (AC-35) | `verify.mjs` step 10 | median 1420 ms (target < 3000 ms) |
| No crash / ANR (AC-36) | `verify.mjs` steps 9 and 12 | 0 fatal log lines at launch and during the 6 Maestro flows |

Launcher icon and name on the user's phone, and the feel check (AC-37), are confirmed at release (`/release-apk`).
