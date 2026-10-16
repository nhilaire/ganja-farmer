import { fixedEngine, ofType, run, W } from '../test-utils/engine';

function bossFight(level = 5) {
  const engine = fixedEngine(0.9); // rng > 0.5: boss enters from the left
  engine.startLevel(level);
  engine.waves['spawns'] = [];
  engine.waves.heliKills = engine.waves.config.requiredHeliKills;
  const events = run(engine, 0.02, 0.01);
  const boss = engine.airEnemies.find((e) => e.type === 'boss');
  if (!boss) throw new Error('boss not spawned');
  return { engine, boss, events };
}

describe('bosses (AC-18)', () => {
  it('spawn when the quota is reached, with the tier stats and a warning', () => {
    const { engine, boss, events } = bossFight(5);
    expect(ofType(events, 'bossSpawn')).toEqual([{ type: 'bossSpawn', name: 'GENERAL SHERMAN' }]);
    expect(boss).toMatchObject({ name: 'GENERAL SHERMAN', hp: 120, speed: 30, score: 7500, maxDropCount: 5, width: 140, height: 70 });
    expect(boss.y).toBeCloseTo(engine.layout.skyTop + 30, 0);
    expect(engine.bossActive).toBe(true);
  });

  it('are not scaled by the level HP multiplier', () => {
    const { boss } = bossFight(10);
    expect(boss).toMatchObject({ name: 'DEA DRONE MOTHER', hp: 250 });
  });

  it('drop a bomb and a paratrooper every 2 s over the field', () => {
    const { engine, boss } = bossFight(5);
    Object.assign(boss, { x: W / 2, vx: 0, maxDropThisPass: 5 });
    run(engine, 1.9, 0.01);
    expect(engine.bombs).toHaveLength(0);
    run(engine, 0.2, 0.01);
    expect(engine.bombs).toHaveLength(1);
    expect(engine.paratroopers).toHaveLength(1);
    expect(Math.abs(engine.paratroopers[0].x - boss.x)).toBeLessThanOrEqual(40);
    expect(boss.dropCount).toBe(4);
  });

  it('drop only bombs once the pass limit is reached', () => {
    const { engine, boss } = bossFight(5);
    Object.assign(boss, { x: W / 2, vx: 0, maxDropThisPass: 1 });
    const events = run(engine, 4.1, 0.01);
    // First bomb at 2 s (exploded on the ground since), second at 4 s, a single paratrooper.
    expect(ofType(events, 'explosion').length).toBeGreaterThanOrEqual(1);
    expect(engine.bombs).toHaveLength(1);
    expect(boss.droppedThisPass).toBe(1);
    expect(boss.dropCount).toBe(4);
  });

  it('wrap keeping HP but never reload paratroopers', () => {
    const { engine, boss } = bossFight(5);
    Object.assign(boss, { x: W + boss.width + 55, direction: 1, vx: 30, hp: 33, dropCount: 0 });
    engine.update(0.01);
    expect(boss.x).toBeLessThan(0);
    expect(boss.passCount).toBe(1);
    expect(boss.hp).toBe(33);
    expect(boss.dropCount).toBe(0);
  });

  it('a boss shot down gives its score, a defeat event, and the level completes', () => {
    const { engine, boss } = bossFight(5);
    Object.assign(boss, { x: engine.layout.playerX, y: 100, vx: 0, hp: 1 });
    engine.setFiring(true, -Math.PI / 2);
    const events = run(engine, 0.5, 0.01);
    engine.setFiring(false);
    expect(ofType(events, 'bossDefeated')).toEqual([{ type: 'bossDefeated', level: 5 }]);
    expect(engine.score).toBe(7500);
    expect(engine.bossActive).toBe(false);
    run(engine, 2, 0.01);
    expect(engine.phase).toBe('levelComplete');
  });

  it('a boss destroyed by Jah Lightning counts as defeated too (D2)', () => {
    const { engine } = bossFight(5);
    engine.activatePowerUp('jah_lightning');
    const events = engine.drainEvents();
    expect(ofType(events, 'bossDefeated')).toEqual([{ type: 'bossDefeated', level: 5 }]);
    expect(engine.score).toBe(7500);
    run(engine, 2, 0.01);
    expect(engine.phase).toBe('levelComplete');
  });
});
