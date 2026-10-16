import { fixedEngine, ofType, run, silenceWaves, W } from '../test-utils/engine';

function setup(level = 1, value = 0.5) {
  const engine = fixedEngine(value);
  engine.startLevel(level);
  silenceWaves(engine);
  return engine;
}

describe('A-10 and bombs (AC-14)', () => {
  it('an A-10 drops 1-2 bombs, one every 0.4 s, between 10% and 90% of the width', () => {
    const engine = setup(8);
    const a10 = engine.spawnEnemy('a10');
    expect(a10.dropCount).toBe(2); // randomInt(1, 2) with rng 0.5
    Object.assign(a10, { x: W / 2, vx: 0 });
    run(engine, 0.35, 0.01);
    expect(engine.bombs).toHaveLength(0);
    run(engine, 0.1, 0.01);
    expect(engine.bombs).toHaveLength(1);
    expect(Math.abs(engine.bombs[0].x - a10.x)).toBeLessThanOrEqual(15);
    run(engine, 0.4, 0.01);
    expect(engine.bombs).toHaveLength(2);
    expect(a10.hasDropped).toBe(true);
  });

  it('an A-10 that leaves the screen goes away and will come back (D6)', () => {
    const engine = setup(8);
    const a10 = engine.spawnEnemy('a10');
    Object.assign(a10, { x: W + 70 + 49, direction: 1, vx: 90, hasDropped: true });
    engine.update(0.05);
    expect(engine.airEnemies).toEqual([a10]);
    expect(a10.away).toBe(true);
  });

  it('a bomb falls at 120 px/s and destroys live plants within 50 px', () => {
    const engine = setup();
    const { groundY } = engine.layout;
    const center = engine.plants[10];
    const bomb = engine.createBomb(center.x, groundY - 120);
    engine.update(0.5);
    expect(bomb.y).toBeCloseTo(groundY - 60);
    const events = run(engine, 0.6, 0.01);
    const destroyed = ofType(events, 'plantDestroyed');
    // Plants are ~29 px apart: the centre one and both neighbours are within 50 px.
    expect(destroyed.map((d) => d.index).sort((a, b) => a - b)).toEqual([9, 10, 11]);
    expect(destroyed.every((d) => d.cause === 'bomb')).toBe(true);
  });

  it('a shielded plant loses its shield instead of being bombed', () => {
    const engine = setup();
    const { groundY } = engine.layout;
    engine.plantShields[10] = true;
    engine.createBomb(engine.plants[10].x, groundY - 5);
    run(engine, 0.2);
    expect(engine.plants[10].alive).toBe(true);
    expect(engine.plantShields[10]).toBe(false);
    expect(engine.plants[9].alive).toBe(false);
  });

  it('a shot bomb is worth 300 points', () => {
    const engine = setup();
    const { playerX } = engine.layout;
    Object.assign(engine.createBomb(playerX, 150), { vy: 0 });
    engine.setFiring(true, -Math.PI / 2);
    run(engine, 0.5, 0.01);
    expect(engine.score).toBe(300);
    expect(engine.bombs).toHaveLength(0);
  });
});

describe('crop duster (AC-14, D4)', () => {
  it('sets up to 5 plants on fire per pass when flying low enough', () => {
    const engine = setup(12);
    const { groundY } = engine.layout;
    const duster = engine.spawnEnemy('cropduster');
    Object.assign(duster, { x: 0, y: groundY - 50, direction: 1, vx: 45 });
    const events = run(engine, 10, 0.01);
    expect(ofType(events, 'plantBurning')).toHaveLength(5);
    const destroyed = ofType(events, 'plantDestroyed');
    expect(destroyed.length).toBeGreaterThan(0);
    expect(destroyed.every((d) => d.cause === 'cropduster')).toBe(true);
  });

  it('does not attack when spawned higher than 60 px above the ground', () => {
    const engine = setup(12);
    const { groundY } = engine.layout;
    const duster = engine.spawnEnemy('cropduster');
    Object.assign(duster, { x: 0, y: groundY - 70, direction: 1, vx: 45 });
    expect(ofType(run(engine, 10, 0.01), 'plantBurning')).toHaveLength(0);
  });

  it('a shield protects its plant for the whole pass (D4)', () => {
    const engine = setup(12);
    const { groundY } = engine.layout;
    engine.plantShields[5] = true;
    const duster = engine.spawnEnemy('cropduster');
    Object.assign(duster, { x: engine.plants[5].x, y: groundY - 50, vx: 0 });
    const events = run(engine, 2, 0.01);
    expect(engine.plantShields[5]).toBe(false);
    expect(engine.plants[5].burning).toBe(false);
    expect(engine.plants[5].alive).toBe(true);
    expect(ofType(events, 'plantBurning')).toHaveLength(0);
    expect(duster.dropCount).toBe(1);
  });
});

describe('UFO (AC-14)', () => {
  it('destroys a random live plant every 3 s once past mid-screen', () => {
    const engine = setup(16);
    const ufo = engine.spawnEnemy('ufo');
    Object.assign(ufo, { x: W * 0.6, direction: 1, vx: 0 });
    let events = run(engine, 2.9, 0.01);
    expect(ofType(events, 'plantDestroyed')).toHaveLength(0);
    events = run(engine, 0.2, 0.01);
    expect(ofType(events, 'plantDestroyed')).toEqual([expect.objectContaining({ cause: 'ufo' })]);
    expect(engine.alivePlants).toBe(25);
  });

  it('does nothing before mid-screen', () => {
    const engine = setup(16);
    const ufo = engine.spawnEnemy('ufo');
    Object.assign(ufo, { x: W * 0.4, direction: 1, vx: 0 });
    expect(ofType(run(engine, 5, 0.01), 'plantDestroyed')).toHaveLength(0);
  });

  it('consumes a shield instead of a plant', () => {
    const engine = setup(16);
    engine.activatePowerUp('ganja_shield');
    const ufo = engine.spawnEnemy('ufo');
    Object.assign(ufo, { x: W * 0.6, direction: 1, vx: 0 });
    run(engine, 3.1, 0.01);
    expect(engine.alivePlants).toBe(26);
    expect(engine.plantShields.filter(Boolean)).toHaveLength(25);
  });

  it('wobbles vertically', () => {
    const engine = setup(16);
    const ufo = engine.spawnEnemy('ufo');
    Object.assign(ufo, { x: W * 0.3, vx: 0 });
    const ys = new Set<number>();
    for (let i = 0; i < 30; i++) {
      engine.update(0.05);
      ys.add(Math.round(ufo.y));
    }
    expect(ys.size).toBeGreaterThan(3);
  });
});

describe('soldier vs shield (AC-14)', () => {
  it('a soldier consumes the shield, the plant does not burn and the soldier gives up', () => {
    const engine = setup();
    const { groundY } = engine.layout;
    engine.plantShields[13] = true;
    const para = engine.createParatrooper(engine.plants[13].x, groundY - 36.5);
    para.vx = 0;
    run(engine, 0.5, 0.01);
    expect(engine.plantShields[13]).toBe(false);
    expect(engine.plants[13].burning).toBe(false);
    expect(para.fleeing).toBe(true);
  });
});
