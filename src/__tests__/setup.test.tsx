import AsyncStorage from '@react-native-async-storage/async-storage';
import { fireEvent, render, screen } from '@testing-library/react-native';

import App from '../App';
import { DEFAULT_SETTINGS, loadSettings } from '../storage/settings';

describe('setup screen (AC-29, AC-30)', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    await AsyncStorage.setItem('telemetry.consent.v1', 'granted');
    await AsyncStorage.setItem('highScores.v1', JSON.stringify([{ name: 'IRIE', score: 2500, level: 2, kills: 7, date: 'x' }]));
  });

  async function openSetup() {
    const view = await render(<App splashMs={0} />);
    await fireEvent.press(await screen.findByText('SETUP'));
    return view;
  }

  it('turns sound and vibration on by default', async () => {
    expect(DEFAULT_SETTINGS).toEqual({ sound: true, vibration: true });
    expect(await loadSettings()).toEqual({ sound: true, vibration: true });
  });

  it('shows the SOUND, VIBRATION and STATS toggles and the reset button', async () => {
    await openSetup();
    for (const text of ['SETUP', 'SOUND', 'VIBRATION', 'STATS', 'RESET HIGH SCORES', 'BACK']) expect(screen.getByText(text)).toBeTruthy();
    expect(screen.getByTestId('setup-sound').props.value).toBe(true);
    expect(screen.getByTestId('setup-vibration').props.value).toBe(true);
    expect(screen.getByTestId('setup-stats').props.value).toBe(true);
  });

  it('keeps changed toggles after a restart', async () => {
    const view = await openSetup();
    await fireEvent(screen.getByTestId('setup-sound'), 'valueChange', false);
    await fireEvent(screen.getByTestId('setup-stats'), 'valueChange', false);
    expect(screen.getByTestId('setup-sound').props.value).toBe(false);
    await view.unmount();
    await openSetup();
    expect(screen.getByTestId('setup-sound').props.value).toBe(false);
    expect(screen.getByTestId('setup-vibration').props.value).toBe(true);
    expect(screen.getByTestId('setup-stats').props.value).toBe(false);
  });

  it('asks for confirmation before erasing the high scores', async () => {
    await openSetup();
    await fireEvent.press(screen.getByText('RESET HIGH SCORES'));
    expect(screen.getByText('Erase all high scores, Rasta?')).toBeTruthy();
    await fireEvent.press(screen.getByText('CANCEL'));
    expect(await AsyncStorage.getItem('highScores.v1')).not.toBeNull();
    await fireEvent.press(screen.getByText('RESET HIGH SCORES'));
    await fireEvent.press(screen.getByText('ERASE'));
    expect(await AsyncStorage.getItem('highScores.v1')).toBeNull();
    await fireEvent.press(screen.getByText('BACK'));
    expect(await screen.findByText('PLAY')).toBeTruthy();
    await fireEvent.press(screen.getByText('SCORES'));
    expect(screen.getByText('No scores yet, Rasta!')).toBeTruthy();
    expect(screen.queryByText('IRIE')).toBeNull();
  });
});
