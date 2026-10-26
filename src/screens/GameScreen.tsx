import { Canvas, createPicture, Picture } from '@shopify/react-native-skia';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AppState, BackHandler, GestureResponderEvent, Pressable, StyleSheet, Text, View } from 'react-native';

import { CheatDetector } from '../game/cheats';
import { GameEngine } from '../game/engine';
import { PLANT_COUNT } from '../game/layout';
import { Aim, TouchTracker } from '../game/touches';
import { GameEvent } from '../game/types';
import { useI18n } from '../i18n/I18nProvider';
import { JAH_QUOTES } from '../i18n/quotes';
import { setRenderLayout } from '../render/renderer';
import { drawScene } from '../render/scene';
import { colors, spacing } from '../ui/theme';
import { JahBlessing } from './JahBlessing';
import { LevelTransition } from './LevelTransition';

type Overlay =
  | { kind: 'none' }
  | { kind: 'blessing'; restored: number; bonus: number }
  | { kind: 'transition'; restored: number; bonus: number; quote: string };

type Props = {
  engine: GameEngine;
  onEvents?: (events: GameEvent[]) => void; // sounds, vibrations, telemetry
  onGameOver: () => void;
  onQuit: () => void;
};

const MAX_DT = 0.05; // clamp long frames (app resumed, GC pause) to keep the simulation stable

// Fingers that changed in this event; tests and some platforms only give the top-level touch.
function changed(e: GestureResponderEvent): { identifier: number; pageX: number; pageY: number }[] {
  const list = e.nativeEvent.changedTouches;
  const touches = list && list.length > 0 ? list : [e.nativeEvent];
  return touches.map((t) => ({ identifier: Number(t.identifier ?? 0), pageX: t.pageX, pageY: t.pageY }));
}

function pickQuote(): string {
  return JAH_QUOTES[Math.floor(Math.random() * JAH_QUOTES.length)];
}

export function GameScreen({ engine, onEvents, onGameOver, onQuit }: Props) {
  const { t } = useI18n();
  const [, setFrame] = useState(0);
  const [paused, setPaused] = useState(false);
  const [overlay, setOverlay] = useState<Overlay>({ kind: 'none' });
  const [message, setMessage] = useState<{ title: string; body?: string } | null>(null);
  const [bossWarning, setBossWarning] = useState<string | null>(null);
  const cheats = useMemo(() => new CheatDetector(engine.layout), [engine]);
  const fingers = useMemo(() => new TouchTracker(), []);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const onEventsRef = useRef(onEvents);
  onEventsRef.current = onEvents;
  const onGameOverRef = useRef(onGameOver);
  onGameOverRef.current = onGameOver;

  setRenderLayout(engine.layout);

  const later = useCallback((ms: number, fn: () => void) => {
    timers.current.push(setTimeout(fn, ms));
  }, []);

  const showMessage = useCallback(
    (title: string, body?: string, ms = 2500) => {
      setMessage({ title, body });
      later(ms, () => setMessage((m) => (m && m.title === title ? null : m)));
    },
    [later],
  );

  const handleEvents = useCallback(
    (events: GameEvent[]) => {
      if (events.length === 0) return;
      onEventsRef.current?.(events);
      for (const e of events) {
        switch (e.type) {
          case 'powerUpActivated':
            showMessage(t.powerUps[e.id].name, t.powerUps[e.id].description);
            break;
          case 'bossSpawn':
            setBossWarning(e.name);
            later(3000, () => setBossWarning(null));
            break;
          case 'levelStart':
            if (e.level === 10) showMessage(t.game.rocketMessage, undefined, 3000);
            break;
          case 'levelComplete':
            setOverlay(
              e.restored > 0
                ? { kind: 'blessing', restored: e.restored, bonus: e.bonus }
                : { kind: 'transition', restored: 0, bonus: e.bonus, quote: pickQuote() },
            );
            break;
          case 'gameOver':
            onGameOverRef.current();
            break;
        }
      }
    },
    [later, showMessage],
  );

  // Game loop: one engine step and one render per animation frame.
  useEffect(() => {
    let raf = 0;
    let last: number | null = null;
    const step = (now: number) => {
      const dt = last === null ? 0 : Math.min((now - last) / 1000, MAX_DT);
      last = now;
      engine.update(dt);
      handleEvents(engine.drainEvents());
      setFrame((f) => (f + 1) % 1_000_000);
      raf = requestAnimationFrame(step);
    };
    handleEvents(engine.drainEvents()); // levelStart of the first level
    raf = requestAnimationFrame(step);
    const pending = timers.current;
    return () => {
      cancelAnimationFrame(raf);
      pending.forEach(clearTimeout);
    };
  }, [engine, handleEvents]);

  const pause = useCallback(() => {
    engine.paused = true;
    fingers.clear();
    engine.setFiring(false);
    setPaused(true);
  }, [engine, fingers]);

  const resume = useCallback(() => {
    engine.paused = false;
    setPaused(false);
  }, [engine]);

  // Leaving the app (call, notification, home button) pauses the game; it never resumes by itself.
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state !== 'active' && engine.phase !== 'over') pause();
    });
    return () => sub.remove();
  }, [engine, pause]);

  // Android back opens the pause overlay instead of leaving the game.
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (!paused) pause();
      return true;
    });
    return () => sub.remove();
  }, [paused, pause]);

  const interactive = !paused && overlay.kind === 'none' && engine.phase !== 'over';

  // Several fingers (AC-40): fire while any finger is down, aim at the last one placed.
  const applyAim = useCallback(
    ({ firing, aim }: Aim) => {
      if (aim) engine.aimAt(aim.x, aim.y);
      engine.setFiring(firing);
    },
    [engine],
  );

  const onTouchStart = useCallback(
    (e: GestureResponderEvent) => {
      if (!interactive) return;
      for (const t of changed(e)) {
        const cheat = cheats.tap(t.pageX, t.pageY, Date.now());
        if (cheat === 'skipLevel') engine.forceComplete();
        else if (cheat === 'restorePlants') engine.restorePlants(2);
        applyAim(fingers.down(t.identifier, t.pageX, t.pageY));
      }
    },
    [interactive, cheats, engine, fingers, applyAim],
  );

  const onTouchMove = useCallback(
    (e: GestureResponderEvent) => {
      if (!interactive) return;
      for (const t of changed(e)) applyAim(fingers.move(t.identifier, t.pageX, t.pageY));
    },
    [interactive, fingers, applyAim],
  );

  const onTouchEnd = useCallback(
    (e: GestureResponderEvent) => {
      for (const t of changed(e)) applyAim(fingers.up(t.identifier));
    },
    [fingers, applyAim],
  );

  const onTouchCancel = useCallback(() => applyAim(fingers.clear()), [fingers, applyAim]);

  const picture = createPicture((canvas) => drawScene(canvas, engine, { bossWarning }, t));

  return (
    <View
      style={styles.container}
      testID="game-screen"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      onTouchCancel={onTouchCancel}
    >
      <Canvas style={StyleSheet.absoluteFill}>
        <Picture picture={picture} />
      </Canvas>

      <View style={[styles.hud, { height: engine.layout.hudHeight + 6 }]} pointerEvents="box-none">
        <Text style={styles.hudText} testID="hud-score">
          {t.hud.score(engine.score)}
        </Text>
        <Text style={styles.hudText} testID="hud-level">
          {t.hud.level(engine.level)}
        </Text>
        <Text style={styles.hudText} testID="hud-plants">
          {t.hud.plants(engine.alivePlants, PLANT_COUNT)}
        </Text>
        <Text style={styles.hudText} testID="hud-weapon">
          {t.hud.weapon(t.weapons[engine.weapon.id])}
        </Text>
        <Pressable
          onPress={pause}
          testID="game-pause"
          accessibilityRole="button"
          accessibilityLabel={t.pause.button}
          style={styles.pauseButton}
          hitSlop={12}
        >
          <Text style={styles.pauseIcon}>II</Text>
        </Pressable>
      </View>

      <View style={[styles.effects, { top: engine.layout.hudHeight + 10 }]} pointerEvents="none">
        {engine.activeEffects.map((effect) => (
          <Text key={effect.id} style={styles.effectText}>
            {t.hud.effect(t.powerUps[effect.id].name, Math.ceil(effect.remaining))}
          </Text>
        ))}
      </View>

      {message && (
        <View style={styles.message} pointerEvents="none" testID="game-message">
          <Text style={styles.messageTitle}>{message.title}</Text>
          {message.body ? <Text style={styles.messageBody}>{message.body}</Text> : null}
        </View>
      )}

      {overlay.kind === 'blessing' && (
        <JahBlessing
          restored={overlay.restored}
          groundY={engine.layout.groundY}
          onComplete={() => setOverlay({ kind: 'transition', restored: overlay.restored, bonus: overlay.bonus, quote: pickQuote() })}
        />
      )}

      {overlay.kind === 'transition' && (
        <LevelTransition
          nextLevel={engine.level + 1}
          bonus={overlay.bonus}
          restored={overlay.restored}
          alive={engine.alivePlants}
          quote={overlay.quote}
          onContinue={() => {
            setOverlay({ kind: 'none' });
            engine.nextLevel();
          }}
        />
      )}

      {paused && (
        <View style={styles.pauseOverlay} testID="pause-overlay">
          <Text style={styles.pauseTitle}>{t.pause.title}</Text>
          <Pressable style={styles.pauseAction} onPress={resume} testID="pause-resume" accessibilityRole="button">
            <Text style={styles.pauseActionText}>{t.pause.resume}</Text>
          </Pressable>
          <Pressable style={[styles.pauseAction, styles.pauseMenu]} onPress={onQuit} testID="pause-menu" accessibilityRole="button">
            <Text style={styles.pauseActionText}>{t.pause.menu}</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.black },
  hud: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    backgroundColor: colors.hudBg,
    borderBottomWidth: 2,
    borderBottomColor: colors.accent,
  },
  hudText: { color: colors.hudText, fontFamily: 'monospace', fontWeight: 'bold', fontSize: 13 },
  pauseButton: { paddingHorizontal: spacing.sm },
  pauseIcon: { color: colors.hudText, fontWeight: '900', fontSize: 16 },
  effects: { position: 'absolute', right: spacing.md, alignItems: 'flex-end' },
  effectText: { color: colors.effect, fontFamily: 'monospace', fontSize: 11, fontWeight: 'bold' },
  message: { position: 'absolute', top: '30%', left: 0, right: 0, alignItems: 'center' },
  messageTitle: {
    color: colors.accent,
    fontSize: 26,
    fontWeight: '900',
    letterSpacing: 2,
    textShadowColor: colors.black,
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 0,
  },
  messageBody: { color: colors.text, fontSize: 15, fontWeight: 'bold', marginTop: spacing.xs },
  pauseOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: colors.overlay,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
  },
  pauseTitle: { color: colors.accent, fontSize: 40, fontWeight: '900', letterSpacing: 6 },
  pauseAction: {
    minWidth: 200,
    minHeight: 48,
    borderRadius: 10,
    backgroundColor: colors.rastaGreen,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.accent,
  },
  pauseMenu: { backgroundColor: colors.rastaRed },
  pauseActionText: { color: colors.text, fontSize: 18, fontWeight: 'bold', letterSpacing: 2 },
});
