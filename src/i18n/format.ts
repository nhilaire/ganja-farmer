// English, arcade-style formatting: zero-padded counters as in the source HUD (`Score: 0001500`, `Level: 03`).
export function pad(value: number, width: number): string {
  return String(Math.max(0, Math.floor(value))).padStart(width, '0');
}
