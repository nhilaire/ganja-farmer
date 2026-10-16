// Background music (AC-42): "Rasta Rocket Man" looped on every screen at a low volume, below the sound effects.
// Plays only when MUSIC is on and the app is in front; independent of SOUND. The player is created lazily.
// The track is NOT in the public repository (Suno free plan: not redistributable). metro.config.js resolves
// `ganja-farmer-local-music` to assets/music/local/rasta-rocket-man.mp3 when that git-ignored file exists, else to null.
import { createAudioPlayer } from 'expo-audio';

export const MUSIC_VOLUME = 0.25;

interface LoopPlayer {
  play(): void;
  pause(): void;
  loop: boolean;
  volume: number;
}

export class BackgroundMusic {
  private player: LoopPlayer | null = null;
  playing = false;

  constructor(private create: (() => LoopPlayer) | null) {}

  update({ enabled, foreground }: { enabled: boolean; foreground: boolean }): void {
    const shouldPlay = enabled && foreground && this.create !== null;
    if (shouldPlay === this.playing) return;
    try {
      if (shouldPlay && this.create) {
        if (!this.player) {
          this.player = this.create();
          this.player.loop = true;
          this.player.volume = MUSIC_VOLUME;
        }
        this.player.play();
      } else {
        this.player?.pause();
      }
      this.playing = shouldPlay;
    } catch {
      // ignore: music is optional
    }
  }
}

const LOCAL_MUSIC: number | null = require('ganja-farmer-local-music');

export const backgroundMusic = new BackgroundMusic(LOCAL_MUSIC === null ? null : () => createAudioPlayer(LOCAL_MUSIC));
