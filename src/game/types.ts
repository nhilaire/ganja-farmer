// Entities of the playfield, from the source `engine/types.ts`. Positions are entity centres, in logical pixels.
import { AirType } from './enemies';
import { PowerUpId } from './powerups';
import { WeaponId } from './weapons';

export type GameOverCause = 'soldier' | 'bomb' | 'cropduster' | 'ufo';

interface Body {
  id: number;
  x: number;
  y: number;
  width: number;
  height: number;
  active: boolean;
}

export interface Bullet extends Body {
  vx: number;
  vy: number;
  damage: number;
  penetrating: boolean;
  explosive: boolean;
  explosionRadius: number;
  angle: number;
  ghost: boolean; // fired by Duppy Conqueror
}

export interface AirEnemy extends Body {
  type: AirType;
  hp: number;
  maxHp: number;
  vx: number;
  vy: number;
  direction: 1 | -1;
  speed: number;
  hasDropped: boolean;
  dropCount: number; // paratroopers (or bombs) left; crop duster: attacks done this pass
  maxDropCount: number;
  droppedThisPass: number;
  maxDropThisPass: number;
  passCount: number;
  dropTimer: number;
  score: number;
  flashTimer: number;
  name?: string; // boss only
  immunePlants?: Set<number>; // crop duster only: plants whose shield blocked this pass (D4)
  away?: boolean; // A-10 / crop duster off screen, waiting to come back (D6)
  returnTimer?: number; // seconds until it comes back (D6)
}

export interface Paratrooper extends Body {
  hp: number;
  maxHp: number;
  vx: number;
  vy: number;
  landed: boolean;
  targetPlantIndex: number;
  burnTimer: number;
  plantsDestroyed: number;
  fleeing: boolean;
  score: number;
  flashTimer: number;
}

export interface Bomb extends Body {
  vy: number;
  score: number;
}

export interface Explosion extends Body {
  timer: number;
  maxTimer: number;
  radius: number;
}

export interface PowerUpOrb extends Body {
  powerUpId: PowerUpId;
  vy: number;
}

export interface Plant {
  index: number;
  x: number;
  y: number;
  alive: boolean;
  burning: boolean;
  burnProgress: number; // 0..1
  burningBy: 'soldier' | 'cropduster' | null;
}

export interface ActiveEffect {
  id: PowerUpId;
  remaining: number;
  duration: number;
}

// Side effects for the UI layer (sounds, vibrations, messages, telemetry), drained once per frame.
export type GameEvent =
  | { type: 'shot'; weapon: WeaponId }
  | { type: 'explosion' }
  | { type: 'plantBurning' }
  | { type: 'plantDestroyed'; index: number; cause: GameOverCause }
  | { type: 'kill'; target: AirType | 'paratrooper' | 'bomb'; points: number }
  | { type: 'combo'; count: number; multiplier: number }
  | { type: 'powerUpActivated'; id: PowerUpId }
  | { type: 'bossSpawn'; name: string }
  | { type: 'bossDefeated'; level: number }
  | { type: 'levelStart'; level: number }
  | { type: 'levelComplete'; level: number; scoreBeforeBonus: number; bonus: number; restored: number }
  | { type: 'gameOver'; level: number; score: number; cause: GameOverCause };

export type Phase = 'playing' | 'levelEnding' | 'levelComplete' | 'over';
