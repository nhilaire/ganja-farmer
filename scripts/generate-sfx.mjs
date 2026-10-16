#!/usr/bin/env node
// Synthesises the game's short sound effects into assets/sfx/*.wav (mono, 22.05 kHz, 16-bit PCM).
// No samples, no third-party audio: every sound is computed here, so the files carry no external licence.
// Deterministic (seeded noise): re-running it produces identical files. Usage: node scripts/generate-sfx.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const RATE = 22050;
const OUT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'assets', 'sfx');

let seed = 12345;
const noise = () => {
  seed = (seed * 1103515245 + 12345) & 0x7fffffff;
  return (seed / 0x7fffffff) * 2 - 1;
};

function render(seconds, fn) {
  const n = Math.round(seconds * RATE);
  const out = new Float32Array(n);
  for (let i = 0; i < n; i++) out[i] = fn(i / RATE, i / n);
  return out;
}

// One-pole low-pass filter, for softer noise.
function lowpass(samples, amount) {
  let y = 0;
  return samples.map((x) => (y += amount * (x - y)));
}

function tone(freq, t) {
  return Math.sin(2 * Math.PI * freq * t);
}

function square(freq, t) {
  return Math.sign(Math.sin(2 * Math.PI * freq * t)) * 0.6;
}

const sounds = {
  // Pistol, machine gun, gatling: a short dry crack.
  shot_light: () => lowpass(render(0.07, (t, p) => noise() * (1 - p) ** 3), 0.6),
  // 20mm AA gun: a heavier thump with a low tone.
  shot_heavy: () => render(0.14, (t, p) => (noise() * 0.6 + tone(110 - 60 * p, t) * 0.7) * (1 - p) ** 2),
  // Rocket launcher: a rising whoosh.
  shot_rocket: () => lowpass(render(0.3, (t, p) => noise() * Math.sin(Math.PI * p) * 0.9), 0.35),
  // Laser cannon: a falling zap.
  shot_laser: () => render(0.16, (t, p) => square(1400 - 1100 * p, t) * (1 - p) ** 1.5 * 0.7),
  // Explosion: low rumbling noise with a long decay.
  explosion: () => lowpass(render(0.6, (t, p) => noise() * (1 - p) ** 2.5), 0.12),
  // A plant catches fire: a crackle.
  fire: () => render(0.35, (t, p) => (noise() > 0.84 ? noise() : noise() * 0.15) * (1 - p) * 0.8),
  // Power-up: a quick rising arpeggio.
  powerup: () => render(0.36, (t, p) => {
    const step = Math.min(3, Math.floor(p * 4));
    return tone([523, 659, 784, 1047][step], t) * (1 - (p * 4 - step)) * 0.6;
  }),
  // Boss incoming: a two-tone alarm.
  boss: () => render(1.2, (t, p) => square(Math.floor(t * 4) % 2 ? 440 : 330, t) * 0.45 * (1 - p * 0.3)),
  // Jah blessing: a soft major chord swelling and fading.
  jah: () =>
    render(1.6, (t, p) => {
      const env = Math.sin(Math.PI * p);
      return (tone(392, t) + tone(494, t) + tone(587, t) + tone(784, t) * 0.5) * env * 0.18;
    }),
  // Game over: three descending notes.
  gameover: () => render(1.2, (t, p) => {
    const step = Math.min(2, Math.floor(p * 3));
    return square([392, 330, 262][step], t) * (1 - (p * 3 - step) * 0.5) * 0.4 * (1 - p * 0.5);
  }),
};

function toWav(samples) {
  const data = Buffer.alloc(samples.length * 2);
  samples.forEach((s, i) => data.writeInt16LE(Math.round(Math.max(-1, Math.min(1, s)) * 32767), i * 2));
  const header = Buffer.alloc(44);
  header.write('RIFF', 0);
  header.writeUInt32LE(36 + data.length, 4);
  header.write('WAVE', 8);
  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20); // PCM
  header.writeUInt16LE(1, 22); // mono
  header.writeUInt32LE(RATE, 24);
  header.writeUInt32LE(RATE * 2, 28);
  header.writeUInt16LE(2, 32);
  header.writeUInt16LE(16, 34);
  header.write('data', 36);
  header.writeUInt32LE(data.length, 40);
  return Buffer.concat([header, data]);
}

fs.mkdirSync(OUT, { recursive: true });
for (const [name, make] of Object.entries(sounds)) {
  seed = 12345;
  const file = path.join(OUT, `${name}.wav`);
  fs.writeFileSync(file, toWav(make()));
  console.log(`${name}.wav ${fs.statSync(file).size} bytes`);
}
