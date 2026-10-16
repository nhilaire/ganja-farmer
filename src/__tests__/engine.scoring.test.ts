import { fixedEngine, ofType, run, silenceWaves } from '../test-utils/engine';

const UP = -Math.PI / 2;

function setup() {
  const engine = fixedEngine();
  silenceWaves(engine);
  engine.startLevel(4); // machine gun: 8 shots/s
  silenceWaves(engine);
  return engine;
}

function target(engine: ReturnType<typeof setup>, type: 'helicopter' | 'blackhawk' | 'a10' | 'ufo', y: number) {
  return Object.assign(engine.spawnEnemy(type), { x: engine.layout.playerX, y, vx: 0, vy: 0, hp: 1, hasDropped: true });
}

describe('scoring and combo (AC-15)', () => {
  it('adds each enemy score and counts kills', () => {
    const engine = setup();
    target(engine, 'helicopter', 150);
    engine.setFiring(true, UP);
    run(engine, 0.3, 0.01);
    expect(engine.score).toBe(500);
    expect(engine.kills).toBe(1);
  });

  it('multiplies air kills within 2 s by 1 + 0.5 (n - 1), rounded down', () => {
    const engine = setup();
    target(engine, 'helicopter', 170);
    target(engine, 'helicopter', 120);
    target(engine, 'a10', 70);
    engine.setFiring(true, UP);
    const events = run(engine, 0.8, 0.01);
    // 500 x1 + 500 x1.5 + 750 x2
    expect(engine.score).toBe(500 + 750 + 1500);
    expect(ofType(events, 'combo')).toEqual([
      { type: 'combo', count: 2, multiplier: 1.5 },
      { type: 'combo', count: 3, multiplier: 2 },
    ]);
    expect(engine.maxCombo).toBe(3);
  });

  it('floors fractional combo points', () => {
    const engine = setup();
    engine.comboCount = 1;
    engine.comboMultiplier = 1;
    engine['comboTimer'] = 2;
    target(engine, 'blackhawk', 150).score = 333;
    engine.setFiring(true, UP);
    run(engine, 0.3, 0.01);
    expect(engine.score).toBe(Math.floor(333 * 1.5));
  });

  it('resets the combo after 2 s without an air kill', () => {
    const engine = setup();
    target(engine, 'helicopter', 150);
    engine.setFiring(true, UP);
    run(engine, 0.3, 0.01);
    engine.setFiring(false);
    run(engine, 2.1, 0.01);
    expect(engine.comboCount).toBe(0);
    target(engine, 'helicopter', 150);
    engine.setFiring(true, UP);
    run(engine, 0.3, 0.01);
    expect(engine.score).toBe(1000);
  });

  it('does not multiply paratroopers, bombs or Jah Lightning kills, nor count them in the combo', () => {
    const engine = setup();
    engine.comboCount = 3;
    engine.comboMultiplier = 2;
    engine['comboTimer'] = 2;
    Object.assign(engine.createParatrooper(engine.layout.playerX, 160), { vx: 0, vy: 0, hp: 1 });
    engine.setFiring(true, UP);
    run(engine, 0.3, 0.01);
    expect(engine.score).toBe(100);
    Object.assign(engine.createBomb(engine.layout.playerX, 160), { vy: 0 });
    run(engine, 0.3, 0.01);
    expect(engine.score).toBe(400);
    engine.setFiring(false);
    engine.spawnEnemy('helicopter');
    engine.activatePowerUp('jah_lightning');
    expect(engine.score).toBe(900);
    expect(engine.comboCount).toBe(3);
  });
});
