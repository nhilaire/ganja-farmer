// Which sound and vibration each engine event produces, filtered by the SOUND / VIBRATION settings.
// Pure (time is an input) so the policy is unit-tested; src/audio/player.ts does the actual playback.
import { GameEvent } from '../game/types';
import { WeaponId } from '../game/weapons';

export type SoundName =
  | 'shot_light'
  | 'shot_heavy'
  | 'shot_rocket'
  | 'shot_laser'
  | 'explosion'
  | 'fire'
  | 'powerup'
  | 'boss'
  | 'jah'
  | 'gameover';

export type Vibration = number | number[];

export const MAX_SHOT_SOUNDS_PER_SECOND = 10;

// Source patterns (components/Game.tsx).
export const VIBRATION_PLANT_BURNING = 30;
export const VIBRATION_BOSS_DEFEATED = [0, 50, 30, 50, 30, 100];
export const VIBRATION_GAME_OVER = [0, 100, 50, 200];

const SHOT_SOUND: Record<WeaponId, SoundName> = {
  pistol: 'shot_light',
  machinegun: 'shot_light',
  gatling: 'shot_light',
  aa_gun: 'shot_heavy',
  rocket: 'shot_rocket',
  laser: 'shot_laser',
};

export interface FeedbackSettings {
  sound: boolean;
  vibration: boolean;
}

export interface Feedback {
  sounds: SoundName[];
  vibrations: Vibration[];
}

export class FeedbackPolicy {
  private lastShotMs = -Infinity;

  feedbackFor(events: readonly GameEvent[], settings: FeedbackSettings, nowMs: number): Feedback {
    const sounds = new Set<SoundName>();
    const vibrations: Vibration[] = [];
    for (const e of events) {
      switch (e.type) {
        case 'shot':
          if (nowMs - this.lastShotMs >= 1000 / MAX_SHOT_SOUNDS_PER_SECOND) {
            this.lastShotMs = nowMs;
            sounds.add(SHOT_SOUND[e.weapon]);
          }
          break;
        case 'explosion':
          sounds.add('explosion');
          break;
        case 'plantBurning':
          sounds.add('fire');
          vibrations.push(VIBRATION_PLANT_BURNING);
          break;
        case 'powerUpActivated':
          sounds.add('powerup');
          break;
        case 'bossSpawn':
          sounds.add('boss');
          break;
        case 'bossDefeated':
          vibrations.push(VIBRATION_BOSS_DEFEATED);
          break;
        case 'levelComplete':
          if (e.restored > 0) sounds.add('jah');
          break;
        case 'gameOver':
          sounds.add('gameover');
          vibrations.push(VIBRATION_GAME_OVER);
          break;
      }
    }
    return {
      sounds: settings.sound ? [...sounds] : [],
      vibrations: settings.vibration ? vibrations : [],
    };
  }
}
