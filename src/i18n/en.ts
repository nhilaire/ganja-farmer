// Every player-facing string lives here, in English (user decision, see docs/PRD.md "Player-facing copy").
// Components never inline text. Casual tone with rasta winks, as in the source game.
import { pad } from './format';

export { JAH_QUOTES } from './quotes';

export const en = {
  consent: {
    title: 'Help the farm grow?',
    body:
      'Share anonymous game statistics (levels reached, game length, crashes) to help improve Ganja Farmer. ' +
      'No name, no ID, no ads.',
    accept: 'YES, SHARE STATS',
    refuse: 'NO THANKS',
    footnote: 'You can change this anytime in SETUP.',
  },
  home: {
    titleTop: 'GANJA',
    titleBottom: 'FARMER',
    subtitle: 'Defend your field, Rasta!',
    play: 'PLAY',
    hints: ['Touch screen to aim and shoot', 'Hold to fire continuously', 'Protect your ganja plants!'],
    scores: 'SCORES',
    about: 'ABOUT',
    setup: 'SETUP',
  },
  scores: {
    title: 'HIGH SCORES',
    rank: '#',
    name: 'NAME',
    score: 'SCORE',
    level: 'LVL',
    kills: 'KILLS',
    back: 'Tap to go back',
    empty: 'No scores yet, Rasta!',
  },
  hud: {
    score: (score: number) => `Score: ${pad(score, 7)}`,
    level: (level: number) => `Level: ${pad(level, 2)}`,
    plants: (alive: number, total: number) => `Plants: ${alive}/${total}`,
    weapon: (name: string) => `[${name}]`,
    effect: (name: string, seconds: number) => `${name} ${seconds}s`,
  },
  pause: {
    title: 'PAUSED',
    resume: 'RESUME',
    menu: 'MENU',
    button: 'Pause',
  },
  game: {
    bossIncoming: 'BOSS INCOMING',
    combo: (count: number) => `x${count} COMBO!`,
    multiplier: (multiplier: number) => `x${multiplier.toFixed(1)}`,
    rocketMessage: 'Rasta rocket mon !',
  },
  blessing: {
    restored: (count: number) => `+${count} Plants Restored`,
  },
  transition: {
    level: (level: number) => `LEVEL ${level}`,
    jah: 'JAH',
    bonus: (bonus: number) => `+${bonus} pts`,
    newWeapon: (weapon: string) => `New Weapon: ${weapon}!`,
    plants: (alive: number, total: number) => `Plants: ${alive}/${total}`,
    continue: 'Tap to continue',
  },
  gameOver: {
    title: 'GAME OVER',
    score: (score: number) => `Score: ${pad(score, 7)}`,
    kills: (kills: number) => `Kills: ${kills}`,
    level: (level: number) => `Level: ${level}`,
    newRecord: 'NEW HIGH SCORE!',
    namePlaceholder: 'Your name, Rasta',
    save: 'SAVE',
    saved: 'Score saved!',
    retry: 'RETRY',
    menu: 'MENU',
  },
  setup: {
    title: 'SETUP',
    sound: 'SOUND',
    vibration: 'VIBRATION',
    stats: 'STATS',
    statsHelp: 'Anonymous statistics: levels, game length, crashes. No name, no ID.',
    on: 'ON',
    off: 'OFF',
    reset: 'RESET HIGH SCORES',
    resetConfirm: 'Erase all high scores, Rasta?',
    resetYes: 'ERASE',
    resetNo: 'CANCEL',
    back: 'BACK',
  },
  about: {
    title: 'ABOUT',
    originalTitle: 'The Original Game',
    original: [
      'Ganja Farmer was a small freeware game released around 1998 for Windows 95/98. Created by an anonymous ' +
        'developer under the name "EvilX Systems", it was a simple but addictive 2D shooter where the player ' +
        'defended a cannabis field against waves of government forces: helicopters, paratroopers, and various ' +
        'military threats.',
      'The game spread virally through early internet download portals, shareware CDs, and peer-to-peer networks. ' +
        'With its crude pixel art graphics, reggae-inspired theme, and deliberately provocative subject matter, it ' +
        'became a cult classic among gamers of the late 90s.',
      'Despite never being a commercial release, Ganja Farmer left a lasting impression on a generation of players ' +
        'who discovered it on their family computers, often hidden in folders of downloaded freeware games.',
    ],
    whyTitle: 'Why this game',
    story: [
      'I played Ganja Farmer for hours as a teenager, on the family computer, found in a folder of downloaded ' +
        'freeware games. I made this version to bring it back on my phone - a tribute by a passionate independent ' +
        'developer, not affiliated with the original creators.',
    ],
    versionTitle: 'This Version',
    thisVersion: [
      'Rebuilt from scratch with React Native and Skia, it keeps the spirit of the original and adds power-ups ' +
        'blessed by Jah, boss fights, combos and a progression that keeps the challenge going. Made on free time, ' +
        'so a few bugs may hide in the field: thanks for your indulgence.',
      'This game is a work of fiction and a nostalgic homage, for adults, intended purely for entertainment.',
    ],
    dataTitle: 'Your data',
    data: [
      'No account, no ads. Anonymous statistics are sent only if you said yes, and you can change your mind in SETUP. ' +
        'High-score names stay on this phone.',
    ],
    builtWithTitle: 'Built with',
    builtWith: ['React Native + Expo + Skia', '100% TypeScript, all graphics drawn in code'],
    version: (version: string) => `Version ${version}`,
    quote: '"One good thing about music, when it hits you, you feel no pain."',
    quoteAuthor: '- Bob Marley',
    back: 'BACK',
  },
  weapons: {
    pistol: 'Pistol',
    machinegun: 'Machine Gun',
    aa_gun: '20mm AA Gun',
    rocket: 'Rocket Launcher',
    gatling: 'Gatling',
    laser: 'Laser Cannon',
  },
  powerUps: {
    rasta_power: { name: 'RASTA POWER', description: 'x2 Damage 15s' },
    speed_spliff: { name: 'SPEED SPLIFF', description: 'x2 Fire Rate 15s' },
    holy_smoke: { name: 'HOLY SMOKE', description: 'Enemies Slowed 50% 10s' },
    jah_lightning: { name: 'JAH LIGHTNING', description: 'All Enemies Destroyed!' },
    ganja_shield: { name: 'GANJA SHIELD', description: 'Plants Protected x1' },
    bullet_time: { name: 'BULLET TIME', description: 'Time Slowed 75% 8s' },
    spread_shot: { name: 'SPREAD SHOT', description: '3-Way Fire 12s' },
    roots_of_zion: { name: 'ROOTS OF ZION', description: 'Auto-Heal Plants 15s' },
    babylon_trap: { name: 'BABYLON TRAP', description: 'Trap! Next 3 Soldiers Explode' },
    zion_wall: { name: 'ZION WALL', description: 'Energy Wall Blocks 3 Hits' },
    one_drop: { name: 'ONE DROP', description: 'All Enemies -50% HP!' },
    duppy_conqueror: { name: 'DUPPY CONQUEROR', description: 'Ghost Auto-Shoots 20s' },
  },
  errors: {
    title: 'Oops, Rasta',
    body: 'Something went wrong. Restart the game.',
    retry: 'TRY AGAIN',
  },
  // Factory template demo screen, removed when the real Game screen lands (T-12).
  demo: {
    tap: 'Tap!',
    score: (score: number) => `Score: ${score}`,
    timeLeft: (seconds: number) => `Time: ${seconds}s`,
    over: 'GAME OVER',
    finalScore: (score: number) => `Score: ${score}`,
    playAgain: 'RETRY',
    home: 'MENU',
  },
} as const;
