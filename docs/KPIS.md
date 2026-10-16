# KPIs and monitoring: Ganja Farmer

Firebase project: ganja-farmer (exact project id: Firebase console > Project settings > General; free Spark plan,
never upgraded to Blaze)
Android app: io.github.nhilaire.ganjafarmer
Data collection: opt-in only (consent screen). Analytics data retention: 2 months. Google signals: off.

Source of truth: `docs/PRD.md` sections "Telemetry events" and "KPIs". The typed catalog in
`src/telemetry/events.ts` must declare exactly the PRD events.

## Events (sent only after consent)

| Event | When | Params |
|---|---|---|
| game_start | PLAY or RETRY starts a game | level (=1) |
| level_complete | a level is completed (before the bonus) | level, score, duration_s, plants_alive |
| boss_defeated | a boss is destroyed (bullet or Jah Lightning) | level |
| game_over | the last plant is destroyed | level, score, duration_s, cause (`soldier`, `bomb`, `cropduster`, `ufo`) |
| game_quit | MENU from the Paused overlay | level, duration_s |
| settings_change | a SETUP toggle changes or scores are reset | setting (`sound`, `vibration`, `telemetry`, `reset_scores`), value (`on`, `off`, `done`) |

`duration_s` is the active play time of the whole game (pauses excluded). High-score names are never sent.

## Business KPIs

| KPI | Definition | Where to read it | Target |
|---|---|---|---|
| D1 retention | % of new users back on day 1 | Analytics > Reports > Retention | >= 30% |
| D7 retention | % of new users back on day 7 | Analytics > Reports > Retention | >= 10% |
| Games per session | `game_start` count / `session_start` count | Analytics > Events > game_start, session_start | >= 2 |
| Games per active user per day | `game_start` count / DAU | Analytics > Events > game_start; Engagement overview (DAU) | >= 3 |
| Average game duration | mean `duration_s` on `game_over` + `game_quit` | custom metric `duration_s` | >= 4 min |
| Average engagement time per session | automatic engagement metric | Analytics > Reports > Engagement overview | >= 8 min |
| Level funnel / drop-off | `level_complete` by `level`; `game_over` and `game_quit` by `level` | custom dimension `level` | median game-over level >= 5 |
| Game-over cause distribution | share of each `cause` on `game_over` | custom dimension `cause` | no single cause > 70% |
| Settings usage (info) | `settings_change` by `setting` / `value` | custom dimensions `setting`, `value` | no target |

## Technical KPIs

| KPI | Definition | Where to read it | Target |
|---|---|---|---|
| Crash-free users | % users without a fatal crash | Crashlytics > Dashboard | >= 99% |
| ANR rate | app not responding events | Crashlytics > Dashboard (filter ANR) | < 0.5% |
| Non-fatal errors | `reportError()` calls | Crashlytics > Non-fatals | low and stable |
| APK size | arm64 release APK size | docs/evidence/v*/REPORT.md | < 40 MB |
| Cold start | launch to first frame | evidence report (device check) | < 3 s |

## Custom definitions to register in Analytics

Analytics > Admin > Custom definitions (free, up to 50 dimensions / 50 metrics):

| Name | Scope | Param | Type |
|---|---|---|---|
| level | Event | level | dimension |
| cause | Event | cause | dimension |
| setting | Event | setting | dimension |
| value | Event | value | dimension |
| score | Event | score | metric (standard) |
| duration_s | Event | duration_s | metric (seconds) |
| plants_alive | Event | plants_alive | metric (standard) |

## How to check that events arrive

1. Build with `firebase/google-services.json` present, accept the consent screen.
2. `adb shell setprop debug.firebase.analytics.app io.github.nhilaire.ganjafarmer` then open Analytics > DebugView.
3. The factory's `verify.mjs --telemetry` captures the `Logging event` lines from logcat as evidence.
Standard reports update within ~24 h; DebugView is real time.
