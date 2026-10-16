import { PowerUpId } from '../game/powerups';
import { fixedEngine, ofType, run, silenceWaves, W } from '../test-utils/engine';

const UP = -Math.PI / 2;

function setup() {
  const engine = fixedEngine();
  silenceWaves(engine);
  return engine;
}

describe('power-up spawning (AC-19)', () => {
  it('spawns the 1st orb at t1 = uniform(20, 40) s and the 2nd at t1 + uniform(90, 120) s', () => {
    const engine = setup(); // rng 0.5: t1 = 30 s, then +105 s
    run(engine, 29.9, 0.1);
    expect(engine.powerUps).toHaveLength(0);
    run(engine, 0.2, 0.1);
    expect(engine.powerUps).toHaveLength(1);
    const orb = engine.powerUps[0];
    expect(orb.x).toBeGreaterThanOrEqual(W * 0.15);
    expect(orb.x).toBeLessThanOrEqual(W * 0.85);
    expect(engine.nextPowerUpIn).toBeCloseTo(105, 0);
    run(engine, 104.8, 0.1);
    expect(engine.powerUps).toHaveLength(0); // the first one fell to the ground long ago
    run(engine, 0.4, 0.1);
    expect(engine.powerUps).toHaveLength(1);
    run(engine, 200, 0.5);
    expect(engine.nextPowerUpIn).toBeNull();
  });

  it('counts spawn time in real time, not slowed by Bullet Time', () => {
    const engine = setup();
    engine.activeEffects = [{ id: 'bullet_time', remaining: 999, duration: 999 }];
    run(engine, 30.1, 0.1);
    expect(engine.powerUps).toHaveLength(1);
  });

  it('falls at 35 px/s and vanishes at the ground', () => {
    const engine = setup();
    const orb = engine.spawnPowerUp('one_drop', 100, 0);
    engine.update(1);
    expect(orb.y).toBeCloseTo(35);
    run(engine, 10);
    expect(engine.powerUps).toHaveLength(0);
  });

  it('is activated by a single hit', () => {
    const engine = setup();
    engine.spawnPowerUp('rasta_power', engine.layout.playerX, 150).vy = 0;
    engine.setFiring(true, UP);
    const events = run(engine, 0.3, 0.01);
    expect(ofType(events, 'powerUpActivated')).toEqual([{ type: 'powerUpActivated', id: 'rasta_power' }]);
    expect(engine.powerUps).toHaveLength(0);
  });
});

describe('power-up effects (AC-20)', () => {
  const timed: [PowerUpId, number][] = [
    ['rasta_power', 15],
    ['speed_spliff', 15],
    ['holy_smoke', 10],
    ['bullet_time', 8],
    ['spread_shot', 12],
    ['roots_of_zion', 15],
    ['duppy_conqueror', 20],
  ];

  it.each(timed)('%s lasts %i s', (id, seconds) => {
    const engine = setup();
    engine.activatePowerUp(id);
    run(engine, seconds - 0.1, 0.05);
    expect(engine.hasEffect(id)).toBe(true);
    run(engine, 0.2, 0.05);
    expect(engine.hasEffect(id)).toBe(false);
  });

  it('picking an active timed effect restarts its timer', () => {
    const engine = setup();
    engine.activatePowerUp('rasta_power');
    run(engine, 10, 0.05);
    engine.activatePowerUp('rasta_power');
    run(engine, 14, 0.05);
    expect(engine.hasEffect('rasta_power')).toBe(true);
    expect(engine.activeEffects).toHaveLength(1);
  });

  it('RASTA POWER doubles bullet damage', () => {
    const engine = setup();
    engine.activatePowerUp('rasta_power');
    engine.setFiring(true, UP);
    engine.update(0.01);
    expect(engine.bullets[0].damage).toBe(2);
  });

  it('HOLY SMOKE slows enemies to 0.5, BULLET TIME to 0.25 and wins over Holy Smoke', () => {
    const engine = setup();
    const heli = Object.assign(engine.spawnEnemy('helicopter'), { x: 100, vx: 60, direction: 1 });
    engine.activatePowerUp('holy_smoke');
    expect(engine.timeScale()).toBe(0.5);
    engine.update(1);
    expect(heli.x).toBeCloseTo(130);
    engine.activatePowerUp('bullet_time');
    expect(engine.timeScale()).toBe(0.25);
    engine.update(1);
    expect(heli.x).toBeCloseTo(145);
  });

  it('JAH LIGHTNING destroys every air enemy, paratrooper and bomb (no score for bombs)', () => {
    const engine = setup();
    engine.spawnEnemy('helicopter');
    engine.createParatrooper(300, 100);
    engine.createBomb(300, 50);
    engine.activatePowerUp('jah_lightning');
    engine.update(0.01);
    expect(engine.airEnemies).toHaveLength(0);
    expect(engine.paratroopers).toHaveLength(0);
    expect(engine.bombs).toHaveLength(0);
    expect(engine.score).toBe(600);
    expect(engine.waves.heliKills).toBe(1);
  });

  it('GANJA SHIELD shields every live plant', () => {
    const engine = setup();
    engine.plants[3].alive = false;
    engine.activatePowerUp('ganja_shield');
    expect(engine.plantShields.filter(Boolean)).toHaveLength(25);
    expect(engine.plantShields[3]).toBe(false);
  });

  it('SPREAD SHOT adds two bullets at +/- 0.15 rad', () => {
    const engine = setup();
    engine.activatePowerUp('spread_shot');
    engine.setFiring(true, UP);
    engine.update(0.01);
    expect(engine.bullets.map((b) => b.angle).sort((a, b) => a - b)).toEqual([UP - 0.15, UP, UP + 0.15].sort((a, b) => a - b));
  });

  it('ROOTS OF ZION restores one dead plant every 3 s', () => {
    const engine = setup();
    for (const p of engine.plants.slice(0, 10)) p.alive = false;
    engine.activatePowerUp('roots_of_zion');
    run(engine, 15.05, 0.05);
    expect(engine.alivePlants).toBe(16 + 4); // at 3, 6, 9 and 12 s: the effect ends at 15 s before a 5th heal (source order)
  });

  it('BABYLON TRAP makes the next 3 soldiers reaching a plant explode for 100 points', () => {
    const engine = setup();
    engine.activatePowerUp('babylon_trap');
    expect(engine.babylonTrapCharges).toBe(3);
    const para = engine.createParatrooper(engine.plants[13].x, engine.layout.groundY - 36.5);
    para.vx = 0;
    run(engine, 0.3, 0.01);
    expect(para.active).toBe(false);
    expect(engine.score).toBe(100);
    expect(engine.babylonTrapCharges).toBe(2);
    expect(engine.plants[13].burning).toBe(false);
  });

  it('ZION WALL stops falling paratroopers (100 points) and bombs (no score), 3 impacts', () => {
    const engine = setup();
    engine.activatePowerUp('zion_wall');
    const wallY = engine.layout.H * 0.55;
    Object.assign(engine.createParatrooper(300, wallY - 5), { vx: 0 });
    engine.createBomb(500, wallY - 5);
    Object.assign(engine.createParatrooper(600, wallY - 5), { vx: 0 });
    Object.assign(engine.createParatrooper(700, wallY - 5), { vx: 0 });
    run(engine, 0.5, 0.01);
    expect(engine.zionWallHits).toBe(0);
    expect(engine.score).toBe(200);
    expect(engine.bombs).toHaveLength(0);
    expect(engine.paratroopers).toHaveLength(1); // the 4th one went through
  });

  it('ONE DROP halves the HP of every active enemy, at least 1', () => {
    const engine = setup();
    const heli = Object.assign(engine.spawnEnemy('helicopter'), { hp: 11 });
    const para = Object.assign(engine.createParatrooper(300, 100), { hp: 1 });
    engine.activatePowerUp('one_drop');
    expect(heli.hp).toBe(6);
    expect(para.hp).toBe(1);
  });

  it('DUPPY CONQUEROR fires a ghost bullet every 0.5 s at the nearest enemy', () => {
    const engine = setup();
    const { playerX, playerY } = engine.layout;
    Object.assign(engine.spawnEnemy('helicopter'), { x: playerX + 200, y: playerY - 200, vx: 0, hp: 100 });
    engine.activatePowerUp('duppy_conqueror');
    run(engine, 0.55, 0.01);
    const ghosts = engine.bullets.filter((b) => b.ghost);
    expect(ghosts).toHaveLength(1);
    expect(ghosts[0].angle).toBeCloseTo(-Math.PI / 4, 1);
    expect(Math.hypot(ghosts[0].vx, ghosts[0].vy)).toBeCloseTo(500);
    expect(ghosts[0].damage).toBe(1);
  });

  it('timed effects end at the next level, shields, trap and wall carry over (D5)', () => {
    const engine = setup();
    engine.activatePowerUp('rasta_power');
    engine.activatePowerUp('ganja_shield');
    engine.activatePowerUp('babylon_trap');
    engine.activatePowerUp('zion_wall');
    engine.phase = 'levelComplete';
    engine.nextLevel();
    expect(engine.activeEffects).toHaveLength(0);
    expect(engine.plantShields.filter(Boolean)).toHaveLength(26);
    expect(engine.babylonTrapCharges).toBe(3);
    expect(engine.zionWallHits).toBe(3);
    engine.newGame();
    expect(engine.plantShields.filter(Boolean)).toHaveLength(0);
    expect(engine.babylonTrapCharges).toBe(0);
    expect(engine.zionWallHits).toBe(0);
  });
});
