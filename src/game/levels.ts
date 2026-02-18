import { LevelData, Platform, CoinSpawn, EnemySpawn, TerminalSpawn, PipeSpawn, EnemyType } from './types';

// ---- Grid & Physics Constants ----
const GRID = 40;            // snap unit
const GROUND_Y = 500;
const CANVAS_W = 2400;
const SINGLE_JUMP_H = 120;  // max height reachable with single jump
const DOUBLE_JUMP_H = 180;  // max height reachable with double jump
const MAX_GAP_X = 200;      // max horizontal gap (reachable at run speed)

function snap(v: number): number { return Math.round(v / GRID) * GRID; }

// Seeded random for deterministic layouts
function seededRandom(seed: number) {
  let s = seed;
  return () => { s = (s * 16807 + 0) % 2147483647; return (s - 1) / 2147483646; };
}

// ---- Difficulty tiers ----
type Tier = 'early' | 'mid' | 'advanced';
function getTier(level: number): Tier {
  if (level <= 15) return 'early';
  if (level <= 35) return 'mid';
  return 'advanced';
}

const TIER_CONFIG = {
  early:    { platWidth: [160, 240], maxDy: SINGLE_JUMP_H * 0.7, maxDx: MAX_GAP_X * 0.6, minPlats: 8 },
  mid:      { platWidth: [120, 200], maxDy: SINGLE_JUMP_H,       maxDx: MAX_GAP_X * 0.8, minPlats: 10 },
  advanced: { platWidth: [80, 160],  maxDy: DOUBLE_JUMP_H * 0.85, maxDx: MAX_GAP_X,       minPlats: 12 },
};

// ---- Structured layout segment generators ----
// Each returns platforms relative to a startX and startY, advancing cursor forward.

interface Segment {
  platforms: Platform[];
  endX: number;
  endY: number;
}

type SegmentGen = (startX: number, startY: number, tier: Tier, rand: () => number) => Segment;

// 1. Stair-step ascending
const stairAscend: SegmentGen = (sx, sy, tier, rand) => {
  const cfg = TIER_CONFIG[tier];
  const steps = 3 + Math.floor(rand() * 2);
  const platforms: Platform[] = [];
  let cx = sx, cy = sy;
  for (let i = 0; i < steps; i++) {
    const w = snap(cfg.platWidth[0] + rand() * (cfg.platWidth[1] - cfg.platWidth[0]));
    cx = snap(cx + 80 + rand() * 60);
    cy = snap(Math.max(160, cy - 40 - rand() * 40));
    platforms.push({ x: cx, y: cy, width: w, height: 20, type: 'normal' });
  }
  return { platforms, endX: cx + 160, endY: cy };
};

// 2. Stair-step descending
const stairDescend: SegmentGen = (sx, sy, tier, rand) => {
  const cfg = TIER_CONFIG[tier];
  const steps = 3 + Math.floor(rand() * 2);
  const platforms: Platform[] = [];
  let cx = sx, cy = sy;
  for (let i = 0; i < steps; i++) {
    const w = snap(cfg.platWidth[0] + rand() * (cfg.platWidth[1] - cfg.platWidth[0]));
    cx = snap(cx + 80 + rand() * 60);
    cy = snap(Math.min(GROUND_Y - 80, cy + 40 + rand() * 40));
    platforms.push({ x: cx, y: cy, width: w, height: 20, type: 'normal' });
  }
  return { platforms, endX: cx + 160, endY: cy };
};

// 3. Zigzag climb (left-right alternating)
const zigzag: SegmentGen = (sx, sy, tier, rand) => {
  const cfg = TIER_CONFIG[tier];
  const count = 4 + Math.floor(rand() * 2);
  const platforms: Platform[] = [];
  let cx = sx, cy = sy;
  for (let i = 0; i < count; i++) {
    const w = snap(cfg.platWidth[0] + rand() * (cfg.platWidth[1] - cfg.platWidth[0]));
    const dir = i % 2 === 0 ? 1 : -0.3;
    cx = snap(cx + (60 + rand() * 80) * dir);
    cx = Math.max(snap(40), Math.min(snap(CANVAS_W - 200), cx));
    cy = snap(Math.max(160, cy - 30 - rand() * 50));
    platforms.push({ x: cx, y: cy, width: w, height: 20, type: 'normal' });
  }
  return { platforms, endX: Math.max(cx + 160, sx + 300), endY: cy };
};

// 4. Vertical tower climb
const towerClimb: SegmentGen = (sx, sy, tier, rand) => {
  const cfg = TIER_CONFIG[tier];
  const count = 3 + Math.floor(rand() * 3);
  const platforms: Platform[] = [];
  let cy = sy;
  const baseX = sx;
  for (let i = 0; i < count; i++) {
    const w = snap(cfg.platWidth[0] * 0.8 + rand() * 40);
    const offsetX = snap((i % 2 === 0 ? 0 : 80) + rand() * 40);
    cy = snap(Math.max(120, cy - 60 - rand() * 30));
    platforms.push({ x: baseX + offsetX, y: cy, width: w, height: 20, type: 'normal' });
  }
  return { platforms, endX: baseX + 280, endY: cy };
};

// 5. Wide bridge (rest area)
const wideBridge: SegmentGen = (sx, sy, tier, rand) => {
  const w = snap(280 + rand() * 120);
  const y = snap(sy - 20 * rand());
  return {
    platforms: [{ x: snap(sx + 40), y, width: w, height: 20, type: 'normal' }],
    endX: snap(sx + 40 + w + 60),
    endY: y,
  };
};

// 6. Gap jump sequence (requires double jump on advanced)
const gapSequence: SegmentGen = (sx, sy, tier, rand) => {
  const cfg = TIER_CONFIG[tier];
  const count = 2 + Math.floor(rand() * 2);
  const platforms: Platform[] = [];
  let cx = sx;
  for (let i = 0; i < count; i++) {
    const w = snap(cfg.platWidth[0] + rand() * 40);
    const gap = snap(cfg.maxDx * 0.5 + rand() * cfg.maxDx * 0.4);
    cx = snap(cx + gap);
    const dy = tier === 'advanced' ? snap(-20 - rand() * 60) : snap(-10 - rand() * 30);
    const y = snap(Math.max(160, Math.min(GROUND_Y - 80, sy + dy)));
    platforms.push({ x: cx, y, width: w, height: 20, type: 'normal' });
  }
  return { platforms, endX: cx + 160, endY: platforms[platforms.length - 1]?.y ?? sy };
};

const ALL_SEGMENTS: SegmentGen[] = [stairAscend, stairDescend, zigzag, towerClimb, wideBridge, gapSequence];

// ---- Enemy types by difficulty ----
const ENEMY_TYPES: EnemyType[] = ['syntax-error', 'logical-error', 'runtime-error', 'debug-ghost', 'virus-bug'];

// ---- Level generator ----
function generateLevel(levelNum: number) {
  const rand = seededRandom(levelNum * 7919);
  const tier = getTier(levelNum);
  const cfg = TIER_CONFIG[tier];

  // Ground platform
  const platforms: Platform[] = [
    { x: 0, y: GROUND_Y, width: CANVAS_W, height: 100, type: 'normal' },
  ];

  // Build level from segments, no repeats within same level
  const usedSegments = new Set<number>();
  let cursorX = snap(120);
  let cursorY = GROUND_Y - 80;
  const segmentCount = Math.max(3, Math.floor(cfg.minPlats / 3));

  for (let i = 0; i < segmentCount; i++) {
    // Pick unused segment type
    let segIdx: number;
    let attempts = 0;
    do {
      segIdx = Math.floor(rand() * ALL_SEGMENTS.length);
      attempts++;
    } while (usedSegments.has(segIdx) && attempts < 20 && usedSegments.size < ALL_SEGMENTS.length);
    usedSegments.add(segIdx);
    if (usedSegments.size >= ALL_SEGMENTS.length) usedSegments.clear();

    const segment = ALL_SEGMENTS[segIdx](cursorX, cursorY, tier, rand);
    platforms.push(...segment.platforms);
    cursorX = segment.endX;
    cursorY = Math.min(GROUND_Y - 80, Math.max(200, segment.endY));

    // Ensure cursor advances
    if (cursorX > CANVAS_W - 300) break;
  }

  // Coins on platforms and ground
  const coins: CoinSpawn[] = [];
  for (const plat of platforms) {
    if (plat.y >= GROUND_Y) continue;
    const count = 1 + Math.floor(rand() * 3);
    for (let c = 0; c < count; c++) {
      coins.push({ x: plat.x + 20 + c * 30, y: plat.y - 30 });
    }
  }
  for (let i = 0; i < 6; i++) {
    coins.push({ x: snap(100 + rand() * 2000), y: GROUND_Y - 40 });
  }

  // Enemies scale with level
  const enemyCount = 3 + Math.floor(levelNum / 5);
  const enemies: EnemySpawn[] = [];
  const availableTypes = ENEMY_TYPES.slice(0, Math.min(2 + Math.floor(levelNum / 5), ENEMY_TYPES.length));
  for (let i = 0; i < enemyCount; i++) {
    enemies.push({
      x: snap(300 + rand() * 1800),
      y: GROUND_Y - 30,
      type: availableTypes[Math.floor(rand() * availableTypes.length)],
      patrolRange: 60 + Math.floor(rand() * 100),
    });
  }

  // Terminals
  const terminalCount = 2 + Math.min(Math.floor(levelNum / 3), 3);
  const terminals: TerminalSpawn[] = [];
  for (let i = 0; i < terminalCount; i++) {
    terminals.push({
      x: snap(400 + i * Math.floor(1600 / terminalCount) + rand() * 80),
      y: GROUND_Y - 60,
      questionIndex: i,
    });
  }

  // Pipes from level 3+
  const pipes: PipeSpawn[] = [];
  if (levelNum >= 3) {
    const pipeX = snap(800 + rand() * 600);
    pipes.push({ x: pipeX, y: GROUND_Y - 50, targetX: pipeX, targetY: GROUND_Y + 200, isReturn: false });
    pipes.push({ x: pipeX + 400, y: GROUND_Y + 350, targetX: pipeX + 100, targetY: GROUND_Y - 60, isReturn: true });
  }

  return { platforms, coins, enemies, terminals, pipes };
}

// ---- Level metadata ----
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
    enemies, coins, terminals, pipes,
  };
}
