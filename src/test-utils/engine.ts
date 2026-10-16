// Test helpers for the pure engine (not shipped: only imported by Jest tests).
import { GameEngine } from '../game/engine';
import { makeLayout } from '../game/layout';
import { constantRng, Rng, seededRng } from '../game/rng';
import { GameEvent } from '../game/types';

export const W = 800;
export const H = 400;

export function makeEngine(rng: Rng = seededRng(1)): GameEngine {
  return new GameEngine(makeLayout(W, H), rng);
}

// Engine whose random draws are all the same value (0.5 = no spread, middle of every range).
export function fixedEngine(value = 0.5): GameEngine {
  return makeEngine(constantRng(value));
}

// Runs the engine for `seconds` in steps of `dt`, returning every event emitted meanwhile.
export function run(engine: GameEngine, seconds: number, dt = 1 / 60): GameEvent[] {
  const events: GameEvent[] = [];
  const steps = Math.round(seconds / dt);
  for (let i = 0; i < steps; i++) {
    engine.update(dt);
    events.push(...engine.drainEvents());
  }
  return events;
}

export function ofType<T extends GameEvent['type']>(events: GameEvent[], type: T): Extract<GameEvent, { type: T }>[] {
  return events.filter((e): e is Extract<GameEvent, { type: T }> => e.type === type);
}

// Freezes spawning and level completion so a test controls every entity itself.
export function silenceWaves(engine: GameEngine): void {
  engine.waves.update = () => false;
}
