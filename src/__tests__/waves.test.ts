import { SpawnType } from '../game/enemies';
import { constantRng } from '../game/rng';
import { WaveManager, WaveWorld } from '../game/waves';
import { fixedEngine, ofType, run } from '../test-utils/engine';

class FakeWorld implements WaveWorld {
  helis = 0;
  enemies = 0;
  spawned: { type: SpawnType | 'boss'; at: number }[] = [];
  t = 0;
  activeHelicopters = () => this.helis;
  enemyCount = () => this.enemies;
  spawn = (type: SpawnType) => {
    this.spawned.push({ type, at: Math.round(this.t) });
  };
  spawnBoss = () => {
    this.spawned.push({ type: 'boss', at: Math.round(this.t) });
  };
}

// Steps the wave manager in 100 ms ticks for `ms` milliseconds.
function tick(waves: WaveManager, world: FakeWorld, ms: number): boolean {
  let done = false;
  for (let i = 0; i < ms / 100; i++) {
    world.t += 100;
    done = waves.update(0.1, world);
  }
  return done;
}

describe('wave manager (AC-11)', () => {
  it('spawns the first scripted helicopter at 1 s, then one per interval', () => {
    const waves = new WaveManager(constantRng(0.1));
    const world = new FakeWorld();
    waves.start(1);
    world.helis = 1; // = active target (no respawn) and < 4 on screen (scripted spawns allowed)
    tick(waves, world, 6000);
    expect(world.spawned).toEqual([
      { type: 'helicopter', at: 1000 },
      { type: 'helicopter', at: 3400 },
    ]);
  });

  it('respawns helicopters below the active target until the quota is met', () => {
    const waves = new WaveManager(constantRng(0.9));
    const world = new FakeWorld();
    waves.start(5); // target 2, interval 2500 ms, Black Hawk when rng > 0.5
    waves['spawns'] = []; // isolate the respawn rule from the scripted waves
    tick(waves, world, 2500);
    expect(world.spawned).toEqual([{ type: 'blackhawk', at: 2500 }]);
    waves.heliKills = waves.config.requiredHeliKills;
    tick(waves, world, 5000);
    expect(world.spawned.filter((s) => s.type !== 'boss')).toHaveLength(1);
  });

  it('blocks helicopter waves at maxHelisOnScreen without advancing their timer, never the other waves', () => {
    const waves = new WaveManager(constantRng(0.1));
    const world = new FakeWorld();
    waves.start(8); // max 6 helicopters on screen
    world.helis = 6;
    tick(waves, world, 12000);
    expect(world.spawned.map((s) => s.type)).toEqual(['a10']);
    world.helis = 0;
    tick(waves, world, 100);
    // The first Black Hawk of wave 1 and of wave 2 come right away once unblocked.
    expect(world.spawned.filter((s) => s.type === 'blackhawk').length).toBe(2);
  });

  it('completes a normal level when the quota is met and the sky is clear', () => {
    const waves = new WaveManager(constantRng(0.1));
    const world = new FakeWorld();
    waves.start(1);
    world.helis = 1;
    waves.heliKills = 4;
    world.enemies = 2;
    expect(tick(waves, world, 1000)).toBe(false);
    world.enemies = 0;
    expect(tick(waves, world, 100)).toBe(true);
  });

  it('on a boss level, spawns the boss at the quota and completes once it is gone', () => {
    const waves = new WaveManager(constantRng(0.1));
    const world = new FakeWorld();
    waves.start(5);
    world.helis = 2;
    world.enemies = 1;
    waves.heliKills = waves.config.requiredHeliKills;
    expect(tick(waves, world, 100)).toBe(false);
    expect(world.spawned.filter((s) => s.type === 'boss')).toHaveLength(1);
    world.enemies = 0;
    expect(tick(waves, world, 100)).toBe(true);
    expect(world.spawned.filter((s) => s.type === 'boss')).toHaveLength(1);
  });
});

describe('level completion in the engine (AC-16)', () => {
  function readyToComplete() {
    const engine = fixedEngine();
    engine.waves.heliKills = engine.waves.config.requiredHeliKills;
    engine.waves['spawns'] = [];
    return engine;
  }

  it('completes 1.5 s after the quota with a clear sky, and adds level x 1000', () => {
    const engine = readyToComplete();
    engine.score = 2500;
    engine.update(0.01);
    expect(engine.phase).toBe('levelEnding');
    let events = run(engine, 1.4, 0.01);
    expect(ofType(events, 'levelComplete')).toHaveLength(0);
    events = run(engine, 0.2, 0.01);
    expect(ofType(events, 'levelComplete')).toEqual([{ type: 'levelComplete', level: 1, scoreBeforeBonus: 2500, bonus: 1000, restored: 0 }]);
    expect(engine.score).toBe(3500);
    expect(engine.phase).toBe('levelComplete');
  });

  it('does not complete while an air enemy, a paratrooper or a bomb remains', () => {
    for (const add of [
      (e: ReturnType<typeof fixedEngine>) => Object.assign(e.spawnEnemy('helicopter'), { vx: 0, x: 400 }),
      (e: ReturnType<typeof fixedEngine>) => Object.assign(e.createParatrooper(400, 100), { vy: 0, vx: 0 }),
      (e: ReturnType<typeof fixedEngine>) => Object.assign(e.createBomb(400, 100), { vy: 0 }),
    ]) {
      const engine = readyToComplete();
      engine.waves.heliKills = 999;
      add(engine);
      run(engine, 3, 0.05);
      expect(engine.phase).toBe('playing');
    }
  });

  it('burning plants survive the level end and the combo resets at the next level', () => {
    const engine = readyToComplete();
    engine.plants[4].burning = true;
    engine.plants[4].burnProgress = 0.9;
    engine.plants[4].burningBy = 'soldier';
    engine.comboCount = 3;
    engine.comboMultiplier = 2;
    engine.update(0.01); // levelEnding: plants are no longer updated
    run(engine, 1.6, 0.01);
    expect(engine.phase).toBe('levelComplete');
    expect(engine.plants[4].alive).toBe(true);
    engine.nextLevel();
    expect(engine.level).toBe(2);
    expect(engine.plants[4]).toMatchObject({ alive: true, burning: false, burnProgress: 0 });
    expect(engine.comboCount).toBe(0);
    expect(engine.comboMultiplier).toBe(1);
  });
});
