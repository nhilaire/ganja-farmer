import { StyleSheet, Text, View } from 'react-native';

import { APP_NAME } from '../config/app';
import { en } from '../i18n/en';
import { Button } from '../ui/Button';
import { Screen } from '../ui/Screen';
import { colors, font, spacing } from '../ui/theme';

type Props = { onPlay: () => void; onSettings: () => void; onAbout: () => void };

export function HomeScreen({ onPlay, onSettings, onAbout }: Props) {
  return (
    <Screen testID="home-screen">
      <View style={styles.hero}>
        <Text style={styles.title} accessibilityRole="header">
          {APP_NAME}
        </Text>
      </View>
      <Button label={en.home.play} onPress={onPlay} testID="home-play" />
      <Button label={en.home.setup} onPress={onSettings} variant="secondary" testID="home-settings" />
      <Button label={en.home.about} onPress={onAbout} variant="secondary" testID="home-about" />
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.sm },
  title: { color: colors.text, fontSize: font.title, fontWeight: '800', textAlign: 'center' },
  best: { color: colors.accent, fontSize: font.body },
});
