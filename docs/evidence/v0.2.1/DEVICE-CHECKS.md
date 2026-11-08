# Device checks: v0.2.1

Commit: e31535b (same as REPORT.md)
APK: `dist/ganja-farmer-0.2.1-universal.apk`, SHA-256 `9a2430b5844adcc66ed2d007250547e31d3587ded6ccbde9c27769f624bd0ebb`
Target: emulator sdk_gphone64_x86_64, Android 16 (API 36), 2400x1080, system language en-US
Run on 2026-11-08 right after the REPORT.md run, on the APK installed by it. Raw outputs: `raw/device-*.txt`
(local, git-ignored).

| Check | Command | Result |
|---|---|---|
| App name in every language (AC-34) | `aapt2 dump badging` / `dump resources` -> `raw/device-badging.txt` | `application-label:'Ganja Farmer'`, `-en:'Ganja Farmer'`, `-fr:'Ganja Farmer'`; `string/app_name` () / (en) / (fr) « Ganja Farmer » |
| No advertising ID permission | same output | permissions: INTERNET, VIBRATE, ACCESS_NETWORK_STATE, WAKE_LOCK, MODIFY_AUDIO_SETTINGS, DYNAMIC_RECEIVER_NOT_EXPORTED; no `AD_ID`, no `RECORD_AUDIO` |
| Landscape (AC-34) | `dumpsys window` while the app is in front -> `raw/device-window.txt` | `mCurrentFocus=... ganjafarmer/...MainActivity`, `mCurrentRotation=ROTATION_90`, `mWindowingMode=fullscreen`, config `land` |
| Fullscreen immersive (AC-34) | same output | `InsetsSource type=statusBars ... visible=false`, `type=navigationBars ... visible=false` |
| Background music playing (AC-42) | `dumpsys media_session` 12 s after launch -> `raw/device-music.txt` | `state=PLAYING(3), position=9017` (the local track is bundled in this local build) |
| Version | `dumpsys package io.github.nhilaire.ganjafarmer` -> `raw/device-package.txt` | `versionName=0.2.1` |
| French first launch (AC-43, AC-44) | `pm clear`, `cmd locale set-app-locales <pkg> --locales fr-FR` (per-app language, system stays en-US, get-app-locales -> `[fr-FR]`), Maestro `raw/device-fr-first-launch.yaml` -> `raw/device-fr-first-launch.txt` | « Aider la ferme à pousser ? », « OUI, PARTAGER », « NON MERCI », then « JOUER » and « Défends ton champ, Rasta ! »: 11 steps COMPLETED, 0 FAILED; screens `device-fr-consent.png`, `device-fr-home.png`; app language reset afterwards (`[]`) |
| Cold start (AC-35) | `verify.mjs` step 11 | median 1211 ms (target < 3000 ms) |
| No crash / ANR (AC-36) | `verify.mjs` steps 10 and 13 | 0 fatal log lines at launch and during the 7 Maestro flows |

Launcher icon and name on the user's phone, the feel check (AC-37) and the French texts (AC-45) are confirmed at
release (`/release-apk`).
