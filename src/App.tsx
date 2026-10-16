import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Dimensions, StyleSheet, View } from 'react-native';

import { GameEngine } from './game/engine';
import { HighScoreEntry, qualifies } from './game/highScores';
import { makeLayout } from './game/layout';
import { AboutScreen } from './screens/AboutScreen';
import { ConsentScreen } from './screens/ConsentScreen';
import { GameOverScreen } from './screens/GameOverScreen';
import { GameScreen } from './screens/GameScreen';
import { HighScoresScreen } from './screens/HighScoresScreen';
import { HomeScreen } from './screens/HomeScreen';
import { SettingsScreen } from './screens/SettingsScreen';
import { loadHighScores, saveHighScore } from './storage/highScores';
import { Consent, loadConsent, saveConsent } from './telemetry/consentStore';
import { applyConsent } from './telemetry/telemetry';
import { ErrorBoundary } from './ui/ErrorBoundary';
import { colors } from './ui/theme';

type Route = 'home' | 'scores' | 'game' | 'gameOver' | 'setup' | 'about';

export default function App() {
  const [consent, setConsentState] = useState<Consent | 'loading'>('loading');
  const [route, setRoute] = useState<Route>('home');
  const [scores, setScores] = useState<HighScoreEntry[]>([]);
  const [result, setResult] = useState({ score: 0, kills: 0, level: 1, isHighScore: false });
  // One engine for the app lifetime; a new game resets it. Layout from the landscape screen size.
  const engine = useMemo(() => {
    const { width, height } = Dimensions.get('screen');
    return new GameEngine(makeLayout(width, height), Math.random);
  }, []);

  useEffect(() => {
    let alive = true;
    (async () => {
      const [storedConsent, storedScores] = await Promise.all([loadConsent(), loadHighScores()]);
      if (storedConsent !== 'unknown') await applyConsent(storedConsent === 'granted');
      if (alive) {
        setScores(storedScores);
        setConsentState(storedConsent);
      }
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

  const home = useCallback(() => setRoute('home'), []);

  const gameOver = useCallback(() => {
    setResult({ score: engine.score, kills: engine.kills, level: engine.level, isHighScore: qualifies(scores, engine.score) });
    setRoute('gameOver');
  }, [engine, scores]);

  const saveScore = useCallback(
    async (name: string) => {
      const entry = { name, score: result.score, level: result.level, kills: result.kills, date: new Date().toISOString() };
      setScores(await saveHighScore(entry));
    },
    [result],
  );

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
    content = <GameScreen engine={engine} onGameOver={gameOver} onQuit={home} />;
  } else if (route === 'gameOver') {
    content = <GameOverScreen {...result} onSave={saveScore} onRetry={play} onMenu={home} />;
  } else if (route === 'scores') {
    content = <HighScoresScreen scores={scores} onBack={home} />;
  } else if (route === 'about') {
    content = <AboutScreen onBack={home} />;
  } else if (route === 'setup') {
    content = <SettingsScreen telemetryEnabled={consent === 'granted'} onToggleTelemetry={decide} onBack={home} />;
  } else {
    content = (
      <HomeScreen
        hasScores={scores.length > 0}
        onPlay={play}
        onScores={() => setRoute('scores')}
        onAbout={() => setRoute('about')}
        onSetup={() => setRoute('setup')}
      />
    );
  }

  return <ErrorBoundary>{content}</ErrorBoundary>;
}

const styles = StyleSheet.create({
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
});
