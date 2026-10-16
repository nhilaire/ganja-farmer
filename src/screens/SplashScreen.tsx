// Custom splash shown for 2 s after the native one: the source landscape artwork with the GANJA FARMER logo.
import { Image, StyleSheet, View } from 'react-native';

export const SPLASH_MS = 2000;

export function SplashScreen() {
  return (
    <View style={styles.container} testID="splash-screen">
      <Image source={require('../../assets/splash-icon.png')} style={styles.image} resizeMode="cover" accessibilityIgnoresInvertColors />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000000' },
  image: { width: '100%', height: '100%' },
});
