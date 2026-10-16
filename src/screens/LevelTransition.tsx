// Between levels: next level number, Jah quote, bonus, restored plants, new weapon, "Tap to continue".
// Ported from the source `components/LevelTransition.tsx`; taps count only after the 500 ms fade-in.
import { useEffect, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';

import { PLANT_COUNT } from '../game/layout';
import { weaponForLevel } from '../game/weapons';
import { en } from '../i18n/en';
import { colors } from '../ui/theme';

type Props = {
  nextLevel: number;
  bonus: number;
  restored: number;
  alive: number;
  quote: string;
  onContinue: () => void;
};

export function LevelTransition({ nextLevel, bonus, restored, alive, quote, onContinue }: Props) {
  const fade = useRef(new Animated.Value(0)).current;
  const [ready, setReady] = useState(false);
  const leaving = useRef(false);
  const weapon = weaponForLevel(nextLevel);
  const isNewWeapon = nextLevel > 1 && weapon.id !== weaponForLevel(nextLevel - 1).id;

  useEffect(() => {
    Animated.timing(fade, { toValue: 1, duration: 500, useNativeDriver: true }).start(() => setReady(true));
  }, [fade]);

  const handleContinue = () => {
    if (!ready || leaving.current) return;
    leaving.current = true;
    Animated.timing(fade, { toValue: 0, duration: 300, useNativeDriver: true }).start(() => onContinue());
  };

  return (
    <Pressable style={styles.container} onPress={handleContinue} testID="level-transition" accessibilityRole="button">
      <Animated.View style={[styles.content, { opacity: fade }]}>
        <Text style={styles.levelText}>{en.transition.level(nextLevel)}</Text>
        <Text style={styles.jahText}>{en.transition.jah}</Text>
        <Text style={styles.message}>{quote}</Text>
        <View style={styles.blessings}>
          {bonus > 0 && <Text style={styles.bonusText}>{en.transition.bonus(bonus)}</Text>}
          {restored > 0 && <Text style={styles.blessingText}>{en.blessing.restored(restored)}</Text>}
          {isNewWeapon && <Text style={styles.weaponText}>{en.transition.newWeapon(en.weapons[weapon.id])}</Text>}
        </View>
        <Text style={styles.plantsText}>{en.transition.plants(alive, PLANT_COUNT)}</Text>
        {ready && (
          <Text style={styles.continueText} testID="transition-continue">
            {en.transition.continue}
          </Text>
        )}
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: { alignItems: 'center' },
  levelText: {
    fontSize: 42,
    fontWeight: 'bold',
    color: colors.rastaYellow,
    letterSpacing: 6,
    marginBottom: 12,
    textShadowColor: '#000',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 0,
  },
  jahText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#FFD700',
    textShadowColor: '#FF8C00',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
    marginBottom: 6,
  },
  message: { fontSize: 16, color: '#FFFFFF', fontStyle: 'italic', marginBottom: 14, textAlign: 'center', paddingHorizontal: 40 },
  blessings: { alignItems: 'center', marginBottom: 10 },
  bonusText: { fontSize: 22, color: colors.rastaYellow, fontWeight: 'bold', marginBottom: 6, letterSpacing: 2 },
  blessingText: { fontSize: 16, color: '#32CD32', fontWeight: 'bold', marginBottom: 5 },
  weaponText: { fontSize: 18, color: colors.rastaRed, fontWeight: 'bold' },
  plantsText: { fontSize: 14, color: '#AAAAAA', fontFamily: 'monospace' },
  continueText: { fontSize: 16, color: '#FFFFFF', marginTop: 18, opacity: 0.7, letterSpacing: 2 },
});
