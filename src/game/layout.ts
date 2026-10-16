// Screen geometry of the landscape playfield, from the source `constants/config.ts`, as a function of the screen size
// (the source read Dimensions at import time; the port keeps the engine pure).
export const PLANT_COUNT = 26;

export interface Layout {
  W: number;
  H: number;
  hudHeight: number;
  skyTop: number;
  groundY: number;
  fieldY: number;
  vanY: number;
  dirtY: number;
  plantSpacing: number;
  plantStartX: number;
  vanWidth: number;
  vanHeight: number;
  vanX: number;
  playerX: number;
  playerY: number;
}

export function makeLayout(width: number, height: number): Layout {
  const W = Math.max(width, height);
  const H = Math.min(width, height);
  const hudHeight = H * 0.06;
  const vanWidth = W * 0.12;
  const vanX = W * 0.45;
  const vanY = H * 0.68;
  return {
    W,
    H,
    hudHeight,
    skyTop: hudHeight,
    groundY: H * 0.75,
    fieldY: H * 0.78,
    vanY,
    dirtY: H * 0.88,
    plantSpacing: (W - 40) / PLANT_COUNT,
    plantStartX: 20,
    vanWidth,
    vanHeight: vanWidth * 0.5,
    vanX,
    playerX: vanX + vanWidth * 0.5,
    playerY: vanY - 10,
  };
}

export function plantX(layout: Layout, index: number): number {
  return layout.plantStartX + index * layout.plantSpacing;
}
