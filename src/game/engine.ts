// Ganja Farmer game engine: pure TypeScript port of the source `engine/GameEngine.ts`, `EntityManager.ts` and the
// level flow of `components/Game.tsx`. The engine owns the whole game state (deviation D1: one plant state).
// It is stepped with `update(dt)`, draws randomness from an injected Rng and never reads the clock.
// Deviations from the source (docs/PRD.md "Deliberate deviations"): D1 single plant state, D2 boss killed by
// Jah Lightning counts as defeated, D3 speed decay changes movement, D4 shield blocks a crop duster for its pass,
// D5 shields / trap / wall carry over between levels.
import { AirType, bossForLevel, BURN_SECONDS, ENEMIES, PARATROOPER_FALL_SPEED, SOLDIER_FLEE_SPEED, SOLDIER_WALK_SPEED, SpawnType } from './enemies';
import { jahDraw } from './jah';
import { Layout, PLANT_COUNT, plantX } from './layout';
import { levelBonus } from './levels';
import { POWER_UP_FALL_SPEED, POWER_UP_SIZE, POWER_UPS, PowerUpId, powerUpDef } from './powerups';
import { randomInt, randomRange, Rng } from './rng';
import { ActiveEffect, AirEnemy, Bomb, Bullet, Explosion, GameEvent, GameOverCause, Paratrooper, Phase, Plant, PowerUpOrb } from './types';
import { WaveManager } from './waves';
import { WeaponDef, weaponForLevel } from './weapons';

export const COMBO_WINDOW = 2.0;
export const LEVEL_END_DELAY = 1.5;
export const CHEAT_END_DELAY = 0.5;
export const BOMB_BLAST_RADIUS = 50;
export const CROPDUSTER_REACH = 20;
export const CROPDUSTER_MAX_ATTACKS = 5;
export const UFO_ABDUCTION_INTERVAL = 3;
export const ZION_WALL_HITS = 3;
export const BABYLON_TRAP_CHARGES = 3;
export const SPREAD_SHOT_ANGLE = 0.15;
export const DUPPY_INTERVAL = 0.5;
export const ROOTS_INTERVAL = 3;

const overlaps = (a: { x: number; y: number; width: number; height: number }, b: { x: number; y: number; width: number; height: number }) =>
  a.x - a.width / 2 < b.x - b.width / 2 + b.width &&
  a.x - a.width / 2 + a.width > b.x - b.width / 2 &&
  a.y - a.height / 2 < b.y - b.height / 2 + b.height &&
  a.y - a.height / 2 + a.height > b.y - b.height / 2;

const isHeli = (e: AirEnemy) => e.type === 'helicopter' || e.type === 'blackhawk';

export class GameEngine {
  readonly waves: WaveManager;

  // Game state
  level = 1;
  score = 0;
  kills = 0;
  phase: Phase = 'playing';
  paused = false;
  plants: Plant[] = [];
  weapon: WeaponDef = weaponForLevel(1);
  playTime = 0; // seconds of active play, whole game (pauses and transitions excluded)
  time = 0; // seconds since the level started (drives wobble animations)

  // Entities
  bullets: Bullet[] = [];
  airEnemies: AirEnemy[] = [];
  paratroopers: Paratrooper[] = [];
  bombs: Bomb[] = [];
  explosions: Explosion[] = [];
  powerUps: PowerUpOrb[] = [];

  // Firing
  firing = false;
  aimAngle = -Math.PI / 2;
  private fireTimer = 0;

  // Power-ups
  activeEffects: ActiveEffect[] = [];
  plantShields: boolean[] = new Array(PLANT_COUNT).fill(false);
  babylonTrapCharges = 0;
  zionWallHits = 0;
  private powerUpTimers: number[] = [];
  private powerUpSpawnCount = 0;
  private rootsTimer = 0;
  private duppyTimer = 0;

  // Combo (air enemies killed by bullets)
  comboCount = 0;
  comboMultiplier = 1;
  maxCombo = 0;
  private comboTimer = 0;

  // Level flow
  bossActive = false;
  private levelEndTimer = 0;
  private lastCause: GameOverCause = 'soldier';
  private nextId = 1;
  private events: GameEvent[] = [];

  constructor(
    readonly layout: Layout,
    private rng: Rng,
  ) {
    this.waves = new WaveManager(rng);
    this.newGame();
  }

  // ---------- Game flow ----------

  newGame(): void {
    this.level = 1;
    this.score = 0;
    this.kills = 0;
    this.playTime = 0;
    this.maxCombo = 0;
    this.lastCause = 'soldier';
    this.plants = Array.from({ length: PLANT_COUNT }, (_, index) => ({
      index,
      x: plantX(this.layout, index),
      y: this.layout.fieldY,
      alive: true,
      burning: false,
      burnProgress: 0,
      burningBy: null,
    }));
    this.plantShields = new Array(PLANT_COUNT).fill(false);
    this.babylonTrapCharges = 0;
    this.zionWallHits = 0;
    this.events = [];
    this.startLevel(1);
  }

  startLevel(level: number): void {
    this.level = level;
    this.weapon = weaponForLevel(level);
    this.phase = 'playing';
    this.time = 0;
    this.bullets = [];
    this.airEnemies = [];
    this.paratroopers = [];
    this.bombs = [];
    this.explosions = [];
    this.powerUps = [];
    this.waves.start(level);
    this.levelEndTimer = 0;
    this.fireTimer = 0;
    // Plants still burning when the previous level ended survive (source: fresh engine per level).
    for (const p of this.plants) {
      p.burning = false;
      p.burnProgress = 0;
      p.burningBy = null;
    }
    this.activeEffects = [];
    this.powerUpTimers = [randomRange(this.rng, 20, 40), randomRange(this.rng, 90, 120)];
    this.powerUpSpawnCount = 0;
    this.rootsTimer = 0;
    this.duppyTimer = 0;
    this.comboCount = 0;
    this.comboMultiplier = 1;
    this.comboTimer = 0;
    this.bossActive = false;
    this.emit({ type: 'levelStart', level });
  }

  // Called by the UI after the Jah blessing and the transition screen.
  nextLevel(): void {
    if (this.phase === 'levelComplete') this.startLevel(this.level + 1);
  }

  get alivePlants(): number {
    return this.plants.reduce((n, p) => n + (p.alive ? 1 : 0), 0);
  }

  get bossLevel(): boolean {
    return this.waves.isBossLevel;
  }

  drainEvents(): GameEvent[] {
    const out = this.events;
    this.events = [];
    return out;
  }

  setFiring(firing: boolean, angle?: number): void {
    this.firing = firing;
    if (angle !== undefined) this.aimAngle = angle;
  }

  aimAt(x: number, y: number): void {
    this.aimAngle = Math.atan2(y - this.layout.playerY, x - this.layout.playerX);
  }

  // Cheat (top-left triple tap): clear the sky and complete the level after 0.5 s.
  forceComplete(): void {
    if (this.phase !== 'playing') return;
    this.bullets = [];
    this.airEnemies = [];
    this.paratroopers = [];
    this.bombs = [];
    this.explosions = [];
    this.powerUps = [];
    this.phase = 'levelEnding';
    this.levelEndTimer = CHEAT_END_DELAY;
  }

  // Restores up to `count` random dead plants (Jah, Roots of Zion, cheat). Returns how many came back.
  restorePlants(count: number): number {
    const dead = this.plants.filter((p) => !p.alive).map((p) => p.index);
    for (let i = dead.length - 1; i > 0; i--) {
      const j = Math.floor(this.rng() * (i + 1));
      [dead[i], dead[j]] = [dead[j], dead[i]];
    }
    const n = Math.min(count, dead.length);
    for (let i = 0; i < n; i++) {
      const p = this.plants[dead[i]];
      p.alive = true;
      p.burning = false;
      p.burnProgress = 0;
      p.burningBy = null;
    }
    return n;
  }

  // ---------- Main loop ----------

  update(dt: number): void {
    if (this.paused || this.phase === 'levelComplete' || this.phase === 'over' || dt <= 0) return;
    this.playTime += dt;
    this.time += dt;

    if (this.phase === 'levelEnding') {
      this.updateBullets(dt);
      this.updateExplosions(dt);
      this.cleanup();
      this.levelEndTimer -= dt;
      if (this.levelEndTimer <= 0) this.completeLevel();
      return;
    }

    const ts = this.timeScale();
    const levelDone = this.waves.update(dt * ts, this.waveWorld);
    this.updateFiring(dt);
    this.updateBullets(dt);
    this.updateAirEnemies(dt * ts);
    this.updateParatroopers(dt * ts);
    this.updateBombs(dt * ts);
    this.updateExplosions(dt);
    this.updatePlants(dt * ts);
    this.updatePowerUpSpawning(dt);
    this.updatePowerUps(dt);
    this.updateActiveEffects(dt);
    if (this.comboCount > 0) {
      this.comboTimer -= dt;
      if (this.comboTimer <= 0) {
        this.comboCount = 0;
        this.comboMultiplier = 1;
      }
    }
    this.checkCollisions();
    this.cleanup();

    if (this.alivePlants <= 0) {
      this.phase = 'over';
      this.firing = false;
      this.emit({ type: 'gameOver', level: this.level, score: this.score, cause: this.lastCause });
      return;
    }
    if (levelDone) {
      this.phase = 'levelEnding';
      this.levelEndTimer = LEVEL_END_DELAY;
    }
  }

  private completeLevel(): void {
    const scoreBeforeBonus = this.score;
    const bonus = levelBonus(this.level);
    this.score += bonus;
    const dead = PLANT_COUNT - this.alivePlants;
    const restored = dead > 0 ? this.restorePlants(jahDraw(this.rng, this.alivePlants)) : 0;
    this.phase = 'levelComplete';
    this.firing = false;
    this.emit({ type: 'levelComplete', level: this.level, scoreBeforeBonus, bonus, restored });
  }

  timeScale(): number {
    if (this.hasEffect('bullet_time')) return 0.25;
    if (this.hasEffect('holy_smoke')) return 0.5;
    return 1;
  }

  hasEffect(id: PowerUpId): boolean {
    return this.activeEffects.some((e) => e.id === id);
  }

  get zionWallActive(): boolean {
    return this.zionWallHits > 0;
  }

  private emit(event: GameEvent): void {
    this.events.push(event);
  }

  private addScore(points: number): void {
    this.score += points;
  }

  // ---------- Spawning ----------

  private readonly waveWorld = {
    activeHelicopters: () => this.airEnemies.filter((e) => e.active && isHeli(e)).length,
    enemyCount: () => this.airEnemies.length + this.paratroopers.length + this.bombs.length,
    spawn: (type: SpawnType) => this.spawnEnemy(type),
    spawnBoss: () => this.spawnBoss(),
  };

  private createAirEnemy(type: AirType, x: number, y: number, direction: 1 | -1, hp: number, speed: number, width: number, height: number, score: number, dropCount: number): AirEnemy {
    const enemy: AirEnemy = {
      id: this.nextId++,
      type,
      x,
      y,
      width,
      height,
      active: true,
      hp,
      maxHp: hp,
      vx: speed * direction,
      vy: 0,
      direction,
      speed,
      hasDropped: false,
      dropCount,
      maxDropCount: dropCount,
      droppedThisPass: 0,
      maxDropThisPass: Math.floor(this.rng() * 5) + 1,
      passCount: 0,
      dropTimer: 0,
      score,
      flashTimer: 0,
    };
    if (type === 'cropduster') enemy.immunePlants = new Set();
    this.airEnemies.push(enemy);
    return enemy;
  }

  spawnEnemy(type: SpawnType): AirEnemy {
    const { W, H, skyTop, groundY } = this.layout;
    const def = ENEMIES[type];
    const { speedMultiplier, hpMultiplier } = this.waves.config;
    const left = this.rng() > 0.5;
    const direction: 1 | -1 = left ? 1 : -1;
    const x = left ? -def.width : W + def.width;
    const speed = def.speed * speedMultiplier;
    const hp = Math.ceil(def.hp * hpMultiplier);
    let y: number;
    let dropCount = 0;
    switch (type) {
      case 'helicopter':
      case 'blackhawk':
        y = skyTop + randomRange(this.rng, 20, H * 0.25);
        dropCount = type === 'helicopter' ? randomInt(this.rng, 3, 8) : randomInt(this.rng, 5, 10);
        break;
      case 'a10':
        y = skyTop + randomRange(this.rng, 10, H * 0.15);
        dropCount = randomInt(this.rng, 1, 2);
        break;
      case 'cropduster':
        y = groundY - randomRange(this.rng, 40, 80);
        break;
      default:
        y = skyTop + randomRange(this.rng, 20, H * 0.3);
    }
    return this.createAirEnemy(type, x, y, direction, hp, speed, def.width, def.height, def.score, dropCount);
  }

  private spawnBoss(): void {
    const boss = bossForLevel(this.level);
    const left = this.rng() > 0.5;
    const direction: 1 | -1 = left ? 1 : -1;
    const x = left ? -boss.width : this.layout.W + boss.width;
    const enemy = this.createAirEnemy('boss', x, this.layout.skyTop + 30, direction, boss.hp, boss.speed, boss.width, boss.height, boss.score, boss.dropCount);
    enemy.name = boss.name;
    this.bossActive = true;
    this.emit({ type: 'bossSpawn', name: boss.name });
  }

  private paratrooperHp(): number {
    return Math.ceil(ENEMIES.paratrooper.hp * (1 + (this.level - 1) * 0.05));
  }

  createParatrooper(x: number, y: number): Paratrooper {
    const def = ENEMIES.paratrooper;
    const para: Paratrooper = {
      id: this.nextId++,
      x,
      y,
      width: def.width,
      height: def.height,
      active: true,
      hp: this.paratrooperHp(),
      maxHp: this.paratrooperHp(),
      vx: (this.rng() - 0.5) * 15,
      vy: PARATROOPER_FALL_SPEED,
      landed: false,
      targetPlantIndex: -1,
      burnTimer: 0,
      plantsDestroyed: 0,
      fleeing: false,
      score: def.score,
      flashTimer: 0,
    };
    this.paratroopers.push(para);
    return para;
  }

  createBomb(x: number, y: number): Bomb {
    const def = ENEMIES.bomb;
    const bomb: Bomb = { id: this.nextId++, x, y, width: def.width, height: def.height, active: true, vy: def.speed, score: def.score };
    this.bombs.push(bomb);
    return bomb;
  }

  private createExplosion(x: number, y: number, radius = 30): void {
    this.explosions.push({ id: this.nextId++, x, y, width: radius * 2, height: radius * 2, active: true, timer: 0, maxTimer: 0.5, radius });
    this.emit({ type: 'explosion' });
  }

  private createBullet(angle: number, speed: number, damage: number, size: number, penetrating: boolean, explosive: boolean, explosionRadius: number, ghost = false): Bullet {
    const bullet: Bullet = {
      id: this.nextId++,
      x: this.layout.playerX,
      y: this.layout.playerY - 20,
      width: size * 2,
      height: size * 2,
      active: true,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      damage,
      penetrating,
      explosive,
      explosionRadius,
      angle,
      ghost,
    };
    this.bullets.push(bullet);
    return bullet;
  }

  spawnPowerUp(id: PowerUpId, x: number, y = -30): PowerUpOrb {
    const orb: PowerUpOrb = { id: this.nextId++, powerUpId: id, x, y, width: POWER_UP_SIZE, height: POWER_UP_SIZE, active: true, vy: POWER_UP_FALL_SPEED };
    this.powerUps.push(orb);
    return orb;
  }

  // ---------- Updates ----------

  private updateFiring(dt: number): void {
    const w = this.weapon;
    const fireRate = w.fireRate * (this.hasEffect('speed_spliff') ? 2 : 1);
    const damage = w.damage * (this.hasEffect('rasta_power') ? 2 : 1);
    this.fireTimer -= dt;
    if (!this.firing || this.fireTimer > 0) return;
    this.fireTimer = 1 / fireRate;
    const angles = [this.aimAngle];
    if (this.hasEffect('spread_shot')) angles.push(this.aimAngle - SPREAD_SHOT_ANGLE, this.aimAngle + SPREAD_SHOT_ANGLE);
    for (const base of angles) {
      const angle = base + (this.rng() - 0.5) * w.spread;
      this.createBullet(angle, w.bulletSpeed, damage, w.bulletSize, w.penetrating, w.explosive, w.explosionRadius);
    }
    this.emit({ type: 'shot', weapon: w.id });
  }

  private updateBullets(dt: number): void {
    const { W, H } = this.layout;
    for (const b of this.bullets) {
      if (!b.active) continue;
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      if (b.x < -20 || b.x > W + 20 || b.y < -20 || b.y > H + 20) b.active = false;
    }
  }

  private updateAirEnemies(dt: number): void {
    const { W, groundY } = this.layout;
    for (const e of this.airEnemies) {
      if (!e.active) continue;
      if (e.flashTimer > 0) e.flashTimer -= dt;

      if (e.type === 'ufo') e.vy = Math.sin((this.time * 1000) / 300) * 30;
      e.x += e.vx * dt;
      e.y += e.vy * dt;

      if (isHeli(e) && !e.hasDropped && e.droppedThisPass < e.maxDropThisPass && this.paratroopers.length < this.waves.config.maxParatroopers) {
        if (e.x > W * 0.15 && e.x < W * 0.85) {
          e.dropTimer += dt;
          if (e.dropTimer > 0.8) {
            e.dropTimer = 0;
            this.createParatrooper(e.x + (this.rng() - 0.5) * 40, e.y + e.height);
            e.dropCount--;
            e.droppedThisPass++;
            if (e.dropCount <= 0) e.hasDropped = true;
          }
        }
      }

      if (e.type === 'a10' && !e.hasDropped && e.x > W * 0.1 && e.x < W * 0.9) {
        e.dropTimer += dt;
        if (e.dropTimer > 0.4) {
          e.dropTimer = 0;
          this.createBomb(e.x + (this.rng() - 0.5) * 30, e.y + e.height);
          e.dropCount--;
          if (e.dropCount <= 0) e.hasDropped = true;
        }
      }

      if (e.type === 'cropduster' && e.dropCount < CROPDUSTER_MAX_ATTACKS) {
        for (const plant of this.plants) {
          if (!plant.alive || plant.burning || e.immunePlants?.has(plant.index)) continue;
          if (Math.abs(e.x - plant.x) < CROPDUSTER_REACH && e.y > groundY - 60) {
            if (this.plantShields[plant.index]) {
              this.plantShields[plant.index] = false;
              e.immunePlants?.add(plant.index); // D4: the shield holds for this whole pass
            } else {
              this.ignite(plant, 'cropduster');
            }
            e.dropCount++;
            if (e.dropCount >= CROPDUSTER_MAX_ATTACKS) break;
          }
        }
      }

      if (e.type === 'ufo') {
        const pastMid = e.direction === 1 ? e.x > W * 0.5 : e.x < W * 0.5;
        if (pastMid) {
          e.dropTimer += dt;
          if (e.dropTimer > UFO_ABDUCTION_INTERVAL) {
            e.dropTimer = 0;
            const alive = this.plants.filter((p) => p.alive);
            if (alive.length > 0) {
              const target = alive[randomInt(this.rng, 0, alive.length - 1)];
              if (this.plantShields[target.index]) this.plantShields[target.index] = false;
              else this.destroyPlant(target, 'ufo');
            }
          }
        }
      }

      if (e.type === 'boss') {
        if (e.x > W * 0.1 && e.x < W * 0.9) {
          e.dropTimer += dt;
          if (e.dropTimer > 2.0) {
            e.dropTimer = 0;
            this.createBomb(e.x + (this.rng() - 0.5) * 60, e.y + e.height);
            if (e.dropCount > 0 && !e.hasDropped && e.droppedThisPass < e.maxDropThisPass) {
              this.createParatrooper(e.x + (this.rng() - 0.5) * 80, e.y + e.height);
              e.dropCount--;
              e.droppedThisPass++;
            }
          }
        }
        // Slight vertical oscillation (source: 0.3 px per frame at 60 fps).
        e.y += Math.sin((this.time * 1000) / 800) * 0.3 * dt * 60;
      }

      if (isHeli(e) || e.type === 'boss') {
        const wrapRight = e.direction === 1 && e.x > W + e.width + 50;
        const wrapLeft = e.direction === -1 && e.x < -e.width - 50;
        if (wrapRight || wrapLeft) {
          e.x = wrapRight ? -e.width - 10 : W + e.width + 10;
          e.passCount++;
          if (this.rng() < 0.5 && e.speed > 30) {
            e.speed = Math.max(e.speed * 0.85, 30);
            e.vx = e.speed * e.direction; // D3: the decay really slows it down
          }
          e.droppedThisPass = 0;
          e.maxDropThisPass = Math.floor(this.rng() * 5) + 1;
          e.dropTimer = 0;
          if (e.hasDropped) {
            const pct = Math.max(0.4 - e.passCount * 0.1, 0);
            e.dropCount += Math.max(Math.ceil(e.maxDropCount * pct), 1);
            e.hasDropped = false;
          }
        }
      } else if ((e.direction === 1 && e.x > W + e.width + 50) || (e.direction === -1 && e.x < -e.width - 50)) {
        e.active = false;
      }
    }
  }

  private nearestAlivePlant(x: number): number {
    let best = -1;
    let bestDist = Infinity;
    for (const p of this.plants) {
      if (!p.alive) continue;
      const d = Math.abs(x - p.x);
      if (d < bestDist) {
        bestDist = d;
        best = p.index;
      }
    }
    return best;
  }

  private updateParatroopers(dt: number): void {
    const { W, H, groundY } = this.layout;
    const wallY = H * 0.55;
    for (const para of this.paratroopers) {
      if (!para.active) continue;
      if (para.flashTimer > 0) para.flashTimer -= dt;

      if (!para.landed) {
        para.x += para.vx * dt;
        para.y += para.vy * dt;
        if (this.zionWallHits > 0 && para.y >= wallY && para.y - para.vy * dt < wallY) {
          para.active = false;
          this.zionWallHits--;
          this.createExplosion(para.x, wallY, 10);
          this.addScore(para.score);
          this.kills++;
          this.emit({ type: 'kill', target: 'paratrooper', points: para.score });
          continue;
        }
        if (para.y >= groundY - para.height) {
          para.y = groundY - para.height;
          para.landed = true;
          para.vx = 0;
          para.vy = 0;
          para.targetPlantIndex = this.nearestAlivePlant(para.x);
        }
      } else if (para.fleeing) {
        const dir = para.x < W / 2 ? -1 : 1;
        para.x += dir * SOLDIER_FLEE_SPEED * dt;
        if (para.x < -para.width || para.x > W + para.width) para.active = false;
      } else if (para.plantsDestroyed >= 3) {
        para.fleeing = true;
        para.targetPlantIndex = -1;
      } else if (para.targetPlantIndex >= 0 && para.targetPlantIndex < this.plants.length) {
        if (!this.plants[para.targetPlantIndex].alive) {
          para.targetPlantIndex = this.nearestAlivePlant(para.x);
          if (para.targetPlantIndex < 0) para.fleeing = true;
        }
        if (!para.fleeing && para.targetPlantIndex >= 0) {
          const plant = this.plants[para.targetPlantIndex];
          const dx = plant.x - para.x;
          if (Math.abs(dx) > 5) {
            para.x += Math.sign(dx) * SOLDIER_WALK_SPEED * dt;
          } else {
            if (this.babylonTrapCharges > 0) {
              this.babylonTrapCharges--;
              para.active = false;
              this.createExplosion(para.x, para.y, 15);
              this.addScore(para.score);
              this.kills++;
              this.emit({ type: 'kill', target: 'paratrooper', points: para.score });
            } else if (!plant.burning) {
              if (this.plantShields[plant.index]) {
                this.plantShields[plant.index] = false;
                para.targetPlantIndex = -1;
              } else {
                this.ignite(plant, 'soldier');
              }
            }
            if (para.active && plant.burning) para.burnTimer += dt;
          }
        }
      } else {
        para.fleeing = true;
      }
    }
  }

  private updateBombs(dt: number): void {
    const { H, groundY } = this.layout;
    const wallY = H * 0.55;
    for (const bomb of this.bombs) {
      if (!bomb.active) continue;
      bomb.y += bomb.vy * dt;
      if (this.zionWallHits > 0 && bomb.y >= wallY) {
        bomb.active = false;
        this.zionWallHits--;
        this.createExplosion(bomb.x, wallY, 20);
        continue;
      }
      if (bomb.y >= groundY) {
        bomb.active = false;
        this.createExplosion(bomb.x, groundY, 40);
        for (const plant of this.plants) {
          if (!plant.alive || Math.abs(bomb.x - plant.x) >= BOMB_BLAST_RADIUS) continue;
          if (this.plantShields[plant.index]) this.plantShields[plant.index] = false;
          else this.destroyPlant(plant, 'bomb');
        }
      }
    }
  }

  private updateExplosions(dt: number): void {
    for (const ex of this.explosions) {
      if (!ex.active) continue;
      ex.timer += dt;
      if (ex.timer >= ex.maxTimer) ex.active = false;
    }
  }

  private updatePlants(dt: number): void {
    for (const plant of this.plants) {
      if (!plant.alive || !plant.burning) continue;
      plant.burnProgress += dt / BURN_SECONDS;
      if (plant.burnProgress >= 1) {
        const cause = plant.burningBy ?? 'soldier';
        this.destroyPlant(plant, cause);
        const soldier = this.paratroopers.find((p) => p.active && p.landed && !p.fleeing && p.targetPlantIndex === plant.index);
        if (soldier) soldier.plantsDestroyed++;
      }
    }
  }

  private ignite(plant: Plant, by: 'soldier' | 'cropduster'): void {
    plant.burning = true;
    plant.burningBy = by;
    this.emit({ type: 'plantBurning' });
  }

  private destroyPlant(plant: Plant, cause: GameOverCause): void {
    plant.alive = false;
    plant.burning = false;
    plant.burnProgress = 0;
    plant.burningBy = null;
    this.lastCause = cause;
    this.emit({ type: 'plantDestroyed', index: plant.index, cause });
  }

  private updatePowerUpSpawning(dt: number): void {
    if (this.powerUpSpawnCount >= this.powerUpTimers.length) return;
    this.powerUpTimers[this.powerUpSpawnCount] -= dt;
    if (this.powerUpTimers[this.powerUpSpawnCount] <= 0) {
      this.powerUpSpawnCount++;
      const def = POWER_UPS[Math.floor(this.rng() * POWER_UPS.length)];
      this.spawnPowerUp(def.id, randomRange(this.rng, this.layout.W * 0.15, this.layout.W * 0.85));
    }
  }

  // Seconds until the next power-up orb spawns (tests and debugging).
  get nextPowerUpIn(): number | null {
    return this.powerUpSpawnCount < this.powerUpTimers.length ? this.powerUpTimers[this.powerUpSpawnCount] : null;
  }

  private updatePowerUps(dt: number): void {
    for (const orb of this.powerUps) {
      if (!orb.active) continue;
      orb.y += orb.vy * dt;
      if (orb.y >= this.layout.groundY) orb.active = false;
    }
  }

  private updateActiveEffects(dt: number): void {
    for (const e of this.activeEffects) if (e.duration > 0) e.remaining -= dt;
    this.activeEffects = this.activeEffects.filter((e) => e.duration === 0 || e.remaining > 0);
    if (this.hasEffect('roots_of_zion')) {
      this.rootsTimer += dt;
      if (this.rootsTimer >= ROOTS_INTERVAL) {
        this.rootsTimer -= ROOTS_INTERVAL;
        this.restorePlants(1);
      }
    }
    if (this.hasEffect('duppy_conqueror')) {
      this.duppyTimer += dt;
      if (this.duppyTimer >= DUPPY_INTERVAL) {
        this.duppyTimer -= DUPPY_INTERVAL;
        this.duppyShoot();
      }
    }
  }

  private duppyShoot(): void {
    const { playerX, playerY } = this.layout;
    let target: { x: number; y: number } | null = null;
    let best = Infinity;
    for (const t of [...this.airEnemies, ...this.paratroopers]) {
      if (!t.active) continue;
      const d = Math.hypot(t.x - playerX, t.y - playerY);
      if (d < best) {
        best = d;
        target = t;
      }
    }
    if (!target) return;
    const angle = Math.atan2(target.y - playerY, target.x - playerX);
    this.createBullet(angle, 500, this.weapon.damage, 5, false, false, 0, true);
  }

  // ---------- Collisions, scoring, power-ups ----------

  private registerComboKill(): void {
    this.comboCount++;
    this.comboTimer = COMBO_WINDOW;
    this.comboMultiplier = 1 + (this.comboCount - 1) * 0.5;
    this.maxCombo = Math.max(this.maxCombo, this.comboCount);
    if (this.comboCount >= 2) this.emit({ type: 'combo', count: this.comboCount, multiplier: this.comboMultiplier });
  }

  private killAirEnemy(e: AirEnemy, points: number): void {
    e.active = false;
    this.addScore(points);
    this.kills++;
    this.createExplosion(e.x, e.y, e.width * 0.4);
    this.emit({ type: 'kill', target: e.type, points });
    if (isHeli(e)) this.waves.onHeliKilled();
    if (e.type === 'boss') {
      this.bossActive = false;
      this.emit({ type: 'bossDefeated', level: this.level });
    }
  }

  private checkCollisions(): void {
    for (const b of this.bullets) {
      if (!b.active) continue;
      for (const e of this.airEnemies) {
        if (!e.active || !overlaps(b, e)) continue;
        e.hp -= b.damage;
        e.flashTimer = 0.1;
        if (!b.penetrating) b.active = false;
        if (e.hp <= 0) {
          this.registerComboKill();
          this.killAirEnemy(e, Math.floor(e.score * this.comboMultiplier));
        }
        if (b.explosive) this.createExplosion(b.x, b.y, b.explosionRadius);
        break;
      }
    }
    for (const b of this.bullets) {
      if (!b.active) continue;
      for (const p of this.paratroopers) {
        if (!p.active || !overlaps(b, p)) continue;
        p.hp -= b.damage;
        p.flashTimer = 0.1;
        if (!b.penetrating) b.active = false;
        if (p.hp <= 0) {
          p.active = false;
          this.addScore(p.score);
          this.kills++;
          this.emit({ type: 'kill', target: 'paratrooper', points: p.score });
        }
        break;
      }
    }
    for (const b of this.bullets) {
      if (!b.active) continue;
      for (const orb of this.powerUps) {
        if (!orb.active || !overlaps(b, orb)) continue;
        orb.active = false;
        b.active = false;
        this.activatePowerUp(orb.powerUpId);
        break;
      }
    }
    for (const b of this.bullets) {
      if (!b.active) continue;
      for (const bomb of this.bombs) {
        if (!bomb.active || !overlaps(b, bomb)) continue;
        bomb.active = false;
        b.active = false;
        this.addScore(bomb.score);
        this.kills++;
        this.createExplosion(bomb.x, bomb.y, 20);
        this.emit({ type: 'kill', target: 'bomb', points: bomb.score });
        break;
      }
    }
  }

  activatePowerUp(id: PowerUpId): void {
    this.emit({ type: 'powerUpActivated', id });
    switch (id) {
      case 'jah_lightning':
        for (const e of this.airEnemies) if (e.active) this.killAirEnemy(e, e.score); // D2: a boss counts as defeated
        for (const p of this.paratroopers) {
          if (!p.active) continue;
          p.active = false;
          this.addScore(p.score);
          this.kills++;
          this.emit({ type: 'kill', target: 'paratrooper', points: p.score });
        }
        for (const bomb of this.bombs) {
          if (!bomb.active) continue;
          bomb.active = false;
          this.createExplosion(bomb.x, bomb.y, 20);
        }
        break;
      case 'ganja_shield':
        for (const p of this.plants) if (p.alive) this.plantShields[p.index] = true;
        break;
      case 'babylon_trap':
        this.babylonTrapCharges = BABYLON_TRAP_CHARGES;
        break;
      case 'zion_wall':
        this.zionWallHits = ZION_WALL_HITS;
        break;
      case 'one_drop':
        for (const t of [...this.airEnemies, ...this.paratroopers]) if (t.active) t.hp = Math.max(1, Math.ceil(t.hp / 2));
        break;
      default: {
        if (id === 'duppy_conqueror') this.duppyTimer = 0;
        const { duration } = powerUpDef(id);
        this.activeEffects = this.activeEffects.filter((e) => e.id !== id);
        this.activeEffects.push({ id, remaining: duration, duration });
      }
    }
  }

  private cleanup(): void {
    this.bullets = this.bullets.filter((b) => b.active);
    this.airEnemies = this.airEnemies.filter((e) => e.active);
    this.paratroopers = this.paratroopers.filter((p) => p.active);
    this.bombs = this.bombs.filter((b) => b.active);
    this.explosions = this.explosions.filter((e) => e.active);
    this.powerUps = this.powerUps.filter((p) => p.active);
  }
}
