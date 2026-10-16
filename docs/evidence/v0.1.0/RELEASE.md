# Release: Ganja Farmer v0.1.0

Phone install: PASS
User acceptance: confirmed (2026-10-16)
Date: 2026-10-16
Commit: 2a4a544
APK: ganja-farmer-0.1.0-arm64-v8a.apk (56 MB, arm64-v8a)
SHA-256: e41a170b243a141386fae4b93bf2501c91ca023f8010cef7b7ba684109890e20
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
- 2026-10-16: the author supplied a background music track ("Rasta Rocket Man", own work): looped everywhere at 25 %,
  MUSIC toggle in SETUP (PRD amended, AC-42, PLAN T-26).
- 2026-10-16, fifth phone test (build 2a4a544, arm64 56 MB): music, returning planes, sound, two-finger firing, icon and
  feel checked by the user: accepted.
