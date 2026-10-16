// Jah blessing between levels: how many dead plants come back (source `components/Game.tsx` onLevelComplete).
import { PLANT_COUNT } from './layout';
import { Rng } from './rng';

// Weights for +2 .. +10; fewer live plants shift the odds towards bigger blessings.
export function jahWeights(alive: number): number[] {
  const lossRatio = 1 - alive / PLANT_COUNT;
  const s = lossRatio * 0.8;
  return [
    Math.max(0.3 - s * 0.35, 0.02),
    Math.max(0.25 - s * 0.25, 0.03),
    Math.max(0.15 - s * 0.1, 0.03),
    0.1 + s * 0.05,
    0.08 + s * 0.1,
    0.05 + s * 0.15,
    0.04 + s * 0.18,
    0.02 + s * 0.12,
    0.01 + s * 0.1,
  ];
}

export function jahDraw(rng: Rng, alive: number): number {
  const weights = jahWeights(alive);
  const total = weights.reduce((a, b) => a + b, 0);
  const roll = rng() * total;
  let cumul = 0;
  for (let i = 0; i < weights.length; i++) {
    cumul += weights[i];
    if (roll < cumul) return 2 + i;
  }
  return 2;
}
