// Enemy spawning and level completion, from the source `engine/WaveManager.ts`.
import { isBossLevel, SpawnType } from './enemies';
import { LevelConfig, levelConfig, WaveConfig } from './levels';
import { Rng } from './rng';

export interface WaveWorld {
  activeHelicopters(): number; // helicopters + Black Hawks alive
  enemyCount(): number; // air enemies + paratroopers + bombs alive
  spawn(type: SpawnType): void;
  spawnBoss(): void;
}

interface ActiveSpawn {
  wave: WaveConfig;
  spawned: number;
  timer: number; // ms
}

export class WaveManager {
  config: LevelConfig = levelConfig(1);
  heliKills = 0;
  bossSpawned = false;
  private spawns: ActiveSpawn[] = [];
  private levelTimer = 0; // ms
  private respawnTimer = 0; // ms
  private complete = false;

  constructor(private rng: Rng) {}

  start(level: number): void {
    this.config = levelConfig(level);
    this.spawns = this.config.waves.map((wave) => ({ wave, spawned: 0, timer: 0 }));
    this.levelTimer = 0;
    this.respawnTimer = 0;
    this.heliKills = 0;
    this.bossSpawned = false;
    this.complete = false;
  }

  onHeliKilled(): void {
    this.heliKills++;
  }

  get isBossLevel(): boolean {
    return isBossLevel(this.config.level);
  }

  // `dt` in seconds, already scaled by Holy Smoke / Bullet Time. Returns true once the level is complete.
  update(dt: number, world: WaveWorld): boolean {
    if (this.complete) return true;
    const ms = dt * 1000;
    this.levelTimer += ms;
    const { config } = this;

    for (const s of this.spawns) {
      if (this.levelTimer < s.wave.delay) continue;
      if (s.spawned >= s.wave.spawn.count) continue;
      const isHeli = s.wave.spawn.type === 'helicopter' || s.wave.spawn.type === 'blackhawk';
      // A blocked helicopter spawn does not advance its interval timer.
      if (isHeli && world.activeHelicopters() >= config.maxHelisOnScreen) continue;
      s.timer += ms;
      if (s.timer >= s.wave.spawn.interval || s.spawned === 0) {
        s.timer = 0;
        world.spawn(s.wave.spawn.type);
        s.spawned++;
      }
    }

    if (this.heliKills < config.requiredHeliKills && world.activeHelicopters() < config.activeHeliTarget) {
      this.respawnTimer += ms;
      if (this.respawnTimer >= config.respawnInterval) {
        this.respawnTimer = 0;
        world.spawn(config.level >= 5 && this.rng() > 0.5 ? 'blackhawk' : 'helicopter');
      }
    }

    if (this.isBossLevel && this.heliKills >= config.requiredHeliKills && !this.bossSpawned) {
      world.spawnBoss();
      this.bossSpawned = true;
    }

    const quotaDone = this.isBossLevel ? this.bossSpawned : this.heliKills >= config.requiredHeliKills;
    if (quotaDone && world.enemyCount() === 0) this.complete = true;
    return this.complete;
  }
}
