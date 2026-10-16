# Brief: ganja-farmer

Date: 2026-10-16
Project slug: ganja-farmer
Final app name: Ganja Farmer

## Original brief

> l'inspiration c'est clairement de faire passer ce jeu là dans l'usine C:\dev\GanjaFarmer ; tu dois reprendre les concepts, les logos, les splash screen, etc. On garde aussi l'anglais dans l'affichage sur les écrans

Source project (local, not a git repository): `C:/dev/GanjaFarmer` - Expo SDK 55 + react-native-skia + zustand,
~5,000 lines of TypeScript, with `docs/GAME_DESIGN_DOCUMENT.md`, `docs/GAME_RULES.md`, `docs/TECHNICAL_SPECS.md`,
pixel-art icon (1024x1024, adaptive icon layers) and splash image (1536x1024, landscape) with the "GANJA FARMER" logo.
The game is a tribute remake of the 1998 freeware "Ganja Farmer" (EvilX Systems): a rasta on a VW van defends a row
of 26 plants against helicopters, paratroopers, A-10s, crop dusters, UFOs and bosses; endless levels, weapons
unlocked by level, power-ups, combos, Jah blessing between levels, local high scores.

## Clarifying questions

Answers are summarised in English. Format: `- **Q:** question` then `  **A:** answer`.
Mark assumptions the user accepted as `(default accepted)`.

### Concept and players

- **Q:** How much of the existing game goes into v0.1?
  **A:** All current content: 6 weapons, 7 enemy types, 12 power-ups, bosses every 5 levels, combos, Jah blessing
  between levels. The engine is ported into the factory structure (pure, tested TypeScript) without changing the
  rules of `docs/GAME_RULES.md` / `docs/GAME_DESIGN_DOCUMENT.md` of the source project.
- **Q:** Who is the game for?
  **A:** The user and adult friends; the APK is sideloaded, no Play Store. Adult theme (cannabis, provocative humour).

### Story (About screen)

- **Q:** Why this game?
  **A:** The user played the original as a young player; the explanation is already in the source About screen.
  Challenged once; the user chose this text (English, as all screens) for the "Why this game" part:
  "I played Ganja Farmer for hours as a teenager, on the family computer, found in a folder of downloaded freeware
  games. I made this version to bring it back on my phone - a tribute by a passionate independent developer, not
  affiliated with the original creators."
  The source About sections ("The Original Game", Bob Marley quote) are kept around it.

### Gameplay and controls

- **Q:** What is the core loop?
  **A:** From the source game: helicopters cross the sky and drop paratroopers; landed soldiers walk to the nearest
  plant and burn it; the player shoots everything (aircraft, paratroopers, soldiers, bombs, power-up orbs) to protect
  the row of 26 plants. A level ends when its helicopter quota is destroyed and the sky is clear. (from source GDD)
- **Q:** What are the controls?
  **A:** Touch and hold anywhere: the rasta aims at the finger and fires continuously; dragging re-aims; releasing
  stops firing. Landscape only, fullscreen. (from source GDD)

### Progression, scoring, difficulty

- **Q:** End condition and scoring?
  **A:** Game over when all 26 plants are destroyed; endless levels. Points per kill (100 to 2000), level bonus
  level x 1000, combo multiplier on air kills within 2 s, boss score. (from source rules)
- **Q:** Progression?
  **A:** Endless levels with rising speed/HP, helicopter quota per level, best weapon unlocked automatically
  (levels 1/4/7/10/14/18), new enemies at levels 5/8/12/16, boss every 5 levels, Jah restores 2-6 plants between
  levels. (from source rules)

### Look, sound and feel

- **Q:** Sound and music?
  **A:** Sound effects only (shots, explosions, Jah blessing, game over, power-up), with a mute toggle. No music in
  v0.1. Effects must be royalty-free (CC0) or generated.
- **Q:** Where do the icon and splash images come from (licence, public repository)?
  **A:** AI-generated for the user by the user; they may be published. Reused as is: icon, adaptive icon layers,
  landscape splash with the "GANJA FARMER" logo. In-game graphics stay code-drawn (Skia), as in the source.

### Screens and settings

- **Q:** What does the SETUP screen contain (currently "Coming soon")?
  **A:** Sound effects on/off, statistics consent on/off, reset high scores (with confirmation). (default accepted)
- **Q:** What happens when the player leaves the app mid-game?
  **A:** Automatic pause when the app goes to background; a PAUSED screen with RESUME / MENU on return; a pause
  button in the HUD. (default accepted)
- **Q:** Keep the high-score name entry?
  **A:** Yes: name entry on a new high score, local top 10 only (stored on the phone, never sent in telemetry).
  (default accepted)

### Telemetry and success metrics

- **Q:** What does success look like (opt-in Firebase Analytics + Crashlytics)?
  **A:** All four: level reached and cause of game over (difficulty tuning), players coming back (games per day,
  D1/D7 retention), game duration (per game and per session), zero crash (crash-free users).

- **Q:** Tone of the English texts (tu/vous does not apply)?
  **A:** Casual with rasta winks, as in the source ("Coming soon, Rasta!", Jah quotes). (default accepted)

### Constraints

- **Q:** What is explicitly out of scope for v0.1?
  **A:** Online leaderboard, music, web and iOS versions, new weapons or enemies beyond the source content.

## Decisions taken during discovery

- **Player-facing language is English** (user's explicit choice), an exception to the factory default of French
  strings: all screens, including consent, About and settings, are in English. `factory-app.json` language must
  reflect it.
- **Port, not redesign:** game rules, numbers and content come from the source project docs (`GAME_RULES.md` is the
  reference for numbers); the engine is ported to pure TypeScript with tests.
- **Assets reused** from the source: icon, adaptive icon layers (foreground, background, monochrome, background colour
  `#228B22`), landscape splash image with logo (custom 2 s splash after the native one). All AI-generated for the user.
- **Landscape only, fullscreen** (immersive mode, as the source `withFullscreen` plugin).
- **Sound effects only**, royalty-free (CC0) or generated, with a mute toggle in SETUP.
- **Telemetry opt-in** (consent screen first, in English); no identifiers; high-score names never sent.
- **Distribution:** sideloaded APK for adults; no Play Store; no ads, no accounts, offline.
- New package `io.github.nhilaire.ganjafarmer`: installs alongside the old `com.anonymous.ganjafarmer` build.
