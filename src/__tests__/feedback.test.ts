import { Vibration } from 'react-native';

import { FeedbackPolicy, VIBRATION_BOSS_DEFEATED, VIBRATION_GAME_OVER, VIBRATION_PLANT_BURNING } from '../audio/feedback';
import { playFeedback } from '../audio/player';
import { GameEvent } from '../game/types';

const ON = { sound: true, vibration: true };

const events: GameEvent[] = [
  { type: 'shot', weapon: 'pistol' },
  { type: 'explosion' },
  { type: 'plantBurning' },
  { type: 'powerUpActivated', id: 'zion_wall' },
  { type: 'bossSpawn', name: 'MOTHERSHIP' },
  { type: 'bossDefeated', level: 20 },
  { type: 'levelComplete', level: 20, scoreBeforeBonus: 1, bonus: 20000, restored: 3 },
  { type: 'gameOver', level: 21, score: 9, cause: 'bomb' },
];

describe('sound and vibration policy (AC-30)', () => {
  it('plays a sound per kind of event and the source vibration patterns', () => {
    const fb = new FeedbackPolicy().feedbackFor(events, ON, 0);
    expect(fb.sounds.sort()).toEqual(['boss', 'explosion', 'fire', 'gameover', 'jah', 'powerup', 'shot_light'].sort());
    expect(fb.vibrations).toEqual([VIBRATION_PLANT_BURNING, VIBRATION_BOSS_DEFEATED, VIBRATION_GAME_OVER]);
    expect(VIBRATION_PLANT_BURNING).toBe(30);
    expect(VIBRATION_BOSS_DEFEATED).toEqual([0, 50, 30, 50, 30, 100]);
    expect(VIBRATION_GAME_OVER).toEqual([0, 100, 50, 200]);
  });

  it('plays no sound with SOUND off and no vibration with VIBRATION off', () => {
    const policy = new FeedbackPolicy();
    expect(policy.feedbackFor(events, { sound: false, vibration: true }, 0).sounds).toEqual([]);
    expect(policy.feedbackFor(events, { sound: true, vibration: false }, 1000).vibrations).toEqual([]);
    expect(policy.feedbackFor(events, { sound: false, vibration: false }, 2000)).toEqual({ sounds: [], vibrations: [] });
  });

  it('limits shot sounds to 10 per second', () => {
    const policy = new FeedbackPolicy();
    let played = 0;
    for (let ms = 0; ms < 1000; ms += 1000 / 15) {
      // gatling: 15 shots/s
      if (policy.feedbackFor([{ type: 'shot', weapon: 'gatling' }], ON, ms).sounds.length) played++;
    }
    expect(played).toBeLessThanOrEqual(10);
    expect(played).toBeGreaterThanOrEqual(7);
  });

  it('has a distinct shot sound per weapon family', () => {
    const policy = new FeedbackPolicy();
    const sound = (weapon: 'pistol' | 'aa_gun' | 'rocket' | 'laser', ms: number) => policy.feedbackFor([{ type: 'shot', weapon }], ON, ms).sounds[0];
    expect([sound('pistol', 0), sound('aa_gun', 1000), sound('rocket', 2000), sound('laser', 3000)]).toEqual(['shot_light', 'shot_heavy', 'shot_rocket', 'shot_laser']);
  });

  it('plays the Jah sound only when plants were restored', () => {
    const fb = new FeedbackPolicy().feedbackFor([{ type: 'levelComplete', level: 1, scoreBeforeBonus: 0, bonus: 1000, restored: 0 }], ON, 0);
    expect(fb.sounds).toEqual([]);
  });

  // Importing player.ts requires every assets/sfx/*.wav file: a missing sound fails this suite.
  it('vibrates through React Native', () => {
    const spy = jest.spyOn(Vibration, 'vibrate').mockImplementation(() => {});
    playFeedback({ sounds: ['explosion'], vibrations: [30] });
    expect(spy).toHaveBeenCalledWith(30);
  });
});
