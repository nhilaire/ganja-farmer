import AsyncStorage from '@react-native-async-storage/async-storage';

import { HighScoreEntry, insertScore } from '../game/highScores';
import { reportError } from '../telemetry/telemetry';

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

// Both writes never throw: they resolve true once stored, false (reported) when the storage failed.
export async function saveHighScore(entry: HighScoreEntry): Promise<boolean> {
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify(insertScore(await loadHighScores(), entry)));
    return true;
  } catch (error) {
    reportError(error, 'save_high_score');
    return false;
  }
}

export async function clearHighScores(): Promise<boolean> {
  try {
    await AsyncStorage.removeItem(KEY);
    return true;
  } catch (error) {
    reportError(error, 'clear_high_scores');
    return false;
  }
}
