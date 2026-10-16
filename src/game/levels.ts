// Level configuration, from the source `constants/levels.ts` and `engine/WaveManager.ts`.
import { SpawnType } from './enemies';
import { weaponUpgrades } from './weapons';

export interface SpawnConfig {
  type: SpawnType;
  count: number;
  interval: number; // ms between spawns
}

export interface WaveConfig {
  delay: number; // ms after level start
  spawn: SpawnConfig;
}

export interface LevelConfig {
  level: number;
  speedMultiplier: number;
  hpMultiplier: number;
  requiredHeliKills: number;
  maxHelisOnScreen: number;
  activeHeliTarget: number;
  respawnInterval: number; // ms
  maxParatroopers: number;
  waves: WaveConfig[];
}

export function levelConfig(level: number): LevelConfig {
  const L = level;
  const maxHelisOnScreen = 4 + weaponUpgrades(L);
  const waves: WaveConfig[] = [
    {
      delay: 1000,
      spawn: {
        type: L >= 5 && L % 2 === 0 ? 'blackhawk' : 'helicopter',
        count: Math.min(2 + Math.floor(L * 0.5), 6),
        interval: Math.max(2500 - L * 100, 800),
      },
    },
  ];
  if (L >= 5) waves.push({ delay: 6000, spawn: { type: 'blackhawk', count: Math.min(1 + Math.floor(L / 2), 5), interval: 3500 } });
  if (L >= 8) {
    waves.push({ delay: 10000, spawn: { type: 'a10', count: Math.min(1 + Math.floor((L - 8) / 2), 5), interval: Math.max(3500 - L * 100, 1500) } });
  }
  if (L >= 12) waves.push({ delay: 15000, spawn: { type: 'cropduster', count: Math.min(1 + Math.floor((L - 12) / 2), 4), interval: 4000 } });
  if (L >= 16) waves.push({ delay: 18000, spawn: { type: 'ufo', count: Math.min(1 + Math.floor((L - 16) / 3), 4), interval: 5000 } });
  return {
    level: L,
    speedMultiplier: 1 + (L - 1) * 0.1,
    hpMultiplier: 1 + (L - 1) * 0.05,
    requiredHeliKills: Math.min(3 + Math.floor(L * 1.5), 25),
    maxHelisOnScreen,
    activeHeliTarget: Math.min(1 + Math.floor(L / 3), maxHelisOnScreen),
    respawnInterval: Math.max(3000 - L * 100, 800),
    maxParatroopers: Math.min(6 + L, 15),
    waves,
  };
}

export function levelBonus(level: number): number {
  return level * 1000;
}
