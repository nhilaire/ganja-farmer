// Top-10 table (source `MainMenu.tsx` scores view). A tap, or 30 s, returns to the home screen.
import { useEffect } from 'react';
import { BackHandler, Pressable, StyleSheet, Text, View } from 'react-native';

import { HighScoreEntry } from '../game/highScores';
import { en } from '../i18n/en';
import { pad } from '../i18n/format';
import { colors } from '../ui/theme';

export const SCORES_AUTO_RETURN_MS = 30_000;

type Props = { scores: readonly HighScoreEntry[]; onBack: () => void };

export function HighScoresScreen({ scores, onBack }: Props) {
  useEffect(() => {
    const timer = setTimeout(onBack, SCORES_AUTO_RETURN_MS);
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      onBack();
      return true;
    });
    return () => {
      clearTimeout(timer);
      sub.remove();
    };
  }, [onBack]);

  return (
    <Pressable style={styles.container} onPress={onBack} testID="scores-screen" accessibilityRole="button">
      <Text style={styles.title} accessibilityRole="header">
        {en.scores.title}
      </Text>
      <View style={styles.row}>
        <Text style={[styles.header, styles.rank]}>{en.scores.rank}</Text>
        <Text style={[styles.header, styles.name]}>{en.scores.name}</Text>
        <Text style={[styles.header, styles.score]}>{en.scores.score}</Text>
        <Text style={[styles.header, styles.level]}>{en.scores.level}</Text>
        <Text style={[styles.header, styles.kills]}>{en.scores.kills}</Text>
      </View>
      {scores.length === 0 && <Text style={styles.cell}>{en.scores.empty}</Text>}
      {scores.map((entry, i) => (
        <View key={entry.date + i} style={[styles.row, i === 0 && styles.firstRow]} testID={'score-row-' + i}>
          <Text style={[styles.cell, styles.rank, i === 0 && styles.first]}>{i + 1}</Text>
          <Text style={[styles.cell, styles.name, i === 0 && styles.first]}>{entry.name}</Text>
          <Text style={[styles.cell, styles.score, i === 0 && styles.first]}>{pad(entry.score, 7)}</Text>
          <Text style={[styles.cell, styles.level, i === 0 && styles.first]}>{entry.level}</Text>
          <Text style={[styles.cell, styles.kills, i === 0 && styles.first]}>{entry.kills}</Text>
        </View>
      ))}
      <Text style={styles.hint}>{en.scores.back}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.rastaYellow,
    letterSpacing: 4,
    marginBottom: 10,
    textShadowColor: '#000',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 0,
  },
  row: { flexDirection: 'row', paddingHorizontal: 30, paddingVertical: 2 },
  firstRow: { backgroundColor: 'rgba(255, 215, 0, 0.1)' },
  header: { fontSize: 12, fontWeight: 'bold', color: colors.rastaYellow, fontFamily: 'monospace' },
  cell: { fontSize: 14, color: '#CCCCCC', fontFamily: 'monospace' },
  first: { color: colors.rastaYellow, fontWeight: 'bold' },
  rank: { width: 30, textAlign: 'center' },
  name: { width: 130 },
  score: { width: 90, textAlign: 'right' },
  level: { width: 50, textAlign: 'center' },
  kills: { width: 60, textAlign: 'right' },
  hint: { fontSize: 11, color: '#88AA88', marginTop: 10 },
});
