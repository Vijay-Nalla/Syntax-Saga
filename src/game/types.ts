export type Language = 'javascript' | 'python' | 'c' | 'cpp' | 'java';

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
}

export interface Platform {
  x: number;
  y: number;
  width: number;
  height: number;
  type: 'normal' | 'moving' | 'breakable';
}

export interface EnemySpawn {
  x: number;
  y: number;
  type: 'bug' | 'glitch' | 'virus';
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
}

export interface GameState {
  screen: 'title' | 'language-select' | 'playing' | 'challenge' | 'game-over' | 'level-complete' | 'paused';
  player: PlayerState;
  currentLevel: number;
  currentQuestion: Question | null;
  isPaused: boolean;
}

export const LANGUAGES: LanguageInfo[] = [
  { id: 'javascript', name: 'JavaScript', color: 'hsl(50, 100%, 55%)', glowClass: 'neon-yellow', icon: 'JS', description: 'The language of the web' },
  { id: 'python', name: 'Python', color: 'hsl(190, 100%, 50%)', glowClass: 'neon-cyan', icon: 'PY', description: 'Simple yet powerful' },
  { id: 'c', name: 'C', color: 'hsl(150, 100%, 50%)', glowClass: 'neon-green', icon: 'C', description: 'The foundation of computing' },
  { id: 'cpp', name: 'C++', color: 'hsl(270, 100%, 65%)', glowClass: 'neon-purple', icon: 'C+', description: 'Power and performance' },
  { id: 'java', name: 'Java', color: 'hsl(25, 100%, 55%)', glowClass: 'neon-orange', icon: 'JV', description: 'Write once, run anywhere' },
];
