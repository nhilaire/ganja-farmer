# Verification report: Ganja Farmer v0.1.0

Overall: PASS
Commit: 4d0c0bf
Date: 2026-10-16 12:40 UTC
Stack: expo
Target: emulator sdk_gphone64_x86_64, Android 16 (API 36, x86_64)
APK: ganja-farmer-0.1.0-universal.apk (141 MB)
SHA-256: 49608556439adba677db632a51680c79edc8ae57732e026646b97163b396b030

| # | Step | Result | Evidence |
|---|---|---|---|
| 1 | clean working tree | PASS | commit 4d0c0bf |
| 2 | typecheck | PASS | `tsc --noEmit` exit 0 |
| 3 | unit tests (Jest) | PASS | Tests:       202 passed, 202 total |
| 4 | expo-doctor | PASS | all checks passed |
| 5 | secrets & personal data scan | PASS | secret-scan (worktree): clean |
| 6 | release build | PASS | ganja-farmer-0.1.0-universal.apk, 141 MB, Firebase on |
| 7 | release signature | PASS | release signature valid; cert SHA-256 54da35e17c99b321... |
| 8 | install (adb) | PASS | Performing Streamed Install Success |
| 9 | launch, alive after 8 s, no fatal error | PASS | process alive, 0 fatal log lines |
| 10 | cold start time | PASS | median 1420 ms of 3341 / 1420 / 1122 ms after a warm-up launch (target < 3000 ms) |
| 11 | Maestro E2E flows | PASS | 6/6 flows passed, 16 screenshots in screens/ |
| 12 | no crash during e2e flows | PASS | 0 fatal log lines (crash buffer + errors, raw/logcat-e2e.txt) |
| 13 | telemetry events after consent | PASS | seen in logcat: game_start, level_complete, game_over |

Screenshots: `screens/` (emulator only, no personal data). Raw logs: `raw/` (local, git-ignored).
