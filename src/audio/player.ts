// Plays the generated sound effects (assets/sfx, made by scripts/generate-sfx.mjs) and vibrations.
// One expo-audio player per sound, created lazily and replayed from the start; failures are ignored (no sound is
// better than a crash).
import { AudioPlayer, createAudioPlayer, setAudioModeAsync } from 'expo-audio';
import { Vibration as RNVibration } from 'react-native';

import { Feedback, SoundName } from './feedback';

const SOURCES: Record<SoundName, number> = {
  shot_light: require('../../assets/sfx/shot_light.wav'),
  shot_heavy: require('../../assets/sfx/shot_heavy.wav'),
  shot_rocket: require('../../assets/sfx/shot_rocket.wav'),
  shot_laser: require('../../assets/sfx/shot_laser.wav'),
  explosion: require('../../assets/sfx/explosion.wav'),
  fire: require('../../assets/sfx/fire.wav'),
  powerup: require('../../assets/sfx/powerup.wav'),
  boss: require('../../assets/sfx/boss.wav'),
  jah: require('../../assets/sfx/jah.wav'),
  gameover: require('../../assets/sfx/gameover.wav'),
};

const players = new Map<SoundName, AudioPlayer>();
let modeSet = false;

function player(name: SoundName): AudioPlayer {
  let p = players.get(name);
  if (!p) {
    p = createAudioPlayer(SOURCES[name]);
    p.volume = name.startsWith('shot_') ? 0.6 : 1;
    players.set(name, p);
  }
  return p;
}

export function playSound(name: SoundName): void {
  try {
    if (!modeSet) {
      modeSet = true;
      // Mix with the player's music instead of stopping it. Media plays whatever the ringer mode (Android convention:
      // with false, expo-audio mutes everything when the phone is on silent or vibrate); SOUND in SETUP is the mute.
      setAudioModeAsync({ playsInSilentMode: true, interruptionMode: 'mixWithOthers' }).catch(() => {});
    }
    const p = player(name);
    p.seekTo(0).catch(() => {});
    p.play();
  } catch {
    // ignore: audio is optional
  }
}

export function playFeedback(feedback: Feedback): void {
  for (const s of feedback.sounds) playSound(s);
  for (const v of feedback.vibrations) RNVibration.vibrate(v);
}
