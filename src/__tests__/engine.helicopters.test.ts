import { seededRng } from '../game/rng';
import { fixedEngine, makeEngine, run, silenceWaves, W } from '../test-utils/engine';

describe('helicopters and Black Hawks (AC-12)', () => {
  it('carry 3-8 (helicopter) or 5-10 (Black Hawk) paratroopers', () => {
    const engine = makeEngine(seededRng(3));
    silenceWaves(engine);
    const heli = new Set<number>();
    const hawk = new Set<number>();
    for (let i = 0; i < 300; i++) {
      heli.add(engine.spawnEnemy('helicopter').maxDropCount);
      hawk.add(engine.spawnEnemy('blackhawk').maxDropCount);
    }
    expect([...heli].sort((a, b) => a - b)).toEqual([3, 4, 5, 6, 7, 8]);
    expect([...hawk].sort((a, b) => a - b)).toEqual([5, 6, 7, 8, 9, 10]);
  });

  it('enter from a side at the top with level-scaled speed and HP', () => {
    const engine = fixedEngine(0.9); // rng > 0.5: from the left
    engine.startLevel(5);
    silenceWaves(engine);
    const e = engine.spawnEnemy('helicopter');
    expect(e.x).toBe(-80);
    expect(e.direction).toBe(1);
    expect(e.speed).toBeCloseTo(60 * 1.4);
    expect(e.hp).toBe(Math.ceil(12 * 1.2));
    expect(e.y).toBeGreaterThanOrEqual(engine.layout.skyTop + 20);
    expect(e.y).toBeLessThanOrEqual(engine.layout.skyTop + 100);
  });

  function hoveringHeli(x = W / 2) {
    const engine = fixedEngine();
    silenceWaves(engine);
    const heli = engine.spawnEnemy('helicopter');
    Object.assign(heli, { x, vx: 0, dropCount: 8, maxDropCount: 8, maxDropThisPass: 5 });
    return { engine, heli };
  }

  it('drop one paratrooper every 0.8 s over the field, just under the body', () => {
    const { engine, heli } = hoveringHeli();
    run(engine, 0.75);
    expect(engine.paratroopers).toHaveLength(0);
    run(engine, 0.1);
    expect(engine.paratroopers).toHaveLength(1);
    const para = engine.paratroopers[0];
    expect(Math.abs(para.x - heli.x)).toBeLessThanOrEqual(20);
    run(engine, 1.7);
    expect(engine.paratroopers).toHaveLength(3);
    expect(heli.dropCount).toBe(5);
  });

  it('stop at the pass limit', () => {
    const { engine, heli } = hoveringHeli();
    heli.maxDropThisPass = 2;
    run(engine, 5);
    expect(engine.paratroopers).toHaveLength(2);
  });

  it('do not drop outside 15%-85% of the width', () => {
    const { engine } = hoveringHeli(W * 0.1);
    run(engine, 3);
    expect(engine.paratroopers).toHaveLength(0);
  });

  it('respect the global cap of min(6 + L, 15) paratroopers', () => {
    const { engine } = hoveringHeli();
    for (let i = 0; i < 7; i++) Object.assign(engine.createParatrooper(100 + i * 30, 120), { vy: 0, vx: 0 });
    run(engine, 3);
    expect(engine.paratroopers).toHaveLength(7);
  });

  it('wrap to the other side keeping HP and reload a share of their capacity', () => {
    const engine = fixedEngine();
    silenceWaves(engine);
    const heli = engine.spawnEnemy('helicopter');
    Object.assign(heli, { direction: 1, vx: 60, x: W + 80 + 49, hp: 7, maxDropCount: 6, dropCount: 0, hasDropped: true });
    run(engine, 0.1);
    expect(heli.x).toBeLessThan(0);
    expect(heli.passCount).toBe(1);
    expect(heli.hp).toBe(7);
    expect(heli.dropCount).toBe(2); // ceil(6 x 0.30)
    expect(heli.hasDropped).toBe(false);
    expect(heli.maxDropThisPass).toBeGreaterThanOrEqual(1);
    expect(heli.maxDropThisPass).toBeLessThanOrEqual(5);

    // Later passes reload less, but always at least one.
    for (const [passCount, expected] of [
      [1, 2], // becomes pass 2: ceil(6 x 0.20)
      [2, 1], // pass 3: ceil(6 x 0.10)
      [5, 1], // pass 6: minimum 1
    ]) {
      Object.assign(heli, { x: W + 80 + 55, direction: 1, passCount, dropCount: 0, hasDropped: true });
      engine.update(0.01);
      expect(heli.dropCount).toBe(expected);
    }
  });

  it('do not reload when they still carry paratroopers', () => {
    const engine = fixedEngine();
    silenceWaves(engine);
    const heli = engine.spawnEnemy('helicopter');
    Object.assign(heli, { direction: -1, vx: -60, x: -80 - 55, dropCount: 2, hasDropped: false });
    engine.update(0.01);
    expect(heli.x).toBeGreaterThan(W);
    expect(heli.dropCount).toBe(2);
  });

  it('slow down for real when the speed decay triggers (D3)', () => {
    const engine = fixedEngine(0.4); // < 0.5: the decay triggers
    silenceWaves(engine);
    const heli = engine.spawnEnemy('helicopter');
    Object.assign(heli, { direction: 1, vx: 60, speed: 60, x: W + 80 + 55 });
    engine.update(0.01);
    expect(heli.speed).toBeCloseTo(51);
    expect(heli.vx).toBeCloseTo(51);
    const x0 = heli.x;
    engine.update(1);
    expect(heli.x - x0).toBeCloseTo(51);
  });

  it('never decay below 30 px/s', () => {
    const engine = fixedEngine(0.4);
    silenceWaves(engine);
    const heli = engine.spawnEnemy('helicopter');
    Object.assign(heli, { direction: 1, vx: 32, speed: 32, x: W + 80 + 55 });
    engine.update(0.01);
    expect(heli.speed).toBe(30);
  });
});
