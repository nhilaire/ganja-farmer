// Palette of the source game (rasta colours, field greens) plus the factory spacing scale.
export const colors = {
  background: '#1a4d1a',
  surface: '#0f2e0f',
  text: '#F5F5F5',
  muted: '#CCDDCC',
  accent: '#FFD700',
  accentText: '#1a1a1a',
  danger: '#CC0000',
  rastaRed: '#CC0000',
  rastaYellow: '#FFD700',
  rastaGreen: '#006400',
  hudBg: '#8B0000',
  hudText: '#FFD700',
  effect: '#00FF88',
  overlay: 'rgba(0, 0, 0, 0.75)',
  black: '#000000',
} as const;

export const spacing = { xs: 4, sm: 8, md: 16, lg: 24, xl: 40 } as const;

export const font = { title: 34, heading: 24, body: 17, small: 14 } as const;
