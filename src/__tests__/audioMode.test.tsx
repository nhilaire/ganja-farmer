import AsyncStorage from '@react-native-async-storage/async-storage';
import { act, render, screen } from '@testing-library/react-native';
import { createAudioPlayer, setAudioModeAsync } from 'expo-audio';

import App from '../App';
import { backgroundMusic } from '../audio/music';

// Phone test (v0.2.0): the game stopped the player's own music at launch. expo-audio asks for exclusive audio focus
// when a player starts with no audio mode set, and the mode was only set by the first sound effect.
describe('audio mode at startup (AC-42)', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    await AsyncStorage.setItem('telemetry.consent.v1', 'denied');
  });

  it('sets the mixing audio mode before the background music starts', async () => {
    let resolveMode: () => void = () => {};
    jest.mocked(setAudioModeAsync).mockClear();
    jest.mocked(createAudioPlayer).mockClear();
    jest.mocked(setAudioModeAsync).mockImplementationOnce(() => new Promise<void>((resolve) => (resolveMode = resolve)));

    await render(<App splashMs={0} />);
    expect(setAudioModeAsync).toHaveBeenCalledWith({ playsInSilentMode: true, interruptionMode: 'mixWithOthers' });
    expect(backgroundMusic.playing).toBe(false); // waits for the mode

    await act(async () => resolveMode());
    await screen.findByText('PLAY');
    expect(backgroundMusic.playing).toBe(true);
    expect(setAudioModeAsync).toHaveBeenCalledTimes(1);
    const musicPlayer = jest.mocked(createAudioPlayer).mock.results[0].value as { play: jest.Mock };
    expect(musicPlayer.play.mock.invocationCallOrder[0]).toBeGreaterThan(jest.mocked(setAudioModeAsync).mock.invocationCallOrder[0]);
  });
});
