import { useRef, useEffect, useCallback, useState } from 'react';
import { PlayerState, GameState, Language, Question, Platform, CoinSpawn, EnemySpawn, TerminalSpawn } from './types';
import { getLevelData } from './levels';
import { getQuestionsForLevel } from './questions';

// ---- Constants ----
const GRAVITY = 0.6;
const JUMP_FORCE = -13; // Slightly higher for better accessibility
const DOUBLE_JUMP_FORCE = -14; // Higher double-jump
const MOVE_SPEED = 5;
const PLAYER_W = 32;
const PLAYER_H = 48;
const CANVAS_W = 2400;
const CANVAS_H = 600;
const VIEWPORT_W = 960;
const MAX_JUMPS = 2; // Double-jump support

// ---- Entity interfaces ----
interface Enemy {
  x: number; y: number; type: string; startX: number; patrolRange: number; dir: number; alive: boolean;
}
interface Coin {
  x: number; y: number; collected: boolean;
}
interface Terminal {
  x: number; y: number; questionIndex: number; used: boolean;
}

// ---- Question tracker for non-repeating questions ----
class QuestionTracker {
  private usedIndices: Set<number> = new Set();
  private shuffled: number[] = [];
  private currentIdx = 0;

  reset(poolSize: number) {
    this.usedIndices.clear();
    this.shuffled = Array.from({ length: poolSize }, (_, i) => i);
    this.shuffle();
    this.currentIdx = 0;
  }

  private shuffle() {
    for (let i = this.shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.shuffled[i], this.shuffled[j]] = [this.shuffled[j], this.shuffled[i]];
    }
  }

  next(): number {
    if (this.currentIdx >= this.shuffled.length) {
      // All exhausted, reshuffle
      this.shuffle();
      this.currentIdx = 0;
    }
    return this.shuffled[this.currentIdx++];
  }
}

// ---- Helper: create fresh player ----
function createPlayer(): PlayerState {
  return {
    x: 50, y: 400, vx: 0, vy: 0,
    width: PLAYER_W, height: PLAYER_H,
    onGround: false, facing: 'right',
    health: 100, xp: 0, level: 1,
    language: 'javascript', coins: 0,
  };
}

export function useGameEngine(canvasRef: React.RefObject<HTMLCanvasElement | null>) {
  const [gameState, setGameState] = useState<GameState>({
    screen: 'title',
    player: createPlayer(),
    currentLevel: 1,
    currentQuestion: null,
    isPaused: false,
  });

  const keysRef = useRef<Set<string>>(new Set());
  const playerRef = useRef<PlayerState>(createPlayer());
  const enemiesRef = useRef<Enemy[]>([]);
  const coinsRef = useRef<Coin[]>([]);
  const terminalsRef = useRef<Terminal[]>([]);
  const platformsRef = useRef<Platform[]>([]);
  const cameraXRef = useRef(0);
  const animFrameRef = useRef(0);
  const screenRef = useRef<GameState['screen']>('title');
  const levelQuestionsRef = useRef<Question[]>([]);

  // Double-jump tracking
  const jumpCountRef = useRef(0);

  // Non-repeating question tracker
  const questionTrackerRef = useRef(new QuestionTracker());

  // ---- Level loading ----
  const loadLevel = useCallback((levelNum: number, language: Language) => {
    const data = getLevelData(levelNum);
    const questions = getQuestionsForLevel(language, levelNum);
    levelQuestionsRef.current = questions;
    questionTrackerRef.current.reset(questions.length);

    platformsRef.current = data.platformLayout.filter(p => p.width > 0);
    coinsRef.current = data.coins.map(c => ({ ...c, collected: false }));
    enemiesRef.current = data.enemies.map(e => ({ ...e, startX: e.x, dir: 1, alive: true }));
    terminalsRef.current = data.terminals.map(t => ({ ...t, used: false }));

    const p = createPlayer();
    p.language = language;
    p.level = levelNum;
    p.health = playerRef.current.health;
    p.xp = playerRef.current.xp;
    p.coins = playerRef.current.coins;
    playerRef.current = p;
    cameraXRef.current = 0;
    jumpCountRef.current = 0;
  }, []);

  // ---- Start game ----
  const startGame = useCallback((language: Language) => {
    const p = createPlayer();
    p.language = language;
    playerRef.current = p;
    loadLevel(1, language);
    screenRef.current = 'playing';
    setGameState(prev => ({ ...prev, screen: 'playing', player: { ...p }, currentLevel: 1 }));
  }, [loadLevel]);

  // ---- Pause / Resume ----
  const pauseGame = useCallback(() => {
    if (screenRef.current === 'playing') {
      screenRef.current = 'paused';
      setGameState(prev => ({ ...prev, screen: 'paused', isPaused: true }));
    }
  }, []);

  const resumeGame = useCallback(() => {
    if (screenRef.current === 'paused') {
      screenRef.current = 'playing';
      setGameState(prev => ({ ...prev, screen: 'playing', isPaused: false }));
    }
  }, []);

  // ---- Return to main menu ----
  const returnToMenu = useCallback(() => {
    screenRef.current = 'title';
    playerRef.current = createPlayer();
    setGameState({ screen: 'title', player: createPlayer(), currentLevel: 1, currentQuestion: null, isPaused: false });
  }, []);

  // ---- Change language mid-game ----
  const changeLanguage = useCallback((language: Language) => {
    const p = createPlayer();
    p.language = language;
    playerRef.current = p;
    loadLevel(1, language);
    screenRef.current = 'playing';
    setGameState(prev => ({ ...prev, screen: 'playing', player: { ...p }, currentLevel: 1, isPaused: false }));
  }, [loadLevel]);

  // ---- Answer question (non-repeating) ----
  const answerQuestion = useCallback((correct: boolean) => {
    const p = playerRef.current;
    if (correct) {
      p.xp += 50;
      p.coins += 5;
    } else {
      p.health = Math.max(0, p.health - 15);
    }
    playerRef.current = p;
    screenRef.current = p.health <= 0 ? 'game-over' : 'playing';
    setGameState(prev => ({
      ...prev,
      screen: p.health <= 0 ? 'game-over' : 'playing',
      player: { ...p },
      currentQuestion: null,
    }));
  }, []);

  // ---- Next level ----
  const nextLevel = useCallback(() => {
    const next = playerRef.current.level + 1;
    if (next > 50) return;
    loadLevel(next, playerRef.current.language);
    screenRef.current = 'playing';
    setGameState(prev => ({ ...prev, screen: 'playing', currentLevel: next, player: { ...playerRef.current } }));
  }, [loadLevel]);

  // ---- Input handling (with ESC for pause) ----
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      keysRef.current.add(e.key);
      if (e.key === 'Escape') {
        if (screenRef.current === 'playing') pauseGame();
        else if (screenRef.current === 'paused') resumeGame();
      }
    };
    const up = (e: KeyboardEvent) => { keysRef.current.delete(e.key); };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); };
  }, [pauseGame, resumeGame]);

  // ---- Game loop ----
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Track jump key state for edge-detection (press, not hold)
    let jumpKeyWasDown = false;

    const loop = () => {
      // Only run physics/render when playing
      if (screenRef.current !== 'playing') {
        animFrameRef.current = requestAnimationFrame(loop);
        return;
      }

      const keys = keysRef.current;
      const p = playerRef.current;

      // ---- Movement ----
      if (keys.has('ArrowLeft') || keys.has('a')) { p.vx = -MOVE_SPEED; p.facing = 'left'; }
      else if (keys.has('ArrowRight') || keys.has('d')) { p.vx = MOVE_SPEED; p.facing = 'right'; }
      else { p.vx = 0; }

      // ---- Jump with double-jump (edge-detect) ----
      const jumpKeyDown = keys.has('ArrowUp') || keys.has('w') || keys.has(' ');
      if (jumpKeyDown && !jumpKeyWasDown) {
        if (p.onGround) {
          p.vy = JUMP_FORCE;
          p.onGround = false;
          jumpCountRef.current = 1;
        } else if (jumpCountRef.current < MAX_JUMPS) {
          p.vy = DOUBLE_JUMP_FORCE;
          jumpCountRef.current++;
        }
      }
      jumpKeyWasDown = jumpKeyDown;

      // ---- Physics ----
      p.vy += GRAVITY;
      p.x += p.vx;
      p.y += p.vy;

      // ---- Platform collision (improved hitbox) ----
      p.onGround = false;
      for (const plat of platformsRef.current) {
        if (
          p.x + p.width > plat.x && p.x < plat.x + plat.width &&
          p.y + p.height > plat.y && p.y + p.height < plat.y + plat.height + 18 &&
          p.vy >= 0
        ) {
          p.y = plat.y - p.height;
          p.vy = 0;
          p.onGround = true;
          jumpCountRef.current = 0; // Reset jumps on landing
        }
      }

      // ---- Boundaries ----
      if (p.x < 0) p.x = 0;
      if (p.x > CANVAS_W - p.width) p.x = CANVAS_W - p.width;
      if (p.y > CANVAS_H) { p.health = 0; }

      // ---- Camera ----
      cameraXRef.current = Math.max(0, Math.min(p.x - VIEWPORT_W / 2, CANVAS_W - VIEWPORT_W));

      // ---- Coins ----
      for (const coin of coinsRef.current) {
        if (!coin.collected && Math.abs(p.x + p.width / 2 - coin.x) < 20 && Math.abs(p.y + p.height / 2 - coin.y) < 20) {
          coin.collected = true;
          p.coins++;
          p.xp += 10;
        }
      }

      // ---- Enemies ----
      for (const enemy of enemiesRef.current) {
        if (!enemy.alive) continue;
        enemy.x += enemy.dir * 1.5;
        if (Math.abs(enemy.x - enemy.startX) > enemy.patrolRange) enemy.dir *= -1;
        if (Math.abs(p.x + p.width / 2 - enemy.x) < 25 && Math.abs(p.y + p.height / 2 - enemy.y) < 25) {
          if (p.vy > 0 && p.y + p.height < enemy.y + 10) {
            enemy.alive = false;
            p.vy = JUMP_FORCE * 0.6;
            p.xp += 25;
          } else {
            p.health = Math.max(0, p.health - 10);
            p.x += p.facing === 'right' ? -40 : 40;
          }
        }
      }

      // ---- Terminals (non-repeating questions) ----
      for (const terminal of terminalsRef.current) {
        if (!terminal.used && Math.abs(p.x + p.width / 2 - terminal.x) < 30 && Math.abs(p.y + p.height - terminal.y - 40) < 30) {
          if (keys.has('e') || keys.has('Enter')) {
            terminal.used = true;
            const questions = levelQuestionsRef.current;
            if (questions.length > 0) {
              const qIndex = questionTrackerRef.current.next();
              const q = questions[qIndex % questions.length];
              if (q) {
                screenRef.current = 'challenge';
                setGameState(prev => ({ ...prev, screen: 'challenge', currentQuestion: q, player: { ...p } }));
              }
            }
          }
        }
      }

      // ---- Level complete ----
      if (p.x > CANVAS_W - 100) {
        if (terminalsRef.current.every(t => t.used)) {
          screenRef.current = 'level-complete';
          setGameState(prev => ({ ...prev, screen: 'level-complete', player: { ...p } }));
        }
      }

      // ---- Game over ----
      if (p.health <= 0) {
        screenRef.current = 'game-over';
        setGameState(prev => ({ ...prev, screen: 'game-over', player: { ...p } }));
      }

      // Update HUD state
      setGameState(prev => ({ ...prev, player: { ...p } }));

      // ---- RENDER ----
      renderFrame(ctx, p, cameraXRef.current, platformsRef.current, coinsRef.current, enemiesRef.current, terminalsRef.current);

      animFrameRef.current = requestAnimationFrame(loop);
    };

    animFrameRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [canvasRef]);

  return {
    gameState,
    startGame,
    answerQuestion,
    nextLevel,
    pauseGame,
    resumeGame,
    returnToMenu,
    changeLanguage,
    setGameState: (screen: GameState['screen']) => {
      screenRef.current = screen;
      setGameState(prev => ({ ...prev, screen }));
    },
  };
}

// ---- Render extracted for readability ----
function renderFrame(
  ctx: CanvasRenderingContext2D,
  p: PlayerState,
  cam: number,
  platforms: Platform[],
  coins: Coin[],
  enemies: Enemy[],
  terminals: Terminal[],
) {
  ctx.fillStyle = '#080c14';
  ctx.fillRect(0, 0, VIEWPORT_W, CANVAS_H);

  // Grid background
  ctx.strokeStyle = 'rgba(0, 255, 128, 0.05)';
  ctx.lineWidth = 1;
  for (let x = -cam % 60; x < VIEWPORT_W; x += 60) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, CANVAS_H); ctx.stroke();
  }
  for (let y = 0; y < CANVAS_H; y += 60) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(VIEWPORT_W, y); ctx.stroke();
  }

  // Platforms
  for (const plat of platforms) {
    const px = plat.x - cam;
    if (px + plat.width < -50 || px > VIEWPORT_W + 50) continue;
    const isGround = plat.y >= 490;
    ctx.fillStyle = isGround ? '#0a1520' : '#0d2030';
    ctx.fillRect(px, plat.y, plat.width, plat.height);
    ctx.strokeStyle = '#00ff80';
    ctx.lineWidth = isGround ? 2 : 1;
    ctx.strokeRect(px, plat.y, plat.width, plat.height);
    if (!isGround) {
      ctx.shadowColor = '#00ff80';
      ctx.shadowBlur = 8;
      ctx.fillStyle = '#00ff80';
      ctx.fillRect(px, plat.y, plat.width, 2);
      ctx.shadowBlur = 0;
    }
  }

  // Coins
  for (const coin of coins) {
    if (coin.collected) continue;
    const cx = coin.x - cam;
    if (cx < -20 || cx > VIEWPORT_W + 20) continue;
    const t = Date.now() / 300;
    ctx.save();
    ctx.shadowColor = '#ffdd00';
    ctx.shadowBlur = 10;
    ctx.fillStyle = '#ffdd00';
    ctx.beginPath();
    ctx.arc(cx, coin.y + Math.sin(t + coin.x) * 3, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#aa8800';
    ctx.font = '10px "Press Start 2P"';
    ctx.textAlign = 'center';
    ctx.fillText('$', cx, coin.y + 4 + Math.sin(t + coin.x) * 3);
    ctx.restore();
  }

  // Enemies
  for (const enemy of enemies) {
    if (!enemy.alive) continue;
    const ex = enemy.x - cam;
    if (ex < -30 || ex > VIEWPORT_W + 30) continue;
    ctx.save();
    ctx.shadowColor = enemy.type === 'bug' ? '#ff3366' : enemy.type === 'virus' ? '#ff6600' : '#cc00ff';
    ctx.shadowBlur = 12;
    ctx.fillStyle = ctx.shadowColor;
    ctx.fillRect(ex - 12, enemy.y - 12, 24, 24);
    ctx.fillStyle = '#000';
    ctx.fillRect(ex - 6, enemy.y - 6, 5, 5);
    ctx.fillRect(ex + 2, enemy.y - 6, 5, 5);
    ctx.fillStyle = ctx.shadowColor;
    ctx.font = '7px "Press Start 2P"';
    ctx.textAlign = 'center';
    ctx.fillText(enemy.type.toUpperCase(), ex, enemy.y - 18);
    ctx.restore();
  }

  // Terminals
  for (const terminal of terminals) {
    const tx = terminal.x - cam;
    if (tx < -30 || tx > VIEWPORT_W + 30) continue;
    ctx.save();
    ctx.shadowColor = terminal.used ? '#333' : '#00ffcc';
    ctx.shadowBlur = terminal.used ? 0 : 15;
    ctx.fillStyle = terminal.used ? '#1a1a2e' : '#0a2a2a';
    ctx.fillRect(tx - 15, terminal.y, 30, 40);
    ctx.strokeStyle = terminal.used ? '#333' : '#00ffcc';
    ctx.lineWidth = 2;
    ctx.strokeRect(tx - 15, terminal.y, 30, 40);
    ctx.fillStyle = terminal.used ? '#111' : '#00ffcc';
    ctx.fillRect(tx - 10, terminal.y + 5, 20, 15);
    if (!terminal.used) {
      ctx.fillStyle = '#000';
      ctx.font = '6px "Press Start 2P"';
      ctx.textAlign = 'center';
      ctx.fillText('>', tx, terminal.y + 15);
    }
    if (!terminal.used && Math.abs(p.x + p.width / 2 - terminal.x) < 40 && Math.abs(p.y + p.height - terminal.y - 40) < 40) {
      ctx.fillStyle = '#00ffcc';
      ctx.font = '8px "Press Start 2P"';
      ctx.textAlign = 'center';
      ctx.fillText('[E] HACK', tx, terminal.y - 10);
    }
    ctx.restore();
  }

  // Player
  const ppx = p.x - cam;
  ctx.save();
  ctx.shadowColor = '#00ff80';
  ctx.shadowBlur = 12;
  ctx.fillStyle = '#00ff80';
  ctx.fillRect(ppx + 4, p.y + 8, PLAYER_W - 8, PLAYER_H - 16);
  ctx.fillStyle = '#00cc66';
  ctx.fillRect(ppx + 6, p.y, PLAYER_W - 12, 14);
  ctx.fillStyle = '#00ffcc';
  const visorX = p.facing === 'right' ? ppx + 14 : ppx + 6;
  ctx.fillRect(visorX, p.y + 4, 12, 5);
  const legAnim = Math.abs(p.vx) > 0 ? Math.sin(Date.now() / 80) * 4 : 0;
  ctx.fillStyle = '#008844';
  ctx.fillRect(ppx + 6, p.y + PLAYER_H - 10 + legAnim, 8, 10);
  ctx.fillRect(ppx + PLAYER_W - 14, p.y + PLAYER_H - 10 - legAnim, 8, 10);
  ctx.restore();

  // End gate
  const gateX = CANVAS_W - 60 - cam;
  if (gateX > -50 && gateX < VIEWPORT_W + 50) {
    ctx.save();
    ctx.shadowColor = '#00ffcc';
    ctx.shadowBlur = 20;
    ctx.strokeStyle = '#00ffcc';
    ctx.lineWidth = 3;
    ctx.strokeRect(gateX, CANVAS_H - 160, 40, 60);
    ctx.fillStyle = 'rgba(0,255,204,0.1)';
    ctx.fillRect(gateX, CANVAS_H - 160, 40, 60);
    ctx.fillStyle = '#00ffcc';
    ctx.font = '7px "Press Start 2P"';
    ctx.textAlign = 'center';
    ctx.fillText('EXIT', gateX + 20, CANVAS_H - 170);
    ctx.restore();
  }
}
