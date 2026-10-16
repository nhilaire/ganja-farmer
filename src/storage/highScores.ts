import AsyncStorage from '@react-native-async-storage/async-storage';

import { HighScoreEntry, insertScore } from '../game/highScores';

const KEY = 'highScores.v1';

function isEntry(value: unknown): value is HighScoreEntry {
  const e = value as HighScoreEntry;
  return !!e && typeof e.name === 'string' && typeof e.score === 'number' && typeof e.level === 'number' && typeof e.kills === 'number';
}

export async function loadHighScores(): Promise<HighScoreEntry[]> {
  try {
    const json = await AsyncStorage.getItem(KEY);
    const parsed: unknown = json ? JSON.parse(json) : [];
    return Array.isArray(parsed) ? parsed.filter(isEntry) : [];
  } catch {
    return [];
  }
}

export async function saveHighScore(entry: HighScoreEntry): Promise<HighScoreEntry[]> {
  const updated = insertScore(await loadHighScores(), entry);
  await AsyncStorage.setItem(KEY, JSON.stringify(updated));
  return updated;
}

export async function clearHighScores(): Promise<void> {
  await AsyncStorage.removeItem(KEY);
}
