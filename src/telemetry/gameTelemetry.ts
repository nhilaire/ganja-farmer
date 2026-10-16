// Maps engine events to the PRD telemetry events (docs/PRD.md "Telemetry events"). Pure: the caller sends them
// with track(), which does nothing without consent.
import { GameEvent } from '../game/types';
import { EventName, TelemetryEvents } from './events';
import { track } from './telemetry';

export type Tracked = { [N in EventName]: { name: N; params: TelemetryEvents[N] } }[EventName];

export interface GameSnapshot {
  playTime: number; // seconds of active play in this game
  alivePlants: number;
}

export function telemetryFor(event: GameEvent, game: GameSnapshot): Tracked | null {
  const duration_s = Math.round(game.playTime);
  switch (event.type) {
    case 'levelComplete':
      return {
        name: 'level_complete',
        params: { level: event.level, score: event.scoreBeforeBonus, duration_s, plants_alive: game.alivePlants - event.restored },
      };
    case 'bossDefeated':
      return { name: 'boss_defeated', params: { level: event.level } };
    case 'gameOver':
      return { name: 'game_over', params: { level: event.level, score: event.score, duration_s, cause: event.cause } };
    default:
      return null;
  }
}

// Sends a mapped event (the name/params pair is correlated by construction, which TypeScript cannot follow).
export function trackMapped(tracked: Tracked): void {
  (track as (name: EventName, params: Tracked['params']) => void)(tracked.name, tracked.params);
}
