import { useRef, useCallback, useState, useEffect, useMemo } from 'react';
import { useGameEngine, MultiplayerRefs } from '@/game/useGameEngine';
import { Language, MatchStats, LANGUAGES } from '@/game/types';
import { getLevelData } from '@/game/levels';
import { getPlayerName, setPlayerName } from '@/game/leaderboard';
import { useMultiplayer } from '@/game/useMultiplayer';
import type { MultiplayerSession, RemotePos, PlayerRow } from '@/game/multiplayerClient';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import TitleScreen from '@/components/TitleScreen';
import LanguageSelect from '@/components/LanguageSelect';
import GameHUD from '@/components/GameHUD';
import CodingChallenge from '@/components/CodingChallenge';
import GameOverScreen from '@/components/GameOverScreen';
import PauseMenu from '@/components/PauseMenu';
import PlayerNameEntry from '@/components/PlayerNameEntry';
import LeaderboardScreen from '@/components/LeaderboardScreen';
import TouchControls from '@/components/TouchControls';
import GameModeSelect from '@/components/GameModeSelect';
import MultiplayerLobby from '@/components/MultiplayerLobby';
import MultiplayerGameHUD from '@/components/MultiplayerGameHUD';
import PostMatchReport from '@/components/PostMatchReport';
import WelcomeScreen from '@/components/WelcomeScreen';
import AuthLogin from '@/components/AuthLogin';
import AuthSignup from '@/components/AuthSignup';
import ForgotPassword from '@/components/ForgotPassword';
import PlayerDashboard from '@/components/PlayerDashboard';
import LevelSelectMap from '@/components/LevelSelectMap';
import CloudStatusBadge from '@/components/CloudStatusBadge';
import GameRecoveryOverlay from '@/components/GameRecoveryOverlay';
import { startSceneHeartbeat } from '@/game/sceneGuard';
import { useAuth } from '@/hooks/useAuth';
import { getGuestId, getOrCreateGuestId, saveLevelResult, unlockAchievement, getDashboard } from '@/game/saveSystem';
import { calcStars } from '@/game/starCalc';
import { evaluateAchievements, ACHIEVEMENTS } from '@/game/achievements';

type AppPhase = 'welcome' | 'login' | 'signup' | 'forgot' | 'dashboard' | 'pick-language' | 'level-select' | 'in-game';

const Index = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Multiplayer refs passed into engine
  const sessionRef = useRef<MultiplayerSession | null>(null);
  const remoteRef = useRef(new Map<string, RemotePos & { lastSeen: number }>());

  const mpEngineRefs: MultiplayerRefs = useMemo(() => ({
    sessionRef,
    remoteRef,
    onChallengeBlocked: (name: string) => {
      toast.error('CHALLENGE OCCUPIED', { description: `${name} reached this challenge first. Race to another!` });
    },
  }), []);

  const {
    gameState, startGame, answerQuestion, useHint, nextLevel, replayLevel,
    pauseGame, resumeGame, returnToMenu, changeLanguage, setControlMode, setGameState, getPlayTime, keysRef,
  } = useGameEngine(canvasRef, mpEngineRefs);

  // ====== Auth / account phase ======
  const { user, username: authUsername, ready: authReady, signOut } = useAuth();
  const [appPhase, setAppPhase] = useState<AppPhase>('welcome');
  const [selectedLang, setSelectedLang] = useState<Language>('javascript');
  const [pendingStartLevel, setPendingStartLevel] = useState<number | null>(null);

  // Decide initial phase once auth is known
  useEffect(() => {
    if (!authReady) return;
    if (user) setAppPhase('dashboard');
    else if (getGuestId()) setAppPhase('dashboard');
    else setAppPhase('welcome');
  }, [authReady, user]);

  // Scene heartbeat: if the canvas hasn't painted soon after entering in-game phase,
  // surface the recovery overlay instead of leaving the user staring at a black screen.
  useEffect(() => {
    if (appPhase !== 'in-game') return;
    const stop = startSceneHeartbeat(canvasRef.current, 5000);
    return stop;
  }, [appPhase, gameState.screen]);

  // ====== Existing flow state ======
  const [playerNameLocal, setPlayerNameLocal] = useState(getPlayerName() || '');
  const [matchTimeElapsed, setMatchTimeElapsed] = useState(0);
  const [matchStats, setMatchStats] = useState<MatchStats | null>(null);
  const [initialJoinCode, setInitialJoinCode] = useState<string | null>(null);
  const [livePlayers, setLivePlayers] = useState<PlayerRow[]>([]);
  const [remoteTick, setRemoteTick] = useState(0);

  const mp = useMultiplayer({ playerName: playerNameLocal });

  // Sync display name when user/guest changes
  useEffect(() => {
    const n = authUsername || (user ? '' : (getGuestId() || ''));
    if (n) {
      setPlayerNameLocal(n);
      setPlayerName(n);
    }
  }, [authUsername, user]);

  // Wire session ref whenever multiplayer session is created
  useEffect(() => {
    sessionRef.current = mp.session.current;
  }, [mp.session, mp.room?.code]);

  // Deep-link join
  useEffect(() => {
    const url = new URL(window.location.href);
    const code = url.searchParams.get('join');
    if (code) setInitialJoinCode(code.toUpperCase().slice(0, 5));
  }, []);

  // Subscribe to remote position broadcasts + player roster while in MP
  useEffect(() => {
    const s = mp.session.current;
    if (!s) return;
    const offPos = s.onPosition((pos) => {
      if (pos.user_id === mp.userId) return;
      remoteRef.current.set(pos.user_id, { ...pos, lastSeen: Date.now() });
      setRemoteTick(t => t + 1);
    });
    const offPlayers = s.onPlayers((rows) => setLivePlayers(rows));
    return () => { offPos(); offPlayers(); };
  }, [mp.session, mp.room?.code, mp.userId]);

  // Watch for both players finished -> build MatchStats and show report
  useEffect(() => {
    if (gameState.screen !== 'post-match-report') return;
    if (!mp.room) return;
    let cancelled = false;
    const buildStats = async () => {
      const start = Date.now();
      while (!cancelled) {
        const { data } = await supabase.from('mp_room_players').select('*').eq('room_code', mp.room!.code);
        const players = (data || []) as PlayerRow[];
        const me = players.find(p => p.user_id === mp.userId);
        const other = players.find(p => p.user_id !== mp.userId);
        const bothDone = players.length >= 2 && players.every(p => p.finished);
        if (bothDone || Date.now() - start > 20000) {
          if (me) {
            const total = me.correct_answers + me.wrong_answers;
            const acc = total > 0 ? Math.round((me.correct_answers / total) * 100) : 0;
            const oTotal = (other?.correct_answers || 0) + (other?.wrong_answers || 0);
            const oAcc = oTotal > 0 ? Math.round(((other?.correct_answers || 0) / oTotal) * 100) : 0;
            const topics = ['Variables', 'Loops', 'Functions', 'Arrays', 'Strings'];
            const mkPerf = (n: number) => topics.map(t => ({
              topic: t, accuracy: Math.max(20, Math.min(100, n + Math.round((Math.random() - 0.5) * 30))),
              avgResponseTime: 5, totalCorrect: 0, totalIncorrect: 0,
            }));
            setMatchStats({
              player1: {
                name: me.name, score: me.score, coins: me.coins,
                performance: mkPerf(acc),
                achievements: [
                  me.challenges_won >= 3 ? 'Challenge Hunter' : '',
                  acc >= 80 ? 'Perfect Accuracy' : '',
                  me.score > (other?.score || 0) ? 'Speed Coder' : '',
                ].filter(Boolean),
              },
              player2: {
                name: other?.name || 'Friend', score: other?.score || 0, coins: other?.coins || 0,
                performance: mkPerf(oAcc),
                achievements: [(other?.challenges_won || 0) >= 3 ? 'Code Ninja' : ''].filter(Boolean),
              },
            });
          }
          return;
        }
        await new Promise(r => setTimeout(r, 1500));
      }
    };
    buildStats();
    return () => { cancelled = true; };
  }, [gameState.screen, mp.room, mp.userId]);

  // ===== Save level result when single-player level completes =====
  const savedLevelRef = useRef<string | null>(null);
  useEffect(() => {
    if (gameState.screen !== 'level-complete') return;
    const lang = gameState.player.language;
    const lvl = gameState.currentLevel;
    const key = `${lang}:${lvl}:${gameState.startTime}`;
    if (savedLevelRef.current === key) return;
    savedLevelRef.current = key;
    const timeMs = Date.now() - gameState.startTime;
    // Approximate mistakes from health loss (rough; engine doesn't expose count)
    const mistakes = Math.max(0, Math.floor((100 - gameState.player.health) / 15));
    const correctAnswers = (gameState.player.xp || 0) / 50 | 0;
    const stars = calcStars({ correct: true, mistakes, timeMs });
    const score = gameState.player.xp + gameState.player.coins * 10;
    saveLevelResult({
      language: lang, level: lvl, stars, score, timeMs, mistakes, correctAnswers,
    }).then(async () => {
      // achievements
      try {
        const dash = await getDashboard();
        const langCounts: Record<string, number> = {};
        Object.values(dash.progressByLang).forEach(p => { langCounts[p.language] = (p.unlockedLevel - 1); });
        const unlocked = evaluateAchievements({
          levelsCompleted: dash.stats.levels_completed,
          challengesSolved: dash.stats.challenges_solved,
          totalStars: Object.values(dash.progressByLang).reduce((s, p) => s + p.totalStars, 0),
          langCounts,
          lastLevel: { mistakes, timeMs },
        });
        for (const id of unlocked) {
          if (!dash.achievements.includes(id)) {
            await unlockAchievement(id);
            const a = ACHIEVEMENTS.find(x => x.id === id);
            if (a) toast.success(`Achievement: ${a.title}`, { description: a.description });
          }
        }
      } catch {}
    }).catch(() => {});
  }, [gameState.screen, gameState.currentLevel, gameState.player.language, gameState.player.health, gameState.player.xp, gameState.player.coins, gameState.startTime]);

  // Disconnect overlay
  const opponent = livePlayers.find(p => p.user_id !== mp.userId);
  const opponentLastSeenAge = opponent ? Date.now() - new Date(opponent.last_seen).getTime() : 0;
  const opponentMissing = opponent && opponentLastSeenAge > 30000;

  // ===== Action handlers =====
  const handleEnterApp = useCallback(() => {
    // From welcome / login / signup → dashboard
    setAppPhase('dashboard');
  }, []);

  const handleGuestPlay = useCallback(() => {
    const g = getOrCreateGuestId();
    setPlayerName(g);
    setPlayerNameLocal(g);
    setAppPhase('dashboard');
  }, []);

  const startEngineAtLevel = useCallback((lang: Language, lvl: number) => {
    // Inject ?level= so engine reads it inside startGame
    try {
      const url = new URL(window.location.href);
      url.searchParams.set('level', String(lvl));
      window.history.replaceState({}, '', url.toString());
    } catch {}
    setAppPhase('in-game');
    startGame(lang, playerNameLocal || authUsername || getOrCreateGuestId());
  }, [startGame, playerNameLocal, authUsername]);

  // Continue from dashboard
  const handleContinue = useCallback(async () => {
    const dash = await getDashboard();
    const langs = Object.values(dash.progressByLang).sort((a, b) => b.currentLevel - a.currentLevel);
    if (langs.length === 0) {
      setAppPhase('pick-language'); return;
    }
    const top = langs[0];
    setSelectedLang(top.language);
    startEngineAtLevel(top.language, top.currentLevel || 1);
  }, [startEngineAtLevel]);

  const handlePickLanguageForSelect = useCallback((lang: Language) => {
    setSelectedLang(lang);
    setAppPhase('level-select');
  }, []);

  const handleLevelChosen = useCallback((lvl: number) => {
    startEngineAtLevel(selectedLang, lvl);
  }, [selectedLang, startEngineAtLevel]);

  const handleMultiplayerFromDash = useCallback(() => {
    setAppPhase('in-game');
    setGameState('game-mode-select');
  }, [setGameState]);

  const handleEngineHome = useCallback(() => {
    // Clear ?level so subsequent starts don't override
    try {
      const url = new URL(window.location.href);
      url.searchParams.delete('level');
      window.history.replaceState({}, '', url.toString());
    } catch {}
    returnToMenu();
    setAppPhase('dashboard');
  }, [returnToMenu]);

  const handleSignOut = useCallback(async () => {
    await signOut();
    setAppPhase('welcome');
  }, [signOut]);

  // ===== Legacy in-game handlers (preserved) =====
  const handleStart = useCallback(() => {
    const saved = getPlayerName();
    if (saved) { setPlayerNameLocal(saved); setGameState('game-mode-select'); }
    else setGameState('name-entry');
  }, [setGameState]);

  const handleNameSubmit = useCallback((name: string) => {
    setPlayerName(name); setPlayerNameLocal(name);
    if (initialJoinCode) setGameState('multiplayer-lobby');
    else setGameState('game-mode-select');
  }, [setGameState, initialJoinCode]);

  useEffect(() => {
    if (initialJoinCode && gameState.screen === 'title') {
      const saved = getPlayerName();
      if (saved) { setPlayerNameLocal(saved); setGameState('multiplayer-lobby'); setAppPhase('in-game'); }
      else { setGameState('name-entry'); setAppPhase('in-game'); }
    }
  }, [initialJoinCode, gameState.screen, setGameState]);

  const handleSinglePlayer = useCallback(() => setGameState('language-select'), [setGameState]);
  const handleMultiplayer = useCallback(() => setGameState('multiplayer-lobby'), [setGameState]);

  const handleMatchStart = useCallback((lang: Language, _code: string, _isHost: boolean) => {
    startGame(lang, playerNameLocal);
    setGameState('multiplayer-playing');
    setMatchTimeElapsed(0);
  }, [startGame, playerNameLocal, setGameState]);

  useEffect(() => {
    if (gameState.screen === 'multiplayer-playing') {
      const interval = setInterval(() => setMatchTimeElapsed(prev => prev + 1), 1000);
      return () => clearInterval(interval);
    }
  }, [gameState.screen]);

  const handleSelectLanguage = useCallback((lang: Language) => {
    startGame(lang, playerNameLocal);
  }, [startGame, playerNameLocal]);

  const handleRestart = useCallback(() => startGame(gameState.player.language, playerNameLocal),
    [startGame, gameState.player.language, playerNameLocal]);

  const handleViewLeaderboard = useCallback(() => setGameState('leaderboard'), [setGameState]);

  const levelData = getLevelData(gameState.currentLevel);
  const isInGame = gameState.screen === 'playing' || gameState.screen === 'challenge' || gameState.screen === 'paused' || gameState.screen === 'multiplayer-playing' || gameState.screen === 'multiplayer-challenge';

  const myRow = livePlayers.find(p => p.user_id === mp.userId);
  const otherRow = livePlayers.find(p => p.user_id !== mp.userId);

  // ===== Render auth/dashboard layer when not in-game =====
  if (!authReady) {
    return <div className="fixed inset-0 flex items-center justify-center bg-background">
      <p className="font-pixel text-xs text-primary">LOADING…</p>
    </div>;
  }

  if (appPhase === 'welcome') {
    return <WelcomeScreen
      onLogin={() => setAppPhase('login')}
      onSignup={() => setAppPhase('signup')}
      onGuest={handleGuestPlay}
    />;
  }
  if (appPhase === 'login') {
    return <AuthLogin onSuccess={handleEnterApp} onBack={() => setAppPhase('welcome')} onForgot={() => setAppPhase('forgot')} />;
  }
  if (appPhase === 'signup') {
    return <AuthSignup onSuccess={handleEnterApp} onBack={() => setAppPhase('welcome')} />;
  }
  if (appPhase === 'forgot') {
    return <ForgotPassword onBack={() => setAppPhase('login')} />;
  }
  if (appPhase === 'dashboard') {
    return <PlayerDashboard
      onPlay={handleContinue}
      onSelectLanguage={() => setAppPhase('pick-language')}
      onMultiplayer={handleMultiplayerFromDash}
      onSignOut={handleSignOut}
    />;
  }
  if (appPhase === 'pick-language') {
    return <LanguageSelect onSelect={handlePickLanguageForSelect} />;
  }
  if (appPhase === 'level-select') {
    return <LevelSelectMap
      language={selectedLang}
      onSelectLevel={handleLevelChosen}
      onBack={() => setAppPhase('dashboard')}
    />;
  }

  // ===== In-game render (original layout preserved) =====
  return (
    <div className="fixed inset-0 bg-background overflow-hidden">
      <div className="flex items-center justify-center w-full h-full p-2 sm:p-4">
        <canvas
          ref={canvasRef}
          width={960}
          height={600}
          className="border border-border rounded-lg"
          style={{
            width: '100%', maxWidth: '960px', height: 'auto',
            aspectRatio: '960 / 600',
            display: isInGame ? 'block' : 'none',
            imageRendering: 'pixelated',
          }}
          data-remote-tick={remoteTick}
        />
      </div>

      {(gameState.screen === 'playing' || gameState.screen === 'multiplayer-playing') && (
        <>
          {gameState.screen === 'playing' ? (
            <GameHUD player={gameState.player} levelNum={gameState.currentLevel} levelTopic={levelData.topic} isUnderground={gameState.isUnderground} />
          ) : (
            <MultiplayerGameHUD
              player1={{
                name: playerNameLocal,
                score: myRow?.score ?? 0,
                coins: myRow?.coins ?? gameState.player.coins,
                x: gameState.player.x,
              }}
              player2={{
                name: otherRow?.name || 'Friend',
                score: otherRow?.score ?? 0,
                coins: otherRow?.coins ?? 0,
                x: remoteRef.current.get(otherRow?.user_id || '')?.x ?? 0,
              }}
              levelNum={gameState.currentLevel}
              levelTopic={levelData.topic}
              isUnderground={gameState.isUnderground}
              timeElapsed={matchTimeElapsed}
            />
          )}
          <button onClick={pauseGame}
            className="absolute top-2 right-2 sm:top-3 sm:right-3 z-40 font-pixel text-[8px] sm:text-[9px] px-2 sm:px-3 py-1.5 sm:py-2 border border-border text-muted-foreground bg-card/80 backdrop-blur-sm rounded hover:border-primary hover:text-primary transition-all pointer-events-auto">
            ☰
          </button>
          <TouchControls
            keysRef={keysRef} onPause={pauseGame} onHint={useHint}
            isNearTerminal={gameState.isNearTerminal}
            player={gameState.player} cameraX={gameState.cameraX}
            canvasRef={canvasRef} controlMode={gameState.controlMode}
          />

          {gameState.screen === 'multiplayer-playing' && opponentMissing && (
            <div className="absolute inset-0 z-40 flex items-center justify-center bg-background/80 backdrop-blur-sm">
              <div className="border-2 border-destructive bg-card rounded-lg p-6 text-center max-w-sm mx-4">
                <p className="font-pixel text-sm text-destructive mb-2">PLAYER DISCONNECTED</p>
                <p className="font-mono text-xs text-muted-foreground mb-4">Waiting for {opponent?.name || 'opponent'} to reconnect...</p>
                <button onClick={() => { mp.leaveRoom(); handleEngineHome(); }}
                  className="font-pixel text-[10px] px-4 py-2 border border-border text-foreground hover:border-primary hover:text-primary">
                  END MATCH
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {gameState.screen === 'title' && <TitleScreen onStart={handleStart} onLeaderboard={handleViewLeaderboard} />}
      {gameState.screen === 'name-entry' && <PlayerNameEntry onSubmit={handleNameSubmit} onBack={() => setGameState('title')} />}
      {gameState.screen === 'game-mode-select' && <GameModeSelect playerName={playerNameLocal} onSinglePlayer={handleSinglePlayer} onMultiplayer={handleMultiplayer} onBack={handleEngineHome} />}
      {gameState.screen === 'language-select' && <LanguageSelect onSelect={handleSelectLanguage} />}
      {gameState.screen === 'leaderboard' && <LeaderboardScreen onBack={() => setGameState('title')} />}
      {gameState.screen === 'multiplayer-lobby' && (
        <MultiplayerLobby
          playerName={playerNameLocal}
          onBack={() => setGameState('game-mode-select')}
          onMatchStart={handleMatchStart}
          mp={mp}
          initialJoinCode={initialJoinCode || undefined}
        />
      )}

      {gameState.screen === 'post-match-report' && matchStats && (
        <PostMatchReport
          stats={matchStats}
          onRematch={() => { mp.leaveRoom(); setMatchStats(null); setGameState('multiplayer-lobby'); }}
          onNewRoom={() => { mp.leaveRoom(); setMatchStats(null); setGameState('game-mode-select'); }}
          onExit={() => { mp.leaveRoom(); setMatchStats(null); handleEngineHome(); }}
        />
      )}
      {gameState.screen === 'post-match-report' && !matchStats && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/90">
          <p className="font-pixel text-sm text-primary text-glow-primary">CALCULATING MATCH RESULTS...</p>
        </div>
      )}

      {gameState.screen === 'paused' && (
        <PauseMenu
          onResume={resumeGame} onMainMenu={handleEngineHome}
          onChangeLanguage={changeLanguage} onViewLeaderboard={handleViewLeaderboard}
          currentLanguage={gameState.player.language}
          controlMode={gameState.controlMode} onControlModeChange={setControlMode}
        />
      )}

      {(gameState.screen === 'challenge' || gameState.screen === 'multiplayer-challenge') && gameState.currentQuestion && (
        <CodingChallenge
          question={gameState.currentQuestion}
          onAnswer={answerQuestion}
          playerCoins={gameState.player.coins}
          onUseHint={useHint}
        />
      )}

      {(gameState.screen === 'game-over' || gameState.screen === 'level-complete') && (
        <GameOverScreen
          player={gameState.player} type={gameState.screen}
          onRestart={handleRestart}
          onNextLevel={gameState.screen === 'level-complete' ? nextLevel : undefined}
          onReplayLevel={gameState.screen === 'level-complete' ? replayLevel : undefined}
          onGoHome={handleEngineHome}
          onViewLeaderboard={handleViewLeaderboard}
          playTime={getPlayTime()}
        />
      )}
      <CloudStatusBadge />
      <GameRecoveryOverlay
        onRetry={() => {
          // Re-trigger engine boot for current language/level if engine seems stuck.
          try { startGame(gameState.player.language || selectedLang, playerNameLocal); } catch {}
        }}
        onReturnHome={handleEngineHome}
      />
    </div>
  );
};

export default Index;
