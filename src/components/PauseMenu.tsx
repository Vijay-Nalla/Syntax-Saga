import { Language, LANGUAGES } from '@/game/types';
import { audioManager } from '@/game/audioManager';
import { useState } from 'react';

interface PauseMenuProps {
  onResume: () => void;
  onMainMenu: () => void;
  onChangeLanguage: (lang: Language) => void;
  onViewLeaderboard: () => void;
  currentLanguage: Language;
}

export default function PauseMenu({ onResume, onMainMenu, onChangeLanguage, onViewLeaderboard, currentLanguage }: PauseMenuProps) {
  const [showLanguages, setShowLanguages] = useState(false);
  const [showConfirmMenu, setShowConfirmMenu] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [audioSettings, setAudioSettings] = useState(audioManager.getSettings());

  const handleMute = () => {
    audioManager.toggleMute();
    setAudioSettings(audioManager.getSettings());
  };

  const handleVolume = (e: React.ChangeEvent<HTMLInputElement>) => {
    audioManager.setVolume(parseFloat(e.target.value));
    setAudioSettings(audioManager.getSettings());
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/90 backdrop-blur-sm">
      <div className="absolute inset-0 scanlines pointer-events-none" />

      <div
        className="relative z-10 w-full max-w-md mx-4 border-2 border-primary rounded-lg bg-card p-8 box-glow-primary"
        style={{ animation: 'fadeInUp 0.3s ease-out' }}
      >
        <h2 className="font-display text-3xl font-black text-primary text-glow-primary text-center mb-2">
          PAUSED
        </h2>
        <p className="font-mono text-xs text-muted-foreground text-center mb-8">
          System suspended...
        </p>

        {/* Confirm return to main menu */}
        {showConfirmMenu && (
          <div className="mb-6 border-2 border-destructive rounded-lg p-4 bg-destructive/5">
            <p className="font-mono text-sm text-foreground mb-4">
              Return to main menu? Your current level progress will be lost.
            </p>
            <div className="flex gap-3 justify-center">
              <button onClick={onMainMenu}
                className="font-pixel text-[9px] px-6 py-2 border-2 border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground transition-all">
                CONFIRM
              </button>
              <button onClick={() => setShowConfirmMenu(false)}
                className="font-pixel text-[9px] px-6 py-2 border-2 border-border text-muted-foreground hover:border-foreground hover:text-foreground transition-all">
                CANCEL
              </button>
            </div>
          </div>
        )}

        {/* Settings panel */}
        {showSettings && (
          <div className="mb-6 border-2 border-secondary rounded-lg p-4 bg-secondary/5">
            <p className="font-pixel text-[9px] text-secondary mb-4 text-center">⚙ SETTINGS</p>
            <div className="flex items-center justify-between mb-3">
              <span className="font-mono text-xs text-foreground">Sound</span>
              <button onClick={handleMute}
                className={`font-pixel text-[8px] px-4 py-1 border-2 rounded transition-all
                  ${audioSettings.muted ? 'border-destructive text-destructive' : 'border-primary text-primary'}`}>
                {audioSettings.muted ? '🔇 MUTED' : '🔊 ON'}
              </button>
            </div>
            <div className="flex items-center gap-3">
              <span className="font-mono text-xs text-muted-foreground">Vol</span>
              <input
                type="range" min="0" max="1" step="0.05"
                value={audioSettings.volume}
                onChange={handleVolume}
                className="flex-1 accent-primary h-1"
              />
              <span className="font-pixel text-[8px] text-foreground w-8 text-right">
                {Math.round(audioSettings.volume * 100)}
              </span>
            </div>
            <button onClick={() => setShowSettings(false)}
              className="mt-3 w-full font-pixel text-[8px] text-muted-foreground hover:text-foreground transition-all">
              BACK
            </button>
          </div>
        )}

        {/* Language selection panel */}
        {showLanguages && (
          <div className="mb-6 border-2 border-secondary rounded-lg p-4 bg-secondary/5">
            <p className="font-mono text-xs text-muted-foreground mb-3 text-center">
              Switch programming realm (resets level progress):
            </p>
            <div className="grid grid-cols-2 gap-2">
              {LANGUAGES.map((lang) => (
                <button
                  key={lang.id}
                  onClick={() => {
                    if (lang.id !== currentLanguage) onChangeLanguage(lang.id);
                    else { setShowLanguages(false); }
                  }}
                  className={`font-pixel text-[9px] px-4 py-3 border-2 rounded transition-all
                    ${lang.id === currentLanguage
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border text-muted-foreground hover:border-foreground hover:text-foreground'
                    }`}
                  style={lang.id !== currentLanguage ? { borderColor: `${lang.color}60` } : undefined}
                >
                  {lang.icon} {lang.name}
                </button>
              ))}
            </div>
            <button onClick={() => setShowLanguages(false)}
              className="mt-3 w-full font-pixel text-[8px] text-muted-foreground hover:text-foreground transition-all">
              BACK
            </button>
          </div>
        )}

        {/* Menu buttons */}
        {!showConfirmMenu && !showLanguages && !showSettings && (
          <div className="flex flex-col gap-3">
            <button onClick={onResume}
              className="font-pixel text-[10px] w-full px-8 py-4 border-2 border-primary text-primary
                hover:bg-primary hover:text-primary-foreground transition-all box-glow-green">
              ▶ RESUME GAME
            </button>
            <button onClick={() => setShowLanguages(true)}
              className="font-pixel text-[10px] w-full px-8 py-3 border-2 border-secondary text-secondary
                hover:bg-secondary hover:text-secondary-foreground transition-all">
              ⟐ CHANGE LANGUAGE
            </button>
            <button onClick={() => setShowSettings(true)}
              className="font-pixel text-[10px] w-full px-8 py-3 border-2 border-border text-muted-foreground
                hover:border-secondary hover:text-secondary transition-all">
              ⚙ SETTINGS
            </button>
            <button onClick={onViewLeaderboard}
              className="font-pixel text-[10px] w-full px-8 py-3 border-2 border-border text-muted-foreground
                hover:border-accent hover:text-accent transition-all">
              🏆 LEADERBOARD
            </button>
            <button onClick={() => setShowConfirmMenu(true)}
              className="font-pixel text-[10px] w-full px-8 py-3 border-2 border-border text-muted-foreground
                hover:border-destructive hover:text-destructive transition-all">
              ✕ MAIN MENU
            </button>
          </div>
        )}

        <p className="font-mono text-[8px] text-muted-foreground text-center mt-6 opacity-50">
          Press ESC to resume
        </p>
      </div>
    </div>
  );
}
