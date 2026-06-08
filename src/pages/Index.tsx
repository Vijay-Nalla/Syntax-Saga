import { useRef, useCallback, useState, useEffect } from 'react';
import { useGameEngine } from '@/game/useGameEngine';
import { Language, MatchStats } from '@/game/types';
import { getLevelData } from '@/game/levels';
import { getPlayerName, setPlayerName } from '@/game/leaderboard';
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
import { useMultiplayer } from '@/game/useMultiplayer';

const Index = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const {
    gameState, startGame, answerQuestion, useHint, nextLevel, replayLevel,
    pauseGame, resumeGame, returnToMenu, changeLanguage, setControlMode, setGameState, getPlayTime, keysRef,
  } = useGameEngine(canvasRef);

  const [playerNameLocal, setPlayerNameLocal] = useState(getPlayerName() || '');
  const [matchTimeElapsed, setMatchTimeElapsed] = useState(0);
  const [matchStats, setMatchStats] = useState<MatchStats | null>(null);

  const {
    roomCode,
    remotePlayer,
    isConnected,
    isRoomReady,
    createRoom,
    joinRoom,
    generateMockStats,
    leaveRoom
  } = useMultiplayer();

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
    setGameState('game-mode-select');
  }, [setGameState]);

  const handleSinglePlayer = useCallback(() => {
    setGameState('language-select');
  }, [setGameState]);

  const handleMultiplayer = useCallback(() => {
    setGameState('multiplayer-lobby');
  }, [setGameState]);

  const handleCreateRoom = useCallback((code: string) => {
    createRoom(code);
  }, [createRoom]);

  const handleJoinRoom = useCallback((code: string) => {
    joinRoom(code);
  }, [joinRoom]);

  const handleStartMultiplayer = useCallback((lang: Language) => {
    startGame(lang, playerNameLocal);
    setGameState('multiplayer-playing');
    setMatchTimeElapsed(0);
  }, [startGame, playerNameLocal, setGameState]);

  // When lobby is ready (both players), show language select or start
  useEffect(() => {
    if (isRoomReady && gameState.screen === 'multiplayer-lobby') {
      // Go to language select for multiplayer too
      setGameState('language-select');
    }
  }, [isRoomReady, gameState.screen, setGameState]);

  // Timer for multiplayer match time
  useEffect(() => {
    if (gameState.screen === 'multiplayer-playing') {
      const interval = setInterval(() => {
        setMatchTimeElapsed(prev => prev + 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [gameState.screen]);

  const handleSelectLanguage = useCallback((lang: Language) => {
    if (isRoomReady) {
      handleStartMultiplayer(lang);
    } else {
      startGame(lang, playerNameLocal);
    }
  }, [startGame, playerNameLocal, isRoomReady, handleStartMultiplayer]);

  const handleRestart = useCallback(() => {
    startGame(gameState.player.language, playerNameLocal);
  }, [startGame, gameState.player.language, playerNameLocal]);

  const handleViewLeaderboard = useCallback(() => {
    setGameState('leaderboard');
  }, [setGameState]);

  const handleGoHome = useCallback(() => {
    returnToMenu();
  }, [returnToMenu]);

  const levelData = getLevelData(gameState.currentLevel);
  const isInGame = gameState.screen === 'playing' || gameState.screen === 'challenge' || gameState.screen === 'paused' || gameState.screen === 'multiplayer-playing' || gameState.screen === 'multiplayer-challenge';

  return (
    <div className="fixed inset-0 bg-background overflow-hidden">
      {/* Game Canvas — responsive */}
      <div className="flex items-center justify-center w-full h-full p-2 sm:p-4">
        <canvas
          ref={canvasRef}
          width={960}
          height={600}
          className="border border-border rounded-lg"
          style={{
            width: '100%',
            maxWidth: '960px',
            height: 'auto',
            aspectRatio: '960 / 600',
            display: isInGame ? 'block' : 'none',
            imageRendering: 'pixelated',
          }}
        />
      </div>

      {/* HUD + Menu Button */}
      {(gameState.screen === 'playing' || gameState.screen === 'multiplayer-playing') && (
        <>
          {gameState.screen === 'playing' ? (
            <GameHUD player={gameState.player} levelNum={gameState.currentLevel} levelTopic={levelData.topic} isUnderground={gameState.isUnderground} />
          ) : (
            <MultiplayerGameHUD 
              player1={{
                name: playerNameLocal,
                score: gameState.player.xp + gameState.player.coins * 10,
                coins: gameState.player.coins,
                x: gameState.player.x
              }}
              player2={{
                name: remotePlayer?.name || 'Friend',
                score: remotePlayer ? remotePlayer.xp + remotePlayer.coins *10 : 200,
                coins: remotePlayer?.coins || 0,
                x: remotePlayer?.x || 100
              }}
              levelNum={gameState.currentLevel}
              levelTopic={levelData.topic}
              isUnderground={gameState.isUnderground}
              timeElapsed={matchTimeElapsed}
            />
          )}
          <button
            onClick={pauseGame}
            className="absolute top-2 right-2 sm:top-3 sm:right-3 z-40 font-pixel text-[8px] sm:text-[9px] px-2 sm:px-3 py-1.5 sm:py-2
              border border-border text-muted-foreground bg-card/80 backdrop-blur-sm rounded
              hover:border-primary hover:text-primary transition-all pointer-events-auto"
          >
            ☰
          </button>
          {/* Touch controls */}
          <TouchControls 
            keysRef={keysRef} 
            onPause={pauseGame} 
            onHint={useHint} 
            isNearTerminal={gameState.isNearTerminal}
            player={gameState.player}
            cameraX={gameState.cameraX}
            canvasRef={canvasRef}
            controlMode={gameState.controlMode}
          />
        </>
      )}

      {/* Screens */}
      {gameState.screen === 'title' && <TitleScreen onStart={handleStart} onLeaderboard={handleViewLeaderboard} />}
      {gameState.screen === 'name-entry' && <PlayerNameEntry onSubmit={handleNameSubmit} onBack={() => setGameState('title')} />}
      {gameState.screen === 'game-mode-select' && <GameModeSelect playerName={playerNameLocal} onSinglePlayer={handleSinglePlayer} onMultiplayer={handleMultiplayer} onBack={() => setGameState('title')} />}
      {gameState.screen === 'language-select' && <LanguageSelect onSelect={handleSelectLanguage} />}
      {gameState.screen === 'leaderboard' && <LeaderboardScreen onBack={() => setGameState('title')} />}
      {gameState.screen === 'multiplayer-lobby' && <MultiplayerLobby onBack={() => {leaveRoom(); setGameState('game-mode-select');}} onCreateRoom={handleCreateRoom} onJoinRoom={handleJoinRoom} />}

      {/* Post Match Report */}
      {gameState.screen === 'post-match-report' && matchStats && (
        <PostMatchReport
          stats={matchStats}
          onRematch={() => setGameState('multiplayer-lobby')}
          onNewRoom={() => {leaveRoom(); setGameState('game-mode-select');}}
          onExit={() => {leaveRoom(); returnToMenu();}}
        />
      )}

      {/* Pause Menu */}
      {gameState.screen === 'paused' && (
        <PauseMenu
          onResume={resumeGame}
          onMainMenu={returnToMenu}
          onChangeLanguage={changeLanguage}
          onViewLeaderboard={handleViewLeaderboard}
          currentLanguage={gameState.player.language}
          controlMode={gameState.controlMode}
          onControlModeChange={setControlMode}
        />
      )}

      {/* Challenge */}
      {(gameState.screen === 'challenge' || gameState.screen === 'multiplayer-challenge') && gameState.currentQuestion && (
        <CodingChallenge
          question={gameState.currentQuestion}
          onAnswer={answerQuestion}
          playerCoins={gameState.player.coins}
          onUseHint={useHint}
        />
      )}

      {/* Game Over / Level Complete */}
      {(gameState.screen === 'game-over' || gameState.screen === 'level-complete') && (
        <GameOverScreen
          player={gameState.player}
          type={gameState.screen}
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
