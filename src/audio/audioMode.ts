// The app's audio mode, set once at startup before any player plays (music or sound effect).
// expo-audio asks Android for exclusive audio focus when a player starts with no mode set, which stopped the
// player's own music app at launch. Mixing keeps it playing. Media plays whatever the ringer mode (Android
// convention: with false, expo-audio mutes everything when the phone is on silent or vibrate); SOUND in SETUP is the
// mute. Failures are ignored: no audio mode is better than a crash.
import { setAudioModeAsync } from 'expo-audio';

let modeSet: Promise<void> | null = null;

/** Idempotent: the first call sets the mode, every call returns the same promise (never rejects). */
export function initAudioMode(): Promise<void> {
  if (!modeSet) {
    try {
      modeSet = setAudioModeAsync({ playsInSilentMode: true, interruptionMode: 'mixWithOthers' }).catch(() => {});
    } catch {
      modeSet = Promise.resolve();
    }
  }
  return modeSet;
}
