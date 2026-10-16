import { CheatDetector } from '../game/cheats';
import { jahDraw, jahWeights } from '../game/jah';
import { makeLayout } from '../game/layout';
import { constantRng, seededRng } from '../game/rng';
import { fixedEngine, H, makeEngine, ofType, run, silenceWaves, W } from '../test-utils/engine';

describe('Jah blessing draw (AC-17)', () => {
  it('uses the source weights, shifted towards big blessings when plants are lost', () => {
    const full = jahWeights(26);
    expect(full.map((w) => +w.toFixed(4))).toEqual([0.3, 0.25, 0.15, 0.1, 0.08, 0.05, 0.04, 0.02, 0.01]);
    const empty = jahWeights(0); // s = 0.8
    expect(empty.map((w) => +w.toFixed(4))).toEqual([0.02, 0.05, 0.07, 0.14, 0.16, 0.17, 0.184, 0.116, 0.09]);
  });

  it('draws 2..10', () => {
    expect(jahDraw(constantRng(0), 26)).toBe(2);
    expect(jahDraw(constantRng(0.9999), 26)).toBe(10);
    const rng = seededRng(11);
    const seen = new Set<number>();
    for (let i = 0; i < 2000; i++) seen.add(jahDraw(rng, 5));
    expect([...seen].sort((a, b) => a - b)).toEqual([2, 3, 4, 5, 6, 7, 8, 9, 10]);
  });

  function completeWithDead(dead: number, rngValue: number) {
    const engine = fixedEngine(rngValue);
    engine.waves.heliKills = 999;
    engine.waves['spawns'] = [];
    for (const p of engine.plants.slice(0, dead)) p.alive = false;
    return ofType(run(engine, 2, 0.01), 'levelComplete')[0];
  }

  it('restores min(count, dead) plants at the end of a level', () => {
    expect(completeWithDead(10, 0.9999).restored).toBe(10);
    expect(completeWithDead(3, 0.9999).restored).toBe(3);
    expect(completeWithDead(10, 0).restored).toBe(2);
  });

  it('skips the blessing when no plant is dead', () => {
    expect(completeWithDead(0, 0.9999).restored).toBe(0);
  });
});

describe('single plant state (AC-38, D1)', () => {
  it.each(['roots', 'cheat', 'jah'] as const)('a plant restored by %s is targetable at once and alive at the next level', (by) => {
    const engine = fixedEngine(0.9999);
    silenceWaves(engine);
    for (const p of engine.plants) if (p.index !== 0) p.alive = false;
    if (by === 'roots') {
      engine.activatePowerUp('roots_of_zion');
      run(engine, 3.05, 0.05);
    } else if (by === 'cheat') {
      engine.restorePlants(2);
    } else {
      engine.waves.update = () => true;
      run(engine, 2, 0.01);
      expect(engine.phase).toBe('levelComplete');
      engine.nextLevel();
      silenceWaves(engine);
    }
    const restored = engine.plants.find((p) => p.index !== 0 && p.alive);
    expect(restored).toBeDefined();
    // A soldier landing next to it targets it.
    const para = engine.createParatrooper(restored!.x + 1, engine.layout.groundY - 36.5);
    para.vx = 0;
    engine.update(0.02);
    expect(para.targetPlantIndex).toBe(restored!.index);
    // And it is still alive after the next level starts.
    engine.phase = 'levelComplete';
    engine.nextLevel();
    expect(engine.plants[restored!.index].alive).toBe(true);
  });
});

describe('pause (AC-28)', () => {
  it('freezes entities, timers, combo window and power-up spawn timers', () => {
    const engine = makeEngine(seededRng(9));
    run(engine, 5);
    engine.comboCount = 2;
    engine['comboTimer'] = 1;
    const snapshot = JSON.stringify({
      air: engine.airEnemies.map((e) => [e.x, e.y, e.hp]),
      paras: engine.paratroopers.map((p) => [p.x, p.y]),
      next: engine.nextPowerUpIn,
      combo: engine['comboTimer'],
      time: engine.playTime,
      plants: engine.plants.map((p) => [p.alive, p.burnProgress]),
    });
    engine.paused = true;
    const events = run(engine, 10);
    expect(events).toHaveLength(0);
    expect(
      JSON.stringify({
        air: engine.airEnemies.map((e) => [e.x, e.y, e.hp]),
        paras: engine.paratroopers.map((p) => [p.x, p.y]),
        next: engine.nextPowerUpIn,
        combo: engine['comboTimer'],
        time: engine.playTime,
        plants: engine.plants.map((p) => [p.alive, p.burnProgress]),
      }),
    ).toBe(snapshot);
    engine.paused = false;
    run(engine, 0.5);
    expect(engine.playTime).toBeCloseTo(5.5, 1);
  });
});

describe('cheats (AC-31)', () => {
  const layout = makeLayout(W, H);

  it('3 taps within 800 ms top-left skip the level, top-right restore plants', () => {
    const cheats = new CheatDetector(layout);
    expect(cheats.tap(10, 10, 0)).toBeNull();
    expect(cheats.tap(10, 10, 300)).toBeNull();
    expect(cheats.tap(10, 10, 700)).toBe('skipLevel');
    expect(cheats.tap(W - 10, 10, 1000)).toBeNull();
    expect(cheats.tap(W - 10, 10, 1100)).toBeNull();
    expect(cheats.tap(W - 10, 10, 1200)).toBe('restorePlants');
  });

  it('ignores taps spread over more than 800 ms or outside the zones', () => {
    const cheats = new CheatDetector(layout);
    expect(cheats.tap(10, 10, 0)).toBeNull();
    expect(cheats.tap(10, 10, 500)).toBeNull();
    expect(cheats.tap(10, 10, 900)).toBeNull(); // the first tap is now too old
    const other = new CheatDetector(layout);
    for (const t of [0, 100, 200]) expect(other.tap(W / 2, 10, t)).toBeNull();
    for (const t of [300, 400, 500]) expect(other.tap(10, H * 0.5, t)).toBeNull();
  });

  it('the skip-level cheat clears the sky and completes the level after 0.5 s with the bonus', () => {
    const engine = makeEngine(seededRng(4));
    run(engine, 4);
    engine.forceComplete();
    expect(engine.airEnemies).toHaveLength(0);
    expect(engine.paratroopers).toHaveLength(0);
    const events = run(engine, 0.6, 0.01);
    expect(ofType(events, 'levelComplete')).toEqual([expect.objectContaining({ level: 1, bonus: 1000 })]);
    engine.nextLevel();
    expect(engine.level).toBe(2);
    expect(engine.phase).toBe('playing');
  });
});

describe('game session', () => {
  it('upgrades the weapon and announces each level start', () => {
    const engine = fixedEngine();
    engine.drainEvents();
    engine.phase = 'levelComplete';
    engine.level = 3;
    engine.nextLevel();
    expect(engine.weapon.id).toBe('machinegun');
    expect(engine.drainEvents()).toContainEqual({ type: 'levelStart', level: 4 });
  });

  it('counts play time over the whole game, transitions excluded', () => {
    const engine = fixedEngine();
    engine.waves.update = () => true;
    run(engine, 2, 0.01); // 1.5 s delay then complete
    const t = engine.playTime;
    run(engine, 5); // waiting on the transition screen: nothing counts
    expect(engine.playTime).toBe(t);
    engine.nextLevel();
    silenceWaves(engine);
    run(engine, 1);
    expect(engine.playTime).toBeCloseTo(t + 1, 1);
  });
});
