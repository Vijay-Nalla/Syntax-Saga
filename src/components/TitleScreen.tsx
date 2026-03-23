import { useEffect, useState } from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { useToast } from './ui/use-toast';

interface TitleScreenProps {
  onStart: () => void;
  onLeaderboard: () => void;
  onGoogleSuccess?: (name: string) => void;
}

const STORY_TEXT = "One coder. Five realms. Crush the Bug King. Restore the Multiverse.";

export default function TitleScreen({ onStart, onLeaderboard, onGoogleSuccess }: TitleScreenProps) {
  const [showStory, setShowStory] = useState(false);
  const [typedText, setTypedText] = useState('');
  const [ready, setReady] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const t1 = setTimeout(() => setShowStory(true), 800);
    return () => clearTimeout(t1);
  }, []);

  useEffect(() => {
    if (!showStory) return;
    let i = 0;
    const interval = setInterval(() => {
      i++;
      setTypedText(STORY_TEXT.slice(0, i));
      if (i >= STORY_TEXT.length) {
        clearInterval(interval);
        setTimeout(() => setReady(true), 500);
      }
    }, 30);
    return () => clearInterval(interval);
  }, [showStory]);

  const handleGoogleSuccess = (credentialResponse: any) => {
    try {
      // Decrypt the JWT token to get user info (simplified for demo)
      const payload = JSON.parse(atob(credentialResponse.credential.split('.')[1]));
      const name = payload.name || payload.given_name || 'Coder';
      
      toast({
        title: "Welcome, " + name + "!",
        description: "Successfully logged in with Google.",
      });

      if (onGoogleSuccess) {
        onGoogleSuccess(name);
      }
    } catch (error) {
      console.error("Failed to parse Google login response:", error);
      toast({
        variant: "destructive",
        title: "Login Failed",
        description: "Could not retrieve user info from Google.",
      });
    }
  };

  const handleGoogleError = () => {
    toast({
      variant: "destructive",
      title: "Google Login Failed",
      description: "An error occurred during Google authentication.",
    });
  };

  return (
    <div className="fixed inset-0 bg-background flex flex-col items-center justify-center overflow-hidden">
      <div className="absolute inset-0 scanlines pointer-events-none z-10" />

      {/* Matrix rain effect */}
      <div className="absolute inset-0 overflow-hidden opacity-10">
        {Array.from({ length: 30 }).map((_, i) => (
          <div
            key={i}
            className="absolute text-primary font-mono text-xs"
            style={{
              left: `${(i / 30) * 100}%`,
              animation: `matrixRain ${3 + Math.random() * 4}s linear infinite`,
              animationDelay: `${Math.random() * 3}s`,
            }}
          >
            {Array.from({ length: 20 }).map((_, j) => (
              <div key={j}>{String.fromCharCode(0x30A0 + Math.random() * 96)}</div>
            ))}
          </div>
        ))}
      </div>

      <div className="relative z-20 text-center px-4 sm:px-8 max-w-3xl">
        <h1
          className="font-display text-3xl sm:text-5xl md:text-7xl font-black mb-2 glitch-text"
          style={{
            background: 'linear-gradient(135deg, hsl(200, 90%, 70%), hsl(350, 80%, 65%))',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            filter: 'drop-shadow(0 0 20px hsla(200, 90%, 70%, 0.5)) drop-shadow(0 0 40px hsla(350, 80%, 65%, 0.3))',
          }}
        >
          SYNTAX SAGA
        </h1>
        <p className="font-pixel text-[8px] sm:text-xs md:text-sm text-neon-cyan text-glow-cyan mb-8 sm:mb-12 tracking-widest">
          THE MULTIVERSE CODING ADVENTURE
        </p>

        {showStory && (
          <div className="border border-border rounded-lg p-6 bg-card/80 backdrop-blur mb-10 min-h-[100px]">
            <p className="font-mono text-xs text-foreground leading-snug italic">
              {typedText}
              {typedText.length < STORY_TEXT.length && <span className="typing-cursor" />}
            </p>
          </div>
        )}

        {ready && (
          <div className="flex flex-col items-center gap-4">
            <button
              onClick={onStart}
              className="font-pixel text-sm px-10 py-4 border-2 border-primary text-primary bg-transparent
                hover:bg-primary hover:text-primary-foreground transition-all duration-300
                box-glow-primary hover:scale-105 active:scale-95"
              style={{ animation: 'fadeInUp 0.5s ease-out' }}
            >
              PRESS START
            </button>
            
            <div 
              className="mt-2 scale-90 sm:scale-100"
              style={{ animation: 'fadeInUp 0.6s ease-out' }}
            >
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={handleGoogleError}
                theme="dark"
                shape="square"
                text="signin_with"
              />
            </div>

            <button
              onClick={onLeaderboard}
              className="font-pixel text-[9px] px-6 py-2 border border-border text-muted-foreground
                hover:border-secondary hover:text-secondary transition-all"
              style={{ animation: 'fadeInUp 0.7s ease-out' }}
            >
              LEADERBOARD
            </button>
          </div>
        )}

        <p className="font-mono text-[9px] sm:text-xs text-muted-foreground mt-4 sm:mt-6 opacity-60 hidden sm:block">
          Arrow Keys / WASD to move • Space to jump • E to interact • ↓ to enter pipes
        </p>
        <p className="font-mono text-[9px] text-muted-foreground mt-4 opacity-60 sm:hidden">
          Touch controls on screen
        </p>
      </div>
    </div>
  );
}
