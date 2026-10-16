# Verification report: Ganja Farmer v0.1.0

Overall: PASS
Commit: 481102d
Date: 2026-10-16 10:00 UTC
Stack: expo
Target: emulator sdk_gphone64_x86_64, Android 16 (API 36, x86_64)
APK: ganja-farmer-0.1.0-universal.apk (138.9 MB)
SHA-256: 3879eb0d3a2c3ce9dbebaa36f510cfad6f07420c41339b4b11f731cdeced880b

| # | Step | Result | Evidence |
|---|---|---|---|
| 1 | clean working tree | PASS | commit 481102d |
| 2 | typecheck | PASS | `tsc --noEmit` exit 0 |
| 3 | unit tests (Jest) | PASS | Tests:       183 passed, 183 total |
| 4 | expo-doctor | PASS | all checks passed |
| 5 | secrets & personal data scan | PASS | secret-scan (worktree): clean |
| 6 | release build | PASS | ganja-farmer-0.1.0-universal.apk, 138.9 MB, Firebase on |
| 7 | release signature | PASS | release signature valid; cert SHA-256 54da35e17c99b321... |
| 8 | install (adb) | PASS | Performing Streamed Install Success |
| 9 | launch, alive after 8 s, no fatal error | PASS | process alive, 0 fatal log lines |
| 10 | cold start time | PASS | median 1747 ms of 1747 / 1801 / 1316 ms after a warm-up launch (target < 3000 ms) |
| 11 | Maestro E2E flows | PASS | 6/6 flows passed, 16 screenshots in screens/ |
| 12 | no crash during e2e flows | PASS | 0 fatal log lines (crash buffer + errors, raw/logcat-e2e.txt) |
| 13 | telemetry events after consent | PASS | seen in logcat: game_start, level_complete, game_over |

Screenshots: `screens/` (emulator only, no personal data). Raw logs: `raw/` (local, git-ignored).
