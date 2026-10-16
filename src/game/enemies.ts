// Enemies and bosses, from the source `constants/enemies.ts`.
export type AirType = 'helicopter' | 'blackhawk' | 'a10' | 'cropduster' | 'ufo' | 'boss';
export type SpawnType = 'helicopter' | 'blackhawk' | 'a10' | 'cropduster' | 'ufo';

export interface EnemyDef {
  hp: number;
  speed: number; // px/s base
  width: number;
  height: number;
  score: number;
}

export const ENEMIES: Record<SpawnType | 'paratrooper' | 'bomb', EnemyDef> = {
  helicopter: { hp: 12, speed: 60, width: 80, height: 40, score: 500 },
  blackhawk: { hp: 20, speed: 80, width: 90, height: 45, score: 750 },
  paratrooper: { hp: 2, speed: 40, width: 24, height: 36, score: 100 },
  a10: { hp: 8, speed: 90, width: 70, height: 25, score: 750 },
  bomb: { hp: 1, speed: 120, width: 10, height: 16, score: 300 },
  cropduster: { hp: 6, speed: 45, width: 60, height: 22, score: 600 },
  ufo: { hp: 15, speed: 50, width: 45, height: 22, score: 2000 },
};

export const PARATROOPER_FALL_SPEED = 40;
export const SOLDIER_WALK_SPEED = 30;
export const SOLDIER_FLEE_SPEED = 50;
export const BURN_SECONDS = 3;

export interface BossDef {
  tier: number;
  name: string;
  hp: number;
  speed: number;
  width: number;
  height: number;
  score: number;
  dropCount: number;
}

const BOSS_HP = [0, 120, 250, 450, 700];
const BOSS_NAMES = ['', 'GENERAL SHERMAN', 'DEA DRONE MOTHER', 'AIR FORCE ONE', 'MOTHERSHIP'];

export function isBossLevel(level: number): boolean {
  return level % 5 === 0;
}

export function bossForLevel(level: number): BossDef {
  const tier = Math.floor(level / 5);
  return {
    tier,
    name: tier <= 4 ? BOSS_NAMES[tier] : `WARLORD MK${tier}`,
    hp: tier <= 4 ? BOSS_HP[tier] : 700 + (tier - 4) * 300,
    speed: 25 + tier * 5,
    width: 130 + tier * 10,
    height: 65 + tier * 5,
    score: 5000 + tier * 2500,
    dropCount: 3 + tier * 2,
  };
}
