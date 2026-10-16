// Fingers on the playfield (AC-40): firing stays on while at least one finger is down, and the aim follows the
// last finger placed that is still down. The source stopped firing as soon as any finger was lifted.
export interface Aim {
  firing: boolean;
  aim: { x: number; y: number } | null;
}

export class TouchTracker {
  // Insertion order = order the fingers were placed; the last entry is the aiming finger.
  private fingers = new Map<number, { x: number; y: number }>();

  down(id: number, x: number, y: number): Aim {
    this.fingers.delete(id);
    this.fingers.set(id, { x, y });
    return this.state();
  }

  move(id: number, x: number, y: number): Aim {
    const finger = this.fingers.get(id);
    if (finger) {
      finger.x = x;
      finger.y = y;
    }
    return this.state();
  }

  up(id: number): Aim {
    this.fingers.delete(id);
    return this.state();
  }

  clear(): Aim {
    this.fingers.clear();
    return this.state();
  }

  private state(): Aim {
    const last = [...this.fingers.values()].pop();
    return last ? { firing: true, aim: { ...last } } : { firing: false, aim: null };
  }
}
