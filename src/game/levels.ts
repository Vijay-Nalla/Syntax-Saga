import { LevelData, Platform, CoinSpawn, EnemySpawn, TerminalSpawn, PipeSpawn, EnemyType } from './types';

// ---- Constants ----
const GRID = 40;
const GROUND_Y = 500;
const CANVAS_W = 2400;

// Only TWO platform heights
const PLAT_HEIGHT_LOW = 400;   // low platforms
const PLAT_HEIGHT_HIGH = 300;  // high platforms (reachable with double jump from low)

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

interface TierCfg {
  platWidthMin: number;
  platWidthMax: number;
  movingChance: number;   // chance a platform is moving
  movingRange: number;    // how far moving platforms travel
  movingSpeed: number;    // pixels per frame
}

const TIER_CONFIG: Record<Tier, TierCfg> = {
  early:    { platWidthMin: 200, platWidthMax: 320, movingChance: 0.15, movingRange: 60,  movingSpeed: 0.8 },
  mid:      { platWidthMin: 160, platWidthMax: 240, movingChance: 0.25, movingRange: 80,  movingSpeed: 1 },
  advanced: { platWidthMin: 120, platWidthMax: 200, movingChance: 0.4,  movingRange: 120, movingSpeed: 1.5 },
};

// ---- Enemy types ----
const ENEMY_TYPES: EnemyType[] = ['syntax-error', 'logical-error', 'runtime-error', 'debug-ghost', 'virus-bug'];

// ---- Segment types for variety ----
type SegmentType = 'stair-up' | 'stair-down' | 'zigzag' | 'bridge' | 'tower' | 'gap-run';

interface SegmentResult {
  platforms: Platform[];
  endX: number;
}

function makePlatform(x: number, y: number, width: number, cfg: TierCfg, rand: () => number): Platform {
  const isMoving = rand() < cfg.movingChance;
  const baseX = snap(x);
  const plat: Platform = {
    x: snap(x),
    y,
    width: snap(width),
    height: 20,
    type: isMoving ? 'moving' : 'normal',
  };
  if (isMoving) {
    plat.baseX = baseX;
    plat.range = cfg.movingRange;
    plat.speed = cfg.movingSpeed;
    plat.dir = rand() < 0.5 ? -1 : 1;
    plat.prevX = baseX;
  }
  return plat;
}

function platWidth(cfg: TierCfg, rand: () => number): number {
  return snap(cfg.platWidthMin + rand() * (cfg.platWidthMax - cfg.platWidthMin));
}

// Segment generators — all use only PLAT_HEIGHT_LOW and PLAT_HEIGHT_HIGH
function generateSegment(type: SegmentType, startX: number, cfg: TierCfg, rand: () => number): SegmentResult {
  const plats: Platform[] = [];
  let cx = startX;

  switch (type) {
    case 'stair-up': {
      // Low → High → Low → High staircase
      const steps = 4;
      for (let i = 0; i < steps; i++) {
        const w = platWidth(cfg, rand);
        const y = i % 2 === 0 ? PLAT_HEIGHT_LOW : PLAT_HEIGHT_HIGH;
        plats.push(makePlatform(cx, y, w, cfg, rand));
        cx += w + snap(60 + rand() * 40);
      }
      break;
    }
    case 'stair-down': {
      // High → Low → High → Low descending
      const steps = 4;
      for (let i = 0; i < steps; i++) {
        const w = platWidth(cfg, rand);
        const y = i % 2 === 0 ? PLAT_HEIGHT_HIGH : PLAT_HEIGHT_LOW;
        plats.push(makePlatform(cx, y, w, cfg, rand));
        cx += w + snap(60 + rand() * 40);
      }
      break;
    }
    case 'zigzag': {
      // Alternating heights with tighter spacing
      const count = 5;
      for (let i = 0; i < count; i++) {
        const w = platWidth(cfg, rand);
        const y = i % 2 === 0 ? PLAT_HEIGHT_LOW : PLAT_HEIGHT_HIGH;
        plats.push(makePlatform(cx, y, w, cfg, rand));
        cx += w + snap(40 + rand() * 40);
      }
      break;
    }
    case 'bridge': {
      // One long low platform (rest area)
      const w = snap(360 + rand() * 160);
      plats.push(makePlatform(cx, PLAT_HEIGHT_LOW, w, cfg, rand));
      cx += w + snap(80);
      break;
    }
    case 'tower': {
      // Vertical stack: low then high directly above with small offset
      const w1 = platWidth(cfg, rand);
      plats.push(makePlatform(cx, PLAT_HEIGHT_LOW, w1, cfg, rand));
      const offset = snap(20 + rand() * 40);
      const w2 = platWidth(cfg, rand);
      plats.push(makePlatform(cx + offset, PLAT_HEIGHT_HIGH, w2, cfg, rand));
      cx += Math.max(w1, w2 + offset) + snap(80 + rand() * 40);
      break;
    }
    case 'gap-run': {
      // Platforms at same height with gaps between
      const count = 3;
      const y = rand() > 0.5 ? PLAT_HEIGHT_LOW : PLAT_HEIGHT_HIGH;
      for (let i = 0; i < count; i++) {
        const w = platWidth(cfg, rand);
        plats.push(makePlatform(cx, y, w, cfg, rand));
        cx += w + snap(80 + rand() * 60);
      }
      break;
    }
  }

  return { platforms: plats, endX: cx };
}

const ALL_SEGMENT_TYPES: SegmentType[] = ['stair-up', 'stair-down', 'zigzag', 'bridge', 'tower', 'gap-run'];

// ---- Underground layout generator ----
function generateUndergroundPlatforms(levelNum: number, rand: () => number): Platform[] {
  const cfg = TIER_CONFIG[getTier(levelNum)];
  const platforms: Platform[] = [
    // Underground ground
    { x: 0, y: 550, width: CANVAS_W, height: 100, type: 'normal' },
  ];
  
  // Add structured platforms at two heights (420 and 340 underground)
  const UG_LOW = 440;
  const UG_HIGH = 360;
  let cx = snap(100);
  for (let i = 0; i < 5; i++) {
    const w = platWidth(cfg, rand);
    const y = i % 2 === 0 ? UG_LOW : UG_HIGH;
    platforms.push(makePlatform(cx, y, w, cfg, rand));
    cx += w + snap(60 + rand() * 60);
    if (cx > CANVAS_W - 300) break;
  }
  return platforms;
}

// ---- Underground enemies ----
function generateUndergroundEnemies(levelNum: number, rand: () => number): EnemySpawn[] {
  const enemies: EnemySpawn[] = [];
  const count = 2 + Math.floor(levelNum / 5);
  const availableTypes = ENEMY_TYPES.slice(0, Math.min(2 + Math.floor(levelNum / 5), ENEMY_TYPES.length));
  for (let i = 0; i < count; i++) {
    enemies.push({
      x: snap(200 + rand() * 1600),
      y: 520,  // on underground ground
      type: availableTypes[Math.floor(rand() * availableTypes.length)],
      patrolRange: 60 + Math.floor(rand() * 100),
    });
  }
  return enemies;
}

// ---- Level generator ----
function generateLevel(levelNum: number) {
  const rand = seededRandom(levelNum * 7919);
  const tier = getTier(levelNum);
  const cfg = TIER_CONFIG[tier];

  // Ground platform
  let platforms: Platform[] = [
    { x: 0, y: GROUND_Y, width: CANVAS_W, height: 100, type: 'normal' },
  ];

  // Build level from non-repeating segments
  const usedSegments = new Set<number>();
  let cursorX = snap(120);
  const segmentCount = tier === 'early' ? 3 : tier === 'mid' ? 4 : 5;

  for (let i = 0; i < segmentCount; i++) {
    let segIdx: number;
    let attempts = 0;
    do {
      segIdx = Math.floor(rand() * ALL_SEGMENT_TYPES.length);
      attempts++;
    } while (usedSegments.has(segIdx) && attempts < 20 && usedSegments.size < ALL_SEGMENT_TYPES.length);
    usedSegments.add(segIdx);
    if (usedSegments.size >= ALL_SEGMENT_TYPES.length) usedSegments.clear();

    const segment = generateSegment(ALL_SEGMENT_TYPES[segIdx], cursorX, cfg, rand);
    platforms.push(...segment.platforms);
    cursorX = segment.endX;
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

  // Terminals (aligned to question pool: 4 per level)
  const terminalCount = 4;
  const terminals: TerminalSpawn[] = [];
  for (let i = 0; i < terminalCount; i++) {
    terminals.push({
      x: snap(400 + i * Math.floor(1600 / terminalCount) + rand() * 80),
      // Place terminals (question blocks) directly on ground (no floating)
      // Terminal height ≈ 40px, so top at groundY - 40 aligns bottom with ground
      y: GROUND_Y - 40,
      questionIndex: i,
    });
  }

  // Underground (generate before pipes so we can check for open spots)
  let undergroundPlatforms = levelNum >= 3 ? generateUndergroundPlatforms(levelNum, rand) : [];
  const undergroundEnemies = levelNum >= 3 ? generateUndergroundEnemies(levelNum, rand) : [];

  // Underground coins
  const undergroundCoins: CoinSpawn[] = [];
  if (levelNum >= 3) {
    for (const plat of undergroundPlatforms) {
      if (plat.y >= 550) continue;
      for (let c = 0; c < 2 + Math.floor(rand() * 2); c++) {
        undergroundCoins.push({ x: plat.x + 20 + c * 30, y: plat.y - 30 });
      }
    }
    for (let i = 0; i < 4; i++) {
      undergroundCoins.push({ x: snap(150 + rand() * 1500), y: 510 });
    }
  }

  // Pipes from level 3+ — only ONE entry pipe on ground, ONE return pipe underground
  const pipes: PipeSpawn[] = [];
  if (levelNum >= 3) {
    const isOpenSpot = (testX: number, allPlats: Platform[], floorY: number): boolean => {
      for (const plat of allPlats) {
        if (plat.y >= floorY) continue;
        // widen horizontal clearance around pipe
        if (testX > plat.x - 120 && testX < plat.x + plat.width + 120) return false;
      }
      return true;
    };
    const clearCorridor = (allPlats: Platform[], pipeX: number, floorY: number): Platform[] => {
      const half = 90; // ensure a clear corridor around pipe
      const minX = pipeX - half;
      const maxX = pipeX + half;
      return allPlats.filter(plat => {
        // keep ground/floor platforms
        if (plat.y >= floorY) return true;
        // remove any platform that overlaps corridor horizontally
        const overlap = !(plat.x + plat.width < minX || plat.x > maxX);
        return !overlap;
      });
    };

    let entryX = snap(800);
    for (let attempt = 0; attempt < 30; attempt++) {
      const candidate = snap(300 + rand() * 1600);
      if (isOpenSpot(candidate, platforms, GROUND_Y)) { entryX = candidate; break; }
    }

    pipes.push({ x: entryX, y: GROUND_Y - 50, targetX: 100, targetY: 550 - 50, isReturn: false });
    // remove any obstructing platforms above entry pipe
    platforms = clearCorridor(platforms, entryX, GROUND_Y);

    let exitX = snap(entryX + 800);
    if (exitX > CANVAS_W - 200) exitX = snap(CANVAS_W - 300);
    for (let attempt = 0; attempt < 30; attempt++) {
      const candidate = snap(400 + rand() * 1600);
      if (isOpenSpot(candidate, undergroundPlatforms, 550)) { exitX = candidate; break; }
    }
    pipes.push({ x: exitX, y: 550 - 50, targetX: entryX + 80, targetY: GROUND_Y - 60, isReturn: true });
    // remove any obstructing platforms above return pipe underground
    undergroundPlatforms = clearCorridor(undergroundPlatforms, exitX, 550);
  }

  return { platforms, coins, enemies, terminals, pipes, undergroundPlatforms, undergroundCoins, undergroundEnemies };
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

export function getLevelData(levelNum: number): LevelData & { undergroundPlatforms: Platform[]; undergroundCoins: CoinSpawn[]; undergroundEnemies: EnemySpawn[] } {
  const { platforms, coins, enemies, terminals, pipes, undergroundPlatforms, undergroundCoins, undergroundEnemies } = generateLevel(levelNum);
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
    undergroundEnemies,
  };
}
