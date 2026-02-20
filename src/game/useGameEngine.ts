import { useRef, useEffect, useCallback, useState } from 'react';
import { PlayerState, GameState, Language, Question, Platform, EnemyType, ENEMY_CONFIG, PipeSpawn } from './types';
import { getLevelData } from './levels';
import { getQuestionsForLevel } from './questions';
import { renderFrame } from './renderer';
import { audioManager } from './audioManager';
import { saveProgress, loadProgress, SavedProgress } from './saveManager';
import { CoinSpawn } from './types';

// ---- Constants ----
const GRAVITY = 0.6;
const JUMP_FORCE = -13;
const DOUBLE_JUMP_FORCE = -14;
const MOVE_SPEED = 5;
const PLAYER_W = 32;
const PLAYER_H = 48;
const CANVAS_W = 2400;
const CANVAS_H = 600;
const VIEWPORT_W = 960;
const MAX_JUMPS = 2;
const PIPE_ENTRY_DELAY = 250; // ms delay before auto-entering pipe
const PIPE_COOLDOWN = 1000;   // ms cooldown after exiting a pipe

// ---- Entity interfaces ----
interface Enemy {
  x: number; y: number; type: EnemyType; startX: number; patrolRange: number; dir: number; alive: boolean;
}
interface Coin {
  x: number; y: number; collected: boolean;
}
interface Terminal {
  x: number; y: number; questionIndex: number; used: boolean;
}

// ---- Question tracker (no repeats within level session) ----
class QuestionTracker {
  private shuffled: number[] = [];
  private currentIdx = 0;

  reset(poolSize: number) {
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
      this.shuffle();
      this.currentIdx = 0;
    }
    return this.shuffled[this.currentIdx++];
  }
}

// ---- Helper: create fresh player ----
function createPlayer(name = 'Player'): PlayerState {
  return {
    x: 50, y: 400, vx: 0, vy: 0,
    width: PLAYER_W, height: PLAYER_H,
    onGround: false, facing: 'right',
    health: 100, xp: 0, level: 1,
    language: 'javascript', coins: 0, name,
  };
}

export function useGameEngine(canvasRef: React.RefObject<HTMLCanvasElement | null>) {
  const [gameState, setGameState] = useState<GameState>({
    screen: 'title',
    player: createPlayer(),
    currentLevel: 1,
    currentQuestion: null,
    isPaused: false,
    startTime: Date.now(),
    isUnderground: false,
  });

  const keysRef = useRef<Set<string>>(new Set());
  const playerRef = useRef<PlayerState>(createPlayer());
  const enemiesRef = useRef<Enemy[]>([]);
  const coinsRef = useRef<Coin[]>([]);
  const terminalsRef = useRef<Terminal[]>([]);
  const platformsRef = useRef<Platform[]>([]);
  const pipesRef = useRef<PipeSpawn[]>([]);
  const cameraXRef = useRef(0);
  const animFrameRef = useRef(0);
  const screenRef = useRef<GameState['screen']>('title');
  const levelQuestionsRef = useRef<Question[]>([]);
  const jumpCountRef = useRef(0);
  const questionTrackerRef = useRef(new QuestionTracker());
  const isUndergroundRef = useRef(false);
  const startTimeRef = useRef(Date.now());
  const completedLevelsRef = useRef<number[]>([]);

  // Underground data refs
  const undergroundPlatformsRef = useRef<Platform[]>([]);
  const undergroundCoinsRef = useRef<Coin[]>([]);
  const surfacePlatformsRef = useRef<Platform[]>([]);
  const surfaceCoinsRef = useRef<Coin[]>([]);

  // Pipe auto-entry state
  const pipeStandingTimerRef = useRef<number | null>(null);
  const pipeStandingOnRef = useRef<PipeSpawn | null>(null);
  const pipeCooldownRef = useRef(0);
  const pipeTransitioningRef = useRef(false);

  // ---- Persist progress ----
  const persistProgress = useCallback(() => {
    const p = playerRef.current;
    saveProgress({
      playerName: p.name,
      language: p.language,
      coins: p.coins,
      xp: p.xp,
      currentLevel: p.level,
      completedLevels: completedLevelsRef.current,
      bestScore: 0,
    });
  }, []);

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
    pipesRef.current = data.pipes || [];

    // Store underground data
    undergroundPlatformsRef.current = data.undergroundPlatforms || [];
    undergroundCoinsRef.current = (data.undergroundCoins || []).map((c: CoinSpawn) => ({ ...c, collected: false }));
    // Store surface data for switching back
    surfacePlatformsRef.current = [...platformsRef.current];
    surfaceCoinsRef.current = [...coinsRef.current];

    const p = createPlayer(playerRef.current.name);
    p.language = language;
    p.level = levelNum;
    p.health = playerRef.current.health;
    p.xp = playerRef.current.xp;
    p.coins = playerRef.current.coins;
    playerRef.current = p;
    cameraXRef.current = 0;
    jumpCountRef.current = 0;
    isUndergroundRef.current = false;
    pipeStandingTimerRef.current = null;
    pipeStandingOnRef.current = null;
    pipeCooldownRef.current = 0;
    pipeTransitioningRef.current = false;
  }, []);

  // Pipe transition helpers (plain functions, not hooks — avoids hook count changes)
  const doEnterUnderground = (pipe: PipeSpawn) => {
    if (pipeTransitioningRef.current) return;
    pipeTransitioningRef.current = true;
    const p = playerRef.current;
    platformsRef.current = undergroundPlatformsRef.current;
    coinsRef.current = undergroundCoinsRef.current;
    p.x = pipe.targetX;
    p.y = pipe.targetY;
    p.vx = 0;
    p.vy = 0;
    isUndergroundRef.current = true;
    pipeCooldownRef.current = Date.now() + PIPE_COOLDOWN;
    audioManager.pipeTransition();
    setGameState(prev => ({ ...prev, isUnderground: true, player: { ...p } }));
    setTimeout(() => { pipeTransitioningRef.current = false; }, 300);
  };

  const doExitUnderground = (pipe: PipeSpawn) => {
    if (pipeTransitioningRef.current) return;
    pipeTransitioningRef.current = true;
    const p = playerRef.current;
    platformsRef.current = surfacePlatformsRef.current;
    coinsRef.current = surfaceCoinsRef.current;
    p.x = pipe.targetX;
    p.y = pipe.targetY;
    p.vx = 0;
    p.vy = 0;
    isUndergroundRef.current = false;
    pipeCooldownRef.current = Date.now() + PIPE_COOLDOWN;
    audioManager.pipeTransition();
    setGameState(prev => ({ ...prev, isUnderground: false, player: { ...p } }));
    setTimeout(() => { pipeTransitioningRef.current = false; }, 300);
  };

  // ---- Start game ----
  const startGame = useCallback((language: Language, playerName?: string) => {
    const name = playerName || playerRef.current.name || 'Player';
    const p = createPlayer(name);
    p.language = language;
    playerRef.current = p;
    startTimeRef.current = Date.now();
    completedLevelsRef.current = [];
    loadLevel(1, language);
    screenRef.current = 'playing';
    audioManager.startBGM();
    setGameState(prev => ({ ...prev, screen: 'playing', player: { ...p }, currentLevel: 1, startTime: Date.now(), isUnderground: false }));
  }, [loadLevel]);

  // ---- Resume from saved progress ----
  const resumeFromSave = useCallback((saved: SavedProgress) => {
    const p = createPlayer(saved.playerName);
    p.language = saved.language;
    p.coins = saved.coins;
    p.xp = saved.xp;
    p.level = saved.currentLevel;
    playerRef.current = p;
    completedLevelsRef.current = saved.completedLevels;
    startTimeRef.current = Date.now();
    loadLevel(saved.currentLevel, saved.language);
    screenRef.current = 'playing';
    audioManager.startBGM();
    setGameState(prev => ({ ...prev, screen: 'playing', player: { ...p }, currentLevel: saved.currentLevel, startTime: Date.now(), isUnderground: false }));
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
    persistProgress();
    audioManager.stopBGM();
    screenRef.current = 'title';
    setGameState({ screen: 'title', player: { ...playerRef.current }, currentLevel: 1, currentQuestion: null, isPaused: false, startTime: Date.now(), isUnderground: false });
  }, [persistProgress]);

  // ---- Change language mid-game ----
  const changeLanguage = useCallback((language: Language) => {
    const p = createPlayer(playerRef.current.name);
    p.language = language;
    playerRef.current = p;
    loadLevel(1, language);
    screenRef.current = 'playing';
    setGameState(prev => ({ ...prev, screen: 'playing', player: { ...p }, currentLevel: 1, isPaused: false }));
  }, [loadLevel]);

  // ---- Answer question ----
  const answerQuestion = useCallback((correct: boolean) => {
    const p = playerRef.current;
    if (correct) {
      p.xp += 50;
      p.coins += 5;
      audioManager.correctAnswer();
    } else {
      p.health = Math.max(0, p.health - 15);
      audioManager.wrongAnswer();
    }
    playerRef.current = p;
    screenRef.current = p.health <= 0 ? 'game-over' : 'playing';
    if (p.health <= 0) audioManager.gameOver();
    setGameState(prev => ({
      ...prev,
      screen: p.health <= 0 ? 'game-over' : 'playing',
      player: { ...p },
      currentQuestion: null,
    }));
  }, []);

  // ---- Use hint (deduct coins) ----
  const useHint = useCallback(() => {
    const p = playerRef.current;
    if (p.coins >= 10) {
      p.coins -= 10;
      playerRef.current = p;
      setGameState(prev => ({ ...prev, player: { ...p } }));
    }
  }, []);

  // ---- Next level ----
  const nextLevel = useCallback(() => {
    const currentLvl = playerRef.current.level;
    completedLevelsRef.current = [...new Set([...completedLevelsRef.current, currentLvl])];
    const next = currentLvl + 1;
    if (next > 50) return;
    loadLevel(next, playerRef.current.language);
    screenRef.current = 'playing';
    persistProgress();
    setGameState(prev => ({ ...prev, screen: 'playing', currentLevel: next, player: { ...playerRef.current }, isUnderground: false }));
  }, [loadLevel, persistProgress]);

  // ---- Replay current level ----
  const replayLevel = useCallback(() => {
    const p = playerRef.current;
    loadLevel(p.level, p.language);
    screenRef.current = 'playing';
    setGameState(prev => ({ ...prev, screen: 'playing', player: { ...playerRef.current }, isUnderground: false }));
  }, [loadLevel]);

  // ---- Input handling ----
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

    let jumpKeyWasDown = false;

    const loop = () => {
      if (screenRef.current !== 'playing') {
        animFrameRef.current = requestAnimationFrame(loop);
        return;
      }

      const keys = keysRef.current;
      const p = playerRef.current;

      // Skip input during pipe transition
      if (!pipeTransitioningRef.current) {
        // Movement
        if (keys.has('ArrowLeft') || keys.has('a')) { p.vx = -MOVE_SPEED; p.facing = 'left'; }
        else if (keys.has('ArrowRight') || keys.has('d')) { p.vx = MOVE_SPEED; p.facing = 'right'; }
        else { p.vx = 0; }

        // Jump (edge-detect)
        const jumpKeyDown = keys.has('ArrowUp') || keys.has('w') || keys.has(' ');
        if (jumpKeyDown && !jumpKeyWasDown) {
          if (p.onGround) {
            p.vy = JUMP_FORCE;
            p.onGround = false;
            jumpCountRef.current = 1;
            audioManager.jump();
          } else if (jumpCountRef.current < MAX_JUMPS) {
            p.vy = DOUBLE_JUMP_FORCE;
            jumpCountRef.current++;
            audioManager.doubleJump();
          }
        }
        jumpKeyWasDown = jumpKeyDown;
      }

      // Physics
      p.vy += GRAVITY;
      p.x += p.vx;
      p.y += p.vy;

      // Platform collision
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
          jumpCountRef.current = 0;
        }
      }

      // Boundaries
      if (p.x < 0) p.x = 0;
      if (p.x > CANVAS_W - p.width) p.x = CANVAS_W - p.width;
      if (p.y > CANVAS_H) { p.health = 0; }

      // Camera
      cameraXRef.current = Math.max(0, Math.min(p.x - VIEWPORT_W / 2, CANVAS_W - VIEWPORT_W));

      // Coins
      for (const coin of coinsRef.current) {
        if (!coin.collected && Math.abs(p.x + p.width / 2 - coin.x) < 20 && Math.abs(p.y + p.height / 2 - coin.y) < 20) {
          coin.collected = true;
          p.coins++;
          p.xp += 10;
          audioManager.coinCollect();
        }
      }

      // Enemies (type-based damage)
      for (const enemy of enemiesRef.current) {
        if (!enemy.alive) continue;
        enemy.x += enemy.dir * 1.5;
        if (Math.abs(enemy.x - enemy.startX) > enemy.patrolRange) enemy.dir *= -1;
        if (Math.abs(p.x + p.width / 2 - enemy.x) < 25 && Math.abs(p.y + p.height / 2 - enemy.y) < 25) {
          if (p.vy > 0 && p.y + p.height < enemy.y + 10) {
            enemy.alive = false;
            p.vy = JUMP_FORCE * 0.6;
            p.xp += 25;
            audioManager.enemyStomp();
          } else {
            const dmg = ENEMY_CONFIG[enemy.type]?.damage || 10;
            p.health = Math.max(0, p.health - dmg);
            p.x += p.facing === 'right' ? -40 : 40;
            audioManager.enemyDamage();
          }
        }
      }

      // ---- Pipe system: auto-entry (no down arrow needed) ----
      const now = Date.now();
      if (!pipeTransitioningRef.current && now > pipeCooldownRef.current) {
        // Entry pipes: auto-enter when player walks over pipe on ground
        for (const pipe of pipesRef.current) {
          if (pipe.isReturn) continue;
          if (isUndergroundRef.current) continue;
          // Check horizontal proximity only — pipe sits on ground, player walks on ground
          const onPipe = p.onGround &&
            Math.abs(p.x + p.width / 2 - pipe.x) < 30;

          if (onPipe) {
            if (pipeStandingOnRef.current !== pipe) {
              pipeStandingOnRef.current = pipe;
              pipeStandingTimerRef.current = now;
            } else if (pipeStandingTimerRef.current && now - pipeStandingTimerRef.current >= PIPE_ENTRY_DELAY) {
              doEnterUnderground(pipe);
              pipeStandingTimerRef.current = null;
              pipeStandingOnRef.current = null;
            }
          } else if (pipeStandingOnRef.current === pipe) {
            pipeStandingOnRef.current = null;
            pipeStandingTimerRef.current = null;
          }
        }

        // Return pipes: press UP arrow while standing on return pipe
        if (isUndergroundRef.current) {
          const upKey = keys.has('ArrowUp') || keys.has('w');
          for (const pipe of pipesRef.current) {
            if (!pipe.isReturn) continue;
            const near = p.onGround &&
              Math.abs(p.x + p.width / 2 - pipe.x) < 30;
            if (near && upKey) {
              doExitUnderground(pipe);
              break;
            }
          }
        }
      }

      // Terminals
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

      // Level complete
      if (p.x > CANVAS_W - 100) {
        if (terminalsRef.current.every(t => t.used)) {
          screenRef.current = 'level-complete';
          audioManager.levelComplete();
          persistProgress();
          setGameState(prev => ({ ...prev, screen: 'level-complete', player: { ...p } }));
        }
      }

      // Game over
      if (p.health <= 0) {
        screenRef.current = 'game-over';
        audioManager.gameOver();
        audioManager.stopBGM();
        setGameState(prev => ({ ...prev, screen: 'game-over', player: { ...p } }));
      }

      // Update HUD state
      setGameState(prev => ({ ...prev, player: { ...p } }));

      // Render
      renderFrame(ctx, p, cameraXRef.current, platformsRef.current, coinsRef.current, enemiesRef.current, terminalsRef.current, pipesRef.current, isUndergroundRef.current);

      animFrameRef.current = requestAnimationFrame(loop);
    };

    animFrameRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [canvasRef, persistProgress]);

  return {
    gameState,
    startGame,
    resumeFromSave,
    answerQuestion,
    useHint,
    nextLevel,
    replayLevel,
    pauseGame,
    resumeGame,
    returnToMenu,
    changeLanguage,
    getPlayTime: () => Math.floor((Date.now() - startTimeRef.current) / 1000),
    setGameState: (screen: GameState['screen']) => {
      screenRef.current = screen;
      setGameState(prev => ({ ...prev, screen }));
    },
  };
}
