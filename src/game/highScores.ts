// Local top-10 rules, from the source `utils/highScores.ts`. Names never leave the phone.
export const MAX_SCORES = 10;
export const MAX_NAME_LENGTH = 12;
export const DEFAULT_NAME = 'RASTA';

export interface HighScoreEntry {
  name: string;
  score: number;
  level: number;
  kills: number;
  date: string; // ISO string
}

// A score qualifies when it is > 0 and the table is not full or it beats the 10th (a tie does not).
export function qualifies(scores: readonly HighScoreEntry[], score: number): boolean {
  if (score <= 0) return false;
  if (scores.length < MAX_SCORES) return true;
  return score > scores[scores.length - 1].score;
}

export function cleanName(name: string): string {
  const trimmed = name.trim().slice(0, MAX_NAME_LENGTH).trim();
  return trimmed || DEFAULT_NAME;
}

// Adds an entry and keeps the top 10, highest first; an equal score goes after the existing one (stable sort).
export function insertScore(scores: readonly HighScoreEntry[], entry: HighScoreEntry): HighScoreEntry[] {
  return [...scores, { ...entry, name: cleanName(entry.name) }].sort((a, b) => b.score - a.score).slice(0, MAX_SCORES);
}
