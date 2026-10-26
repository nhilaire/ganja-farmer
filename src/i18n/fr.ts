// French translation of en.ts (same keys, enforced by the Strings type). Tone: « tu », with the same rasta winks.
// French typography: NBSP before ":" and "%", NNBSP before "!", "?" and ";". Kept in English by the user's decision:
// the power-up names (often reggae song titles), the Jah quotes (quotes.ts) and the Bob Marley quote of ABOUT.
import { NBSP, NNBSP, pad } from './format';
import type { Strings } from './types';

const pct = (n: number) => `${n}${NBSP}%`;
const ex = (text: string) => `${text}${NNBSP}!`;

export const fr: Strings = {
  locale: 'fr-FR',
  consent: {
    title: `Aider la ferme à pousser${NNBSP}?`,
    body:
      'Partage des statistiques de jeu anonymes (niveaux atteints, durée des parties, plantages) pour améliorer ' +
      "Ganja Farmer. Pas de nom, pas d'identifiant, pas de pub.",
    accept: 'OUI, PARTAGER',
    refuse: 'NON MERCI',
    footnote: "Tu peux changer d'avis à tout moment dans RÉGLAGES.",
  },
  home: {
    titleTop: 'GANJA',
    titleBottom: 'FARMER',
    subtitle: ex('Défends ton champ, Rasta'),
    play: 'JOUER',
    hints: ["Touche l'écran pour viser et tirer", 'Garde le doigt appuyé pour tirer en continu', ex('Protège tes plants de ganja')],
    scores: 'SCORES',
    about: 'À PROPOS',
    setup: 'RÉGLAGES',
  },
  scores: {
    title: 'MEILLEURS SCORES',
    rank: '#',
    name: 'NOM',
    score: 'SCORE',
    level: 'NIV',
    kills: 'TUÉS',
    back: 'Touche pour revenir',
    empty: ex('Pas encore de score, Rasta'),
  },
  hud: {
    score: (score: number) => `Score${NBSP}: ${pad(score, 7)}`,
    level: (level: number) => `Niveau${NBSP}: ${pad(level, 2)}`,
    plants: (alive: number, total: number) => `Plants${NBSP}: ${alive}/${total}`,
    weapon: (name: string) => `[${name}]`,
    effect: (name: string, seconds: number) => `${name} ${seconds}${NBSP}s`,
  },
  pause: {
    title: 'PAUSE',
    resume: 'REPRENDRE',
    menu: 'MENU',
    button: 'Pause',
  },
  game: {
    bossIncoming: 'BOSS EN APPROCHE',
    combo: (count: number) => ex(`x${count} COMBO`),
    multiplier: (multiplier: number) => `x${multiplier.toFixed(1).replace('.', ',')}`,
    rocketMessage: `Rasta rocket mon${NNBSP}!`,
  },
  blessing: {
    restored: (count: number) => (count === 1 ? `+${count} plant restauré` : `+${count} plants restaurés`),
    phrases: [
      ex("Plus d'herbe, man"),
      ex('Jah sauve les plants'),
      ex("L'herbe repousse"),
      ex('Jah touche, les plants se lèvent'),
      ex('Bénédiction verte'),
      ex('Les racines tiennent bon'),
      ex('Le champ vit encore'),
      ex('Jah soigne le jardin'),
      ex("L'herbe renaît"),
      ex('De Jah, la vie revient'),
      ex('La ganja se relève'),
      ex('Jah ramène le vert'),
      ex('Ça repousse, Rasta'),
      ex('Récolte bénie'),
      ex("L'herbe ne meurt jamais"),
      ex('Jah restaure le champ'),
      ex("La vie vient d'en haut"),
      ex('Culture sacrée'),
      ex('Les plants respirent à nouveau'),
      ex('Le miracle vert de Jah'),
    ],
  },
  transition: {
    level: (level: number) => `NIVEAU ${level}`,
    jah: 'JAH',
    bonus: (bonus: number) => `+${bonus} pts`,
    newWeapon: (weapon: string) => ex(`Nouvelle arme${NBSP}: ${weapon}`),
    plants: (alive: number, total: number) => `Plants${NBSP}: ${alive}/${total}`,
    continue: 'Touche pour continuer',
  },
  gameOver: {
    title: 'GAME OVER',
    score: (score: number) => `Score${NBSP}: ${pad(score, 7)}`,
    kills: (kills: number) => `Tués${NBSP}: ${kills}`,
    level: (level: number) => `Niveau${NBSP}: ${level}`,
    newRecord: ex('NOUVEAU RECORD'),
    namePlaceholder: 'Ton nom, Rasta',
    save: 'ENREGISTRER',
    saved: ex('Score enregistré'),
    retry: 'REJOUER',
    menu: 'MENU',
  },
  setup: {
    title: 'RÉGLAGES',
    sound: 'SON',
    music: 'MUSIQUE',
    vibration: 'VIBRATIONS',
    stats: 'STATS',
    statsHelp: `Statistiques anonymes${NBSP}: niveaux, durée des parties, plantages. Pas de nom, pas d'identifiant.`,
    on: 'ON',
    off: 'OFF',
    language: 'LANGUE',
    languageAuto: 'AUTO (TÉLÉPHONE)',
    reset: 'EFFACER LES SCORES',
    resetConfirm: `Effacer tous les scores, Rasta${NNBSP}?`,
    resetYes: 'EFFACER',
    resetNo: 'ANNULER',
    back: 'RETOUR',
  },
  about: {
    title: 'À PROPOS',
    originalTitle: 'Le jeu original',
    original: [
      'Ganja Farmer était un petit freeware sorti vers 1998 pour Windows 95/98. Créé par un développeur anonyme sous ' +
        `le nom «${NBSP}EvilX Systems${NBSP}», c'était un jeu de tir 2D simple mais addictif où le joueur défendait un ` +
        `champ de cannabis contre des vagues de forces gouvernementales${NBSP}: hélicoptères, parachutistes et autres ` +
        'menaces militaires.',
      "Le jeu s'est répandu de façon virale par les premiers sites de téléchargement, les CD de sharewares et les " +
        'réseaux peer-to-peer. Avec ses graphismes en pixel art rudimentaires, son thème inspiré du reggae et son sujet ' +
        'volontairement provocateur, il est devenu culte chez les joueurs de la fin des années 90.',
      "Sans jamais avoir été commercialisé, Ganja Farmer a marqué toute une génération de joueurs qui l'ont découvert " +
        "sur l'ordinateur familial, souvent caché dans un dossier de freewares téléchargés.",
    ],
    whyTitle: 'Pourquoi ce jeu',
    story: [
      "Ado, j'ai joué des heures à Ganja Farmer sur l'ordinateur familial, trouvé dans un dossier de freewares " +
        `téléchargés. J'ai fait cette version pour le retrouver sur mon téléphone${NBSP}: un hommage d'un développeur ` +
        "indépendant passionné, sans lien avec les créateurs d'origine.",
    ],
    versionTitle: 'Cette version',
    thisVersion: [
      "Entièrement refaite avec React Native et Skia, elle garde l'esprit de l'original et ajoute des bonus bénis par " +
        'Jah, des combats de boss, des combos et une progression qui maintient le défi. Faite sur mon temps libre, ' +
        `quelques bugs peuvent se cacher dans le champ${NBSP}: merci pour ton indulgence.`,
      "Ce jeu est une œuvre de fiction et un hommage nostalgique, pour adultes, destiné uniquement au divertissement.",
    ],
    dataTitle: 'Tes données',
    data: [
      "Aucun compte, aucune pub. Des statistiques anonymes ne sont envoyées que si tu as dit oui, et tu peux changer " +
        "d'avis dans RÉGLAGES. Les noms des meilleurs scores restent sur ce téléphone.",
    ],
    builtWithTitle: 'Fait avec',
    builtWith: ['React Native + Expo + Skia', `100${NBSP}% TypeScript, tous les graphismes dessinés en code`],
    version: (version: string) => `Version ${version}`,
    // Kept in its English original (user decision).
    quote: '"One good thing about music, when it hits you, you feel no pain."',
    quoteAuthor: '- Bob Marley',
    back: 'RETOUR',
  },
  weapons: {
    pistol: 'Pistolet',
    machinegun: 'Mitrailleuse',
    aa_gun: `Canon antiaérien 20${NBSP}mm`,
    rocket: 'Lance-roquettes',
    gatling: 'Gatling',
    laser: 'Canon laser',
  },
  // Names kept in English (user decision), descriptions translated.
  powerUps: {
    rasta_power: { name: 'RASTA POWER', description: `Dégâts x2 15${NBSP}s` },
    speed_spliff: { name: 'SPEED SPLIFF', description: `Cadence x2 15${NBSP}s` },
    holy_smoke: { name: 'HOLY SMOKE', description: `Ennemis ralentis de ${pct(50)} 10${NBSP}s` },
    jah_lightning: { name: 'JAH LIGHTNING', description: ex('Tous les ennemis détruits') },
    ganja_shield: { name: 'GANJA SHIELD', description: 'Plants protégés x1' },
    bullet_time: { name: 'BULLET TIME', description: `Temps ralenti de ${pct(75)} 8${NBSP}s` },
    spread_shot: { name: 'SPREAD SHOT', description: `Tir triple 12${NBSP}s` },
    roots_of_zion: { name: 'ROOTS OF ZION', description: `Soin auto des plants 15${NBSP}s` },
    babylon_trap: { name: 'BABYLON TRAP', description: ex(`Piège${NNBSP}! Les 3 prochains soldats explosent`) },
    zion_wall: { name: 'ZION WALL', description: "Mur d'énergie, bloque 3 tirs" },
    one_drop: { name: 'ONE DROP', description: ex(`Tous les ennemis −${pct(50)} PV`) },
    duppy_conqueror: { name: 'DUPPY CONQUEROR', description: `Un fantôme tire seul 20${NBSP}s` },
  },
  errors: {
    title: 'Oups, Rasta',
    body: 'Un problème est survenu. Relance le jeu.',
    retry: 'RÉESSAYER',
  },
};
