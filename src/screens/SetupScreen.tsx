// SETUP (was "Coming soon" in the source): sound, music, vibration and statistics toggles, reset of the high scores.
import { useEffect, useState } from 'react';
import { BackHandler, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';

import { LANGUAGE_NAMES, LANGUAGES, LanguageSetting } from '../i18n';
import { useI18n } from '../i18n/I18nProvider';
import { colors, spacing } from '../ui/theme';

type Props = {
  sound: boolean;
  music: boolean;
  vibration: boolean;
  stats: boolean;
  onSound: (on: boolean) => void;
  onMusic: (on: boolean) => void;
  onVibration: (on: boolean) => void;
  onStats: (on: boolean) => void;
  onResetScores: () => Promise<void>;
  onBack: () => void;
};

function Toggle({ label, help, value, onChange, testID }: { label: string; help?: string; value: boolean; onChange: (on: boolean) => void; testID: string }) {
  const { t } = useI18n();
  return (
    <View style={styles.row}>
      <View style={styles.rowText}>
        <Text style={styles.label}>{label}</Text>
        {help ? <Text style={styles.help}>{help}</Text> : null}
      </View>
      <Text style={styles.state}>{value ? t.setup.on : t.setup.off}</Text>
      <Switch
        value={value}
        onValueChange={onChange}
        accessibilityLabel={label}
        testID={testID}
        trackColor={{ true: colors.rastaGreen, false: '#444444' }}
        thumbColor={value ? colors.rastaYellow : '#CCCCCC'}
      />
    </View>
  );
}

function Action({ label, onPress, testID, color }: { label: string; onPress: () => void; testID: string; color: string }) {
  return (
    <Pressable style={[styles.button, { backgroundColor: color }]} onPress={onPress} testID={testID} accessibilityRole="button">
      <Text style={styles.buttonText}>{label}</Text>
    </Pressable>
  );
}

export function SetupScreen({ sound, music, vibration, stats, onSound, onMusic, onVibration, onStats, onResetScores, onBack }: Props) {
  const { t, setting, setSetting } = useI18n();
  const [confirming, setConfirming] = useState(false);
  // Each language is named in itself; AUTO follows the phone.
  const choices: { value: LanguageSetting; label: string }[] = [
    { value: 'auto', label: t.setup.languageAuto },
    ...LANGUAGES.map((language) => ({ value: language, label: LANGUAGE_NAMES[language] })),
  ];

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      onBack();
      return true;
    });
    return () => sub.remove();
  }, [onBack]);

  return (
    <View style={styles.container} testID="setup-screen">
      <Text style={styles.title} accessibilityRole="header">
        {t.setup.title}
      </Text>
      <View style={styles.rasta} />
      <ScrollView style={styles.scroll} contentContainerStyle={styles.list}>
        <Toggle label={t.setup.sound} value={sound} onChange={onSound} testID="setup-sound" />
        <Toggle label={t.setup.music} value={music} onChange={onMusic} testID="setup-music" />
        <Toggle label={t.setup.vibration} value={vibration} onChange={onVibration} testID="setup-vibration" />
        <Toggle label={t.setup.stats} help={t.setup.statsHelp} value={stats} onChange={onStats} testID="setup-stats" />
        <View style={styles.row} accessibilityRole="radiogroup" accessibilityLabel={t.setup.language}>
          <Text style={[styles.label, styles.rowText]}>{t.setup.language}</Text>
          {choices.map(({ value, label }) => {
            const selected = value === setting;
            return (
              <Pressable
                key={value}
                testID={`settings-language-${value}`}
                accessibilityRole="radio"
                accessibilityState={{ checked: selected }}
                accessibilityLabel={label}
                onPress={() => setSetting(value)}
                style={[styles.choice, selected && styles.choiceSelected]}
              >
                <Text style={[styles.choiceText, selected && styles.choiceTextSelected]}>{label}</Text>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>
      {confirming ? (
        <View style={styles.confirm} testID="setup-reset-confirm">
          <Text style={styles.confirmText}>{t.setup.resetConfirm}</Text>
          <View style={styles.actions}>
            <Action
              label={t.setup.resetYes}
              testID="setup-reset-yes"
              color={colors.rastaRed}
              onPress={async () => {
                setConfirming(false);
                await onResetScores();
              }}
            />
            <Action label={t.setup.resetNo} testID="setup-reset-no" color={colors.surface} onPress={() => setConfirming(false)} />
          </View>
        </View>
      ) : (
        <View style={styles.actions}>
          <Action label={t.setup.reset} testID="setup-reset" color={colors.rastaRed} onPress={() => setConfirming(true)} />
          <Action label={t.setup.back} testID="setup-back" color={colors.surface} onPress={onBack} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.xl },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.rastaYellow,
    letterSpacing: 6,
    textShadowColor: '#000',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 0,
  },
  rasta: { height: 4, width: 200, marginVertical: spacing.sm, backgroundColor: colors.rastaRed, borderRadius: 2 },
  scroll: { width: '70%', flexGrow: 0, flexShrink: 1 },
  list: { gap: spacing.xs },
  choice: { minHeight: 36, justifyContent: 'center', borderRadius: 8, borderWidth: 2, borderColor: '#444444', paddingHorizontal: spacing.sm },
  choiceSelected: { borderColor: colors.rastaYellow },
  choiceText: { color: colors.text, fontSize: 13, fontWeight: 'bold' },
  choiceTextSelected: { color: colors.rastaYellow },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 10,
    paddingHorizontal: spacing.md,
    minHeight: 48,
  },
  rowText: { flex: 1 },
  label: { color: colors.rastaYellow, fontSize: 16, fontWeight: 'bold', letterSpacing: 2 },
  help: { color: colors.muted, fontSize: 11 },
  state: { color: colors.text, fontFamily: 'monospace', fontWeight: 'bold', width: 34, textAlign: 'right' },
  confirm: { alignItems: 'center', marginTop: spacing.sm, gap: spacing.xs },
  confirmText: { color: colors.text, fontSize: 16, fontWeight: 'bold' },
  actions: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.sm },
  button: {
    minWidth: 150,
    minHeight: 48,
    paddingHorizontal: spacing.md,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: colors.rastaYellow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: { fontSize: 15, fontWeight: 'bold', color: '#FFFFFF', letterSpacing: 2 },
});
