// Jah comes down on a cloud and blesses the field between levels (about 4 s), ported from the source
// `components/JahBlessing.tsx`. Drawn over the playfield; touches are ignored meanwhile.
import { useEffect, useRef, useState } from 'react';
import { Animated, Dimensions, Easing, StyleSheet, Text, View } from 'react-native';

import { en } from '../i18n/en';

const { width, height } = Dimensions.get('screen');
const W = Math.max(width, height);

type Props = { onComplete: () => void; restored: number; groundY: number };

export function JahBlessing({ onComplete, restored, groundY }: Props) {
  const [phrase] = useState(() => en.blessing.phrases[Math.floor(Math.random() * en.blessing.phrases.length)]);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;
  const jahY = useRef(new Animated.Value(-100)).current;
  const jahScale = useRef(new Animated.Value(0.3)).current;
  const glowOpacity = useRef(new Animated.Value(0)).current;
  const glowScale = useRef(new Animated.Value(0.5)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;

  const targetY = groundY - 100;

  useEffect(() => {
    // Phase 1: Jah descends + text appears early (at 1s)
    Animated.parallel([
      Animated.timing(jahY, {
        toValue: targetY,
        duration: 1800,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(jahScale, {
        toValue: 1,
        duration: 1800,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.sequence([
        Animated.delay(1000),
        Animated.timing(textOpacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
      ]),
    ]).start(() => {
      // Phase 2: Blessing glow
      Animated.parallel([
        Animated.timing(glowOpacity, {
          toValue: 0.7,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(glowScale, {
          toValue: 2.5,
          duration: 800,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
      ]).start(() => {
        // Phase 3: Hold briefly, then ascend
        Animated.sequence([
          Animated.delay(800),
          Animated.parallel([
            Animated.timing(jahY, {
              toValue: -150,
              duration: 800,
              easing: Easing.in(Easing.quad),
              useNativeDriver: true,
            }),
            Animated.timing(jahScale, {
              toValue: 0.3,
              duration: 800,
              useNativeDriver: true,
            }),
            Animated.timing(glowOpacity, {
              toValue: 0,
              duration: 600,
              useNativeDriver: true,
            }),
            Animated.timing(textOpacity, {
              toValue: 0,
              duration: 500,
              useNativeDriver: true,
            }),
          ]),
        ]).start(() => {
          onCompleteRef.current();
        });
      });
    });
    // Animated values and the target are fixed for the lifetime of the overlay.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <View style={styles.overlay} pointerEvents="none" testID="jah-blessing">
      {/* Light dim */}
      <View style={styles.dimOverlay} />

      {/* Jah + cloud */}
      <Animated.View style={[styles.jahGroup, {
        transform: [
          { translateY: jahY },
          { scale: jahScale },
        ],
      }]}>
        {/* Cloud */}
        <View style={styles.cloud}>
          <View style={styles.cloudPuff1} />
          <View style={styles.cloudPuff2} />
          <View style={styles.cloudPuff3} />
          <View style={styles.cloudBase} />
        </View>

        {/* Jah */}
        <View style={styles.jahBody}>
          <View style={styles.halo} />
          <View style={styles.head} />
          <View style={styles.dreads}>
            <View style={styles.dread1} />
            <View style={styles.dread2} />
            <View style={styles.dread3} />
          </View>
          <View style={styles.robe} />
          <View style={styles.armLeft} />
          <View style={styles.armRight} />
        </View>
      </Animated.View>

      {/* Blessing glow at plant level */}
      <Animated.View style={[styles.blessingGlow, {
        top: targetY + 60,
        opacity: glowOpacity,
        transform: [{ scale: glowScale }],
      }]} />

      {/* Jah phrase + Plants Restored text */}
      <Animated.View style={[styles.restoredContainer, {
        top: targetY - 75,
        opacity: textOpacity,
      }]}>
        <Text style={styles.phraseText}>{phrase}</Text>
        <Text style={styles.restoredText}>{en.blessing.restored(restored)}</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFill,
    zIndex: 100,
  },
  dimOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
  },
  jahGroup: {
    position: 'absolute',
    left: W * 0.5 - 40,
    top: 0,
    alignItems: 'center',
    zIndex: 10,
  },
  cloud: {
    width: 80,
    height: 35,
    marginBottom: -10,
  },
  cloudBase: {
    position: 'absolute',
    bottom: 0,
    left: 5,
    width: 70,
    height: 18,
    borderRadius: 10,
    backgroundColor: '#E8E8E8',
    opacity: 0.85,
  },
  cloudPuff1: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    width: 25,
    height: 25,
    borderRadius: 13,
    backgroundColor: '#F5F5F5',
    opacity: 0.9,
  },
  cloudPuff2: {
    position: 'absolute',
    bottom: 10,
    left: 25,
    width: 35,
    height: 30,
    borderRadius: 17,
    backgroundColor: '#FFFFFF',
  },
  cloudPuff3: {
    position: 'absolute',
    bottom: 6,
    left: 50,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#F0F0F0',
    opacity: 0.9,
  },
  jahBody: {
    alignItems: 'center',
    width: 50,
    height: 65,
  },
  halo: {
    position: 'absolute',
    top: -12,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFD700',
    opacity: 0.35,
  },
  head: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#8B4513',
    zIndex: 2,
  },
  dreads: {
    flexDirection: 'row',
    marginTop: -4,
    zIndex: 1,
  },
  dread1: {
    width: 4,
    height: 12,
    backgroundColor: '#1a1a1a',
    borderBottomLeftRadius: 3,
    borderBottomRightRadius: 3,
    marginHorizontal: 1,
  },
  dread2: {
    width: 4,
    height: 14,
    backgroundColor: '#1a1a1a',
    borderBottomLeftRadius: 3,
    borderBottomRightRadius: 3,
    marginHorizontal: 1,
  },
  dread3: {
    width: 4,
    height: 11,
    backgroundColor: '#1a1a1a',
    borderBottomLeftRadius: 3,
    borderBottomRightRadius: 3,
    marginHorizontal: 1,
  },
  robe: {
    width: 24,
    height: 28,
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
    marginTop: 2,
    borderWidth: 1,
    borderColor: '#FFD700',
  },
  armLeft: {
    position: 'absolute',
    top: 28,
    left: 2,
    width: 14,
    height: 5,
    backgroundColor: '#8B4513',
    borderRadius: 3,
    transform: [{ rotate: '-35deg' }],
  },
  armRight: {
    position: 'absolute',
    top: 28,
    right: 2,
    width: 14,
    height: 5,
    backgroundColor: '#8B4513',
    borderRadius: 3,
    transform: [{ rotate: '35deg' }],
  },
  blessingGlow: {
    position: 'absolute',
    alignSelf: 'center',
    left: W * 0.5 - 50,
    width: 100,
    height: 60,
    borderRadius: 50,
    backgroundColor: '#FFD700',
  },
  restoredContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 20,
  },
  phraseText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFD700',
    textShadowColor: '#000',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 6,
    marginBottom: 6,
    fontStyle: 'italic',
  },
  restoredText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#32CD32',
    textShadowColor: '#000',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 4,
  },
});
