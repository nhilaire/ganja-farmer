import AsyncStorage from '@react-native-async-storage/async-storage';
import { fireEvent, render, screen } from '@testing-library/react-native';

import App from '../App';
import { BackgroundMusic, MUSIC_VOLUME } from '../audio/music';
import { DEFAULT_SETTINGS } from '../storage/settings';

function fakePlayer() {
  return { play: jest.fn(), pause: jest.fn(), loop: false, volume: 1 };
}

describe('background music (AC-42)', () => {
  it('loops at volume 0.25 when enabled and the app is in front', () => {
    const player = fakePlayer();
    const music = new BackgroundMusic(() => player);
    music.update({ enabled: true, foreground: true });
    expect(player.loop).toBe(true);
    expect(player.volume).toBe(MUSIC_VOLUME);
    expect(MUSIC_VOLUME).toBe(0.25);
    expect(player.play).toHaveBeenCalledTimes(1);
    expect(music.playing).toBe(true);
  });

  it('pauses in the background and resumes on return', () => {
    const player = fakePlayer();
    const music = new BackgroundMusic(() => player);
    music.update({ enabled: true, foreground: true });
    music.update({ enabled: true, foreground: false });
    expect(player.pause).toHaveBeenCalledTimes(1);
    expect(music.playing).toBe(false);
    music.update({ enabled: true, foreground: true });
    expect(player.play).toHaveBeenCalledTimes(2);
  });

  it('stays silent when MUSIC is off, even in front', () => {
    const player = fakePlayer();
    const create = jest.fn(() => player);
    const music = new BackgroundMusic(create);
    music.update({ enabled: false, foreground: true });
    expect(create).not.toHaveBeenCalled();
    music.update({ enabled: true, foreground: true });
    music.update({ enabled: false, foreground: true });
    expect(player.pause).toHaveBeenCalledTimes(1);
    expect(music.playing).toBe(false);
  });

  it('is on by default', () => {
    expect(DEFAULT_SETTINGS.music).toBe(true);
  });
});

describe('MUSIC toggle in SETUP (AC-42, AC-29)', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    await AsyncStorage.setItem('telemetry.consent.v1', 'denied');
  });

  it('shows MUSIC, keeps the choice after a restart, and SOUND off does not touch it', async () => {
    const view = await render(<App splashMs={0} />);
    await fireEvent.press(await screen.findByText('SETUP'));
    expect(screen.getByText('MUSIC')).toBeTruthy();
    expect(screen.getByTestId('setup-music').props.value).toBe(true);
    await fireEvent(screen.getByTestId('setup-sound'), 'valueChange', false);
    expect(screen.getByTestId('setup-music').props.value).toBe(true);
    await fireEvent(screen.getByTestId('setup-music'), 'valueChange', false);
    await view.unmount();
    await render(<App splashMs={0} />);
    await fireEvent.press(await screen.findByText('SETUP'));
    expect(screen.getByTestId('setup-music').props.value).toBe(false);
    expect(screen.getByTestId('setup-sound').props.value).toBe(false);
  });
});
