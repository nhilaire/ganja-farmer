import AsyncStorage from '@react-native-async-storage/async-storage';

import { cleanName, HighScoreEntry, insertScore, qualifies } from '../game/highScores';
import { clearHighScores, loadHighScores, saveHighScore } from '../storage/highScores';

const entry = (score: number, name = 'A'): HighScoreEntry => ({ name, score, level: 1, kills: 1, date: '2026-10-16T00:00:00.000Z' });
const table = (n: number) => Array.from({ length: n }, (_, i) => entry(1000 - i * 100, 'P' + i));

describe('high-score rules (AC-24)', () => {
  it('keeps the top 10, highest first', () => {
    let scores: HighScoreEntry[] = [];
    for (const s of [300, 900, 100, 500, 700, 200, 800, 400, 600, 1000, 50, 1100]) scores = insertScore(scores, entry(s));
    expect(scores.map((e) => e.score)).toEqual([1100, 1000, 900, 800, 700, 600, 500, 400, 300, 200]);
  });

  it('qualifies a score > 0 when the table is not full or when it beats the 10th', () => {
    expect(qualifies([], 0)).toBe(false);
    expect(qualifies([], 1)).toBe(true);
    expect(qualifies(table(9), 1)).toBe(true);
    const full = table(10); // lowest is 100
    expect(qualifies(full, 100)).toBe(false); // a tie with the 10th does not qualify
    expect(qualifies(full, 101)).toBe(true);
  });

  it('places an equal new score after the existing one', () => {
    const scores = insertScore([entry(500, 'OLD')], entry(500, 'NEW'));
    expect(scores.map((e) => e.name)).toEqual(['OLD', 'NEW']);
  });

  it('trims names to 12 characters and defaults to RASTA', () => {
    expect(cleanName('  JAH  ')).toBe('JAH');
    expect(cleanName('ABCDEFGHIJKLMNOP')).toBe('ABCDEFGHIJKL');
    expect(cleanName('   ')).toBe('RASTA');
    expect(insertScore([], entry(10, '')).at(0)?.name).toBe('RASTA');
  });
});

describe('high-score storage (AC-25)', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  it('persists entries and reloads them', async () => {
    await saveHighScore(entry(700, 'ZION'));
    await saveHighScore(entry(900, 'JAH'));
    expect((await loadHighScores()).map((e) => e.name)).toEqual(['JAH', 'ZION']);
  });

  it('survives corrupt data and can be cleared', async () => {
    await AsyncStorage.setItem('highScores.v1', '{not json');
    expect(await loadHighScores()).toEqual([]);
    await saveHighScore(entry(5));
    await clearHighScores();
    expect(await loadHighScores()).toEqual([]);
  });
});
