// Title screen ported from the source `components/MainMenu.tsx`: title, PLAY, control hints and leaf buttons.
// After 30 s without a touch, and if a high score exists, the high-score table is shown (onScores).
import { useCallback, useEffect, useRef } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { en } from '../i18n/en';
import { GanjaLeaf } from '../ui/GanjaLeaf';
import { colors } from '../ui/theme';

export const HOME_IDLE_MS = 30_000;

type Props = {
  hasScores: boolean;
  onPlay: () => void;
  onScores: () => void;
  onAbout: () => void;
  onSetup: () => void;
};

function LeafButton({ label, onPress, testID }: { label: string; onPress: () => void; testID: string }) {
  return (
    <Pressable style={styles.leafButton} onPress={onPress} testID={testID} accessibilityRole="button" accessibilityLabel={label}>
      <GanjaLeaf size={80} />
      <Text style={styles.leafText}>{label}</Text>
    </Pressable>
  );
}

export function HomeScreen({ hasScores, onPlay, onScores, onAbout, onSetup }: Props) {
  const idle = useRef<ReturnType<typeof setTimeout> | null>(null);

  const resetIdle = useCallback(() => {
    if (idle.current) clearTimeout(idle.current);
    idle.current = hasScores ? setTimeout(onScores, HOME_IDLE_MS) : null;
  }, [hasScores, onScores]);

  useEffect(() => {
    resetIdle();
    return () => {
      if (idle.current) clearTimeout(idle.current);
    };
  }, [resetIdle]);

  return (
    <View style={styles.container} testID="home-screen" onTouchStart={resetIdle}>
      <View style={styles.center}>
        <View style={styles.titleContainer} accessibilityRole="header">
          <Text style={styles.titleGanja}>{en.home.titleTop}</Text>
          <Text style={styles.titleFarmer}>{en.home.titleBottom}</Text>
        </View>
        <Text style={styles.subtitle}>{en.home.subtitle}</Text>
        <Pressable style={styles.playButton} onPress={onPlay} testID="home-play" accessibilityRole="button">
          <Text style={styles.playText}>{en.home.play}</Text>
        </Pressable>
        <View style={styles.controls}>
          {en.home.hints.map((hint) => (
            <Text key={hint} style={styles.controlText}>
              {hint}
            </Text>
          ))}
        </View>
      </View>
      <View style={styles.leafMenu}>
        {hasScores && <LeafButton label={en.home.scores} onPress={onScores} testID="home-scores" />}
        <LeafButton label={en.home.about} onPress={onAbout} testID="home-about" />
        <LeafButton label={en.home.setup} onPress={onSetup} testID="home-setup" />
      </View>
    </View>
  );
}

const shadow = { textShadowColor: '#000', textShadowOffset: { width: 3, height: 3 }, textShadowRadius: 0 } as const;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, flexDirection: 'row', alignItems: 'center' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  titleContainer: { alignItems: 'center', marginBottom: 6 },
  titleGanja: { fontSize: 52, fontWeight: 'bold', color: colors.rastaGreen, letterSpacing: 8, ...shadow },
  titleFarmer: { fontSize: 48, fontWeight: 'bold', color: colors.rastaYellow, letterSpacing: 6, marginTop: -10, ...shadow },
  subtitle: { fontSize: 16, color: colors.muted, marginBottom: 20, fontStyle: 'italic' },
  playButton: {
    backgroundColor: colors.rastaRed,
    paddingHorizontal: 60,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 3,
    borderColor: colors.rastaYellow,
    marginBottom: 10,
  },
  playText: { fontSize: 28, fontWeight: 'bold', color: '#FFFFFF', letterSpacing: 4 },
  controls: { alignItems: 'center', marginTop: 5 },
  controlText: { fontSize: 12, color: '#88AA88', marginBottom: 4 },
  leafMenu: { width: 130, alignItems: 'center', justifyContent: 'center', gap: 8, marginRight: 20 },
  leafButton: {
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'rgba(255, 215, 0, 0.4)',
    width: 110,
    minHeight: 48,
    paddingTop: 2,
    paddingBottom: 6,
  },
  leafText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: colors.rastaYellow,
    letterSpacing: 2,
    marginTop: -8,
    textShadowColor: '#000',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
});
