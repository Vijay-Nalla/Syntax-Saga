import { useRef, useCallback, useState, useEffect, useMemo } from 'react';
import { useGameEngine, MultiplayerRefs } from '@/game/useGameEngine';
import { Language, MatchStats } from '@/game/types';
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

  const [playerNameLocal, setPlayerNameLocal] = useState(getPlayerName() || '');
  const [matchTimeElapsed, setMatchTimeElapsed] = useState(0);
  const [matchStats, setMatchStats] = useState<MatchStats | null>(null);
  const [initialJoinCode, setInitialJoinCode] = useState<string | null>(null);
  const [livePlayers, setLivePlayers] = useState<PlayerRow[]>([]);
  const [remoteTick, setRemoteTick] = useState(0);

  const mp = useMultiplayer({ playerName: playerNameLocal });

  // Wire session ref whenever multiplayer session is created
  useEffect(() => {
    sessionRef.current = mp.session.current;
  }, [mp.session, mp.room?.code]);

  // Detect ?join= deep link on mount
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
    // Poll briefly waiting for opponent to also finish
    let cancelled = false;
    const buildStats = async () => {
      // wait until at least we have rows and both finished OR 20 seconds elapsed
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
                achievements: [
                  (other?.challenges_won || 0) >= 3 ? 'Code Ninja' : '',
                ].filter(Boolean),
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

  // Disconnect overlay: if opponent's last_seen > 30s ago while playing, end match
  const opponent = livePlayers.find(p => p.user_id !== mp.userId);
  const opponentLastSeenAge = opponent ? Date.now() - new Date(opponent.last_seen).getTime() : 0;
  const opponentMissing = opponent && opponentLastSeenAge > 30000;

  const handleStart = useCallback(() => {
    const saved = getPlayerName();
    if (saved) {
      setPlayerNameLocal(saved);
      setGameState('game-mode-select');
    } else {
      setGameState('name-entry');
    }
  }, [setGameState]);

  const handleNameSubmit = useCallback((name: string) => {
    setPlayerName(name);
    setPlayerNameLocal(name);
    if (initialJoinCode) setGameState('multiplayer-lobby');
    else setGameState('game-mode-select');
  }, [setGameState, initialJoinCode]);

  // If we have a deep-link join code, take user straight to name entry / lobby
  useEffect(() => {
    if (initialJoinCode && gameState.screen === 'title') {
      const saved = getPlayerName();
      if (saved) { setPlayerNameLocal(saved); setGameState('multiplayer-lobby'); }
      else setGameState('name-entry');
    }
  }, [initialJoinCode, gameState.screen, setGameState]);

  const handleSinglePlayer = useCallback(() => setGameState('language-select'), [setGameState]);
  const handleMultiplayer = useCallback(() => setGameState('multiplayer-lobby'), [setGameState]);

  const handleMatchStart = useCallback((lang: Language, _code: string, _isHost: boolean) => {
    startGame(lang, playerNameLocal);
    setGameState('multiplayer-playing');
    setMatchTimeElapsed(0);
  }, [startGame, playerNameLocal, setGameState]);

  // Timer for multiplayer match time
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
  const handleGoHome = useCallback(() => returnToMenu(), [returnToMenu]);

  const levelData = getLevelData(gameState.currentLevel);
  const isInGame = gameState.screen === 'playing' || gameState.screen === 'challenge' || gameState.screen === 'paused' || gameState.screen === 'multiplayer-playing' || gameState.screen === 'multiplayer-challenge';

  // Live MP HUD data
  const myRow = livePlayers.find(p => p.user_id === mp.userId);
  const otherRow = livePlayers.find(p => p.user_id !== mp.userId);

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

          {/* Opponent disconnect overlay */}
          {gameState.screen === 'multiplayer-playing' && opponentMissing && (
            <div className="absolute inset-0 z-40 flex items-center justify-center bg-background/80 backdrop-blur-sm">
              <div className="border-2 border-destructive bg-card rounded-lg p-6 text-center max-w-sm mx-4">
                <p className="font-pixel text-sm text-destructive mb-2">PLAYER DISCONNECTED</p>
                <p className="font-mono text-xs text-muted-foreground mb-4">Waiting for {opponent?.name || 'opponent'} to reconnect...</p>
                <button onClick={() => { mp.leaveRoom(); returnToMenu(); }}
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
      {gameState.screen === 'game-mode-select' && <GameModeSelect playerName={playerNameLocal} onSinglePlayer={handleSinglePlayer} onMultiplayer={handleMultiplayer} onBack={() => setGameState('title')} />}
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
          onExit={() => { mp.leaveRoom(); setMatchStats(null); returnToMenu(); }}
        />
      )}
      {gameState.screen === 'post-match-report' && !matchStats && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/90">
          <p className="font-pixel text-sm text-primary text-glow-primary">CALCULATING MATCH RESULTS...</p>
        </div>
      )}

      {gameState.screen === 'paused' && (
        <PauseMenu
          onResume={resumeGame} onMainMenu={returnToMenu}
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
          onGoHome={handleGoHome}
          onViewLeaderboard={handleViewLeaderboard}
          playTime={getPlayTime()}
        />
      )}
    </div>
  );
};

export default Index;
