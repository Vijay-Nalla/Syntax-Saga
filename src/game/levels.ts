import { LevelData, Platform, CoinSpawn, EnemySpawn, TerminalSpawn, PipeSpawn, EnemyType } from './types';

// ---- Grid & Physics Constants ----
const GRID = 40;
const GROUND_Y = 500;
const CANVAS_W = 2400;
const SINGLE_JUMP_H = 120;
const DOUBLE_JUMP_H = 180;
const MAX_HORIZ_JUMP = 200; // max horizontal distance at full run speed

function snap(v: number): number { return Math.round(v / GRID) * GRID; }
function clamp(v: number, min: number, max: number): number { return Math.max(min, Math.min(max, v)); }

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

interface TierCfg {
  platWidth: [number, number];
  maxDy: number;
  maxDx: number;
  minSegments: number;
}

const TIER_CONFIG: Record<Tier, TierCfg> = {
  early:    { platWidth: [160, 280], maxDy: SINGLE_JUMP_H * 0.6,  maxDx: MAX_HORIZ_JUMP * 0.5, minSegments: 3 },
  mid:      { platWidth: [120, 200], maxDy: SINGLE_JUMP_H * 0.9,  maxDx: MAX_HORIZ_JUMP * 0.75, minSegments: 4 },
  advanced: { platWidth: [80, 160],  maxDy: DOUBLE_JUMP_H * 0.8,  maxDx: MAX_HORIZ_JUMP * 0.95, minSegments: 5 },
};

// ---- Segment types ----
interface Segment {
  platforms: Platform[];
  endX: number;
  endY: number;
}

type SegmentGen = (sx: number, sy: number, cfg: TierCfg, rand: () => number) => Segment;

function platW(cfg: TierCfg, rand: () => number): number {
  return snap(cfg.platWidth[0] + rand() * (cfg.platWidth[1] - cfg.platWidth[0]));
}

// 1. Stair ascending — evenly spaced steps going up
const stairAscend: SegmentGen = (sx, sy, cfg, rand) => {
  const steps = 3 + Math.floor(rand() * 2);
  const plats: Platform[] = [];
  let cx = sx, cy = sy;
  for (let i = 0; i < steps; i++) {
    const w = platW(cfg, rand);
    const dx = snap(80 + rand() * (cfg.maxDx * 0.5));
    const dy = snap(40 + rand() * 40);
    cx += dx;
    cy = snap(clamp(cy - dy, 160, GROUND_Y - 100));
    plats.push({ x: cx, y: cy, width: w, height: 20, type: 'normal' });
  }
  return { platforms: plats, endX: cx + plats[plats.length - 1].width + 40, endY: cy };
};

// 2. Stair descending
const stairDescend: SegmentGen = (sx, sy, cfg, rand) => {
  const steps = 3 + Math.floor(rand() * 2);
  const plats: Platform[] = [];
  let cx = sx, cy = sy;
  for (let i = 0; i < steps; i++) {
    const w = platW(cfg, rand);
    const dx = snap(80 + rand() * (cfg.maxDx * 0.5));
    const dy = snap(30 + rand() * 40);
    cx += dx;
    cy = snap(clamp(cy + dy, 200, GROUND_Y - 80));
    plats.push({ x: cx, y: cy, width: w, height: 20, type: 'normal' });
  }
  return { platforms: plats, endX: cx + plats[plats.length - 1].width + 40, endY: cy };
};

// 3. Zigzag alternating left-right climb
const zigzag: SegmentGen = (sx, sy, cfg, rand) => {
  const count = 4 + Math.floor(rand() * 2);
  const plats: Platform[] = [];
  let cx = sx, cy = sy;
  for (let i = 0; i < count; i++) {
    const w = platW(cfg, rand);
    // alternate: advance forward but offset x slightly back on odd steps
    const forwardDx = snap(60 + rand() * 60);
    const lateralShift = i % 2 === 0 ? forwardDx : snap(20 + rand() * 30);
    cx = snap(clamp(cx + lateralShift, 40, CANVAS_W - 240));
    cy = snap(clamp(cy - 30 - rand() * 40, 160, GROUND_Y - 100));
    plats.push({ x: cx, y: cy, width: w, height: 20, type: 'normal' });
  }
  return { platforms: plats, endX: cx + 200, endY: cy };
};

// 4. Tower climb — stacked vertically with small horizontal offsets
const towerClimb: SegmentGen = (sx, sy, cfg, rand) => {
  const count = 3 + Math.floor(rand() * 2);
  const plats: Platform[] = [];
  let cy = sy;
  for (let i = 0; i < count; i++) {
    const w = snap(Math.max(80, cfg.platWidth[0] * 0.7 + rand() * 40));
    const offsetX = snap((i % 2 === 0 ? 0 : 60) + rand() * 40);
    cy = snap(clamp(cy - 50 - rand() * 40, 120, GROUND_Y - 120));
    plats.push({ x: sx + offsetX, y: cy, width: w, height: 20, type: 'normal' });
  }
  return { platforms: plats, endX: sx + 280, endY: cy };
};

// 5. Wide bridge rest area
const wideBridge: SegmentGen = (sx, sy, cfg, rand) => {
  const w = snap(280 + rand() * 160);
  const y = snap(clamp(sy - rand() * 20, 200, GROUND_Y - 80));
  return {
    platforms: [{ x: snap(sx + 40), y, width: w, height: 20, type: 'normal' }],
    endX: snap(sx + 40 + w + 80),
    endY: y,
  };
};

// 6. Gap sequence — spaced platforms requiring precise jumps
const gapSequence: SegmentGen = (sx, sy, cfg, rand) => {
  const count = 2 + Math.floor(rand() * 2);
  const plats: Platform[] = [];
  let cx = sx;
  for (let i = 0; i < count; i++) {
    const w = platW(cfg, rand);
    const gap = snap(cfg.maxDx * 0.4 + rand() * cfg.maxDx * 0.5);
    cx += gap;
    const dy = snap(-10 - rand() * (cfg.maxDy * 0.5));
    const y = snap(clamp(sy + dy, 160, GROUND_Y - 80));
    plats.push({ x: cx, y, width: w, height: 20, type: 'normal' });
  }
  const lastPlat = plats[plats.length - 1];
  return { platforms: plats, endX: lastPlat.x + lastPlat.width + 60, endY: lastPlat.y };
};

// 7. Elevated corridor — flat run at height with small steps down at end
const elevatedCorridor: SegmentGen = (sx, sy, cfg, rand) => {
  const plats: Platform[] = [];
  const h = snap(clamp(sy - 60 - rand() * 40, 160, GROUND_Y - 120));
  const w1 = snap(200 + rand() * 120);
  plats.push({ x: snap(sx), y: h, width: w1, height: 20, type: 'normal' });
  // step down
  const w2 = platW(cfg, rand);
  plats.push({ x: snap(sx + w1 + 60), y: snap(h + 40 + rand() * 30), width: w2, height: 20, type: 'normal' });
  return { platforms: plats, endX: snap(sx + w1 + 60 + w2 + 40), endY: plats[1].y };
};

// 8. Pyramid — platforms forming a pyramid shape
const pyramid: SegmentGen = (sx, sy, cfg, rand) => {
  const plats: Platform[] = [];
  const baseW = snap(240 + rand() * 80);
  const midW = snap(160 + rand() * 40);
  const topW = snap(80 + rand() * 40);
  const baseY = snap(clamp(sy - 20, 200, GROUND_Y - 100));
  plats.push({ x: snap(sx), y: baseY, width: baseW, height: 20, type: 'normal' });
  plats.push({ x: snap(sx + (baseW - midW) / 2), y: snap(baseY - 60 - rand() * 20), width: midW, height: 20, type: 'normal' });
  plats.push({ x: snap(sx + (baseW - topW) / 2), y: snap(baseY - 120 - rand() * 20), width: topW, height: 20, type: 'normal' });
  return { platforms: plats, endX: snap(sx + baseW + 80), endY: plats[2].y };
};

const ALL_SEGMENTS: SegmentGen[] = [
  stairAscend, stairDescend, zigzag, towerClimb,
  wideBridge, gapSequence, elevatedCorridor, pyramid,
];

// ---- Enemy types by difficulty ----
const ENEMY_TYPES: EnemyType[] = ['syntax-error', 'logical-error', 'runtime-error', 'debug-ghost', 'virus-bug'];

// ---- Underground layout generator ----
function generateUndergroundPlatforms(levelNum: number, rand: () => number): Platform[] {
  const platforms: Platform[] = [
    // Underground ground at y=550 (below main ground)
    { x: 0, y: 550, width: CANVAS_W, height: 100, type: 'normal' },
  ];
  const tier = getTier(levelNum);
  const cfg = TIER_CONFIG[tier];
  // Simpler layout: a few elevated platforms
  let cx = snap(100);
  for (let i = 0; i < 4; i++) {
    const w = platW(cfg, rand);
    const y = snap(400 - rand() * 120);
    platforms.push({ x: cx, y, width: w, height: 20, type: 'normal' });
    cx += snap(w + 80 + rand() * 100);
    if (cx > CANVAS_W - 300) break;
  }
  return platforms;
}

// ---- Level generator ----
function generateLevel(levelNum: number) {
  const rand = seededRandom(levelNum * 7919);
  const tier = getTier(levelNum);
  const cfg = TIER_CONFIG[tier];

  // Ground platform
  const platforms: Platform[] = [
    { x: 0, y: GROUND_Y, width: CANVAS_W, height: 100, type: 'normal' },
  ];

  // Build level from non-repeating segments
  const usedSegments = new Set<number>();
  let cursorX = snap(120);
  let cursorY = GROUND_Y - 80;

  for (let i = 0; i < cfg.minSegments; i++) {
    let segIdx: number;
    let attempts = 0;
    do {
      segIdx = Math.floor(rand() * ALL_SEGMENTS.length);
      attempts++;
    } while (usedSegments.has(segIdx) && attempts < 20 && usedSegments.size < ALL_SEGMENTS.length);
    usedSegments.add(segIdx);
    if (usedSegments.size >= ALL_SEGMENTS.length) usedSegments.clear();

    const segment = ALL_SEGMENTS[segIdx](cursorX, cursorY, cfg, rand);
    platforms.push(...segment.platforms);
    cursorX = segment.endX;
    cursorY = clamp(segment.endY, 200, GROUND_Y - 80);

    if (cursorX > CANVAS_W - 300) break;
  }

  // Coins on platforms + ground
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

  // Enemies
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

  // Pipes from level 3+ — auto-entry pipe on ground
  const pipes: PipeSpawn[] = [];
  if (levelNum >= 3) {
    const pipeX = snap(800 + rand() * 600);
    // Entry pipe: player lands on it → auto teleport to underground
    pipes.push({ x: pipeX, y: GROUND_Y - 50, targetX: 100, targetY: 500, isReturn: false });
    // Return pipe inside underground
    pipes.push({ x: snap(pipeX + 600), y: 500, targetX: pipeX + 80, targetY: GROUND_Y - 60, isReturn: true });
  }

  // Underground platforms for this level
  const undergroundPlatforms = levelNum >= 3 ? generateUndergroundPlatforms(levelNum, rand) : [];

  // Underground coins
  const undergroundCoins: CoinSpawn[] = [];
  if (levelNum >= 3) {
    for (const plat of undergroundPlatforms) {
      if (plat.y >= 550) continue;
      for (let c = 0; c < 2 + Math.floor(rand() * 2); c++) {
        undergroundCoins.push({ x: plat.x + 20 + c * 30, y: plat.y - 30 });
      }
    }
    // Bonus ground coins
    for (let i = 0; i < 4; i++) {
      undergroundCoins.push({ x: snap(150 + rand() * 1500), y: 510 });
    }
  }

  return { platforms, coins, enemies, terminals, pipes, undergroundPlatforms, undergroundCoins };
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

export function getLevelData(levelNum: number): LevelData & { undergroundPlatforms: Platform[]; undergroundCoins: CoinSpawn[] } {
  const { platforms, coins, enemies, terminals, pipes, undergroundPlatforms, undergroundCoins } = generateLevel(levelNum);
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
    undergroundPlatforms,
    undergroundCoins,
  };
}
