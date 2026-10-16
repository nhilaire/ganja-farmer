# Verification report: Ganja Farmer v0.1.0

Overall: PASS
Commit: a00c134
Date: 2026-10-16 11:10 UTC
Stack: expo
Target: emulator sdk_gphone64_x86_64, Android 16 (API 36, x86_64)
APK: ganja-farmer-0.1.0-universal.apk (138.9 MB)
SHA-256: 8afc829905b58af150a40ec737b8c0b20846758288691f5581cbb0cf7fbcc069

| # | Step | Result | Evidence |
|---|---|---|---|
| 1 | clean working tree | PASS | commit a00c134 |
| 2 | typecheck | PASS | `tsc --noEmit` exit 0 |
| 3 | unit tests (Jest) | PASS | Tests:       184 passed, 184 total |
| 4 | expo-doctor | PASS | all checks passed |
| 5 | secrets & personal data scan | PASS | secret-scan (worktree): clean |
| 6 | release build | PASS | ganja-farmer-0.1.0-universal.apk, 138.9 MB, Firebase on |
| 7 | release signature | PASS | release signature valid; cert SHA-256 54da35e17c99b321... |
| 8 | install (adb) | PASS | Performing Streamed Install Success |
| 9 | launch, alive after 8 s, no fatal error | PASS | process alive, 0 fatal log lines |
| 10 | cold start time | PASS | median 1421 ms of 1421 / 1534 / 1167 ms after a warm-up launch (target < 3000 ms) |
| 11 | Maestro E2E flows | PASS | 6/6 flows passed, 16 screenshots in screens/ |
| 12 | no crash during e2e flows | PASS | 0 fatal log lines (crash buffer + errors, raw/logcat-e2e.txt) |
| 13 | telemetry events after consent | PASS | seen in logcat: game_start, level_complete, game_over |

Screenshots: `screens/` (emulator only, no personal data). Raw logs: `raw/` (local, git-ignored).
