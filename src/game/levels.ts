import { LevelData, Platform, CoinSpawn, EnemySpawn, TerminalSpawn } from './types';

const GROUND_Y = 500;
const CANVAS_W = 2400;

function generateLevel(levelNum: number): { platforms: Platform[]; coins: CoinSpawn[]; enemies: EnemySpawn[]; terminals: TerminalSpawn[] } {
  const platforms: Platform[] = [
    // Ground
    { x: 0, y: GROUND_Y, width: CANVAS_W, height: 100, type: 'normal' },
    // Floating platforms
    { x: 200, y: 380, width: 120, height: 20, type: 'normal' },
    { x: 450, y: 300, width: 120, height: 20, type: 'normal' },
    { x: 700, y: 350, width: 150, height: 20, type: 'normal' },
    { x: 950, y: 280, width: 120, height: 20, type: 'normal' },
    { x: 1200, y: 320, width: 130, height: 20, type: 'normal' },
    { x: 1500, y: 250, width: 140, height: 20, type: 'normal' },
    { x: 1800, y: 350, width: 120, height: 20, type: 'normal' },
    { x: 2050, y: 300, width: 150, height: 20, type: 'normal' },
    // Gap in ground
    { x: 800, y: GROUND_Y, width: -150, height: 100, type: 'normal' },
  ];

  const coins: CoinSpawn[] = [
    { x: 230, y: 340 }, { x: 260, y: 340 },
    { x: 480, y: 260 }, { x: 510, y: 260 },
    { x: 730, y: 310 }, { x: 760, y: 310 }, { x: 790, y: 310 },
    { x: 980, y: 240 }, { x: 1010, y: 240 },
    { x: 1530, y: 210 }, { x: 1560, y: 210 },
    { x: 1830, y: 310 },
    { x: 2080, y: 260 }, { x: 2110, y: 260 },
    // Ground coins
    { x: 100, y: 460 }, { x: 130, y: 460 }, { x: 160, y: 460 },
    { x: 400, y: 460 }, { x: 1100, y: 460 }, { x: 1400, y: 460 },
  ];

  const enemies: EnemySpawn[] = [
    { x: 350, y: GROUND_Y - 30, type: 'bug', patrolRange: 100 },
    { x: 600, y: GROUND_Y - 30, type: 'glitch', patrolRange: 80 },
    { x: 1000, y: GROUND_Y - 30, type: 'bug', patrolRange: 120 },
    { x: 1600, y: GROUND_Y - 30, type: 'virus', patrolRange: 100 },
  ];

  const terminals: TerminalSpawn[] = [
    { x: 500, y: GROUND_Y - 60, questionIndex: 0 },
    { x: 1250, y: GROUND_Y - 60, questionIndex: 1 },
    { x: 2100, y: GROUND_Y - 60, questionIndex: 2 },
  ];

  return { platforms, coins, enemies, terminals };
}

const LEVEL_TOPICS = [
  'Console Output', 'Variables', 'Data Types', 'Operators', 'Comparisons',
  'If Statements', 'Else & Else If', 'Switch', 'Mixed Basics', 'Mini Boss: Syntax Goblin',
  'For Loops', 'While Loops', 'Do-While', 'Loop Debugging', 'Break & Continue',
  'Nested Loops', 'Patterns', 'Timer Loops', 'Loop Mastery', 'Boss: Loop Destroyer',
];

const PHASE_NAMES = ['The Syntax Wastes', 'Loop Labyrinth', 'Function Fortress', 'Data Citadel', 'The Core'];

export function getLevelData(levelNum: number): LevelData {
  const { platforms, coins, enemies, terminals } = generateLevel(levelNum);
  const phase = Math.floor((levelNum - 1) / 10);
  const isBoss = levelNum % 10 === 0;
  const topic = LEVEL_TOPICS[Math.min(levelNum - 1, LEVEL_TOPICS.length - 1)];

  return {
    id: levelNum,
    name: `${PHASE_NAMES[phase]} - Level ${levelNum}`,
    topic,
    phase: phase + 1,
    isBoss,
    bossName: isBoss ? ['Syntax Goblin', 'Loop Destroyer', 'Function Master', 'Data Overlord', 'The Bug King'][phase] : undefined,
    questions: [],
    platformLayout: platforms,
    enemies,
    coins,
    terminals,
  };
}
