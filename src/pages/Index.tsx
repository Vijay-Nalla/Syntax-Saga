import { useRef, useCallback } from 'react';
import { useGameEngine } from '@/game/useGameEngine';
import { Language } from '@/game/types';
import { getLevelData } from '@/game/levels';
import TitleScreen from '@/components/TitleScreen';
import LanguageSelect from '@/components/LanguageSelect';
import GameHUD from '@/components/GameHUD';
import CodingChallenge from '@/components/CodingChallenge';
import GameOverScreen from '@/components/GameOverScreen';

const Index = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const { gameState, startGame, answerQuestion, nextLevel, setGameState } = useGameEngine(canvasRef);

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

  return (
    <div className="fixed inset-0 bg-background overflow-hidden">
      {/* Game Canvas - always mounted */}
      <div className="flex items-center justify-center w-full h-full">
        <canvas
          ref={canvasRef}
          width={960}
          height={600}
          className="border border-border rounded-lg"
          style={{
            maxWidth: '100%',
            maxHeight: '100%',
            display: gameState.screen === 'playing' || gameState.screen === 'challenge' ? 'block' : 'none',
            imageRendering: 'pixelated',
          }}
        />
      </div>

      {/* HUD */}
      {(gameState.screen === 'playing' || gameState.screen === 'challenge') && (
        <GameHUD player={gameState.player} levelNum={gameState.currentLevel} levelTopic={levelData.topic} />
      )}

      {/* Screens */}
      {gameState.screen === 'title' && <TitleScreen onStart={handleStart} />}
      {gameState.screen === 'language-select' && <LanguageSelect onSelect={handleSelectLanguage} />}

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
