import { StyleSheet, Switch, Text, View } from 'react-native';

import { en } from '../i18n/en';
import { Button } from '../ui/Button';
import { Screen } from '../ui/Screen';
import { colors, font, spacing } from '../ui/theme';

type Props = { telemetryEnabled: boolean; onToggleTelemetry: (granted: boolean) => void; onBack: () => void };

export function SettingsScreen({ telemetryEnabled, onToggleTelemetry, onBack }: Props) {
  return (
    <Screen testID="settings-screen">
      <Text style={styles.title} accessibilityRole="header">
        {en.setup.title}
      </Text>
      <View style={styles.row}>
        <View style={styles.rowText}>
          <Text style={styles.label}>{en.setup.stats}</Text>
          <Text style={styles.help}>{en.setup.statsHelp}</Text>
        </View>
        <Switch
          value={telemetryEnabled}
          onValueChange={onToggleTelemetry}
          accessibilityLabel={en.setup.stats}
          testID="settings-telemetry"
          trackColor={{ true: colors.accent, false: colors.surface }}
        />
      </View>
      <View style={styles.spacer} />
      <Button label={en.setup.back} onPress={onBack} variant="secondary" testID="settings-back" />
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { color: colors.text, fontSize: font.heading, fontWeight: '800' },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, backgroundColor: colors.surface, borderRadius: 14, padding: spacing.md },
  rowText: { flex: 1, gap: spacing.xs },
  label: { color: colors.text, fontSize: font.body, fontWeight: '600' },
  help: { color: colors.muted, fontSize: font.small },
  spacer: { flex: 1 },
});
