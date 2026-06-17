interface Props {
  onLogin: () => void;
  onSignup: () => void;
  onGuest: () => void;
}

export default function WelcomeScreen({ onLogin, onSignup, onGuest }: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background overflow-hidden">
      <div className="absolute inset-0 scanlines pointer-events-none z-10" />
      <div className="relative z-20 max-w-md w-full px-6 text-center">
        <h1
          className="font-display text-4xl sm:text-6xl font-black mb-2 leading-tight"
          style={{
            backgroundImage: 'linear-gradient(135deg, hsl(200, 100%, 65%), hsl(0, 90%, 60%))',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            filter: 'drop-shadow(0 0 18px rgba(120,180,255,0.55))',
          }}
        >
          SYNTAX SAGA
        </h1>
        <p className="font-mono text-xs sm:text-sm text-muted-foreground mb-10">
          Learn Coding Through Adventure
        </p>

        <div className="flex flex-col gap-3">
          <button onClick={onLogin}
            className="font-pixel text-[11px] sm:text-xs px-6 py-4 rounded-md border-2 border-primary text-primary
                       bg-primary/5 hover:bg-primary/15 hover:scale-[1.02] active:scale-100 transition-all
                       backdrop-blur-sm shadow-[0_0_20px_rgba(56,189,248,0.25)]">
            LOGIN
          </button>
          <button onClick={onSignup}
            className="font-pixel text-[11px] sm:text-xs px-6 py-4 rounded-md border-2 border-destructive text-destructive
                       bg-destructive/5 hover:bg-destructive/15 hover:scale-[1.02] active:scale-100 transition-all
                       backdrop-blur-sm shadow-[0_0_20px_rgba(244,63,94,0.25)]">
            CREATE ACCOUNT
          </button>
          <button onClick={onGuest}
            className="font-pixel text-[10px] sm:text-[11px] px-6 py-3 rounded-md border border-border text-muted-foreground
                       hover:border-foreground hover:text-foreground transition-all">
            PLAY AS GUEST
          </button>
        </div>

        <p className="font-mono text-[10px] text-muted-foreground/70 mt-8">
          Your progress is auto-saved and synced across devices when you sign in.
        </p>
      </div>
    </div>
  );
}
