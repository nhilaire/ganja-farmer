import { ReactNode } from 'react';
import { StatusBar, StyleSheet, View } from 'react-native';

import { colors, spacing } from './theme';

// Full-screen container; the system bars stay hidden (immersive landscape game).
export function Screen({ children, testID }: { children: ReactNode; testID?: string }) {
  return (
    <View testID={testID} style={[styles.screen, { paddingTop: spacing.lg }]}>
      <StatusBar hidden />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background, paddingHorizontal: spacing.lg, paddingBottom: spacing.xl, gap: spacing.md },
});
