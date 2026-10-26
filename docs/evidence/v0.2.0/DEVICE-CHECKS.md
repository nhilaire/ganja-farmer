# Device checks: v0.2.0

Commit: 8451fcc (same as REPORT.md)
APK: `dist/ganja-farmer-0.2.0-universal.apk`, SHA-256 `eb9ea3509c562593f749d99f9a4499e24fa1aeaf4b3fcae6fea4494261991ea0`
Target: emulator sdk_gphone64_x86_64, Android 16 (API 36), 2400x1080, system language en-US
Raw outputs: `raw/device-*.txt` (local, git-ignored)

Note: to install the 141 MB universal APK, the emulator's storage was freed with
`adb shell cmd package uninstall-system-updates` (Google app updates, 3.8 GB) and `pm trim-caches`. This also
reverted the emulator keyboard, which doubled a typed letter once (flow 04 now matches the end of the name).

| Check | Command | Result |
|---|---|---|
| App name in every language (AC-34) | `aapt2 dump badging` / `dump resources` -> `raw/device-badging.txt` | `application-label:'Ganja Farmer'`, `-en:'Ganja Farmer'`, `-fr:'Ganja Farmer'`; `string/app_name` () / (en) / (fr) « Ganja Farmer » |
| No advertising ID permission | same output | permissions: INTERNET, VIBRATE, ACCESS_NETWORK_STATE, WAKE_LOCK, MODIFY_AUDIO_SETTINGS, DYNAMIC_RECEIVER_NOT_EXPORTED; no `AD_ID`, no `RECORD_AUDIO` (expo-localization adds none) |
| Landscape (AC-34) | `dumpsys window` while the app is in front -> `raw/device-window.txt` | `mCurrentRotation=ROTATION_90` |
| Fullscreen immersive (AC-34) | same output | `statusBars ... visible=false`, `navigationBars ... visible=false` |
| Background music playing (AC-42) | `dumpsys media_session` after launch -> `raw/device-music.txt` | `state=PLAYING(3), position=43385` (the local track is bundled in this local build) |
| Version | `dumpsys package io.github.nhilaire.ganjafarmer` -> `raw/device-package.txt` | `versionName=0.2.0` |
| French first launch (AC-43, AC-44) | `pm clear`, `cmd locale set-app-locales <pkg> --locales fr-FR` (per-app language, system stays en-US), Maestro `fr-first-launch.yaml` -> `raw/device-fr-first-launch.txt` | « Aider la ferme à pousser ? », « OUI, PARTAGER », « NON MERCI », then « JOUER » and « Défends ton champ, Rasta ! »: 10 steps COMPLETED, 0 FAILED; screens `device-fr-consent.png`, `device-fr-home.png`; app language reset afterwards (`[]`) |
| Cold start (AC-35) | `verify.mjs` step 10 | median 2207 ms (target < 3000 ms) |
| No crash / ANR (AC-36) | `verify.mjs` steps 9 and 12 | 0 fatal log lines at launch and during the 7 Maestro flows |

Launcher icon and name on the user's phone, the feel check (AC-37) and the French texts (AC-45) are confirmed at
release (`/release-apk`).
