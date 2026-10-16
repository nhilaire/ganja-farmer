import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { AppState } from 'react-native';

import { GameScreen } from '../screens/GameScreen';
import { fixedEngine } from '../test-utils/engine';

function setup() {
  const engine = fixedEngine();
  engine.waves.update = () => false; // quiet sky: the test drives the level flow
  const onQuit = jest.fn();
  const onGameOver = jest.fn();
  const onEvents = jest.fn();
  return { engine, onQuit, onGameOver, onEvents };
}

async function advance(ms: number) {
  await act(async () => {
    jest.advanceTimersByTime(ms);
  });
}

describe('GameScreen', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  it('shows the HUD and a pause button (AC-08)', async () => {
    const { engine, onQuit, onGameOver } = setup();
    await render(<GameScreen engine={engine} onQuit={onQuit} onGameOver={onGameOver} />);
    expect(screen.getByText('Score: 0000000')).toBeTruthy();
    expect(screen.getByText('Level: 01')).toBeTruthy();
    expect(screen.getByText('Plants: 26/26')).toBeTruthy();
    expect(screen.getByText('[Pistol]')).toBeTruthy();
    expect(screen.getByTestId('game-pause')).toBeTruthy();
  });

  it('pauses with RESUME and MENU (AC-26)', async () => {
    const { engine, onQuit, onGameOver } = setup();
    await render(<GameScreen engine={engine} onQuit={onQuit} onGameOver={onGameOver} />);
    await fireEvent.press(screen.getByTestId('game-pause'));
    expect(screen.getByText('PAUSED')).toBeTruthy();
    expect(engine.paused).toBe(true);
    await fireEvent.press(screen.getByText('RESUME'));
    expect(screen.queryByText('PAUSED')).toBeNull();
    expect(engine.paused).toBe(false);
    await fireEvent.press(screen.getByTestId('game-pause'));
    await fireEvent.press(screen.getByText('MENU'));
    expect(onQuit).toHaveBeenCalledTimes(1);
  });

  it('pauses itself when the app leaves the foreground, and stays paused (AC-27)', async () => {
    const listeners: ((state: string) => void)[] = [];
    jest.spyOn(AppState, 'addEventListener').mockImplementation((_type, listener) => {
      listeners.push(listener as (state: string) => void);
      return { remove: jest.fn() } as unknown as ReturnType<typeof AppState.addEventListener>;
    });
    const { engine, onQuit, onGameOver } = setup();
    await render(<GameScreen engine={engine} onQuit={onQuit} onGameOver={onGameOver} />);
    await advance(500);
    const t = engine.playTime;
    await act(async () => listeners.forEach((l) => l('background')));
    expect(screen.getByText('PAUSED')).toBeTruthy();
    await act(async () => listeners.forEach((l) => l('active')));
    await advance(2000);
    expect(screen.getByText('PAUSED')).toBeTruthy();
    expect(engine.playTime).toBeCloseTo(t, 5);
  });

  it('aims and fires while the finger is down', async () => {
    const { engine, onQuit, onGameOver } = setup();
    await render(<GameScreen engine={engine} onQuit={onQuit} onGameOver={onGameOver} />);
    const field = screen.getByTestId('game-screen');
    await fireEvent(field, 'touchStart', { nativeEvent: { pageX: 400, pageY: 50 } });
    expect(engine.firing).toBe(true);
    await fireEvent(field, 'touchEnd', { nativeEvent: {} });
    expect(engine.firing).toBe(false);
  });

  it('runs the engine every frame and forwards its events', async () => {
    const { engine, onQuit, onGameOver, onEvents } = setup();
    await render(<GameScreen engine={engine} onQuit={onQuit} onGameOver={onGameOver} onEvents={onEvents} />);
    await advance(1000);
    expect(engine.playTime).toBeGreaterThan(0.5);
    expect(onEvents).toHaveBeenCalledWith([{ type: 'levelStart', level: 1 }]);
  });

  it('calls onGameOver when the last plant is destroyed', async () => {
    const { engine, onQuit, onGameOver } = setup();
    await render(<GameScreen engine={engine} onQuit={onQuit} onGameOver={onGameOver} />);
    for (const p of engine.plants.slice(1)) p.alive = false;
    engine.createBomb(engine.plants[0].x, engine.layout.groundY - 1);
    await advance(500);
    expect(onGameOver).toHaveBeenCalledTimes(1);
  });

  it('the top-left triple tap skips to the level transition (AC-22, AC-31)', async () => {
    const { engine, onQuit, onGameOver } = setup();
    await render(<GameScreen engine={engine} onQuit={onQuit} onGameOver={onGameOver} />);
    const field = screen.getByTestId('game-screen');
    for (let i = 0; i < 3; i++) {
      await fireEvent(field, 'touchStart', { nativeEvent: { pageX: 10, pageY: 10 } });
      await fireEvent(field, 'touchEnd', { nativeEvent: {} });
      await advance(100);
    }
    await advance(1500);
    expect(screen.getByText('LEVEL 2')).toBeTruthy();
    expect(screen.getByText('+1000 pts')).toBeTruthy();
    expect(screen.queryByText(/Plants Restored/)).toBeNull();
    await advance(600); // fade-in
    expect(screen.getByText('Tap to continue')).toBeTruthy();
    await fireEvent.press(screen.getByTestId('level-transition'));
    await advance(400);
    expect(screen.queryByTestId('level-transition')).toBeNull();
    expect(engine.level).toBe(2);
    expect(screen.getByText('Level: 02')).toBeTruthy();
  });

  it('shows the Jah blessing then the transition with the restored plants (AC-22)', async () => {
    const { engine, onQuit, onGameOver } = setup();
    await render(<GameScreen engine={engine} onQuit={onQuit} onGameOver={onGameOver} />);
    for (const p of engine.plants.slice(0, 6)) p.alive = false;
    engine.forceComplete();
    await advance(700);
    expect(screen.getByTestId('jah-blessing')).toBeTruthy();
    const restored = 26 - 6 < engine.alivePlants ? engine.alivePlants - 20 : 0;
    expect(restored).toBeGreaterThan(0);
    expect(screen.getAllByText(`+${restored} Plants Restored`).length).toBeGreaterThan(0);
    await advance(6000);
    expect(screen.queryByTestId('jah-blessing')).toBeNull();
    expect(screen.getByText('LEVEL 2')).toBeTruthy();
    expect(screen.getByText(`+${restored} Plants Restored`)).toBeTruthy();
  });
});
