import AsyncStorage from '@react-native-async-storage/async-storage';
import { act, fireEvent, render, screen } from '@testing-library/react-native';

import App from '../App';
import { GameOverScreen } from '../screens/GameOverScreen';
import { HighScoresScreen } from '../screens/HighScoresScreen';
import { HomeScreen } from '../screens/HomeScreen';

async function advance(ms: number) {
  await act(async () => {
    jest.advanceTimersByTime(ms);
  });
}

const noop = () => {};

describe('home screen (AC-07, AC-33)', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  it('shows the title, subtitle, PLAY, hints and the leaf buttons', async () => {
    await render(<HomeScreen hasScores onPlay={noop} onScores={noop} onAbout={noop} onSetup={noop} />);
    for (const text of ['GANJA', 'FARMER', 'Defend your field, Rasta!', 'PLAY', 'Touch screen to aim and shoot', 'Hold to fire continuously', 'Protect your ganja plants!', 'SCORES', 'ABOUT', 'SETUP']) {
      expect(screen.getByText(text)).toBeTruthy();
    }
  });

  it('hides SCORES when there is no score', async () => {
    await render(<HomeScreen hasScores={false} onPlay={noop} onScores={noop} onAbout={noop} onSetup={noop} />);
    expect(screen.queryByText('SCORES')).toBeNull();
  });

  it('shows the scores after 30 s without a touch, only if a score exists', async () => {
    const onScores = jest.fn();
    const view = await render(<HomeScreen hasScores onPlay={noop} onScores={onScores} onAbout={noop} onSetup={noop} />);
    await advance(20_000);
    await fireEvent(screen.getByTestId('home-screen'), 'touchStart', {});
    await advance(20_000);
    expect(onScores).not.toHaveBeenCalled();
    await advance(10_001);
    expect(onScores).toHaveBeenCalledTimes(1);
    const none = jest.fn();
    await view.rerender(<HomeScreen hasScores={false} onPlay={noop} onScores={none} onAbout={noop} onSetup={noop} />);
    await advance(60_000);
    expect(none).not.toHaveBeenCalled();
  });
});

describe('high scores table (AC-33)', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  const scores = [
    { name: 'JAH', score: 12000, level: 6, kills: 80, date: 'a' },
    { name: 'ZION', score: 900, level: 2, kills: 9, date: 'b' },
  ];

  it('lists the entries and returns on tap or after 30 s', async () => {
    const onBack = jest.fn();
    await render(<HighScoresScreen scores={scores} onBack={onBack} />);
    expect(screen.getByText('HIGH SCORES')).toBeTruthy();
    expect(screen.getByText('JAH')).toBeTruthy();
    expect(screen.getByText('0012000')).toBeTruthy();
    expect(screen.getByText('Tap to go back')).toBeTruthy();
    await fireEvent.press(screen.getByTestId('scores-screen'));
    expect(onBack).toHaveBeenCalledTimes(1);
    await advance(30_000);
    expect(onBack).toHaveBeenCalledTimes(2);
  });
});

describe('game over screen (AC-23)', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  it('shows the stats, then after 3 s the name entry and the buttons', async () => {
    const onSave = jest.fn(() => Promise.resolve());
    const onRetry = jest.fn();
    const onMenu = jest.fn();
    await render(<GameOverScreen score={1500} kills={12} level={2} isHighScore onSave={onSave} onRetry={onRetry} onMenu={onMenu} />);
    expect(screen.getByText('GAME OVER')).toBeTruthy();
    expect(screen.getByText('Score: 0001500')).toBeTruthy();
    expect(screen.getByText('Kills: 12')).toBeTruthy();
    expect(screen.getByText('Level: 2')).toBeTruthy();
    expect(screen.queryByText('RETRY')).toBeNull();
    await advance(3000);
    expect(screen.getByText('NEW HIGH SCORE!')).toBeTruthy();
    await fireEvent.changeText(screen.getByTestId('gameover-name'), 'IRIE');
    await fireEvent.press(screen.getByText('SAVE'));
    expect(onSave).toHaveBeenCalledWith('IRIE');
    expect(screen.getByText('Score saved!')).toBeTruthy();
    expect(screen.queryByTestId('gameover-name')).toBeNull();
    await fireEvent.press(screen.getByText('RETRY'));
    await fireEvent.press(screen.getByText('MENU'));
    expect(onRetry).toHaveBeenCalledTimes(1);
    expect(onMenu).toHaveBeenCalledTimes(1);
  });

  it('does not offer the name entry for a score outside the top 10', async () => {
    await render(<GameOverScreen score={0} kills={0} level={1} isHighScore={false} onSave={jest.fn()} onRetry={noop} onMenu={noop} />);
    await advance(3000);
    expect(screen.queryByText('NEW HIGH SCORE!')).toBeNull();
    expect(screen.getByText('RETRY')).toBeTruthy();
  });
});

describe('app flow: saved score appears in SCORES (AC-23, AC-25)', () => {
  beforeEach(async () => {
    jest.useFakeTimers();
    await AsyncStorage.clear();
    await AsyncStorage.setItem('telemetry.consent.v1', 'denied');
  });

  it('shows a stored high score in the SCORES table after a relaunch', async () => {
    await AsyncStorage.setItem('highScores.v1', JSON.stringify([{ name: 'IRIE', score: 2500, level: 2, kills: 7, date: 'x' }]));
    await render(<App />);
    await fireEvent.press(await screen.findByText('SCORES'));
    expect(screen.getByText('IRIE')).toBeTruthy();
    expect(screen.getByText('0002500')).toBeTruthy();
  });
});
