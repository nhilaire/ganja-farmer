# Release: Ganja Farmer v0.1.0

Phone install: PASS
User acceptance: pending
Date: 2026-10-16
Commit: f64c49b
APK: ganja-farmer-0.1.0-arm64-v8a.apk (54 MB, arm64-v8a)
SHA-256: fea34463e28d1b0654637f3ac6a017f6dbf6c64a8df041d42f6582f06b564cb6
Signature: release signature valid
Phone: Android 11 (API 30, arm64-v8a)
Launch check: alive after 10 s, no fatal error

## Notes from the user test

- 2026-10-16, first phone test (OnePlus Nord N10, Android 11): firing stops when the player holds one finger, puts a
  second finger elsewhere and lifts the first one (the source game had the same flaw). Fix: firing continues while at
  least one finger is down and aims at the last finger placed (PRD amended, AC-40, PLAN T-24).
- APK size 54 MB (arm64) is above the 40 MB target: accepted by the user, PRD target changed to < 60 MB
  (Skia + Reanimated native code).
