# Release: Ganja Farmer v0.1.0

Phone install: PASS
User acceptance: pending
Date: 2026-10-16
Commit: afeee55
APK: ganja-farmer-0.1.0-arm64-v8a.apk (54 MB, arm64-v8a)
SHA-256: 943ff7ed7a334f220a2042c57b1209e870ca0fd4b08f28cb0291724243d77951
Signature: release signature valid
Phone: Android 11 (API 30, arm64-v8a)
Launch check: alive after 10 s, no fatal error

## Notes from the user test

- 2026-10-16, first phone test (OnePlus Nord N10, Android 11): firing stops when the player holds one finger, puts a
  second finger elsewhere and lifts the first one (the source game had the same flaw). Fix: firing continues while at
  least one finger is down and aims at the last finger placed (PRD amended, AC-40, PLAN T-24).
- APK size 54 MB (arm64) is above the 40 MB target: accepted by the user, PRD target changed to < 60 MB
  (Skia + Reanimated native code).
- 2026-10-16, second phone test: multi-touch firing fixed; no sound heard. On the emulator the sounds do play
  (expo-audio PLAYING, frames delivered) but they were far too quiet for a phone speaker (pistol shot about 5% of
  full scale, explosion mostly bass). Fix: every generated sound normalized to a 0.95 peak, brighter shot and
  explosion, playback volume 0.6 for shots and 1.0 for the rest.
