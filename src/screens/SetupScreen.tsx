// SETUP (was "Coming soon" in the source): sound, vibration and statistics toggles, reset of the high scores.
import { useEffect, useState } from 'react';
import { BackHandler, Pressable, StyleSheet, Switch, Text, View } from 'react-native';

import { en } from '../i18n/en';
import { colors, spacing } from '../ui/theme';

type Props = {
  sound: boolean;
  vibration: boolean;
  stats: boolean;
  onSound: (on: boolean) => void;
  onVibration: (on: boolean) => void;
  onStats: (on: boolean) => void;
  onResetScores: () => Promise<void>;
  onBack: () => void;
};

function Toggle({ label, help, value, onChange, testID }: { label: string; help?: string; value: boolean; onChange: (on: boolean) => void; testID: string }) {
  return (
    <View style={styles.row}>
      <View style={styles.rowText}>
        <Text style={styles.label}>{label}</Text>
        {help ? <Text style={styles.help}>{help}</Text> : null}
      </View>
      <Text style={styles.state}>{value ? en.setup.on : en.setup.off}</Text>
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

export function SetupScreen({ sound, vibration, stats, onSound, onVibration, onStats, onResetScores, onBack }: Props) {
  const [confirming, setConfirming] = useState(false);

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
        {en.setup.title}
      </Text>
      <View style={styles.rasta} />
      <View style={styles.list}>
        <Toggle label={en.setup.sound} value={sound} onChange={onSound} testID="setup-sound" />
        <Toggle label={en.setup.vibration} value={vibration} onChange={onVibration} testID="setup-vibration" />
        <Toggle label={en.setup.stats} help={en.setup.statsHelp} value={stats} onChange={onStats} testID="setup-stats" />
      </View>
      {confirming ? (
        <View style={styles.confirm} testID="setup-reset-confirm">
          <Text style={styles.confirmText}>{en.setup.resetConfirm}</Text>
          <View style={styles.actions}>
            <Action
              label={en.setup.resetYes}
              testID="setup-reset-yes"
              color={colors.rastaRed}
              onPress={async () => {
                setConfirming(false);
                await onResetScores();
              }}
            />
            <Action label={en.setup.resetNo} testID="setup-reset-no" color={colors.surface} onPress={() => setConfirming(false)} />
          </View>
        </View>
      ) : (
        <View style={styles.actions}>
          <Action label={en.setup.reset} testID="setup-reset" color={colors.rastaRed} onPress={() => setConfirming(true)} />
          <Action label={en.setup.back} testID="setup-back" color={colors.surface} onPress={onBack} />
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
  list: { width: '70%', gap: spacing.xs },
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
