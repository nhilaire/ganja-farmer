// Cannabis leaf drawn with Skia, used for the home menu buttons (ported from the source `components/GanjaLeaf.tsx`).
import { Canvas, Path, Skia } from '@shopify/react-native-skia';
import { Fragment } from 'react';

interface GanjaLeafProps {
  size: number;
  color?: string;
  strokeColor?: string;
}

export function GanjaLeaf({ size, color = '#5B9B2A', strokeColor = '#1a3d0a' }: GanjaLeafProps) {
  const cx = size / 2;
  const cy = size * 0.52;
  const s = size / 100;

  // Cannabis foliole: narrow, pointed, with serrated edges
  const makeFolliole = (length: number, maxWidth: number, angleDeg: number) => {
    const path = Skia.Path.Make();
    const hw = maxWidth / 2;
    const serrSize = 1.8 * s;
    const serrCount = Math.max(3, Math.floor(length / (6 * s)));

    path.moveTo(0, 0);

    // Left edge with serrations
    for (let i = 1; i <= serrCount; i++) {
      const t = i / (serrCount + 1);
      // Width profile: widest at 30%, tapers to point
      const w = hw * Math.sin(t * Math.PI * 0.85) * (1 - t * 0.15);
      const yp = -length * t;
      // Serration out
      path.lineTo(-w - serrSize, yp + length / serrCount * 0.3);
      // Serration in
      path.lineTo(-w + serrSize * 0.3, yp);
    }
    // Tip
    path.lineTo(-1 * s, -length * 0.95);
    path.lineTo(0, -length);
    path.lineTo(1 * s, -length * 0.95);

    // Right edge with serrations (mirror)
    for (let i = serrCount; i >= 1; i--) {
      const t = i / (serrCount + 1);
      const w = hw * Math.sin(t * Math.PI * 0.85) * (1 - t * 0.15);
      const yp = -length * t;
      path.lineTo(w - serrSize * 0.3, yp);
      path.lineTo(w + serrSize, yp + length / serrCount * 0.3);
    }
    path.close();

    const rad = (angleDeg * Math.PI) / 180;
    const matrix = Skia.Matrix();
    matrix.translate(cx, cy);
    matrix.rotate(rad);
    path.transform(matrix);
    return path;
  };

  // Central vein for each foliole
  const makeVein = (length: number, angleDeg: number) => {
    const path = Skia.Path.Make();
    path.moveTo(0, 2 * s);
    path.lineTo(0, -length * 0.92);
    const rad = (angleDeg * Math.PI) / 180;
    const matrix = Skia.Matrix();
    matrix.translate(cx, cy);
    matrix.rotate(rad);
    path.transform(matrix);
    return path;
  };

  // Side veins (short lines branching off main vein)
  const makeSideVeins = (length: number, angleDeg: number) => {
    const path = Skia.Path.Make();
    const count = Math.max(2, Math.floor(length / (10 * s)));
    for (let i = 1; i <= count; i++) {
      const t = i / (count + 1);
      const yp = -length * t;
      const veinLen = length * 0.15 * Math.sin(t * Math.PI * 0.8);
      // Left side vein
      path.moveTo(0, yp);
      path.lineTo(-veinLen, yp - veinLen * 0.5);
      // Right side vein
      path.moveTo(0, yp);
      path.lineTo(veinLen, yp - veinLen * 0.5);
    }
    const rad = (angleDeg * Math.PI) / 180;
    const matrix = Skia.Matrix();
    matrix.translate(cx, cy);
    matrix.rotate(rad);
    path.transform(matrix);
    return path;
  };

  // Stem (short)
  const stemPath = Skia.Path.Make();
  stemPath.moveTo(cx - 1.5 * s, cy);
  stemPath.lineTo(cx - 2 * s, cy + 15 * s);
  stemPath.lineTo(cx + 2 * s, cy + 15 * s);
  stemPath.lineTo(cx + 1.5 * s, cy);
  stemPath.close();

  // 7 folioles: like real cannabis leaf
  // Center is tallest, pairs get shorter and wider angle
  const folioles = [
    { length: 40 * s, width: 10 * s, angle: 0 },       // center
    { length: 35 * s, width: 9.5 * s, angle: -28 },    // inner left
    { length: 35 * s, width: 9.5 * s, angle: 28 },     // inner right
    { length: 28 * s, width: 8.5 * s, angle: -56 },    // middle left
    { length: 28 * s, width: 8.5 * s, angle: 56 },     // middle right
    { length: 18 * s, width: 7 * s, angle: -82 },      // outer left
    { length: 18 * s, width: 7 * s, angle: 82 },       // outer right
  ];

  // Colors
  const colors = [
    color,       // center
    color,       // inner
    color,
    '#4F8C22',   // middle (slightly darker)
    '#4F8C22',
    '#3D7518',   // outer (darkest)
    '#3D7518',
  ];

  // Paints
  const makeFill = (c: string) => {
    const p = Skia.Paint();
    p.setColor(Skia.Color(c));
    p.setStyle(0);
    return p;
  };

  const strokeP = Skia.Paint();
  strokeP.setColor(Skia.Color(strokeColor));
  strokeP.setStyle(1);
  strokeP.setStrokeWidth(1.2 * s);

  const veinP = Skia.Paint();
  veinP.setColor(Skia.Color('#2a5510'));
  veinP.setStyle(1);
  veinP.setStrokeWidth(0.8 * s);

  const sideVeinP = Skia.Paint();
  sideVeinP.setColor(Skia.Color('#2a5510'));
  sideVeinP.setStyle(1);
  sideVeinP.setStrokeWidth(0.5 * s);

  const stemP = Skia.Paint();
  stemP.setColor(Skia.Color('#2a5510'));
  stemP.setStyle(0);

  const stemStrokeP = Skia.Paint();
  stemStrokeP.setColor(Skia.Color(strokeColor));
  stemStrokeP.setStyle(1);
  stemStrokeP.setStrokeWidth(1 * s);

  // Render order: outer first (back), center last (front)
  const order = [5, 6, 3, 4, 1, 2, 0];

  return (
    <Canvas style={{ width: size, height: size }}>
      {/* Stem */}
      <Path path={stemPath} paint={stemP} />
      <Path path={stemPath} paint={stemStrokeP} />

      {/* Folioles */}
      {order.map((idx) => {
        const f = folioles[idx];
        return (
          <Fragment key={idx}>
            <Path path={makeFolliole(f.length, f.width, f.angle)} paint={makeFill(colors[idx])} />
            <Path path={makeFolliole(f.length, f.width, f.angle)} paint={strokeP} />
            <Path path={makeVein(f.length, f.angle)} paint={veinP} />
            <Path path={makeSideVeins(f.length, f.angle)} paint={sideVeinP} />
          </Fragment>
        );
      })}
    </Canvas>
  );
}
