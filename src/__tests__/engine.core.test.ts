import { seededRng } from '../game/rng';
import { fixedEngine, makeEngine, ofType, run, silenceWaves } from '../test-utils/engine';

const UP = -Math.PI / 2;

describe('firing (AC-09)', () => {
  it('fires from the player at the weapon fire rate while firing is on', () => {
    const engine = fixedEngine();
    silenceWaves(engine);
    engine.setFiring(true, UP);
    engine.update(0.001);
    expect(engine.bullets).toHaveLength(1);
    const b = engine.bullets[0];
    expect(b.x).toBeCloseTo(engine.layout.playerX);
    expect(b.y).toBeCloseTo(engine.layout.playerY - 20 + b.vy * 0.001);
    expect(b.vy).toBeCloseTo(-700);
    const shots = ofType(run(engine, 0.95, 0.01), 'shot');
    // Pistol 3.5 shots/s: one at t=0 (still queued) and 3 more within 0.95 s.
    expect(shots).toHaveLength(4);
  });

  it('doubles the fire rate with Speed Spliff', () => {
    const engine = fixedEngine();
    silenceWaves(engine);
    engine.activatePowerUp('speed_spliff');
    engine.setFiring(true, UP);
    expect(ofType(run(engine, 0.95, 0.01), 'shot')).toHaveLength(7);
  });

  it('does not fire when firing is off', () => {
    const engine = fixedEngine();
    silenceWaves(engine);
    engine.setFiring(false, UP);
    expect(ofType(run(engine, 1), 'shot')).toHaveLength(0);
    expect(engine.bullets).toHaveLength(0);
  });

  it('spreads bullets within +/- spread/2 around the aim', () => {
    const engine = makeEngine(seededRng(7));
    silenceWaves(engine);
    engine.startLevel(4); // machine gun, spread 0.05
    silenceWaves(engine);
    engine.setFiring(true, UP);
    const angles: number[] = [];
    for (let i = 0; i < 200; i++) {
      engine.update(0.01);
      for (const b of engine.bullets) angles.push(b.angle);
    }
    expect(angles.length).toBeGreaterThan(10);
    for (const a of angles) expect(Math.abs(a - UP)).toBeLessThanOrEqual(0.025 + 1e-9);
    expect(new Set(angles.map((a) => a.toFixed(6))).size).toBeGreaterThan(1);
  });

  it('aims at the touched point', () => {
    const engine = fixedEngine();
    const { playerX, playerY } = engine.layout;
    engine.aimAt(playerX + 100, playerY - 100);
    expect(engine.aimAngle).toBeCloseTo(-Math.PI / 4);
  });
});

function fireOneShot(engine: ReturnType<typeof fixedEngine>) {
  engine.setFiring(true, UP);
  engine.update(0.001);
  engine.setFiring(false);
}

describe('collisions (AC-39)', () => {
  it('a normal bullet stops at the first air enemy', () => {
    const engine = fixedEngine();
    silenceWaves(engine);
    const { playerX } = engine.layout;
    const low = engine.spawnEnemy('helicopter');
    Object.assign(low, { x: playerX, y: 150, vx: 0, hp: 50 });
    const high = engine.spawnEnemy('helicopter');
    Object.assign(high, { x: playerX, y: 60, vx: 0, hp: 50 });
    fireOneShot(engine);
    run(engine, 1);
    expect(low.hp).toBe(49);
    expect(high.hp).toBe(50);
  });

  // A penetrating bullet hits again on every frame it overlaps a target (source behaviour).
  it('a laser goes through air enemies and paratroopers', () => {
    const engine = fixedEngine();
    engine.startLevel(18);
    silenceWaves(engine);
    const { playerX } = engine.layout;
    const para = engine.createParatrooper(playerX, 170);
    Object.assign(para, { vy: 0, vx: 0, hp: 50 });
    const heli = engine.spawnEnemy('helicopter');
    Object.assign(heli, { x: playerX, y: 80, vx: 0, hp: 50 });
    fireOneShot(engine);
    run(engine, 0.5);
    expect(para.hp).toBeLessThan(50);
    expect(heli.hp).toBeLessThan(50);
    expect(engine.bullets).toHaveLength(0);
  });

  it.each(['orb', 'bomb'] as const)('a %s stops even a laser bullet', (blocker) => {
    const engine = fixedEngine();
    engine.startLevel(18);
    silenceWaves(engine);
    const { playerX } = engine.layout;
    if (blocker === 'orb') Object.assign(engine.spawnPowerUp('rasta_power', playerX, 170), { vy: 0 });
    else Object.assign(engine.createBomb(playerX, 170), { vy: 0 });
    const heli = engine.spawnEnemy('helicopter');
    Object.assign(heli, { x: playerX, y: 80, vx: 0, hp: 50 });
    fireOneShot(engine);
    run(engine, 0.5);
    expect(heli.hp).toBe(50);
  });

  it('a rocket shows an explosion of radius 50 on an air hit only', () => {
    const engine = fixedEngine();
    engine.startLevel(10);
    silenceWaves(engine);
    const { playerX } = engine.layout;
    const para = engine.createParatrooper(playerX, 170);
    Object.assign(para, { vy: 0, vx: 0, hp: 50 });
    fireOneShot(engine);
    run(engine, 0.2);
    expect(para.hp).toBe(42);
    expect(engine.explosions.some((e) => e.radius === 50)).toBe(false);

    const heli = engine.spawnEnemy('helicopter');
    Object.assign(heli, { x: playerX, y: 80, vx: 0, hp: 50 });
    para.active = false;
    run(engine, 0.3); // let the rocket launcher reload
    fireOneShot(engine);
    run(engine, 0.3);
    expect(heli.hp).toBe(42);
    expect(engine.explosions.some((e) => e.radius === 50)).toBe(true);
  });
});

describe('game over (AC-21)', () => {
  it('fires exactly once when the last plant is destroyed', () => {
    const engine = fixedEngine();
    silenceWaves(engine);
    for (const p of engine.plants.slice(1)) p.alive = false;
    const last = engine.plants[0];
    engine.createBomb(last.x, engine.layout.groundY - 1);
    const events = run(engine, 2);
    const overs = ofType(events, 'gameOver');
    expect(overs).toHaveLength(1);
    expect(overs[0].cause).toBe('bomb');
    expect(engine.phase).toBe('over');
    expect(ofType(run(engine, 2), 'gameOver')).toHaveLength(0);
  });

  it('starts a new game with 26 plants, level 1, score 0 and the pistol', () => {
    const engine = makeEngine();
    expect(engine.alivePlants).toBe(26);
    expect(engine.level).toBe(1);
    expect(engine.score).toBe(0);
    expect(engine.weapon.id).toBe('pistol');
  });
});
