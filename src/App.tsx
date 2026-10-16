import { useCallback, useEffect, useMemo, useState } from 'react';
import * as NativeSplash from 'expo-splash-screen';
import { ActivityIndicator, Dimensions, StatusBar, StyleSheet, View } from 'react-native';

import { FeedbackPolicy } from './audio/feedback';
import { playFeedback } from './audio/player';
import { GameEngine } from './game/engine';
import { HighScoreEntry, qualifies } from './game/highScores';
import { makeLayout } from './game/layout';
import { GameEvent } from './game/types';
import { AboutScreen } from './screens/AboutScreen';
import { ConsentScreen } from './screens/ConsentScreen';
import { GameOverScreen } from './screens/GameOverScreen';
import { GameScreen } from './screens/GameScreen';
import { HighScoresScreen } from './screens/HighScoresScreen';
import { HomeScreen } from './screens/HomeScreen';
import { SetupScreen } from './screens/SetupScreen';
import { SPLASH_MS, SplashScreen } from './screens/SplashScreen';
import { clearHighScores, loadHighScores, saveHighScore } from './storage/highScores';
import { DEFAULT_SETTINGS, loadSettings, saveSettings, Settings } from './storage/settings';
import { Consent, loadConsent, saveConsent } from './telemetry/consentStore';
import { telemetryFor, trackMapped } from './telemetry/gameTelemetry';
import { applyConsent, track } from './telemetry/telemetry';
import { ErrorBoundary } from './ui/ErrorBoundary';
import { colors } from './ui/theme';

// Keep the native splash until the stored state is loaded, then show the 2 s artwork splash.
NativeSplash.preventAutoHideAsync().catch(() => {});

type Route = 'home' | 'scores' | 'game' | 'gameOver' | 'setup' | 'about';

export default function App({ splashMs = SPLASH_MS }: { splashMs?: number }) {
  const [splash, setSplash] = useState(splashMs > 0);
  const [consent, setConsentState] = useState<Consent | 'loading'>('loading');
  const [route, setRoute] = useState<Route>('home');
  const [scores, setScores] = useState<HighScoreEntry[]>([]);
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const feedback = useMemo(() => new FeedbackPolicy(), []);
  const [result, setResult] = useState({ score: 0, kills: 0, level: 1, isHighScore: false });
  // One engine for the app lifetime; a new game resets it. Layout from the landscape screen size.
  const engine = useMemo(() => {
    const { width, height } = Dimensions.get('screen');
    return new GameEngine(makeLayout(width, height), Math.random);
  }, []);

  useEffect(() => {
    let alive = true;
    (async () => {
      const [storedConsent, storedScores, storedSettings] = await Promise.all([loadConsent(), loadHighScores(), loadSettings()]);
      if (storedConsent !== 'unknown') await applyConsent(storedConsent === 'granted');
      if (alive) {
        setScores(storedScores);
        setSettings(storedSettings);
        setConsentState(storedConsent);
        NativeSplash.hideAsync().catch(() => {});
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

  // STATS toggle in SETUP: the "off" event is the last one sent, the "on" event the first one after consent.
  const toggleStats = useCallback(
    async (granted: boolean) => {
      if (!granted) track('settings_change', { setting: 'telemetry', value: 'off' });
      await decide(granted);
      if (granted) track('settings_change', { setting: 'telemetry', value: 'on' });
    },
    [decide],
  );

  const play = useCallback(() => {
    engine.newGame();
    track('game_start', { level: 1 });
    setRoute('game');
  }, [engine]);

  const home = useCallback(() => setRoute('home'), []);

  const quit = useCallback(() => {
    track('game_quit', { level: engine.level, duration_s: Math.round(engine.playTime) });
    engine.paused = false;
    setRoute('home');
  }, [engine]);

  const onGameEvents = useCallback(
    (events: GameEvent[]) => {
      playFeedback(feedback.feedbackFor(events, settings, Date.now()));
      for (const event of events) {
        const tracked = telemetryFor(event, engine);
        if (tracked) trackMapped(tracked);
      }
    },
    [engine, feedback, settings],
  );

  const changeSettings = useCallback((patch: Partial<Settings>) => {
    for (const [setting, on] of Object.entries(patch) as [keyof Settings, boolean][]) {
      track('settings_change', { setting, value: on ? 'on' : 'off' });
    }
    setSettings((current) => {
      const next = { ...current, ...patch };
      saveSettings(next).catch(() => {});
      return next;
    });
  }, []);

  const resetScores = useCallback(async () => {
    await clearHighScores();
    setScores([]);
    track('settings_change', { setting: 'reset_scores', value: 'done' });
  }, []);

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

  useEffect(() => {
    if (!splash || consent === 'loading') return;
    const timer = setTimeout(() => setSplash(false), splashMs);
    return () => clearTimeout(timer);
  }, [splash, consent, splashMs]);

  let content: React.ReactNode;
  if (splash && consent !== 'loading') {
    content = <SplashScreen />;
  } else if (consent === 'loading') {
    content = (
      <View style={styles.loading}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  } else if (consent === 'unknown') {
    content = <ConsentScreen onDecision={decide} />;
  } else if (route === 'game') {
    content = <GameScreen engine={engine} onEvents={onGameEvents} onGameOver={gameOver} onQuit={quit} />;
  } else if (route === 'gameOver') {
    content = <GameOverScreen {...result} onSave={saveScore} onRetry={play} onMenu={home} />;
  } else if (route === 'scores') {
    content = <HighScoresScreen scores={scores} onBack={home} />;
  } else if (route === 'about') {
    content = <AboutScreen onBack={home} />;
  } else if (route === 'setup') {
    content = (
      <SetupScreen
        sound={settings.sound}
        vibration={settings.vibration}
        stats={consent === 'granted'}
        onSound={(sound) => changeSettings({ sound })}
        onVibration={(vibration) => changeSettings({ vibration })}
        onStats={toggleStats}
        onResetScores={resetScores}
        onBack={home}
      />
    );
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

  return (
    <ErrorBoundary>
      <StatusBar hidden />
      {content}
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
});
