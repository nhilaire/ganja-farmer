import { bossForLevel, isBossLevel } from '../game/enemies';
import { makeLayout, plantX, PLANT_COUNT } from '../game/layout';
import { levelBonus, levelConfig } from '../game/levels';
import { POWER_UPS } from '../game/powerups';
import { constantRng, randomInt, seededRng } from '../game/rng';
import { weaponForLevel, WEAPONS } from '../game/weapons';

describe('weapons (AC-10)', () => {
  it.each([
    [1, 'pistol'],
    [3, 'pistol'],
    [4, 'machinegun'],
    [7, 'aa_gun'],
    [10, 'rocket'],
    [14, 'gatling'],
    [18, 'laser'],
    [30, 'laser'],
  ])('level %i uses %s', (level, id) => {
    expect(weaponForLevel(level).id).toBe(id);
  });

  it('keeps the source stats', () => {
    expect(WEAPONS.pistol).toMatchObject({ damage: 1, fireRate: 3.5, bulletSpeed: 700, spread: 0 });
    expect(WEAPONS.machinegun).toMatchObject({ damage: 1, fireRate: 8, bulletSpeed: 800, spread: 0.05 });
    expect(WEAPONS.aa_gun).toMatchObject({ damage: 3, fireRate: 5, bulletSpeed: 900, spread: 0.02 });
    expect(WEAPONS.rocket).toMatchObject({ damage: 8, fireRate: 3.5, bulletSpeed: 600, spread: 0.03, explosive: true, explosionRadius: 50 });
    expect(WEAPONS.gatling).toMatchObject({ damage: 2, fireRate: 15, bulletSpeed: 1000, spread: 0.08 });
    expect(WEAPONS.laser).toMatchObject({ damage: 5, fireRate: 6, bulletSpeed: 1500, spread: 0, penetrating: true });
  });
});

describe('level formulas (AC-11)', () => {
  it.each([
    // level, quota, maxHelisOnScreen, activeHeliTarget, respawnInterval, maxParatroopers
    [1, 4, 4, 1, 2900, 7],
    [4, 9, 5, 2, 2600, 10],
    [5, 10, 5, 2, 2500, 11],
    [8, 15, 6, 3, 2200, 14],
    [12, 21, 7, 5, 1800, 15],
    [16, 25, 8, 6, 1400, 15],
    [20, 25, 9, 7, 1000, 15],
    [30, 25, 9, 9, 800, 15],
  ])('level %i', (level, quota, maxHelis, active, respawn, maxParas) => {
    const c = levelConfig(level);
    expect(c.requiredHeliKills).toBe(quota);
    expect(c.maxHelisOnScreen).toBe(maxHelis);
    expect(c.activeHeliTarget).toBe(active);
    expect(c.respawnInterval).toBe(respawn);
    expect(c.maxParatroopers).toBe(maxParas);
    expect(c.speedMultiplier).toBeCloseTo(1 + (level - 1) * 0.1);
    expect(c.hpMultiplier).toBeCloseTo(1 + (level - 1) * 0.05);
  });

  it('builds the scripted waves', () => {
    expect(levelConfig(1).waves).toEqual([{ delay: 1000, spawn: { type: 'helicopter', count: 2, interval: 2400 } }]);
    expect(levelConfig(5).waves.map((w) => [w.delay, w.spawn.type, w.spawn.count, w.spawn.interval])).toEqual([
      [1000, 'helicopter', 4, 2000],
      [6000, 'blackhawk', 3, 3500],
    ]);
    expect(levelConfig(8).waves.map((w) => [w.delay, w.spawn.type, w.spawn.count, w.spawn.interval])).toEqual([
      [1000, 'blackhawk', 6, 1700],
      [6000, 'blackhawk', 5, 3500],
      [10000, 'a10', 1, 2700],
    ]);
    expect(levelConfig(12).waves.map((w) => [w.spawn.type, w.spawn.count])).toEqual([
      ['blackhawk', 6],
      ['blackhawk', 5],
      ['a10', 3],
      ['cropduster', 1],
    ]);
    expect(levelConfig(16).waves.map((w) => [w.delay, w.spawn.type, w.spawn.count])).toEqual([
      [1000, 'blackhawk', 6],
      [6000, 'blackhawk', 5],
      [10000, 'a10', 5],
      [15000, 'cropduster', 3],
      [18000, 'ufo', 1],
    ]);
    expect(levelConfig(20).waves[4].spawn).toEqual({ type: 'ufo', count: 2, interval: 5000 });
    expect(levelConfig(30).waves[2].spawn).toEqual({ type: 'a10', count: 5, interval: 1500 });
  });

  it('gives a level bonus of level x 1000', () => {
    expect(levelBonus(1)).toBe(1000);
    expect(levelBonus(7)).toBe(7000);
  });
});

describe('bosses (AC-18 data)', () => {
  it('appear every 5 levels', () => {
    expect([4, 5, 6, 10, 25].map(isBossLevel)).toEqual([false, true, false, true, true]);
  });

  it.each([
    [5, 'GENERAL SHERMAN', 120, 30, 7500, 5],
    [10, 'DEA DRONE MOTHER', 250, 35, 10000, 7],
    [15, 'AIR FORCE ONE', 450, 40, 12500, 9],
    [20, 'MOTHERSHIP', 700, 45, 15000, 11],
    [25, 'WARLORD MK5', 1000, 50, 17500, 13],
    [30, 'WARLORD MK6', 1300, 55, 20000, 15],
  ])('level %i boss is %s', (level, name, hp, speed, score, drops) => {
    expect(bossForLevel(level)).toMatchObject({ name, hp, speed, score, dropCount: drops });
  });

  it('grows with the tier', () => {
    expect(bossForLevel(5)).toMatchObject({ width: 140, height: 70 });
  });
});

describe('layout and power-ups', () => {
  it('spaces 26 plants across the landscape screen', () => {
    const layout = makeLayout(400, 800); // portrait numbers are swapped to landscape
    expect(layout.W).toBe(800);
    expect(layout.H).toBe(400);
    expect(layout.groundY).toBe(300);
    expect(plantX(layout, 0)).toBe(20);
    expect(plantX(layout, PLANT_COUNT - 1)).toBeCloseTo(20 + 25 * (760 / 26));
  });

  it('lists the 12 source power-ups', () => {
    expect(POWER_UPS).toHaveLength(12);
    expect(POWER_UPS.filter((p) => p.duration > 0).map((p) => [p.id, p.duration])).toEqual([
      ['rasta_power', 15],
      ['speed_spliff', 15],
      ['holy_smoke', 10],
      ['bullet_time', 8],
      ['spread_shot', 12],
      ['roots_of_zion', 15],
      ['duppy_conqueror', 20],
    ]);
  });
});

describe('random source', () => {
  it('is deterministic for a seed', () => {
    const a = seededRng(42);
    const b = seededRng(42);
    expect([a(), a(), a()]).toEqual([b(), b(), b()]);
  });

  it('draws inclusive integers', () => {
    expect(randomInt(constantRng(0), 3, 8)).toBe(3);
    expect(randomInt(constantRng(0.9999), 3, 8)).toBe(8);
  });
});
