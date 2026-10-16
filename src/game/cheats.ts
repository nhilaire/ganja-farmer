// Hidden cheats kept from the source: 3 taps within 800 ms in a top corner.
import { Layout } from './layout';

export type Cheat = 'skipLevel' | 'restorePlants';

export const CHEAT_TAP_WINDOW_MS = 800;

export class CheatDetector {
  private left: number[] = [];
  private right: number[] = [];

  constructor(private layout: Layout) {}

  tap(x: number, y: number, nowMs: number): Cheat | null {
    const { W, H } = this.layout;
    const zoneW = W * 0.12;
    const zoneH = H * 0.15;
    if (y >= zoneH) return null;
    if (x < zoneW) {
      this.left = [...this.left, nowMs].filter((t) => nowMs - t < CHEAT_TAP_WINDOW_MS);
      if (this.left.length >= 3) {
        this.left = [];
        return 'skipLevel';
      }
    } else if (x > W - zoneW) {
      this.right = [...this.right, nowMs].filter((t) => nowMs - t < CHEAT_TAP_WINDOW_MS);
      if (this.right.length >= 3) {
        this.right = [];
        return 'restorePlants';
      }
    }
    return null;
  }
}
