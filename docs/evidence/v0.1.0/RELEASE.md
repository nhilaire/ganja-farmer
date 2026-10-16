# Release: Ganja Farmer v0.1.0

Phone install: PASS
User acceptance: pending
Date: 2026-10-16
Commit: e4cb484
APK: ganja-farmer-0.1.0-arm64-v8a.apk (54 MB, arm64-v8a)
SHA-256: a2c9f19789151c487e3e275ba70c67dd8f5f2aeb2a758d5d224fc25060a1cb1d
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
- 2026-10-16, third phone test: still no sound. Phone log: players created and started at volume 1.0, media volume
  30/30 on the speaker, but the ringer is on silent/vibrate and expo-audio mutes playback in that case when
  `playsInSilentMode` is false. Fix: `playsInSilentMode: true` (media stream, Android convention); SOUND in SETUP
  stays the in-game mute.
- 2026-10-16, fourth phone test: sound now works (phone on vibrate). Request: an A-10 that is not destroyed should
  come back from time to time until destroyed, and regularly once the level is nearly over. Decided with the user:
  A-10 and crop duster return after 5-10 s, at most 2 s once the quota is reached, keeping their HP (PRD D6, AC-41,
  PLAN T-25).
