import { useRef, useCallback } from 'react';
import { useGameEngine } from '@/game/useGameEngine';
import { Language } from '@/game/types';
import { getLevelData } from '@/game/levels';
import TitleScreen from '@/components/TitleScreen';
import LanguageSelect from '@/components/LanguageSelect';
import GameHUD from '@/components/GameHUD';
import CodingChallenge from '@/components/CodingChallenge';
import GameOverScreen from '@/components/GameOverScreen';
import PauseMenu from '@/components/PauseMenu';

const Index = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const {
    gameState, startGame, answerQuestion, nextLevel,
    pauseGame, resumeGame, returnToMenu, changeLanguage, setGameState,
  } = useGameEngine(canvasRef);

  const handleStart = useCallback(() => {
    setGameState('language-select');
  }, [setGameState]);

  const handleSelectLanguage = useCallback((lang: Language) => {
    startGame(lang);
  }, [startGame]);

  const handleRestart = useCallback(() => {
    startGame(gameState.player.language);
  }, [startGame, gameState.player.language]);

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

      {/* HUD + Back Button */}
      {isInGame && (
        <>
          <GameHUD player={gameState.player} levelNum={gameState.currentLevel} levelTopic={levelData.topic} />
          {/* Back / Pause button */}
          <button
            onClick={pauseGame}
            className="absolute top-3 left-3 z-40 font-pixel text-[9px] px-3 py-2
              border border-border text-muted-foreground bg-card/80 backdrop-blur-sm rounded
              hover:border-primary hover:text-primary transition-all pointer-events-auto"
          >
            ☰ MENU
          </button>
        </>
      )}

      {/* Screens */}
      {gameState.screen === 'title' && <TitleScreen onStart={handleStart} />}
      {gameState.screen === 'language-select' && <LanguageSelect onSelect={handleSelectLanguage} />}

      {/* Pause Menu */}
      {gameState.screen === 'paused' && (
        <PauseMenu
          onResume={resumeGame}
          onMainMenu={returnToMenu}
          onChangeLanguage={changeLanguage}
          currentLanguage={gameState.player.language}
        />
      )}

      {/* Challenge */}
      {gameState.screen === 'challenge' && gameState.currentQuestion && (
        <CodingChallenge question={gameState.currentQuestion} onAnswer={answerQuestion} />
      )}

      {/* Game Over / Level Complete */}
      {(gameState.screen === 'game-over' || gameState.screen === 'level-complete') && (
        <GameOverScreen
          player={gameState.player}
          type={gameState.screen}
          onRestart={handleRestart}
          onNextLevel={gameState.screen === 'level-complete' ? nextLevel : undefined}
        />
      )}
    </div>
  );
};

export default Index;
