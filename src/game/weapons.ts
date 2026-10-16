// Weapons, from the source `constants/weapons.ts` (the code is the reference). Display names live in i18n.
export type WeaponId = 'pistol' | 'machinegun' | 'aa_gun' | 'rocket' | 'gatling' | 'laser';

export interface WeaponDef {
  id: WeaponId;
  fireRate: number; // shots per second
  damage: number;
  bulletSpeed: number; // px/s
  bulletSize: number;
  unlockLevel: number;
  spread: number; // radians, total width
  explosive: boolean;
  explosionRadius: number;
  penetrating: boolean;
}

const weapon = (def: WeaponDef): WeaponDef => def;

export const WEAPONS: Record<WeaponId, WeaponDef> = {
  pistol: weapon({ id: 'pistol', fireRate: 3.5, damage: 1, bulletSpeed: 700, bulletSize: 6, unlockLevel: 1, spread: 0, explosive: false, explosionRadius: 0, penetrating: false }),
  machinegun: weapon({ id: 'machinegun', fireRate: 8, damage: 1, bulletSpeed: 800, bulletSize: 7, unlockLevel: 4, spread: 0.05, explosive: false, explosionRadius: 0, penetrating: false }),
  aa_gun: weapon({ id: 'aa_gun', fireRate: 5, damage: 3, bulletSpeed: 900, bulletSize: 9, unlockLevel: 7, spread: 0.02, explosive: false, explosionRadius: 0, penetrating: false }),
  rocket: weapon({ id: 'rocket', fireRate: 3.5, damage: 8, bulletSpeed: 600, bulletSize: 12, unlockLevel: 10, spread: 0.03, explosive: true, explosionRadius: 50, penetrating: false }),
  gatling: weapon({ id: 'gatling', fireRate: 15, damage: 2, bulletSpeed: 1000, bulletSize: 7, unlockLevel: 14, spread: 0.08, explosive: false, explosionRadius: 0, penetrating: false }),
  laser: weapon({ id: 'laser', fireRate: 6, damage: 5, bulletSpeed: 1500, bulletSize: 7, unlockLevel: 18, spread: 0, explosive: false, explosionRadius: 0, penetrating: true }),
};

export const WEAPON_ORDER: readonly WeaponId[] = ['pistol', 'machinegun', 'aa_gun', 'rocket', 'gatling', 'laser'];

export function weaponForLevel(level: number): WeaponDef {
  let best = WEAPONS.pistol;
  for (const id of WEAPON_ORDER) if (WEAPONS[id].unlockLevel <= level) best = WEAPONS[id];
  return best;
}

// Number of weapons unlocked after the pistol at this level (drives max helicopters on screen).
export function weaponUpgrades(level: number): number {
  return WEAPON_ORDER.slice(1).filter((id) => WEAPONS[id].unlockLevel <= level).length;
}
