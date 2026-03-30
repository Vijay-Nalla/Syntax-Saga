import { useRef, useCallback, useState } from 'react';
import { useGameEngine } from '@/game/useGameEngine';
import { Language } from '@/game/types';
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

const Index = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const {
    gameState, startGame, answerQuestion, useHint, nextLevel, replayLevel,
    pauseGame, resumeGame, returnToMenu, changeLanguage, setGameState, getPlayTime, keysRef,
  } = useGameEngine(canvasRef);

  const [playerNameLocal, setPlayerNameLocal] = useState(getPlayerName() || '');

  const handleStart = useCallback(() => {
    const saved = getPlayerName();
    if (saved) {
      setPlayerNameLocal(saved);
      setGameState('language-select');
    } else {
      setGameState('name-entry');
    }
  }, [setGameState]);

  const handleNameSubmit = useCallback((name: string) => {
    setPlayerName(name);
    setPlayerNameLocal(name);
    setGameState('language-select');
  }, [setGameState]);

  const handleSelectLanguage = useCallback((lang: Language) => {
    startGame(lang, playerNameLocal);
  }, [startGame, playerNameLocal]);

  const handleRestart = useCallback(() => {
    startGame(gameState.player.language, playerNameLocal);
  }, [startGame, gameState.player.language, playerNameLocal]);

  const handleViewLeaderboard = useCallback(() => {
    setGameState('leaderboard');
  }, [setGameState]);

  const handleGoogleSuccess = useCallback((name: string) => {
    setPlayerName(name);
    setPlayerNameLocal(name);
    setGameState('language-select');
  }, [setGameState]);

  const handleGoHome = useCallback(() => {
    returnToMenu();
  }, [returnToMenu]);

  const levelData = getLevelData(gameState.currentLevel);
  const isInGame = gameState.screen === 'playing' || gameState.screen === 'challenge' || gameState.screen === 'paused';

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
      {isInGame && (
        <>
          <GameHUD player={gameState.player} levelNum={gameState.currentLevel} levelTopic={levelData.topic} isUnderground={gameState.isUnderground} />
          <button
            onClick={pauseGame}
            className="absolute top-2 right-2 sm:top-3 sm:right-3 z-40 font-pixel text-[8px] sm:text-[9px] px-2 sm:px-3 py-1.5 sm:py-2
              border border-border text-muted-foreground bg-card/80 backdrop-blur-sm rounded
              hover:border-primary hover:text-primary transition-all pointer-events-auto"
          >
            ☰
          </button>
          {/* Touch controls */}
          <TouchControls keysRef={keysRef} onPause={pauseGame} onHint={useHint} />
        </>
      )}

      {/* Screens */}
      {gameState.screen === 'title' && <TitleScreen onStart={handleStart} onLeaderboard={handleViewLeaderboard} onGoogleSuccess={handleGoogleSuccess} />}
      {gameState.screen === 'name-entry' && <PlayerNameEntry onSubmit={handleNameSubmit} onBack={() => setGameState('title')} />}
      {gameState.screen === 'language-select' && <LanguageSelect onSelect={handleSelectLanguage} />}
      {gameState.screen === 'leaderboard' && <LeaderboardScreen onBack={() => setGameState('title')} />}

      {/* Pause Menu */}
      {gameState.screen === 'paused' && (
        <PauseMenu
          onResume={resumeGame}
          onMainMenu={returnToMenu}
          onChangeLanguage={changeLanguage}
          onViewLeaderboard={handleViewLeaderboard}
          currentLanguage={gameState.player.language}
        />
      )}

      {/* Challenge */}
      {gameState.screen === 'challenge' && gameState.currentQuestion && (
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
