import AsyncStorage from '@react-native-async-storage/async-storage';
import { act, fireEvent, render, screen } from '@testing-library/react-native';

import App from '../App';
import { HighScoreEntry } from '../game/highScores';
import { GameOverScreen } from '../screens/GameOverScreen';
import { clearHighScores, loadHighScores, saveHighScore } from '../storage/highScores';
import { loadConsent, saveConsent } from '../telemetry/consentStore';
import * as telemetry from '../telemetry/telemetry';

// A full disk or a storage failure must never break the game nor claim a save that did not happen.
const entry = (score: number, name = 'A'): HighScoreEntry => ({ name, score, level: 1, kills: 1, date: '2026-11-08T00:00:00.000Z' });
const failing = () => Promise.reject(new Error('disk full'));

describe('storage write failures (AC-02, AC-23, AC-29)', () => {
  let reportError: jest.SpyInstance;

  beforeEach(async () => {
    jest.restoreAllMocks();
    await AsyncStorage.clear();
    reportError = jest.spyOn(telemetry, 'reportError').mockImplementation(() => {});
  });

  it('saveConsent reports the error instead of throwing', async () => {
    jest.spyOn(AsyncStorage, 'setItem').mockImplementationOnce(failing);
    await expect(saveConsent('granted')).resolves.toBeUndefined();
    expect(reportError).toHaveBeenCalledWith(expect.any(Error), 'save_consent');
    expect(await loadConsent()).toBe('unknown');
  });

  it('saveHighScore resolves true once written, false (reported) when the write fails', async () => {
    await expect(saveHighScore(entry(700, 'ZION'))).resolves.toBe(true);
    jest.spyOn(AsyncStorage, 'setItem').mockImplementationOnce(failing);
    await expect(saveHighScore(entry(900, 'JAH'))).resolves.toBe(false);
    expect(reportError).toHaveBeenCalledWith(expect.any(Error), 'save_high_score');
    expect((await loadHighScores()).map((e) => e.name)).toEqual(['ZION']);
  });

  it('clearHighScores resolves false (reported) when the removal fails', async () => {
    await saveHighScore(entry(700));
    jest.spyOn(AsyncStorage, 'removeItem').mockImplementationOnce(failing);
    await expect(clearHighScores()).resolves.toBe(false);
    expect(reportError).toHaveBeenCalledWith(expect.any(Error), 'clear_high_scores');
    await expect(clearHighScores()).resolves.toBe(true);
  });

  it('the consent choice still leads to the home screen when it cannot be stored', async () => {
    jest.spyOn(AsyncStorage, 'setItem').mockImplementation(failing);
    await render(<App splashMs={0} />);
    await fireEvent.press(await screen.findByText('NO THANKS'));
    expect(await screen.findByText('PLAY')).toBeTruthy();
  });
});

describe('"Score saved!" only after a successful save (AC-23)', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  async function saveWith(onSave: (name: string) => Promise<boolean>) {
    await render(<GameOverScreen score={1500} kills={12} level={2} isHighScore onSave={onSave} onRetry={jest.fn()} onMenu={jest.fn()} />);
    await act(async () => {
      jest.advanceTimersByTime(3000);
    });
    await fireEvent.changeText(screen.getByTestId('gameover-name'), 'IRIE');
    await fireEvent.press(screen.getByText('SAVE'));
  }

  it('waits for the save before saying it is saved', async () => {
    let finish: (ok: boolean) => void = () => {};
    const onSave = jest.fn(() => new Promise<boolean>((resolve) => (finish = resolve)));
    await saveWith(onSave);
    expect(screen.queryByText('Score saved!')).toBeNull();
    await fireEvent.press(screen.getByText('SAVE')); // a second tap while saving does not save twice
    expect(onSave).toHaveBeenCalledTimes(1);
    await act(async () => finish(true));
    expect(screen.getByText('Score saved!')).toBeTruthy();
    expect(screen.queryByTestId('gameover-name')).toBeNull();
  });

  it('says the save failed and lets the player try again', async () => {
    const onSave = jest.fn().mockResolvedValueOnce(false).mockResolvedValueOnce(true);
    await saveWith(onSave);
    expect(screen.queryByText('Score saved!')).toBeNull();
    expect(screen.getByText('Could not save the score. Try again.')).toBeTruthy();
    await fireEvent.press(screen.getByText('SAVE'));
    expect(onSave).toHaveBeenCalledTimes(2);
    expect(screen.getByText('Score saved!')).toBeTruthy();
    expect(screen.queryByText('Could not save the score. Try again.')).toBeNull();
  });
});
