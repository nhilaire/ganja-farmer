import AsyncStorage from '@react-native-async-storage/async-storage';
import { act, fireEvent, render, screen } from '@testing-library/react-native';

import App from '../App';
import { deviceLanguageTags } from '../i18n/deviceLocale';

// render/fireEvent are awaited: asynchronous in React Native Testing Library 14+, harmless before.
describe('App', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  it('asks for consent in English on first launch, then shows the home screen', async () => {
    await render(<App splashMs={0} />);
    expect(await screen.findByText('Help the farm grow?')).toBeTruthy();
    expect(screen.getByTestId('consent-accept')).toBeTruthy();
    await fireEvent.press(screen.getByText('NO THANKS'));
    expect(await screen.findByText('PLAY')).toBeTruthy();
  });

  it('shows the About screen: story, passionate developer, version (AC-32)', async () => {
    await AsyncStorage.setItem('telemetry.consent.v1', 'denied');
    await render(<App splashMs={0} />);
    await fireEvent.press(await screen.findByText('ABOUT'));
    expect(screen.getByTestId('about-screen')).toBeTruthy();
    expect(screen.getByText('Why this game')).toBeTruthy();
    expect(screen.getByText(/passionate independent developer/)).toBeTruthy();
    expect(screen.getByText(/I played Ganja Farmer for hours as a teenager/)).toBeTruthy();
    expect(screen.getByText('The Original Game')).toBeTruthy();
    expect(screen.getByText(/One good thing about music/)).toBeTruthy();
    expect(screen.getByText(/^Version [0-9]+[.][0-9]+[.][0-9]+$/)).toBeTruthy();
    await fireEvent.press(screen.getByText('BACK'));
    expect(await screen.findByText('PLAY')).toBeTruthy();
  });

  it('does not ask again once the player has chosen', async () => {
    await AsyncStorage.setItem('telemetry.consent.v1', 'granted');
    await render(<App splashMs={0} />);
    expect(await screen.findByText('PLAY')).toBeTruthy();
    expect(screen.queryByText('Help the farm grow?')).toBeNull();
  });

  it('shows the artwork splash for 2 s before the first screen (AC-06)', async () => {
    jest.useFakeTimers();
    await render(<App />);
    expect(await screen.findByTestId('splash-screen')).toBeTruthy();
    // The whole artwork, letterboxed on black: the logo is never cropped on long screens.
    expect(screen.getByTestId('splash-image').props.resizeMode).toBe('contain');
    expect(screen.queryByText('Help the farm grow?')).toBeNull();
    await act(async () => {
      jest.advanceTimersByTime(2000);
    });
    expect(screen.getByText('Help the farm grow?')).toBeTruthy();
  });
});

describe('languages (AC-43, AC-44)', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    jest.mocked(deviceLanguageTags).mockReturnValue(['en-US']);
  });

  it('speaks French on a French phone', async () => {
    jest.mocked(deviceLanguageTags).mockReturnValue(['fr-FR']);
    await render(<App splashMs={0} />);
    expect(await screen.findByText('Aider la ferme à pousser ?')).toBeTruthy();
    await fireEvent.press(screen.getByText('NON MERCI'));
    expect(await screen.findByText('JOUER')).toBeTruthy();
    expect(screen.getByText('Défends ton champ, Rasta !')).toBeTruthy();
  });

  it('uses English on a phone in an unsupported language', async () => {
    jest.mocked(deviceLanguageTags).mockReturnValue(['it-IT']);
    await AsyncStorage.setItem('telemetry.consent.v1', 'denied');
    await render(<App splashMs={0} />);
    expect(await screen.findByText('PLAY')).toBeTruthy();
  });

  it('switches language from SETUP at once and remembers the choice', async () => {
    await AsyncStorage.setItem('telemetry.consent.v1', 'denied');
    await render(<App splashMs={0} />);
    await fireEvent.press(await screen.findByTestId('home-setup'));
    await fireEvent.press(screen.getByTestId('settings-language-fr'));
    expect(await screen.findByText('RÉGLAGES')).toBeTruthy();
    expect(screen.getByText('SON')).toBeTruthy();
    expect(await AsyncStorage.getItem('settings.language.v1')).toBe('fr');
    await screen.unmount();
    await render(<App splashMs={0} />);
    expect(await screen.findByText('JOUER')).toBeTruthy();
  });

  it('goes back to the phone language with AUTO', async () => {
    await AsyncStorage.multiSet([
      ['telemetry.consent.v1', 'denied'],
      ['settings.language.v1', 'fr'],
    ]);
    await render(<App splashMs={0} />);
    await fireEvent.press(await screen.findByTestId('home-setup'));
    await fireEvent.press(screen.getByTestId('settings-language-auto'));
    expect(await screen.findByText('SETUP')).toBeTruthy();
  });
});
