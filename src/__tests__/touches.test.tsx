import { act, fireEvent, render, screen } from '@testing-library/react-native';

import { TouchTracker } from '../game/touches';
import { GameScreen } from '../screens/GameScreen';
import { fixedEngine } from '../test-utils/engine';

describe('multi-touch firing (AC-40)', () => {
  it('keeps firing while a finger is down and aims at the last finger placed', () => {
    const t = new TouchTracker();
    expect(t.down(1, 100, 50)).toEqual({ firing: true, aim: { x: 100, y: 50 } });
    expect(t.down(2, 700, 80)).toEqual({ firing: true, aim: { x: 700, y: 80 } });
    // The first finger is lifted: still firing, at the second finger.
    expect(t.up(1)).toEqual({ firing: true, aim: { x: 700, y: 80 } });
    expect(t.move(2, 650, 60)).toEqual({ firing: true, aim: { x: 650, y: 60 } });
    expect(t.up(2)).toEqual({ firing: false, aim: null });
  });

  it('falls back to the previous finger when the last one is lifted', () => {
    const t = new TouchTracker();
    t.down(1, 100, 50);
    t.down(2, 700, 80);
    t.move(1, 120, 40);
    expect(t.up(2)).toEqual({ firing: true, aim: { x: 120, y: 40 } });
  });

  it('ignores moves of a finger that is no longer down and clears on cancel', () => {
    const t = new TouchTracker();
    t.down(1, 100, 50);
    expect(t.move(9, 1, 1)).toEqual({ firing: true, aim: { x: 100, y: 50 } });
    expect(t.clear()).toEqual({ firing: false, aim: null });
  });
});

describe('game screen with two fingers (AC-40)', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  const touch = (identifier: number, pageX: number, pageY: number) => ({ identifier, pageX, pageY });

  it('does not stop firing when the first finger is lifted while a second one is down', async () => {
    const engine = fixedEngine();
    engine.waves.update = () => false;
    await render(<GameScreen engine={engine} onQuit={jest.fn()} onGameOver={jest.fn()} />);
    const field = screen.getByTestId('game-screen');
    const a = touch(1, 200, 100);
    const b = touch(2, 700, 120);
    await fireEvent(field, 'touchStart', { nativeEvent: { ...a, changedTouches: [a], touches: [a] } });
    expect(engine.firing).toBe(true);
    await fireEvent(field, 'touchStart', { nativeEvent: { ...b, changedTouches: [b], touches: [a, b] } });
    await fireEvent(field, 'touchEnd', { nativeEvent: { ...a, changedTouches: [a], touches: [b] } });
    expect(engine.firing).toBe(true);
    const { playerX, playerY } = engine.layout;
    expect(engine.aimAngle).toBeCloseTo(Math.atan2(120 - playerY, 700 - playerX));
    await fireEvent(field, 'touchEnd', { nativeEvent: { ...b, changedTouches: [b], touches: [] } });
    expect(engine.firing).toBe(false);
    await act(async () => {
      jest.advanceTimersByTime(100);
    });
  });
});
