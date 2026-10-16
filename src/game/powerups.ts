// Power-ups, from the source `constants/powerups.ts`. Names and descriptions live in i18n (en.powerUps).
export type PowerUpId =
  | 'rasta_power'
  | 'speed_spliff'
  | 'holy_smoke'
  | 'jah_lightning'
  | 'ganja_shield'
  | 'bullet_time'
  | 'spread_shot'
  | 'roots_of_zion'
  | 'babylon_trap'
  | 'zion_wall'
  | 'one_drop'
  | 'duppy_conqueror';

export interface PowerUpDef {
  id: PowerUpId;
  color: string;
  duration: number; // seconds; 0 = instant or until used
}

export const POWER_UPS: readonly PowerUpDef[] = [
  { id: 'rasta_power', color: '#FF4444', duration: 15 },
  { id: 'speed_spliff', color: '#44FF44', duration: 15 },
  { id: 'holy_smoke', color: '#AAAAFF', duration: 10 },
  { id: 'jah_lightning', color: '#FFFF00', duration: 0 },
  { id: 'ganja_shield', color: '#00FF88', duration: 0 },
  { id: 'bullet_time', color: '#8844FF', duration: 8 },
  { id: 'spread_shot', color: '#FF8800', duration: 12 },
  { id: 'roots_of_zion', color: '#228B22', duration: 15 },
  { id: 'babylon_trap', color: '#CC4400', duration: 0 },
  { id: 'zion_wall', color: '#00DDFF', duration: 0 },
  { id: 'one_drop', color: '#4488FF', duration: 0 },
  { id: 'duppy_conqueror', color: '#DD44DD', duration: 20 },
];

export const POWER_UP_FALL_SPEED = 35;
export const POWER_UP_SIZE = 28;

export function powerUpDef(id: PowerUpId): PowerUpDef {
  const def = POWER_UPS.find((p) => p.id === id);
  if (!def) throw new Error(`unknown power-up ${id}`);
  return def;
}
