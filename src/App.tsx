import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Dimensions, StyleSheet, View } from 'react-native';

import { GameEngine } from './game/engine';
import { makeLayout } from './game/layout';
import { AboutScreen } from './screens/AboutScreen';
import { ConsentScreen } from './screens/ConsentScreen';
import { GameScreen } from './screens/GameScreen';
import { HomeScreen } from './screens/HomeScreen';
import { SettingsScreen } from './screens/SettingsScreen';
import { Consent, loadConsent, saveConsent } from './telemetry/consentStore';
import { applyConsent } from './telemetry/telemetry';
import { ErrorBoundary } from './ui/ErrorBoundary';
import { colors } from './ui/theme';

type Route = 'home' | 'game' | 'settings' | 'about';

export default function App() {
  const [consent, setConsentState] = useState<Consent | 'loading'>('loading');
  const [route, setRoute] = useState<Route>('home');
  // One engine for the app lifetime; a new game resets it. Layout from the landscape screen size.
  const engine = useMemo(() => {
    const { width, height } = Dimensions.get('screen');
    return new GameEngine(makeLayout(width, height), Math.random);
  }, []);

  useEffect(() => {
    let alive = true;
    (async () => {
      const storedConsent = await loadConsent();
      if (storedConsent !== 'unknown') await applyConsent(storedConsent === 'granted');
      if (alive) setConsentState(storedConsent);
    })();
    return () => {
      alive = false;
    };
  }, []);

  const decide = useCallback(async (granted: boolean) => {
    const value = granted ? 'granted' : 'denied';
    await saveConsent(value);
    await applyConsent(granted);
    setConsentState(value);
  }, []);

  const play = useCallback(() => {
    engine.newGame();
    setRoute('game');
  }, [engine]);

  let content: React.ReactNode;
  if (consent === 'loading') {
    content = (
      <View style={styles.loading}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  } else if (consent === 'unknown') {
    content = <ConsentScreen onDecision={decide} />;
  } else if (route === 'game') {
    content = <GameScreen engine={engine} onGameOver={() => setRoute('home')} onQuit={() => setRoute('home')} />;
  } else if (route === 'about') {
    content = <AboutScreen onBack={() => setRoute('home')} />;
  } else if (route === 'settings') {
    content = <SettingsScreen telemetryEnabled={consent === 'granted'} onToggleTelemetry={decide} onBack={() => setRoute('home')} />;
  } else {
    content = <HomeScreen onPlay={play} onSettings={() => setRoute('settings')} onAbout={() => setRoute('about')} />;
  }

  return <ErrorBoundary>{content}</ErrorBoundary>;
}

const styles = StyleSheet.create({
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
});
