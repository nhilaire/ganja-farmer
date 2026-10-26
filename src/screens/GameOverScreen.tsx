// End of a game (source `components/GameOver.tsx`): stats at once, buttons after 3 s, name entry on a top-10 score.
import { useEffect, useState } from 'react';
import { BackHandler, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { MAX_NAME_LENGTH } from '../game/highScores';
import { useI18n } from '../i18n/I18nProvider';
import { colors, spacing } from '../ui/theme';

export const GAME_OVER_UI_DELAY_MS = 3000;

type Props = {
  score: number;
  kills: number;
  level: number;
  isHighScore: boolean;
  onSave: (name: string) => Promise<void>;
  onRetry: () => void;
  onMenu: () => void;
};

function Action({ label, onPress, testID, color }: { label: string; onPress: () => void; testID: string; color: string }) {
  return (
    <Pressable style={[styles.button, { backgroundColor: color }]} onPress={onPress} testID={testID} accessibilityRole="button">
      <Text style={styles.buttonText}>{label}</Text>
    </Pressable>
  );
}

export function GameOverScreen({ score, kills, level, isHighScore, onSave, onRetry, onMenu }: Props) {
  const { t } = useI18n();
  const [showUI, setShowUI] = useState(false);
  const [name, setName] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setShowUI(true), GAME_OVER_UI_DELAY_MS);
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      onMenu();
      return true;
    });
    return () => {
      clearTimeout(timer);
      sub.remove();
    };
  }, [onMenu]);

  const save = async () => {
    if (saved) return;
    setSaved(true);
    await onSave(name);
  };

  return (
    <View style={styles.container} testID="gameover-screen">
      <Text style={styles.title} accessibilityRole="header">
        {t.gameOver.title}
      </Text>
      <View style={styles.stats}>
        <Text style={styles.stat}>{t.gameOver.score(score)}</Text>
        <Text style={styles.stat}>{t.gameOver.kills(kills)}</Text>
        <Text style={styles.stat}>{t.gameOver.level(level)}</Text>
      </View>
      {showUI && isHighScore && !saved && (
        <View style={styles.record}>
          <Text style={styles.newRecord}>{t.gameOver.newRecord}</Text>
          <View style={styles.nameRow}>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder={t.gameOver.namePlaceholder}
              placeholderTextColor="#88AA88"
              maxLength={MAX_NAME_LENGTH}
              autoCapitalize="characters"
              autoCorrect={false}
              returnKeyType="done"
              onSubmitEditing={save}
              testID="gameover-name"
            />
            <Action label={t.gameOver.save} onPress={save} testID="gameover-save" color={colors.rastaGreen} />
          </View>
        </View>
      )}
      {saved && <Text style={styles.saved}>{t.gameOver.saved}</Text>}
      {showUI && (
        <View style={styles.actions}>
          <Action label={t.gameOver.retry} onPress={onRetry} testID="gameover-retry" color={colors.rastaRed} />
          <Action label={t.gameOver.menu} onPress={onMenu} testID="gameover-menu" color={colors.surface} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a0000', alignItems: 'center', justifyContent: 'center', gap: spacing.sm },
  title: {
    fontSize: 48,
    fontWeight: 'bold',
    color: colors.rastaRed,
    letterSpacing: 6,
    textShadowColor: '#000',
    textShadowOffset: { width: 3, height: 3 },
    textShadowRadius: 0,
  },
  stats: { alignItems: 'center' },
  stat: { fontSize: 18, color: colors.rastaYellow, fontFamily: 'monospace', marginVertical: 2 },
  record: { alignItems: 'center', gap: spacing.xs },
  newRecord: { fontSize: 22, fontWeight: 'bold', color: '#32CD32', letterSpacing: 2 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  input: {
    width: 220,
    minHeight: 44,
    borderWidth: 2,
    borderColor: colors.rastaYellow,
    borderRadius: 8,
    color: '#FFFFFF',
    fontSize: 18,
    paddingHorizontal: spacing.sm,
    fontFamily: 'monospace',
  },
  saved: { fontSize: 16, color: '#32CD32', fontWeight: 'bold' },
  actions: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.sm },
  button: {
    minWidth: 130,
    minHeight: 48,
    paddingHorizontal: spacing.md,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: colors.rastaYellow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: { fontSize: 18, fontWeight: 'bold', color: '#FFFFFF', letterSpacing: 2 },
});
