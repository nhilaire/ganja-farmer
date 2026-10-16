// Background music (AC-42): "Rasta Rocket Man" looped on every screen at a low volume, below the sound effects.
// Plays only when MUSIC is on and the app is in front; independent of SOUND. The player is created lazily.
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

  constructor(private create: () => LoopPlayer) {}

  update({ enabled, foreground }: { enabled: boolean; foreground: boolean }): void {
    const shouldPlay = enabled && foreground;
    if (shouldPlay === this.playing) return;
    try {
      if (shouldPlay) {
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

export const backgroundMusic = new BackgroundMusic(() => createAudioPlayer(require('../../assets/music/rasta-rocket-man.mp3')));
