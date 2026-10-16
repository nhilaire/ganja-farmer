import AsyncStorage from '@react-native-async-storage/async-storage';
import { fireEvent, render, screen } from '@testing-library/react-native';

import App from '../App';

// render/fireEvent are awaited: asynchronous in React Native Testing Library 14+, harmless before.
describe('App', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  it('asks for consent in English on first launch, then shows the home screen', async () => {
    await render(<App />);
    expect(await screen.findByText('Help the farm grow?')).toBeTruthy();
    expect(screen.getByTestId('consent-accept')).toBeTruthy();
    await fireEvent.press(screen.getByText('NO THANKS'));
    expect(await screen.findByText('PLAY')).toBeTruthy();
  });

  it('shows the About screen: story, passionate developer, version', async () => {
    await AsyncStorage.setItem('telemetry.consent.v1', 'denied');
    await render(<App />);
    await fireEvent.press(await screen.findByText('ABOUT'));
    expect(screen.getByTestId('about-screen')).toBeTruthy();
    expect(screen.getByText('Why this game')).toBeTruthy();
    expect(screen.getByText(/passionate independent developer/)).toBeTruthy();
    expect(screen.getByText(/^Version [0-9]+[.][0-9]+[.][0-9]+$/)).toBeTruthy();
  });

  it('does not ask again once the player has chosen', async () => {
    await AsyncStorage.setItem('telemetry.consent.v1', 'granted');
    await render(<App />);
    expect(await screen.findByText('PLAY')).toBeTruthy();
    expect(screen.queryByText('Help the farm grow?')).toBeNull();
  });
});
