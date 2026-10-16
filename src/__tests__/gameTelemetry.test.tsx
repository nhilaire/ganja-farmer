import AsyncStorage from '@react-native-async-storage/async-storage';
import { logEvent } from '@react-native-firebase/analytics';
import { fireEvent, render, screen } from '@testing-library/react-native';

import App from '../App';
import { GameEvent } from '../game/types';
import { sanitizeParams } from '../telemetry/events';
import { telemetryFor } from '../telemetry/gameTelemetry';

const game = { playTime: 125.4, alivePlants: 20 };

describe('engine events to PRD telemetry (AC-03)', () => {
  it('maps level completion, boss defeat and game over', () => {
    expect(telemetryFor({ type: 'levelComplete', level: 3, scoreBeforeBonus: 4200, bonus: 3000, restored: 4 }, game)).toEqual({
      name: 'level_complete',
      params: { level: 3, score: 4200, duration_s: 125, plants_alive: 16 },
    });
    expect(telemetryFor({ type: 'bossDefeated', level: 5 }, game)).toEqual({ name: 'boss_defeated', params: { level: 5 } });
    expect(telemetryFor({ type: 'gameOver', level: 7, score: 31000, cause: 'ufo' }, game)).toEqual({
      name: 'game_over',
      params: { level: 7, score: 31000, duration_s: 125, cause: 'ufo' },
    });
  });

  it('ignores every other engine event', () => {
    const others: GameEvent[] = [
      { type: 'shot', weapon: 'pistol' },
      { type: 'explosion' },
      { type: 'plantBurning' },
      { type: 'kill', target: 'helicopter', points: 500 },
      { type: 'combo', count: 2, multiplier: 1.5 },
      { type: 'powerUpActivated', id: 'one_drop' },
      { type: 'bossSpawn', name: 'MOTHERSHIP' },
      { type: 'levelStart', level: 2 },
    ];
    for (const e of others) expect(telemetryFor(e, game)).toBeNull();
  });
});

describe('telemetry params carry no personal data (AC-04)', () => {
  it('keeps only numbers and short lowercase enums, unchanged by the sanitizer', () => {
    const tracked = [
      telemetryFor({ type: 'levelComplete', level: 3, scoreBeforeBonus: 4200, bonus: 3000, restored: 4 }, game),
      telemetryFor({ type: 'gameOver', level: 7, score: 31000, cause: 'cropduster' }, game),
      telemetryFor({ type: 'bossDefeated', level: 5 }, game),
    ];
    for (const t of tracked) {
      expect(t).not.toBeNull();
      const params = t!.params as Record<string, unknown>;
      expect(sanitizeParams(params)).toEqual(params);
      for (const v of Object.values(params)) {
        expect(typeof v === 'number' || /^[a-z_]{1,12}$/.test(String(v))).toBe(true);
      }
    }
  });
});

describe('consent gating in the app (AC-03)', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    await AsyncStorage.clear();
  });

  it('sends game_start after consent', async () => {
    await AsyncStorage.setItem('telemetry.consent.v1', 'granted');
    await render(<App splashMs={0} />);
    await fireEvent.press(await screen.findByText('PLAY'));
    expect(logEvent).toHaveBeenCalledWith(expect.anything(), 'game_start', { level: 1 });
  });

  it('sends nothing when the player refused', async () => {
    await AsyncStorage.setItem('telemetry.consent.v1', 'denied');
    await render(<App splashMs={0} />);
    await fireEvent.press(await screen.findByText('PLAY'));
    await fireEvent.press(screen.getByTestId('game-pause'));
    await fireEvent.press(screen.getByText('MENU'));
    expect(logEvent).not.toHaveBeenCalled();
  });

  it('turning STATS off sends settings_change telemetry off last, then nothing', async () => {
    await AsyncStorage.setItem('telemetry.consent.v1', 'granted');
    await render(<App splashMs={0} />);
    await fireEvent.press(await screen.findByText('SETUP'));
    await fireEvent(screen.getByTestId('setup-sound'), 'valueChange', false);
    await fireEvent(screen.getByTestId('setup-stats'), 'valueChange', false);
    await fireEvent(screen.getByTestId('setup-vibration'), 'valueChange', false);
    const names = (logEvent as jest.Mock).mock.calls.map((c) => [c[1], c[2]]);
    expect(names).toEqual([
      ['settings_change', { setting: 'sound', value: 'off' }],
      ['settings_change', { setting: 'telemetry', value: 'off' }],
    ]);
  });

  it('sends game_quit with level and duration when leaving from the pause menu', async () => {
    await AsyncStorage.setItem('telemetry.consent.v1', 'granted');
    await render(<App splashMs={0} />);
    await fireEvent.press(await screen.findByText('PLAY'));
    await fireEvent.press(screen.getByTestId('game-pause'));
    await fireEvent.press(screen.getByText('MENU'));
    expect(logEvent).toHaveBeenCalledWith(expect.anything(), 'game_quit', { level: 1, duration_s: expect.any(Number) });
  });
});
