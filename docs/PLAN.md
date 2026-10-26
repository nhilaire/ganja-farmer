# Plan: Ganja Farmer v0.2.0

Each task is small (one commit), references the acceptance criteria it serves, and names its proof.
Format: `- [ ] T-01 Title (AC-01, AC-02) - proof: unit|e2e|device`. Check the box only when the proof passes.

## Tasks

### Foundation
- [x] T-01 English player copy: `src/i18n/en.ts` replaces `fr.ts`, app CLAUDE.md language rule, template screens and App test in English (AC-01, AC-02) - proof: unit
- [x] T-02 Seeded RNG, screen layout from (W, H), constants: weapons, enemies, levels, bosses, power-ups ported from the source (AC-10, AC-11) - proof: unit

### Engine (pure TypeScript, `src/game/`)
- [x] T-03 Engine core: plants, firing, bullets, collisions (laser, orb and bomb stop rules), game-over once (AC-09, AC-39, AC-21) - proof: unit
- [x] T-04 Helicopters and Black Hawks: spawn, drops, global cap, wrap, reload, applied speed decay D3 (AC-12) - proof: unit
- [x] T-05 Paratroopers and soldiers: fall with drift, landing, targeting, burning, fleeing (AC-13) - proof: unit
- [x] T-06 A-10 and bombs, crop duster (D4), UFO, plant shields (AC-14) - proof: unit
- [x] T-07 Wave manager: quota, respawn, scripted waves with helicopter blocking, level completion and its edge cases (AC-11, AC-16) - proof: unit
- [x] T-08 Bosses: tiers, attacks, wrap without reload, defeat by bullet or Jah Lightning D2 (AC-18) - proof: unit
- [x] T-09 Scoring and combo (AC-15) - proof: unit
- [x] T-10 Power-ups: spawn timing, orbs, the 12 effects, carry-over of defences D5 (AC-19, AC-20) - proof: unit
- [x] T-11 Game session: level progression, bonus, Jah draw, single plant state D1, pause freeze, cheats, play time (AC-16, AC-17, AC-38, AC-28, AC-31) - proof: unit

### Screens
- [x] T-12 Skia renderer port and Game screen: canvas, touch aim/fire, HUD, pause overlay, messages (AC-08, AC-26) - proof: unit
- [x] T-13 Jah blessing overlay and level transition screen (AC-22) - proof: unit
- [x] T-14 High scores storage, game over screen with name entry, SCORES table, home idle display (AC-23, AC-24, AC-25, AC-33) - proof: unit
- [x] T-15 Home screen port (AC-07) - proof: unit
- [x] T-16 Source assets (icon, adaptive icon, splash), landscape + fullscreen config plugin, custom 2 s splash (AC-06, AC-34) - proof: unit
- [x] T-17 Setup screen: sound, vibration, stats toggles, reset high scores with confirmation, persisted settings (AC-29, AC-30) - proof: unit
- [x] T-18 About screen: original game, story, this version, version, quote (AC-32) - proof: unit
- [x] T-19 Auto-pause when the app leaves the foreground (AC-27) - proof: unit

### Factory layer and polish
- [x] T-20 Telemetry calls for the 6 PRD events, cause tracking, consent gating (AC-03, AC-04, AC-05) - proof: unit
- [x] T-21 Generated sound effects (no third-party audio) with expo-audio, haptics, both behind settings (AC-30, AC-37) - proof: unit
- [x] T-22 Maestro flows: consent, home, game HUD, cheat skip and transition, game over and high score, relaunch persistence, pause, background, setup, about, idle scores, telemetry (AC-01, AC-02, AC-05, AC-06, AC-07, AC-08, AC-22, AC-23, AC-25, AC-26, AC-27, AC-29, AC-32, AC-33) - proof: e2e
- [x] T-23 Device criteria prepared for verify and release: icon/name/landscape, cold start, no crash, feel check by the user (AC-34, AC-35, AC-36, AC-37) - proof: device (emulator check done during build; formal proofs in /verify-app and /release-apk)

### After the first phone test
- [x] T-24 Multi-touch firing: keep firing while a finger is down, aim at the last finger placed (AC-40) - proof: unit
- [x] T-25 Returning A-10s and crop dusters until destroyed, faster once the quota is reached (AC-41, D6) - proof: unit
- [x] T-26 Background music looped at 25 %, MUSIC toggle in SETUP, pause in background (AC-42, AC-29) - proof: unit
- [x] T-27 Language core and French: i18n index (English reference), Strings type, I18nProvider, expo-localization, language setting store, French dictionary (typography, plurals), SETUP language choice, canvas texts per language, app wiring, launcher name (AC-34, AC-43, AC-45) - proof: unit
- [x] T-28 Maestro: flows pin English through SETUP, language flow with screenshots, readme-3 capture on the level transition (AC-44) - proof: e2e

## Notes

- Build findings: Skia 2.6 needs react-native-reanimated at runtime (added); a stale Metro cache from a build
  made before Reanimated was installed bundled Skia without worklets and crashed on the first canvas (cleared);
  Maestro waits fail at once right after some screen changes, so flows use a plain evalScript pause there.

- Source of rules: `C:/dev/GanjaFarmer` code (PRD "Reference rule"), with deviations D1-D5. The source is a local
  folder outside this repository; the port copies code and assets, never references the path at runtime.
- **Engine design:**
  - `src/game/` exposes a `GameEngine` stepped with `update(dt)`. It owns all game state (plants, score, kills,
    level, effects: D1).
  - The engine takes an injected `rng: () => number` and a layout `{ W, H }`. It never reads `Date.now()` or
    `Dimensions` (the source used `Date.now()` for the UFO and boss wobble: replaced by engine time).
  - Side effects (sounds, vibrations, telemetry, UI messages) come out as an event queue drained by the Game screen.
- **Rendering:** `src/render/renderer.ts` ports the source Skia drawing code. It is not unit-tested (visual);
  it is covered by Maestro screenshots and the user's feel check.
- **E2E reachability:**
  - Game over is reached by not firing: soldiers burn the field (a few minutes at level 1).
  - A qualifying score (> 0) comes from the skip-level cheat (+1000 bonus): triple tap at a fixed point with
    `repeat: 3`.
  - Total flow time must stay under the 20 min verify budget: the game-over flow and the telemetry flow are the
    long ones.
- **Sound:** short effects are synthesised by a dependency-free Node script (`scripts/generate-sfx.mjs`) into
  `assets/sfx/*.wav`, recorded in `assets/LICENSES.md`, so there is no third-party licence.
- **Risks:**
  - Skia API drift between the source's 2.4 and the SDK 57 version.
  - APK size with Skia vs the 40 MB target.
  - Maestro gestures on a Skia canvas (use `point:` taps).
