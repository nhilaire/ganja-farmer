// ABOUT (source `components/About.tsx`): the original game, why this game exists (story from the discovery brief),
// this version (a passionate independent developer, bugs are possible), the player's data, the version, the quote.
import { useEffect } from 'react';
import { BackHandler, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { APP_VERSION } from '../config/app';
import { en } from '../i18n/en';
import { colors, spacing } from '../ui/theme';

function Section({ title, paragraphs }: { title: string; paragraphs: readonly string[] }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {paragraphs.map((p) => (
        <Text key={p} style={styles.text}>
          {p}
        </Text>
      ))}
    </View>
  );
}

export function AboutScreen({ onBack }: { onBack: () => void }) {
  // Android back returns to Home.
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      onBack();
      return true;
    });
    return () => sub.remove();
  }, [onBack]);

  return (
    <View style={styles.container} testID="about-screen">
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.title} accessibilityRole="header">
          {en.about.title}
        </Text>
        <View style={styles.rasta} />
        <Section title={en.about.originalTitle} paragraphs={en.about.original} />
        <View style={styles.separator} />
        <Section title={en.about.whyTitle} paragraphs={en.about.story} />
        <View style={styles.separator} />
        <Section title={en.about.versionTitle} paragraphs={en.about.thisVersion} />
        <View style={styles.separator} />
        <Section title={en.about.dataTitle} paragraphs={en.about.data} />
        <View style={styles.separator} />
        <Text style={styles.techTitle}>{en.about.builtWithTitle}</Text>
        {en.about.builtWith.map((line) => (
          <Text key={line} style={styles.techText}>
            {line}
          </Text>
        ))}
        <Text style={styles.version}>{en.about.version(APP_VERSION)}</Text>
        <View style={styles.separator} />
        <Text style={styles.quote}>{en.about.quote}</Text>
        <Text style={styles.quoteAuthor}>{en.about.quoteAuthor}</Text>
        <Pressable style={styles.backButton} onPress={onBack} testID="about-back" accessibilityRole="button">
          <Text style={styles.backText}>{en.about.back}</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scroll: { alignItems: 'center', paddingVertical: 20, paddingHorizontal: 60 },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.rastaYellow,
    textShadowColor: '#000',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 0,
    letterSpacing: 6,
    marginBottom: 8,
  },
  rasta: { height: 4, width: 200, marginBottom: 15, backgroundColor: colors.rastaRed, borderRadius: 2 },
  section: { alignSelf: 'stretch' },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#5B9B2A', marginBottom: 8, marginTop: 5 },
  text: { fontSize: 13, color: colors.muted, lineHeight: 19, marginBottom: 8 },
  separator: { height: 1, alignSelf: 'stretch', backgroundColor: 'rgba(255, 215, 0, 0.25)', marginVertical: spacing.sm },
  techTitle: { fontSize: 14, fontWeight: 'bold', color: colors.rastaYellow, marginBottom: 4 },
  techText: { fontSize: 12, color: '#88AA88', fontFamily: 'monospace' },
  version: { fontSize: 12, color: colors.muted, marginTop: spacing.sm },
  quote: { fontSize: 14, color: colors.rastaYellow, fontStyle: 'italic', textAlign: 'center' },
  quoteAuthor: { fontSize: 12, color: '#88AA88', marginTop: 4 },
  backButton: {
    marginTop: spacing.md,
    minWidth: 160,
    minHeight: 48,
    borderRadius: 8,
    backgroundColor: colors.rastaRed,
    borderWidth: 2,
    borderColor: colors.rastaYellow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backText: { fontSize: 18, fontWeight: 'bold', color: '#FFFFFF', letterSpacing: 3 },
});
