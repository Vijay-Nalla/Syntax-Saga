import { LevelData, Platform, CoinSpawn, EnemySpawn, TerminalSpawn, PipeSpawn, EnemyType } from './types';

const GROUND_Y = 500;
const CANVAS_W = 2400;

// Seeded random for deterministic but varied layouts per level
function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

// Multiple platform layout templates
const LAYOUT_TEMPLATES = [
  // Template A: staircase ascending
  (rand: () => number, offset: number) => [
    { x: 200 + offset, y: 400 - rand() * 40, width: 100 + rand() * 40, height: 20, type: 'normal' as const },
    { x: 420 + offset, y: 340 - rand() * 40, width: 110 + rand() * 30, height: 20, type: 'normal' as const },
    { x: 650 + offset, y: 280 - rand() * 40, width: 120 + rand() * 30, height: 20, type: 'normal' as const },
  ],
  // Template B: zigzag
  (rand: () => number, offset: number) => [
    { x: 180 + offset, y: 350 - rand() * 30, width: 130 + rand() * 30, height: 20, type: 'normal' as const },
    { x: 400 + offset, y: 420 - rand() * 30, width: 100 + rand() * 40, height: 20, type: 'normal' as const },
    { x: 600 + offset, y: 300 - rand() * 40, width: 140 + rand() * 20, height: 20, type: 'normal' as const },
  ],
  // Template C: floating islands
  (rand: () => number, offset: number) => [
    { x: 250 + offset, y: 320 - rand() * 50, width: 80 + rand() * 40, height: 20, type: 'normal' as const },
    { x: 500 + offset, y: 250 - rand() * 40, width: 90 + rand() * 30, height: 20, type: 'normal' as const },
    { x: 720 + offset, y: 380 - rand() * 30, width: 100 + rand() * 30, height: 20, type: 'normal' as const },
  ],
  // Template D: wide platforms
  (rand: () => number, offset: number) => [
    { x: 200 + offset, y: 380 - rand() * 40, width: 200 + rand() * 50, height: 20, type: 'normal' as const },
    { x: 550 + offset, y: 300 - rand() * 50, width: 180 + rand() * 40, height: 20, type: 'normal' as const },
  ],
];

const ENEMY_TYPES: EnemyType[] = ['syntax-error', 'logical-error', 'runtime-error', 'debug-ghost', 'virus-bug'];

function generateLevel(levelNum: number): {
  platforms: Platform[];
  coins: CoinSpawn[];
  enemies: EnemySpawn[];
  terminals: TerminalSpawn[];
  pipes: PipeSpawn[];
} {
  const rand = seededRandom(levelNum * 7919);

  // Ground
  const platforms: Platform[] = [
    { x: 0, y: GROUND_Y, width: CANVAS_W, height: 100, type: 'normal' },
  ];

  // Pick 2-3 layout templates and place them across the map
  const templateCount = 2 + Math.floor(rand() * 2);
  for (let i = 0; i < templateCount; i++) {
    const templateIdx = Math.floor(rand() * LAYOUT_TEMPLATES.length);
    const offset = i * 700 + Math.floor(rand() * 100);
    const generated = LAYOUT_TEMPLATES[templateIdx](rand, offset);
    platforms.push(...generated);
  }

  // Add some extra random platforms
  const extraPlatforms = 2 + Math.floor(rand() * 3);
  for (let i = 0; i < extraPlatforms; i++) {
    platforms.push({
      x: 1400 + Math.floor(rand() * 800),
      y: 250 + Math.floor(rand() * 200),
      width: 80 + Math.floor(rand() * 100),
      height: 20,
      type: 'normal',
    });
  }

  // Coins on platforms and ground
  const coins: CoinSpawn[] = [];
  for (const plat of platforms) {
    if (plat.y >= GROUND_Y) continue;
    const coinCount = 1 + Math.floor(rand() * 3);
    for (let c = 0; c < coinCount; c++) {
      coins.push({ x: plat.x + 20 + c * 30, y: plat.y - 40 });
    }
  }
  // Ground coins
  for (let i = 0; i < 6; i++) {
    coins.push({ x: 100 + Math.floor(rand() * 2000), y: GROUND_Y - 40 });
  }

  // Enemies - difficulty scales with level
  const enemyCount = 3 + Math.floor(levelNum / 5);
  const enemies: EnemySpawn[] = [];
  const availableTypes = ENEMY_TYPES.slice(0, Math.min(2 + Math.floor(levelNum / 5), ENEMY_TYPES.length));
  for (let i = 0; i < enemyCount; i++) {
    const etype = availableTypes[Math.floor(rand() * availableTypes.length)];
    enemies.push({
      x: 300 + Math.floor(rand() * 1800),
      y: GROUND_Y - 30,
      type: etype,
      patrolRange: 60 + Math.floor(rand() * 100),
    });
  }

  // Terminals
  const terminalCount = 2 + Math.min(Math.floor(levelNum / 3), 3);
  const terminals: TerminalSpawn[] = [];
  for (let i = 0; i < terminalCount; i++) {
    terminals.push({
      x: 400 + i * Math.floor(1600 / terminalCount) + Math.floor(rand() * 100),
      y: GROUND_Y - 60,
      questionIndex: i,
    });
  }

  // Pipes - appear from level 3+
  const pipes: PipeSpawn[] = [];
  if (levelNum >= 3) {
    const pipeX = 800 + Math.floor(rand() * 600);
    pipes.push({
      x: pipeX,
      y: GROUND_Y - 50,
      targetX: pipeX,
      targetY: GROUND_Y + 200, // underground
      isReturn: false,
    });
    // Return pipe in underground
    pipes.push({
      x: pipeX + 400,
      y: GROUND_Y + 350,
      targetX: pipeX + 100,
      targetY: GROUND_Y - 60,
      isReturn: true,
    });
  }

  return { platforms, coins, enemies, terminals, pipes };
}

const LEVEL_TOPICS = [
  'Console Output', 'Variables', 'Data Types', 'Operators', 'Comparisons',
  'If Statements', 'Else & Else If', 'Switch', 'Mixed Basics', 'Mini Boss: Syntax Goblin',
  'For Loops', 'While Loops', 'Do-While', 'Loop Debugging', 'Break & Continue',
  'Nested Loops', 'Patterns', 'Timer Loops', 'Loop Mastery', 'Boss: Loop Destroyer',
  'Functions Basics', 'Parameters', 'Return Statements', 'Arrow Functions', 'Callbacks',
  'Function Expressions', 'Scope', 'Closures', 'Recursion', 'Boss: Function Master',
  'Array Creation', 'Push & Pop', 'Map', 'Filter', 'Reduce',
  'Object Properties', 'Nested Objects', 'Destructuring', 'Spread Operator', 'Boss: Data Overlord',
  'DOM Manipulation', 'Event Listeners', 'Timers', 'Promises', 'Async/Await',
  'Fetch API', 'Error Handling', 'Debugging', 'Rapid Challenges', 'Final Boss: Bug King',
];

const PHASE_NAMES = ['The Syntax Wastes', 'Loop Labyrinth', 'Function Fortress', 'Data Citadel', 'The Core'];

export function getLevelData(levelNum: number): LevelData {
  const { platforms, coins, enemies, terminals, pipes } = generateLevel(levelNum);
  const phase = Math.floor((levelNum - 1) / 10);
  const isBoss = levelNum % 10 === 0;
  const topic = LEVEL_TOPICS[Math.min(levelNum - 1, LEVEL_TOPICS.length - 1)];

  return {
    id: levelNum,
    name: `${PHASE_NAMES[Math.min(phase, PHASE_NAMES.length - 1)]} - Level ${levelNum}`,
    topic,
    phase: phase + 1,
    isBoss,
    bossName: isBoss ? ['Syntax Goblin', 'Loop Destroyer', 'Function Master', 'Data Overlord', 'The Bug King'][Math.min(phase, 4)] : undefined,
    questions: [],
    platformLayout: platforms,
    enemies,
    coins,
    terminals,
    pipes,
  };
}
