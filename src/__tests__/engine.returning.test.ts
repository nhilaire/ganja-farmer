import { constantRng } from '../game/rng';
import { WaveManager } from '../game/waves';
import { fixedEngine, ofType, run, W } from '../test-utils/engine';

// Engine with a quiet sky: no scripted spawn, no respawn, the quota not reached.
function setup(level = 12, value = 0.5) {
  const engine = fixedEngine(value);
  engine.startLevel(level);
  engine.waves['spawns'] = [];
  engine.waves.heliKills = 0;
  engine.waves.config = { ...engine.waves.config, activeHeliTarget: 0 };
  return engine;
}

function leaving(engine: ReturnType<typeof setup>, type: 'a10' | 'cropduster') {
  const plane = engine.spawnEnemy(type);
  Object.assign(plane, { x: W + plane.width + 49, direction: 1, vx: 100, hp: 3, hasDropped: true, dropCount: type === 'a10' ? 0 : 5 });
  engine.update(0.05); // crosses the right edge
  return plane;
}

describe('returning planes (AC-41, D6)', () => {
  it.each(['a10', 'cropduster'] as const)('a %s that leaves alive goes away instead of disappearing', (type) => {
    const engine = setup();
    const plane = leaving(engine, type);
    expect(engine.airEnemies).toContain(plane);
    expect(plane.away).toBe(true);
    expect(plane.returnTimer).toBeGreaterThanOrEqual(5);
    expect(plane.returnTimer).toBeLessThanOrEqual(10);
  });

  it('is neither hittable nor affected by Jah Lightning or One Drop while away', () => {
    const engine = setup();
    const plane = leaving(engine, 'a10');
    Object.assign(plane, { x: engine.layout.playerX, y: 100 }); // even right above the gun
    engine.setFiring(true, -Math.PI / 2);
    run(engine, 0.5, 0.01);
    engine.setFiring(false);
    expect(plane.hp).toBe(3);
    engine.activatePowerUp('one_drop');
    expect(plane.hp).toBe(3);
    engine.activatePowerUp('jah_lightning');
    expect(engine.airEnemies).toContain(plane);
  });

  it('blocks the level end while away', () => {
    const engine = setup();
    const plane = leaving(engine, 'a10');
    plane.returnTimer = 999;
    const waves = new WaveManager(constantRng(0.5));
    waves.start(12);
    waves['spawns'] = [];
    waves.heliKills = waves.config.requiredHeliKills;
    const world = { activeHelicopters: () => 0, enemyCount: () => engine.airEnemies.length, spawn: () => {}, spawnBoss: () => {} };
    expect(waves.update(0.1, world)).toBe(false);
  });

  it.each([
    ['a10', 0.9],
    ['cropduster', 0.1],
  ] as const)('a %s comes back after the delay, same HP, from a random side, with a new pass', (type, side) => {
    const engine = setup(12, side);
    const plane = leaving(engine, type);
    const delay = plane.returnTimer as number;
    run(engine, delay - 0.2, 0.05);
    expect(plane.away).toBe(true);
    run(engine, 0.3, 0.05);
    expect(plane.away).toBe(false);
    expect(plane.hp).toBe(3);
    expect(plane.passCount).toBe(1);
    if (side > 0.5) {
      expect(plane.direction).toBe(1);
      expect(plane.x).toBeLessThan(0);
    } else {
      expect(plane.direction).toBe(-1);
      expect(plane.x).toBeGreaterThan(W);
    }
    if (type === 'a10') {
      expect(plane.hasDropped).toBe(false);
      expect([1, 2]).toContain(plane.dropCount);
    } else {
      expect(plane.dropCount).toBe(0);
      expect(plane.immunePlants?.size).toBe(0);
    }
  });

  it('comes back within 2 s once the helicopter quota is reached', () => {
    const engine = setup();
    const plane = leaving(engine, 'a10');
    plane.returnTimer = 9;
    engine.waves.heliKills = engine.waves.config.requiredHeliKills;
    run(engine, 2.05, 0.05);
    expect(plane.away).toBe(false);
  });

  it('a returning A-10 drops new bombs on its new pass', () => {
    const engine = setup(12, 0.9);
    const plane = leaving(engine, 'a10');
    run(engine, (plane.returnTimer as number) + 0.1, 0.05);
    Object.assign(plane, { x: W / 2, vx: 0 });
    const before = engine.bombs.length;
    run(engine, 0.5, 0.01);
    expect(engine.bombs.length).toBeGreaterThan(before);
  });

  it('a UFO still crosses once', () => {
    const engine = setup(16);
    const ufo = engine.spawnEnemy('ufo');
    Object.assign(ufo, { x: W + ufo.width + 49, direction: 1, vx: 50 });
    engine.update(0.05);
    expect(engine.airEnemies).not.toContain(ufo);
  });

  it('is not drawn while away, and drawn again once back', () => {
    const engine = setup();
    const plane = leaving(engine, 'a10');
    expect(engine.visibleAirEnemies).not.toContain(plane);
    run(engine, (plane.returnTimer as number) + 0.1, 0.05);
    expect(engine.visibleAirEnemies).toContain(plane);
  });

  it('keeps the engine from completing the level while a plane is away', () => {
    const engine = setup();
    const plane = leaving(engine, 'a10');
    engine.waves.heliKills = engine.waves.config.requiredHeliKills;
    const events = run(engine, 1.5, 0.05); // the plane returns within 2 s; the level must not end before
    expect(ofType(events, 'levelComplete')).toHaveLength(0);
    expect(engine.phase).toBe('playing');
    expect(engine.airEnemies).toContain(plane);
  });

  it('a returning crop duster sets plants on fire again on its new pass', () => {
    const engine = setup(12, 0.9);
    const duster = leaving(engine, 'cropduster');
    run(engine, (duster.returnTimer as number) + 0.1, 0.05);
    Object.assign(duster, { y: engine.layout.groundY - 50, x: engine.plants[3].x, vx: 0 });
    const events = run(engine, 0.2, 0.01);
    expect(ofType(events, 'plantBurning').length).toBeGreaterThan(0);
  });
});
