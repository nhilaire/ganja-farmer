# Verification report: Ganja Farmer v0.2.1

Overall: PASS
Commit: e31535b
Date: 2026-11-08 17:54 UTC
Stack: expo
Target: emulator sdk_gphone64_x86_64, Android 16 (API 36, x86_64)
APK: ganja-farmer-0.2.1-universal.apk (141 MB)
SHA-256: 9a2430b5844adcc66ed2d007250547e31d3587ded6ccbde9c27769f624bd0ebb

| # | Step | Result | Evidence |
|---|---|---|---|
| 1 | clean working tree | PASS | commit e31535b |
| 2 | typecheck | PASS | `tsc --noEmit` exit 0 |
| 3 | lint | WARN | no "lint" script in package.json (app scaffolded before ESLint was part of the overlay) |
| 4 | unit tests (Jest) | PASS | Tests:       237 passed, 237 total |
| 5 | expo-doctor | WARN | issues reported (see raw/expo-doctor.txt) |
| 6 | secrets & personal data scan | PASS | secret-scan (worktree): clean |
| 7 | release build | PASS | ganja-farmer-0.2.1-universal.apk, 141 MB, Firebase on |
| 8 | release signature | PASS | release signature valid; cert SHA-256 54da35e17c99b321... |
| 9 | install (adb) | PASS | Performing Streamed Install Success |
| 10 | launch, alive after 8 s, no fatal error | PASS | process alive, 0 fatal log lines |
| 11 | cold start time | PASS | median 1211 ms of 1211 / 1192 / 1223 ms after a warm-up launch (target < 3000 ms) |
| 12 | Maestro E2E flows | PASS | 7/7 flows passed, 21 screenshots in screens/ |
| 13 | no crash during e2e flows | PASS | 0 fatal log lines (crash buffer + errors, raw/logcat-e2e.txt) |
| 14 | telemetry events after consent | PASS | seen in logcat: game_start, level_complete, game_over |

Screenshots: `screens/` (emulator only, no personal data). Raw logs: `raw/` (local, git-ignored).
