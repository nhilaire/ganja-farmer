// Skia drawing of the playfield, ported from the source `sprites/renderer.ts`. Visual only: not unit-tested,
// proven by Maestro screenshots and the feel check on the phone. Uses the clock for animations (allowed here, never in
// the engine). Geometry comes from the engine layout instead of module constants.
import { matchFont, PaintStyle, SkCanvas, Skia, StrokeCap } from '@shopify/react-native-skia';

import { Layout } from '../game/layout';
import { powerUpDef } from '../game/powerups';
import { ActiveEffect, AirEnemy, Bomb, Bullet, Explosion, Paratrooper, Plant, PowerUpOrb } from '../game/types';

let L: Layout;

// Must be called once with the engine layout before drawing.
export function setRenderLayout(layout: Layout): void {
  L = layout;
}

const COLORS = {
  sky: '#87CEEB',
  skyGradientTop: '#4A90D9',
  skyGradientBottom: '#87CEEB',
  grass: '#228B22',
  grassLight: '#32CD32',
  dirt: '#8B4513',
  dirtDark: '#654321',
  hudBg: '#8B0000',
  hudText: '#FFD700',
  plantGreen: '#006400',
  plantLeaf: '#228B22',
  vanWhite: '#F5F5F5',
  vanRed: '#CC0000',
  vanYellow: '#FFD700',
  vanGreen: '#006400',
  rastaRed: '#CC0000',
  rastaYellow: '#FFD700',
  rastaGreen: '#006400',
  explosion: '#FF4500',
  explosionInner: '#FFD700',
  fire: '#FF6600',
  bullet: '#FFD700',
  bulletTrail: '#FFA500',
};

// Paint cache
const makePaint = (color: string, style: PaintStyle = PaintStyle.Fill) => {
  const paint = Skia.Paint();
  paint.setColor(Skia.Color(color));
  paint.setStyle(style);
  paint.setAntiAlias(true);
  return paint;
};

const makeStrokePaint = (color: string, width: number) => {
  const paint = Skia.Paint();
  paint.setColor(Skia.Color(color));
  paint.setStyle(PaintStyle.Stroke);
  paint.setStrokeWidth(width);
  paint.setAntiAlias(true);
  paint.setStrokeCap(StrokeCap.Round);
  return paint;
};

// Cached paints
const paints = {
  sky: makePaint(COLORS.sky),
  grass: makePaint(COLORS.grass),
  grassLight: makePaint(COLORS.grassLight),
  dirt: makePaint(COLORS.dirt),
  dirtDark: makePaint(COLORS.dirtDark),
  plantGreen: makePaint(COLORS.plantGreen),
  plantLeaf: makePaint(COLORS.plantLeaf),
  vanWhite: makePaint(COLORS.vanWhite),
  vanRed: makePaint(COLORS.rastaRed),
  vanYellow: makePaint(COLORS.rastaYellow),
  vanGreen: makePaint(COLORS.rastaGreen),
  white: makePaint('#FFFFFF'),
  black: makePaint('#000000'),
  brown: makePaint('#8B4513'),
  darkBrown: makePaint('#5C3317'),
  skinBrown: makePaint('#8B6914'),
  rastaRed: makePaint(COLORS.rastaRed),
  rastaYellow: makePaint(COLORS.rastaYellow),
  rastaGreen: makePaint(COLORS.rastaGreen),
  bullet: makePaint(COLORS.bullet),
  bulletTrail: makePaint(COLORS.bulletTrail),
  explosion: makePaint(COLORS.explosion),
  explosionInner: makePaint(COLORS.explosionInner),
  fire: makePaint(COLORS.fire),
  fireYellow: makePaint('#FFAA00'),
  smoke: makePaint('#444444'),
  olive: makePaint('#556B2F'),
  darkOlive: makePaint('#3B4A1F'),
  gray: makePaint('#808080'),
  darkGray: makePaint('#404040'),
  lightGray: makePaint('#C0C0C0'),
  heliGreen: makePaint('#2F4F2F'),
  heliDarkGreen: makePaint('#1A3A1A'),
  blackPaint: makePaint('#000000'),
  parachuteWhite: makePaint('#EEEEDD'),
  parachuteStroke: makeStrokePaint('#999999', 1),
  paraLines: makeStrokePaint('#666666', 0.5),
  bombGray: makePaint('#333333'),
  bombRed: makePaint('#CC0000'),
  ufoSilver: makePaint('#C0C0C0'),
  ufoGlow: makePaint('#00FF00'),
  laserGreen: makePaint('#00FF00'),
  gunMetal: makePaint('#444444'),
  gunBarrel: makePaint('#333333'),
  flashWhite: makePaint('#FFFFFF'),
};

export function drawBackground(canvas: SkCanvas) {
  // Sky
  canvas.drawRect(Skia.XYWHRect(0, 0, L.W, L.groundY), paints.sky);

  // Grass/field
  canvas.drawRect(Skia.XYWHRect(0, L.groundY, L.W, L.dirtY - L.groundY), paints.grass);

  // Bushes (decorative)
  drawBush(canvas, L.W * 0.05, L.groundY - 25, 50, 30);
  drawBush(canvas, L.W * 0.15, L.groundY - 20, 35, 22);
  drawBush(canvas, L.W * 0.85, L.groundY - 28, 45, 28);
  drawBush(canvas, L.W * 0.92, L.groundY - 18, 30, 20);

  // Dirt
  canvas.drawRect(Skia.XYWHRect(0, L.dirtY, L.W, L.H - L.dirtY), paints.dirt);

  // Dirt texture lines
  for (let i = 0; i < 8; i++) {
    const y = L.dirtY + 5 + i * 8;
    canvas.drawLine(0, y, L.W, y, makeStrokePaint('#7A3B10', 0.5));
  }
}

function drawBush(canvas: SkCanvas, x: number, y: number, w: number, h: number) {
  canvas.drawOval(Skia.XYWHRect(x - w / 2, y - h / 2, w, h), paints.grassLight);
  canvas.drawOval(Skia.XYWHRect(x - w / 3, y - h / 2 - h * 0.3, w * 0.6, h * 0.7), paints.grass);
}

export function drawPlant(canvas: SkCanvas, plant: Plant) {
  if (!plant.alive && !plant.burning) return;

  const { x, y } = plant;
  const alpha = plant.burning ? 1 - plant.burnProgress * 0.5 : 1;

  // Stem
  canvas.drawRect(Skia.XYWHRect(x - 1, y - 20, 2, 22), paints.plantGreen);

  // Leaves (cannabis-style fan)
  const leafPaint = plant.burning ? paints.fire : paints.plantLeaf;

  // Center leaf
  const path = Skia.Path.Make();
  path.moveTo(x, y - 20);
  path.lineTo(x - 3, y - 32);
  path.lineTo(x, y - 35);
  path.lineTo(x + 3, y - 32);
  path.close();
  canvas.drawPath(path, leafPaint);

  // Side leaves
  for (const angle of [-0.6, -0.3, 0.3, 0.6]) {
    const lx = x + Math.sin(angle) * 10;
    const ly = y - 20 - Math.cos(angle) * 12;
    const leaf = Skia.Path.Make();
    leaf.moveTo(x, y - 18);
    leaf.lineTo(lx - 2, ly);
    leaf.lineTo(lx, ly - 4);
    leaf.lineTo(lx + 2, ly);
    leaf.close();
    canvas.drawPath(leaf, leafPaint);
  }

  // Fire effect
  if (plant.burning) {
    const fireHeight = 10 + plant.burnProgress * 15;
    for (let i = 0; i < 3; i++) {
      const fx = x + (Math.random() - 0.5) * 8;
      const fy = y - 15 - Math.random() * fireHeight;
      canvas.drawCircle(fx, fy, 3 + Math.random() * 3, paints.fire);
      canvas.drawCircle(fx, fy, 2 + Math.random() * 2, paints.fireYellow);
    }
  }
}

export function drawFence(canvas: SkCanvas) {
  const fenceY = L.fieldY + 8;
  const fenceHeight = 18;
  const postSpacing = 18;

  // Horizontal bars
  canvas.drawRect(Skia.XYWHRect(10, fenceY, L.W - 20, 1.5), paints.brown);
  canvas.drawRect(Skia.XYWHRect(10, fenceY + fenceHeight * 0.5, L.W - 20, 1.5), paints.brown);

  // Vertical posts
  for (let x = 15; x < L.W - 10; x += postSpacing) {
    canvas.drawRect(Skia.XYWHRect(x, fenceY - 3, 2, fenceHeight + 3), paints.darkBrown);
  }
}

export function drawVan(canvas: SkCanvas) {
  const x = L.vanX;
  const y = L.vanY;
  const w = L.vanWidth;
  const h = L.vanHeight;

  // Body
  canvas.drawRRect(
    Skia.RRectXY(Skia.XYWHRect(x, y, w, h), 4, 4),
    paints.vanWhite,
  );

  // Rasta stripes
  const stripeH = h * 0.12;
  canvas.drawRect(Skia.XYWHRect(x, y + h * 0.35, w, stripeH), paints.vanRed);
  canvas.drawRect(Skia.XYWHRect(x, y + h * 0.5, w, stripeH), paints.vanYellow);
  canvas.drawRect(Skia.XYWHRect(x, y + h * 0.65, w, stripeH), paints.vanGreen);

  // Windows
  canvas.drawRect(Skia.XYWHRect(x + w * 0.65, y + h * 0.1, w * 0.15, h * 0.3), paints.lightGray);
  canvas.drawRect(Skia.XYWHRect(x + w * 0.82, y + h * 0.1, w * 0.12, h * 0.3), paints.lightGray);

  // Front windshield
  canvas.drawRect(Skia.XYWHRect(x + 3, y + h * 0.1, w * 0.2, h * 0.3), paints.lightGray);

  // Wheels
  const wheelR = h * 0.22;
  canvas.drawCircle(x + w * 0.2, y + h + 1, wheelR, paints.blackPaint);
  canvas.drawCircle(x + w * 0.8, y + h + 1, wheelR, paints.blackPaint);
  canvas.drawCircle(x + w * 0.2, y + h + 1, wheelR * 0.5, paints.gray);
  canvas.drawCircle(x + w * 0.8, y + h + 1, wheelR * 0.5, paints.gray);
}

export function drawRasta(canvas: SkCanvas, aimAngle: number, activeEffects: ActiveEffect[] = [], weaponId: string = 'pistol') {
  const cx = L.playerX;
  const cy = L.playerY;

  // Power-up halo glow
  if (activeEffects.length > 0) {
    const effect = activeEffects[0]; // use first active effect color
    const pulse = 0.4 + 0.3 * Math.sin(Date.now() / 200); // pulsing opacity
    const haloPaint = Skia.Paint();
    haloPaint.setColor(Skia.Color(powerUpDef(effect.id).color));
    haloPaint.setAlphaf(pulse);
    haloPaint.setAntiAlias(true);
    haloPaint.setMaskFilter(Skia.MaskFilter.MakeBlur(0, 20, true));
    canvas.drawCircle(cx, cy - 15, 40, haloPaint);
  }

  // Body
  canvas.drawRect(Skia.XYWHRect(cx - 8, cy - 20, 16, 22), paints.rastaGreen);

  // Head
  canvas.drawCircle(cx, cy - 28, 10, paints.skinBrown);

  // Dreadlocks
  for (let i = -3; i <= 3; i++) {
    const dx = i * 3;
    const path = Skia.Path.Make();
    path.moveTo(cx + dx, cy - 22);
    path.lineTo(cx + dx + i * 0.5, cy - 10);
    canvas.drawPath(path, makeStrokePaint('#1A1A00', 2.5));
  }

  // Rasta hat (tam)
  canvas.drawOval(Skia.XYWHRect(cx - 12, cy - 40, 24, 14), paints.rastaRed);
  canvas.drawRect(Skia.XYWHRect(cx - 10, cy - 36, 20, 3), paints.rastaYellow);
  canvas.drawRect(Skia.XYWHRect(cx - 10, cy - 33, 20, 3), paints.rastaGreen);

  // Arms + Gun (rotate toward aim angle)
  canvas.save();
  canvas.translate(cx, cy - 15);
  canvas.rotate((aimAngle * 180) / Math.PI + 90, 0, 0);

  // Weapon sprites based on current weapon
  switch (weaponId) {
    case 'machinegun':
      // Compact SMG
      canvas.drawRect(Skia.XYWHRect(-2, -32, 4, 26), paints.gunMetal);
      canvas.drawRect(Skia.XYWHRect(-3, -35, 6, 4), paints.gunBarrel);
      canvas.drawRect(Skia.XYWHRect(-4, -10, 8, 6), paints.darkGray); // magazine
      canvas.drawCircle(0, -35, 2, paints.bullet);
      break;
    case 'aa_gun':
      // Heavy barrel
      canvas.drawRect(Skia.XYWHRect(-3, -38, 6, 32), paints.gunMetal);
      canvas.drawRect(Skia.XYWHRect(-4, -42, 8, 6), paints.gunBarrel);
      canvas.drawRect(Skia.XYWHRect(-5, -8, 10, 5), paints.darkGray); // receiver
      canvas.drawCircle(0, -42, 2.5, paints.bullet);
      break;
    case 'rocket':
      // Tube launcher
      canvas.drawRect(Skia.XYWHRect(-4, -36, 8, 30), paints.darkGray);
      canvas.drawRect(Skia.XYWHRect(-5, -40, 10, 6), paints.gunMetal);
      canvas.drawRect(Skia.XYWHRect(-3, -6, 6, 8), makePaint('#556B2F')); // grip
      canvas.drawCircle(0, -40, 3, paints.fire);
      break;
    case 'gatling':
      // Multi-barrel
      canvas.drawRect(Skia.XYWHRect(-4, -40, 3, 34), paints.gunMetal);
      canvas.drawRect(Skia.XYWHRect(-1, -40, 3, 34), paints.gunBarrel);
      canvas.drawRect(Skia.XYWHRect(2, -40, 3, 34), paints.gunMetal);
      canvas.drawRect(Skia.XYWHRect(-6, -8, 12, 6), paints.darkGray); // housing
      canvas.drawCircle(0, -40, 2, paints.bullet);
      break;
    case 'laser':
      // Sci-fi barrel
      canvas.drawRect(Skia.XYWHRect(-2, -38, 4, 32), makePaint('#4466AA'));
      canvas.drawRect(Skia.XYWHRect(-4, -42, 8, 6), makePaint('#6688CC'));
      canvas.drawRect(Skia.XYWHRect(-3, -10, 6, 4), paints.gunMetal);
      canvas.drawCircle(0, -42, 3, makePaint('#00CCFF')); // energy glow
      break;
    default: // pistol
      canvas.drawRect(Skia.XYWHRect(-2, -30, 4, 24), paints.gunMetal);
      canvas.drawRect(Skia.XYWHRect(-3, -33, 6, 4), paints.gunBarrel);
      canvas.drawCircle(0, -33, 1.5, paints.bullet);
      break;
  }

  canvas.restore();

  // Legs
  canvas.drawRect(Skia.XYWHRect(cx - 7, cy + 2, 5, 12), paints.darkBrown);
  canvas.drawRect(Skia.XYWHRect(cx + 2, cy + 2, 5, 12), paints.darkBrown);
}

export function drawHelicopter(canvas: SkCanvas, enemy: AirEnemy) {
  const { x, y, width, height, direction, flashTimer } = enemy;
  const isBlackhawk = enemy.type === 'blackhawk';
  const bodyPaint = flashTimer > 0 ? paints.flashWhite :
    (isBlackhawk ? paints.blackPaint : paints.heliGreen);

  canvas.save();
  canvas.translate(x, y);
  if (direction === 1) canvas.scale(-1, 1);

  // Body (drawn facing left: cockpit on left, tail on right)
  const bw = width * 0.6;
  const bh = height * 0.45;
  canvas.drawRRect(
    Skia.RRectXY(Skia.XYWHRect(-bw / 2, -bh / 2, bw, bh), 5, 5),
    bodyPaint,
  );

  // Tail (right side)
  const path = Skia.Path.Make();
  path.moveTo(bw / 2 - 3, 0);
  path.lineTo(width / 2, -height * 0.15);
  path.lineTo(width / 2, height * 0.15);
  path.close();
  canvas.drawPath(path, bodyPaint);

  // Tail rotor
  canvas.drawRect(Skia.XYWHRect(width / 2 - 3, -height * 0.3, 3, height * 0.15), paints.gray);

  // Cockpit window (left side)
  canvas.drawRRect(
    Skia.RRectXY(Skia.XYWHRect(-bw / 2 - 2, -bh / 3, bw * 0.3, bh * 0.5), 3, 3),
    paints.lightGray,
  );

  // Main rotor (animated) - always negative angle; scale(-1,1) auto-flips for direction=1
  const rotorAngle = -((Date.now() / 30) % 360);
  canvas.save();
  canvas.rotate(rotorAngle, 0, 0);
  canvas.drawRect(Skia.XYWHRect(-width * 0.55, -1.5, width * 1.1, 3), paints.gray);
  canvas.restore();

  // Skids
  canvas.drawRect(Skia.XYWHRect(-bw / 2, bh / 2, bw, 2), paints.darkGray);

  // Damage effects: smoke < 50% HP, fire + smoke < 25% HP
  const hpRatio = enemy.hp / enemy.maxHp;
  if (hpRatio < 0.5) {
    const t = Date.now() / 100;
    const intense = hpRatio < 0.25;
    const particles = intense ? 5 : 3;
    for (let i = 0; i < particles; i++) {
      const px = -bw * 0.2 + Math.sin(t + i * 2.1) * bw * 0.3;
      const py = -bh * 0.3 - Math.abs(Math.sin(t * 0.7 + i * 1.3)) * 12 - i * 4;
      // Smoke
      canvas.drawCircle(px, py, 3 + Math.sin(t + i) * 1.5, paints.smoke);
      // Fire (only when heavily damaged)
      if (intense) {
        const fx = px + Math.sin(t * 1.5 + i) * 3;
        const fy = py + 2;
        canvas.drawCircle(fx, fy, 2.5, paints.fire);
        canvas.drawCircle(fx, fy, 1.5, paints.fireYellow);
      }
    }
  }

  canvas.restore();
}

export function drawParatrooper(canvas: SkCanvas, para: Paratrooper) {
  const { x, y, landed, flashTimer } = para;
  const bodyPaint = flashTimer > 0 ? paints.flashWhite : paints.olive;

  if (!landed) {
    // Parachute
    const chutePath = Skia.Path.Make();
    chutePath.moveTo(x - 15, y - 25);
    chutePath.quadTo(x, y - 40, x + 15, y - 25);
    chutePath.lineTo(x + 12, y - 20);
    chutePath.quadTo(x, y - 30, x - 12, y - 20);
    chutePath.close();
    canvas.drawPath(chutePath, paints.parachuteWhite);
    canvas.drawPath(chutePath, paints.parachuteStroke);

    // Lines
    canvas.drawLine(x - 12, y - 20, x - 3, y - 5, paints.paraLines);
    canvas.drawLine(x + 12, y - 20, x + 3, y - 5, paints.paraLines);
  }

  // Body (soldier)
  // Head
  canvas.drawCircle(x, y - 8, 4, paints.skinBrown);
  // Helmet
  canvas.drawOval(Skia.XYWHRect(x - 5, y - 14, 10, 7), bodyPaint);
  // Torso (camo base)
  canvas.drawRect(Skia.XYWHRect(x - 5, y - 4, 10, 12), bodyPaint);
  // Camo stripes on torso
  canvas.drawRect(Skia.XYWHRect(x - 4, y - 2, 3, 2), paints.darkOlive);
  canvas.drawRect(Skia.XYWHRect(x + 1, y + 1, 4, 2), paints.darkOlive);
  canvas.drawRect(Skia.XYWHRect(x - 3, y + 5, 3, 2), paints.darkOlive);
  // Belt
  canvas.drawRect(Skia.XYWHRect(x - 5, y + 7, 10, 2), paints.blackPaint);
  // Legs
  canvas.drawRect(Skia.XYWHRect(x - 5, y + 9, 4, 7), paints.darkOlive);
  canvas.drawRect(Skia.XYWHRect(x + 1, y + 9, 4, 7), paints.darkOlive);
  // Boots
  canvas.drawRect(Skia.XYWHRect(x - 5, y + 14, 4, 2), paints.blackPaint);
  canvas.drawRect(Skia.XYWHRect(x + 1, y + 14, 4, 2), paints.blackPaint);
  // Backpack (small)
  canvas.drawRect(Skia.XYWHRect(x + 4, y - 3, 3, 6), paints.darkOlive);
}

export function drawA10(canvas: SkCanvas, enemy: AirEnemy) {
  const { x, y, width, height, direction, flashTimer } = enemy;
  const bodyPaint = flashTimer > 0 ? paints.flashWhite : paints.gray;

  canvas.save();
  canvas.translate(x, y);
  if (direction === -1) canvas.scale(-1, 1);

  // Fuselage
  canvas.drawRRect(
    Skia.RRectXY(Skia.XYWHRect(-width / 2, -height * 0.2, width, height * 0.4), 3, 3),
    bodyPaint,
  );

  // Wings
  canvas.drawRect(Skia.XYWHRect(-width * 0.15, -height / 2, width * 0.3, height), paints.darkGray);

  // Tail fins
  canvas.drawRect(Skia.XYWHRect(width * 0.35, -height * 0.4, width * 0.1, height * 0.3), paints.darkGray);
  canvas.drawRect(Skia.XYWHRect(width * 0.35, height * 0.1, width * 0.1, height * 0.3), paints.darkGray);

  // Cockpit
  canvas.drawOval(Skia.XYWHRect(-width / 2 - 3, -height * 0.12, width * 0.15, height * 0.24), paints.lightGray);

  // Engines (twin)
  canvas.drawOval(Skia.XYWHRect(width * 0.2, -height * 0.35, width * 0.15, height * 0.15), paints.darkGray);
  canvas.drawOval(Skia.XYWHRect(width * 0.2, height * 0.2, width * 0.15, height * 0.15), paints.darkGray);

  canvas.restore();
}

export function drawCropDuster(canvas: SkCanvas, enemy: AirEnemy) {
  const { x, y, width, height, direction, flashTimer } = enemy;
  const bodyPaint = flashTimer > 0 ? paints.flashWhite : paints.vanWhite;

  canvas.save();
  canvas.translate(x, y);
  if (direction === -1) canvas.scale(-1, 1);

  // Body
  canvas.drawRRect(
    Skia.RRectXY(Skia.XYWHRect(-width / 2, -height * 0.25, width * 0.7, height * 0.5), 2, 2),
    bodyPaint,
  );

  // Wings
  canvas.drawRect(Skia.XYWHRect(-width * 0.15, -height / 2, width * 0.35, height), paints.lightGray);

  // Tail
  canvas.drawRect(Skia.XYWHRect(width * 0.2, -height * 0.15, width * 0.3, height * 0.3), bodyPaint);

  // Spray
  for (let i = 0; i < 5; i++) {
    const sx = -width * 0.1 + Math.random() * width * 0.2;
    const sy = height * 0.3 + Math.random() * 10;
    const sprayPaint = makePaint(`rgba(200, 200, 100, ${0.3 + Math.random() * 0.3})`);
    canvas.drawCircle(sx, sy, 2 + Math.random() * 3, sprayPaint);
  }

  canvas.restore();
}

export function drawUFO(canvas: SkCanvas, enemy: AirEnemy) {
  const { x, y, width, height, flashTimer } = enemy;
  const bodyPaint = flashTimer > 0 ? paints.flashWhite : paints.ufoSilver;

  // Body (disc shape)
  canvas.drawOval(Skia.XYWHRect(x - width / 2, y - height * 0.3, width, height * 0.6), bodyPaint);

  // Dome
  canvas.drawOval(Skia.XYWHRect(x - width * 0.2, y - height * 0.6, width * 0.4, height * 0.5), paints.lightGray);

  // Lights (animated)
  const time = Date.now() / 200;
  for (let i = 0; i < 4; i++) {
    const angle = time + (i * Math.PI * 2) / 4;
    const lx = x + Math.cos(angle) * width * 0.3;
    const ly = y + Math.sin(angle) * height * 0.1;
    canvas.drawCircle(lx, ly, 2, paints.ufoGlow);
  }

  // Beam (when abducting)
  if (enemy.dropTimer > 2.5) {
    const beamPath = Skia.Path.Make();
    beamPath.moveTo(x - 5, y + height * 0.3);
    beamPath.lineTo(x - 20, y + 100);
    beamPath.lineTo(x + 20, y + 100);
    beamPath.lineTo(x + 5, y + height * 0.3);
    beamPath.close();
    const beamPaint = makePaint('rgba(0, 255, 0, 0.2)');
    canvas.drawPath(beamPath, beamPaint);
  }
}

export function drawBomb(canvas: SkCanvas, bomb: Bomb) {
  const { x, y } = bomb;
  const flashTimer = 0; // bombs never flash (no HP to lose)
  const bodyPaint = flashTimer > 0 ? paints.flashWhite : paints.bombGray;

  // Body
  canvas.drawOval(Skia.XYWHRect(x - 5, y - 8, 10, 16), bodyPaint);
  // Fins
  canvas.drawRect(Skia.XYWHRect(x - 7, y - 9, 14, 3), paints.bombRed);
  // Nose
  canvas.drawCircle(x, y + 8, 2, paints.bombRed);
}

export function drawBullet(canvas: SkCanvas, bullet: Bullet) {
  const { x, y, angle } = bullet;
  const radius = bullet.width / 2;
  // Trail
  const trailLen = radius * 3;
  const tx = x - Math.cos(angle) * trailLen;
  const ty = y - Math.sin(angle) * trailLen;
  canvas.drawLine(tx, ty, x, y, makeStrokePaint(COLORS.bulletTrail, Math.max(2, radius * 0.8)));
  // Head
  canvas.drawCircle(x, y, radius, paints.bullet);
}

export function drawExplosion(canvas: SkCanvas, exp: Explosion) {
  const progress = exp.timer / exp.maxTimer;
  const r = exp.radius * (0.3 + progress * 0.7);
  const alpha = 1 - progress;

  // Outer
  const outerPaint = makePaint(`rgba(255, 69, 0, ${alpha * 0.6})`);
  canvas.drawCircle(exp.x, exp.y, r, outerPaint);

  // Inner
  const innerPaint = makePaint(`rgba(255, 215, 0, ${alpha * 0.8})`);
  canvas.drawCircle(exp.x, exp.y, r * 0.5, innerPaint);

  // Sparks
  if (progress < 0.5) {
    for (let i = 0; i < 4; i++) {
      const ang = (i / 4) * Math.PI * 2 + progress * 3;
      const dist = r * 0.8 + progress * 10;
      const sx = exp.x + Math.cos(ang) * dist;
      const sy = exp.y + Math.sin(ang) * dist;
      canvas.drawCircle(sx, sy, 2, paints.explosionInner);
    }
  }
}

export function drawBoss(canvas: SkCanvas, enemy: AirEnemy) {
  const { x, y, width, height, direction, flashTimer, hp, maxHp } = enemy;
  const bodyPaint = flashTimer > 0 ? paints.flashWhite : makePaint('#333333');

  canvas.save();
  canvas.translate(x, y);
  if (direction === 1) canvas.scale(-1, 1);

  // Main fuselage (large military transport)
  const bw = width * 0.7;
  const bh = height * 0.4;
  canvas.drawRRect(
    Skia.RRectXY(Skia.XYWHRect(-bw / 2, -bh / 2, bw, bh), 8, 8),
    bodyPaint,
  );

  // Cockpit (front, red tint)
  const cockpitPaint = flashTimer > 0 ? paints.flashWhite : makePaint('#881111');
  canvas.drawRRect(
    Skia.RRectXY(Skia.XYWHRect(-bw / 2 - 8, -bh / 3, bw * 0.25, bh * 0.6), 4, 4),
    cockpitPaint,
  );

  // Tail section
  const tailPath = Skia.Path.Make();
  tailPath.moveTo(bw / 2 - 5, 0);
  tailPath.lineTo(width / 2 + 5, -height * 0.25);
  tailPath.lineTo(width / 2 + 5, height * 0.15);
  tailPath.close();
  canvas.drawPath(tailPath, bodyPaint);

  // Tail fin
  canvas.drawRect(Skia.XYWHRect(width / 2 - 2, -height * 0.45, 5, height * 0.25), makePaint('#444444'));

  // Two rotors (front and back)
  const rotorAngle1 = (direction === 1 ? 1 : -1) * ((Date.now() / 20) % 360);
  const rotorAngle2 = (direction === 1 ? 1 : -1) * ((Date.now() / 20 + 180) % 360);

  // Front rotor
  canvas.save();
  canvas.translate(-bw * 0.25, -bh / 2 - 3);
  canvas.rotate(rotorAngle1, 0, 0);
  canvas.drawRect(Skia.XYWHRect(-width * 0.35, -2, width * 0.7, 4), paints.gray);
  canvas.restore();

  // Rear rotor
  canvas.save();
  canvas.translate(bw * 0.25, -bh / 2 - 3);
  canvas.rotate(rotorAngle2, 0, 0);
  canvas.drawRect(Skia.XYWHRect(-width * 0.35, -2, width * 0.7, 4), paints.gray);
  canvas.restore();

  // Engine nacelles
  canvas.drawOval(Skia.XYWHRect(-bw / 2 + 5, bh / 2 - 3, 15, 8), makePaint('#555555'));
  canvas.drawOval(Skia.XYWHRect(bw / 2 - 20, bh / 2 - 3, 15, 8), makePaint('#555555'));

  // Warning stripes
  const stripePaint = makePaint('#FF4400');
  canvas.drawRect(Skia.XYWHRect(-bw / 2, -bh / 2, bw, 3), stripePaint);
  canvas.drawRect(Skia.XYWHRect(-bw / 2, bh / 2 - 3, bw, 3), stripePaint);

  canvas.restore();

  // HP bar below boss
  const barWidth = width * 0.8;
  const barHeight = 6;
  const barX = x - barWidth / 2;
  const barY = y + height / 2 + 8;
  const hpRatio = hp / maxHp;
  // Background
  canvas.drawRect(Skia.XYWHRect(barX, barY, barWidth, barHeight), makePaint('#440000'));
  // HP fill
  const hpColor = hpRatio > 0.5 ? '#44FF44' : hpRatio > 0.25 ? '#FFAA00' : '#FF2222';
  canvas.drawRect(Skia.XYWHRect(barX, barY, barWidth * hpRatio, barHeight), makePaint(hpColor));
  // Border
  canvas.drawRect(Skia.XYWHRect(barX, barY, barWidth, barHeight), makeStrokePaint('#FFFFFF', 1));
}

export function drawCombo(canvas: SkCanvas, text: string, multText: string) {
  const font = matchFont({ fontFamily: 'monospace', fontSize: 20, fontWeight: 'bold' });
  const smallFont = matchFont({ fontFamily: 'monospace', fontSize: 14, fontWeight: 'bold' });

  const pulse = 1 + Math.sin(Date.now() / 100) * 0.15;
  const comboX = L.W / 2;
  const comboY = L.hudHeight + 25;

  canvas.save();
  canvas.translate(comboX, comboY);
  canvas.scale(pulse, pulse);

  // Glow
  const glowPaint = Skia.Paint();
  glowPaint.setColor(Skia.Color('#FFD700'));
  glowPaint.setAlphaf(0.6);
  glowPaint.setMaskFilter(Skia.MaskFilter.MakeBlur(0, 10, true));
  canvas.drawCircle(0, 0, 30, glowPaint);

  // Text
  const textPaint = makePaint('#FFD700');
  const w = font.measureText(text).width;
  canvas.drawText(text, -w / 2, 5, textPaint, font);

  // Multiplier below
  const multPaint = makePaint('#FF8800');
  const mw = smallFont.measureText(multText).width;
  canvas.drawText(multText, -mw / 2, 20, multPaint, smallFont);

  canvas.restore();
}

export function drawBossWarning(canvas: SkCanvas, warning: string, bossName: string) {
  const pulse = 0.5 + 0.5 * Math.sin(Date.now() / 200);
  const font = matchFont({ fontFamily: 'monospace', fontSize: 24, fontWeight: 'bold' });
  const smallFont = matchFont({ fontFamily: 'monospace', fontSize: 16, fontWeight: 'bold' });

  // Dark overlay
  const overlayPaint = Skia.Paint();
  overlayPaint.setColor(Skia.Color('#000000'));
  overlayPaint.setAlphaf(0.3 * pulse);
  canvas.drawRect(Skia.XYWHRect(0, L.H * 0.35, L.W, L.H * 0.15), overlayPaint);

  // WARNING text
  const warningPaint = makePaint(`rgba(255, 0, 0, ${pulse})`);
  const warnText = `⚠ ${warning} ⚠`;
  const ww = font.measureText(warnText).width;
  canvas.drawText(warnText, L.W / 2 - ww / 2, L.H * 0.41, warningPaint, font);

  // Boss name
  const namePaint = makePaint('#FFD700');
  const nw = smallFont.measureText(bossName).width;
  canvas.drawText(bossName, L.W / 2 - nw / 2, L.H * 0.47, namePaint, smallFont);
}

export function drawPowerUp(canvas: SkCanvas, pu: PowerUpOrb) {
  const { x, y, width, height } = pu;
  const { color } = powerUpDef(pu.powerUpId);

  // Glow effect (pulsing)
  const pulse = 0.6 + Math.sin(Date.now() / 200) * 0.4;
  const glowPaint = Skia.Paint();
  glowPaint.setColor(Skia.Color(color));
  glowPaint.setAlphaf(pulse * 0.4);
  canvas.drawCircle(x, y, width * 0.8, glowPaint);

  // Main body (colored circle)
  const bodyPaint = makePaint(color);
  canvas.drawCircle(x, y, width / 2, bodyPaint);

  // White inner circle
  const innerPaint = Skia.Paint();
  innerPaint.setColor(Skia.Color('#FFFFFF'));
  innerPaint.setAlphaf(0.6);
  canvas.drawCircle(x, y, width / 2 - 4, innerPaint);

  // Star/sparkle on top
  const t = Date.now() / 150;
  const sparkPaint = makePaint('#FFFFFF');
  for (let i = 0; i < 4; i++) {
    const angle = t + (i * Math.PI / 2);
    const sx = x + Math.cos(angle) * (width * 0.6);
    const sy = y + Math.sin(angle) * (height * 0.6);
    canvas.drawCircle(sx, sy, 2, sparkPaint);
  }
}

export function drawShieldIndicator(canvas: SkCanvas, plant: Plant) {
  // Small blue circle above shielded plant
  const shieldPaint = Skia.Paint();
  shieldPaint.setColor(Skia.Color('#00FF88'));
  shieldPaint.setAlphaf(0.5 + Math.sin(Date.now() / 300) * 0.3);
  canvas.drawCircle(plant.x, plant.y - 20, 8, shieldPaint);
}

export function drawZionWall(canvas: SkCanvas, hitsRemaining: number) {
  const wallY = L.H * 0.55;
  const pulse = 0.4 + 0.2 * Math.sin(Date.now() / 150);
  const alpha = pulse * (hitsRemaining / 3); // fades as hits decrease
  const wallPaint = Skia.Paint();
  wallPaint.setColor(Skia.Color('#00DDFF'));
  wallPaint.setAlphaf(alpha);
  wallPaint.setStyle(PaintStyle.Fill);
  // Draw a horizontal energy bar across the screen
  canvas.drawRect(Skia.XYWHRect(0, wallY - 2, L.W, 4), wallPaint);
  // Glow effect
  const glowPaint = Skia.Paint();
  glowPaint.setColor(Skia.Color('#00DDFF'));
  glowPaint.setAlphaf(alpha * 0.4);
  glowPaint.setMaskFilter(Skia.MaskFilter.MakeBlur(0, 15, true));
  canvas.drawRect(Skia.XYWHRect(0, wallY - 6, L.W, 12), glowPaint);
  // Hit counter
  for (let i = 0; i < hitsRemaining; i++) {
    const dotPaint = Skia.Paint();
    dotPaint.setColor(Skia.Color('#00FFFF'));
    dotPaint.setAlphaf(0.8);
    canvas.drawCircle(L.W / 2 - 15 + i * 15, wallY - 10, 4, dotPaint);
  }
}

export function drawBabylonTrap(canvas: SkCanvas, charges: number) {
  // Draw trap indicators near the ground
  const trapPaint = Skia.Paint();
  trapPaint.setColor(Skia.Color('#CC4400'));
  const pulse = 0.5 + 0.3 * Math.sin(Date.now() / 200);
  trapPaint.setAlphaf(pulse);
  // Draw small mine icons spread across the field
  const spacing = L.W / (charges + 1);
  for (let i = 0; i < charges; i++) {
    const tx = spacing * (i + 1);
    const ty = L.groundY - 5;
    canvas.drawCircle(tx, ty, 5, trapPaint);
    // Cross on top
    const crossPaint = makeStrokePaint('#FF6600', 1.5);
    canvas.drawLine(tx - 3, ty - 3, tx + 3, ty + 3, crossPaint);
    canvas.drawLine(tx - 3, ty + 3, tx + 3, ty - 3, crossPaint);
  }
}
