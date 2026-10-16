import { plantX } from '../game/layout';
import { seededRng } from '../game/rng';
import { fixedEngine, makeEngine, ofType, run, silenceWaves, W } from '../test-utils/engine';

function setup() {
  const engine = fixedEngine();
  silenceWaves(engine);
  return engine;
}

describe('paratroopers and soldiers (AC-13)', () => {
  it('fall at 40 px/s with a drift within +/- 7.5 px/s', () => {
    const engine = makeEngine(seededRng(5));
    silenceWaves(engine);
    for (let i = 0; i < 200; i++) {
      const p = engine.createParatrooper(400, 50);
      expect(p.vy).toBe(40);
      expect(Math.abs(p.vx)).toBeLessThanOrEqual(7.5);
    }
    const engine2 = setup();
    const para = engine2.createParatrooper(400, 100);
    para.vx = 0;
    run(engine2, 1, 0.01);
    expect(para.y).toBeCloseTo(140);
  });

  it('land on the ground line and target the nearest live plant', () => {
    const engine = setup();
    const { groundY } = engine.layout;
    const para = engine.createParatrooper(plantX(engine.layout, 13) + 10, groundY - 37);
    para.vx = 0;
    engine.update(0.05);
    expect(para.landed).toBe(true);
    expect(para.y).toBe(groundY - 36);
    expect(para.targetPlantIndex).toBe(13);
  });

  it('walk at 30 px/s to the plant, set it on fire, and the plant dies after 3 s', () => {
    const engine = setup();
    const { groundY } = engine.layout;
    const target = engine.plants[13];
    const para = engine.createParatrooper(target.x + 10, groundY - 36.5);
    para.vx = 0;
    engine.update(0.02); // lands
    const x0 = para.x;
    engine.update(0.1);
    expect(x0 - para.x).toBeCloseTo(3);
    const events = run(engine, 0.6, 0.01); // reaches the plant (5 px at 30 px/s)
    expect(target.burning).toBe(true);
    expect(ofType(events, 'plantBurning')).toHaveLength(1);
    const later = run(engine, 3.05, 0.01);
    expect(target.alive).toBe(false);
    expect(ofType(later, 'plantDestroyed')).toEqual([{ type: 'plantDestroyed', index: 13, cause: 'soldier' }]);
    expect(para.plantsDestroyed).toBe(1);
  });

  it('retarget the nearest live plant when its target dies', () => {
    const engine = setup();
    const { groundY } = engine.layout;
    const para = engine.createParatrooper(engine.plants[13].x, groundY - 36.5);
    para.vx = 0;
    engine.update(0.02);
    expect(para.targetPlantIndex).toBe(13);
    engine.plants[13].alive = false;
    engine.plants[13].burning = false;
    engine.update(0.02);
    expect([12, 14]).toContain(para.targetPlantIndex);
  });

  it('flee to the nearest edge after destroying 3 plants, then leave the screen', () => {
    const engine = setup();
    const { groundY } = engine.layout;
    const para = engine.createParatrooper(200, groundY - 36.5);
    para.vx = 0;
    engine.update(0.02);
    para.plantsDestroyed = 3;
    engine.update(0.02);
    expect(para.fleeing).toBe(true);
    const x0 = para.x;
    engine.update(1);
    expect(x0 - para.x).toBeCloseTo(50); // 200 < W/2: runs left
    run(engine, 5);
    expect(engine.paratroopers).toHaveLength(0);
    expect(engine.alivePlants).toBe(26);
  });

  it('flee when no live plant is left to target', () => {
    const engine = setup();
    const { groundY } = engine.layout;
    for (const p of engine.plants) if (p.index !== 0) p.alive = false;
    const para = engine.createParatrooper(W - 100, groundY - 36.5);
    para.vx = 0;
    engine.update(0.02);
    expect(para.targetPlantIndex).toBe(0);
    engine.plants[0].alive = false; // the last plant dies elsewhere
    engine.update(0.02);
    expect(para.fleeing || engine.phase === 'over').toBe(true);
  });

  it('can be shot while falling and on the ground for 100 points', () => {
    const engine = setup();
    const { playerX, groundY } = engine.layout;
    const falling = engine.createParatrooper(playerX, 150);
    Object.assign(falling, { vx: 0, vy: 0 });
    engine.setFiring(true, -Math.PI / 2);
    run(engine, 0.8, 0.01);
    engine.setFiring(false);
    expect(falling.active).toBe(false);
    expect(engine.score).toBe(100);
    expect(engine.kills).toBe(1);

    const landed = engine.createParatrooper(playerX + 120, groundY - 36);
    landed.vx = 0;
    engine.update(0.01);
    engine.aimAt(landed.x, landed.y);
    engine.setFiring(true);
    run(engine, 1.5, 0.01);
    expect(landed.active).toBe(false);
    expect(engine.score).toBe(200);
  });
});
