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

const Index = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const {
    gameState, startGame, answerQuestion, useHint, nextLevel, replayLevel,
    pauseGame, resumeGame, returnToMenu, changeLanguage, setGameState, getPlayTime,
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

  const handleGoHome = useCallback(() => {
    returnToMenu();
  }, [returnToMenu]);

  const levelData = getLevelData(gameState.currentLevel);
  const isInGame = gameState.screen === 'playing' || gameState.screen === 'challenge' || gameState.screen === 'paused';

  return (
    <div className="fixed inset-0 bg-background overflow-hidden">
      {/* Game Canvas */}
      <div className="flex items-center justify-center w-full h-full">
        <canvas
          ref={canvasRef}
          width={960}
          height={600}
          className="border border-border rounded-lg"
          style={{
            maxWidth: '100%',
            maxHeight: '100%',
            display: isInGame ? 'block' : 'none',
            imageRendering: 'pixelated',
          }}
        />
      </div>

      {/* HUD + Menu Button (top-right) */}
      {isInGame && (
        <>
          <GameHUD player={gameState.player} levelNum={gameState.currentLevel} levelTopic={levelData.topic} isUnderground={gameState.isUnderground} />
          <button
            onClick={pauseGame}
            className="absolute top-3 right-3 z-40 font-pixel text-[9px] px-3 py-2
              border border-border text-muted-foreground bg-card/80 backdrop-blur-sm rounded
              hover:border-primary hover:text-primary transition-all pointer-events-auto"
          >
            ☰ MENU
          </button>
        </>
      )}

      {/* Screens */}
      {gameState.screen === 'title' && <TitleScreen onStart={handleStart} onLeaderboard={handleViewLeaderboard} />}
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
