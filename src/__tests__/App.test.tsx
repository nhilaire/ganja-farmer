import AsyncStorage from '@react-native-async-storage/async-storage';
import { act, fireEvent, render, screen } from '@testing-library/react-native';

import App from '../App';

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
    expect(screen.queryByText('Help the farm grow?')).toBeNull();
    await act(async () => {
      jest.advanceTimersByTime(2000);
    });
    expect(screen.getByText('Help the farm grow?')).toBeTruthy();
  });
});
