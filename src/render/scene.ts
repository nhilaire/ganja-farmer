// Draws one frame of the playfield from the engine state (draw order of the source `components/Game.tsx`).
// The HUD is not drawn here: it is a React Native overlay so that tests and Maestro can read it.
import { SkCanvas } from '@shopify/react-native-skia';

import { GameEngine } from '../game/engine';
import { en } from '../i18n/en';
import {
  drawA10,
  drawBabylonTrap,
  drawBackground,
  drawBomb,
  drawBoss,
  drawBossWarning,
  drawBullet,
  drawCombo,
  drawCropDuster,
  drawExplosion,
  drawFence,
  drawHelicopter,
  drawParatrooper,
  drawPlant,
  drawPowerUp,
  drawRasta,
  drawShieldIndicator,
  drawUFO,
  drawVan,
  drawZionWall,
} from './renderer';

export interface SceneOverlay {
  bossWarning: string | null;
}

export function drawScene(canvas: SkCanvas, engine: GameEngine, overlay: SceneOverlay): void {
  drawBackground(canvas);
  for (const plant of engine.plants) drawPlant(canvas, plant);
  drawFence(canvas);
  drawVan(canvas);
  drawRasta(canvas, engine.aimAngle, engine.activeEffects, engine.weapon.id);
  for (const bullet of engine.bullets) drawBullet(canvas, bullet);
  for (const enemy of engine.airEnemies) {
    switch (enemy.type) {
      case 'helicopter':
      case 'blackhawk':
        drawHelicopter(canvas, enemy);
        break;
      case 'a10':
        drawA10(canvas, enemy);
        break;
      case 'cropduster':
        drawCropDuster(canvas, enemy);
        break;
      case 'ufo':
        drawUFO(canvas, enemy);
        break;
      case 'boss':
        drawBoss(canvas, enemy);
        break;
    }
  }
  for (const para of engine.paratroopers) drawParatrooper(canvas, para);
  for (const bomb of engine.bombs) drawBomb(canvas, bomb);
  for (const exp of engine.explosions) drawExplosion(canvas, exp);
  for (const orb of engine.powerUps) drawPowerUp(canvas, orb);
  for (const plant of engine.plants) if (plant.alive && engine.plantShields[plant.index]) drawShieldIndicator(canvas, plant);
  if (engine.zionWallHits > 0) drawZionWall(canvas, engine.zionWallHits);
  if (engine.babylonTrapCharges > 0) drawBabylonTrap(canvas, engine.babylonTrapCharges);
  if (engine.comboCount >= 2) drawCombo(canvas, en.game.combo(engine.comboCount), en.game.multiplier(engine.comboMultiplier));
  if (overlay.bossWarning) drawBossWarning(canvas, en.game.bossIncoming, overlay.bossWarning);
}
