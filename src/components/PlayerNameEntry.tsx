import { useState } from 'react';

interface PlayerNameEntryProps {
  onSubmit: (name: string) => void;
  onBack: () => void;
}

export default function PlayerNameEntry({ onSubmit, onBack }: PlayerNameEntryProps) {
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = () => {
    const trimmed = name.trim();
    if (!trimmed) { setError('Enter a valid name, hacker.'); return; }
    if (trimmed.length > 16) { setError('Max 16 characters.'); return; }
    onSubmit(trimmed);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background">
      <div className="absolute inset-0 scanlines pointer-events-none" />
      <div className="relative z-10 w-full max-w-md mx-4 border-2 border-primary rounded-lg bg-card p-8 box-glow-primary"
        style={{ animation: 'fadeInUp 0.3s ease-out' }}>
        <h2 className="font-display text-2xl font-black text-primary text-glow-primary text-center mb-2">
          IDENTIFY YOURSELF
        </h2>
        <p className="font-mono text-xs text-muted-foreground text-center mb-6">
          Enter your hacker alias to begin
        </p>

        <input
          type="text"
          value={name}
          onChange={(e) => { setName(e.target.value); setError(''); }}
          onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
          maxLength={16}
          placeholder="Your name..."
          autoFocus
          className="w-full bg-muted border-2 border-border rounded px-4 py-3 font-mono text-sm text-foreground
            focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary
            placeholder:text-muted-foreground mb-2"
        />
        {error && <p className="font-pixel text-[8px] text-destructive mb-3">{error}</p>}

        <button
          onClick={handleSubmit}
          className="w-full font-pixel text-[10px] px-8 py-4 border-2 border-primary text-primary
            hover:bg-primary hover:text-primary-foreground transition-all box-glow-green mt-4"
        >
          JACK IN
        </button>
        <button
          onClick={onBack}
          className="w-full font-pixel text-[8px] text-muted-foreground hover:text-foreground mt-3 transition-all"
        >
          ← BACK
        </button>
      </div>
    </div>
  );
}
