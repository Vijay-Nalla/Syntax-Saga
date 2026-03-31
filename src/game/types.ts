export type Language = 'javascript' | 'python' | 'c' | 'cpp' | 'java';
export type ControlMode = 'joystick' | 'button';

export interface LanguageInfo {
  id: Language;
  name: string;
  color: string;
  glowClass: string;
  icon: string;
  description: string;
}

export interface Question {
  type: 'mcq' | 'fill-blank' | 'debug' | 'output';
  question: string;
  code?: string;
  options?: string[];
  answer: string;
  explanation: string;
  hint?: string;
}

export interface LevelData {
  id: number;
  name: string;
  topic: string;
  phase: number;
  isBoss: boolean;
  bossName?: string;
  questions: Question[];
  platformLayout: Platform[];
  enemies: EnemySpawn[];
  coins: CoinSpawn[];
  terminals: TerminalSpawn[];
  pipes: PipeSpawn[];
}

export interface Platform {
  x: number;
  y: number;
  width: number;
  height: number;
  type: 'normal' | 'moving' | 'breakable';
  baseX?: number;
  range?: number;
  speed?: number;
  dir?: number;
  prevX?: number;
}

export type EnemyType = 'syntax-error' | 'logical-error' | 'runtime-error' | 'debug-ghost' | 'virus-bug';

export const ENEMY_CONFIG: Record<EnemyType, { damage: number; color: string; label: string }> = {
  'syntax-error':   { damage: 5,  color: '#ff9933', label: 'SYNTAX' },
  'logical-error':  { damage: 10, color: '#ff3366', label: 'LOGIC' },
  'runtime-error':  { damage: 20, color: '#ff0000', label: 'RUNTIME' },
  'debug-ghost':    { damage: 15, color: '#cc00ff', label: 'GHOST' },
  'virus-bug':      { damage: 25, color: '#00ff00', label: 'VIRUS' },
};

export interface EnemySpawn {
  x: number;
  y: number;
  type: EnemyType;
  patrolRange: number;
}

export interface CoinSpawn {
  x: number;
  y: number;
}

export interface TerminalSpawn {
  x: number;
  y: number;
  questionIndex: number;
}

export interface PipeSpawn {
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  isReturn: boolean;
}

export interface PlayerState {
  x: number;
  y: number;
  vx: number;
  vy: number;
  width: number;
  height: number;
  onGround: boolean;
  facing: 'left' | 'right';
  health: number;
  xp: number;
  level: number;
  language: Language;
  coins: number;
  name: string;
  isCrouching?: boolean;
}

export interface GameState {
  screen: 'title' | 'name-entry' | 'language-select' | 'leaderboard' | 'playing' | 'challenge' | 'game-over' | 'level-complete' | 'paused';
  player: PlayerState;
  currentLevel: number;
  currentQuestion: Question | null;
  isPaused: boolean;
  startTime: number;
  isUnderground: boolean;
  isNearTerminal?: boolean;
  cameraX?: number;
  controlMode: ControlMode;
  maxProgressX?: number;
  lockX?: number;
}

export interface LeaderboardEntry {
  name: string;
  coins: number;
  levelsCompleted: number;
  timeTaken: number; // seconds
  score: number;
  language: Language;
  date: string;
}

export const LANGUAGES: LanguageInfo[] = [
  { id: 'javascript', name: 'JavaScript', color: 'hsl(50, 100%, 55%)', glowClass: 'neon-yellow', icon: 'JS', description: 'The language of the web' },
  { id: 'python', name: 'Python', color: 'hsl(190, 100%, 50%)', glowClass: 'neon-cyan', icon: 'PY', description: 'Simple yet powerful' },
  { id: 'c', name: 'C', color: 'hsl(150, 100%, 50%)', glowClass: 'neon-green', icon: 'C', description: 'The foundation of computing' },
  { id: 'cpp', name: 'C++', color: 'hsl(270, 100%, 65%)', glowClass: 'neon-purple', icon: 'C+', description: 'Power and performance' },
  { id: 'java', name: 'Java', color: 'hsl(25, 100%, 55%)', glowClass: 'neon-orange', icon: 'JV', description: 'Write once, run anywhere' },
];

export const HINT_COST = 10;
