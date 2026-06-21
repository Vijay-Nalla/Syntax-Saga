import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { lovable } from '@/integrations/lovable';
import { migrateGuestToAccount } from '@/game/saveSystem';


interface Props { onSuccess: () => void; onBack: () => void; onForgot: () => void; }

export default function AuthLogin({ onSuccess, onBack, onForgot }: Props) {
  const { signIn } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const { error } = await signIn(username.trim(), password);
    setBusy(false);
    if (error) { toast.error('Invalid Username or Password'); return; }
    toast.success('Welcome back!');
    onSuccess();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background px-4">
      <div className="absolute inset-0 scanlines pointer-events-none z-10" />
      <form onSubmit={submit} className="relative z-20 w-full max-w-sm border-2 border-primary/40 rounded-lg p-6 bg-card/70 backdrop-blur-md shadow-[0_0_30px_rgba(56,189,248,0.18)]">
        <h2 className="font-display text-2xl font-bold text-primary mb-1">LOGIN</h2>
        <p className="font-mono text-xs text-muted-foreground mb-6">Continue your adventure</p>

        <label className="font-pixel text-[10px] text-muted-foreground">USERNAME OR EMAIL</label>
        <input value={username} onChange={e => setUsername(e.target.value)} required
          className="w-full mt-1 mb-4 px-3 py-2 bg-background border border-border rounded font-mono text-sm focus:border-primary outline-none" />

        <label className="font-pixel text-[10px] text-muted-foreground">PASSWORD</label>
        <input type="password" value={password} onChange={e => setPassword(e.target.value)} required
          className="w-full mt-1 mb-2 px-3 py-2 bg-background border border-border rounded font-mono text-sm focus:border-primary outline-none" />

        <button type="button" onClick={onForgot} className="font-mono text-[11px] text-muted-foreground hover:text-primary underline mb-4">
          Forgot password?
        </button>

        <button type="submit" disabled={busy}
          className="w-full font-pixel text-xs px-4 py-3 rounded border-2 border-primary text-primary bg-primary/5 hover:bg-primary/15 disabled:opacity-50">
          {busy ? 'SIGNING IN…' : 'LOGIN'}
        </button>

        <div className="flex items-center gap-2 my-3">
          <div className="flex-1 h-px bg-border" />
          <span className="font-pixel text-[9px] text-muted-foreground">OR</span>
          <div className="flex-1 h-px bg-border" />
        </div>

        <button type="button" disabled={busy}
          onClick={async () => {
            setBusy(true);
            const result = await lovable.auth.signInWithOAuth('google', { redirect_uri: window.location.origin });
            if (result.error) { setBusy(false); toast.error('Google sign-in failed'); return; }
            if (result.redirected) return;
            await migrateGuestToAccount();
            toast.success('Signed in with Google');
            onSuccess();
          }}
          aria-label="Continue with Google"
          className="w-full flex items-center justify-center gap-2 font-pixel text-[10px] px-4 py-3 rounded border-2 border-border bg-card hover:bg-muted/40 disabled:opacity-50">
          <svg width="14" height="14" viewBox="0 0 48 48" aria-hidden="true">
            <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.9 32.3 29.4 35.5 24 35.5c-6.4 0-11.5-5.1-11.5-11.5S17.6 12.5 24 12.5c2.9 0 5.6 1.1 7.6 2.9l5.7-5.7C33.6 6.4 29.1 4.5 24 4.5 13.2 4.5 4.5 13.2 4.5 24S13.2 43.5 24 43.5 43.5 34.8 43.5 24c0-1.2-.1-2.4-.4-3.5z"/>
            <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 16 19 12.5 24 12.5c2.9 0 5.6 1.1 7.6 2.9l5.7-5.7C33.6 6.4 29.1 4.5 24 4.5 16.3 4.5 9.7 8.9 6.3 14.7z"/>
            <path fill="#4CAF50" d="M24 43.5c5.1 0 9.6-1.8 13.1-4.9l-6.1-5c-2 1.5-4.5 2.4-7 2.4-5.4 0-9.9-3.2-11.3-7.7l-6.5 5C9.6 39 16.2 43.5 24 43.5z"/>
            <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.7 2-2 3.7-3.8 4.9l6.1 5c-.4.4 6.4-4.6 6.4-13.9 0-1.2-.1-2.4-.4-3.5z"/>
          </svg>
          CONTINUE WITH GOOGLE
        </button>

        <button type="button" onClick={onBack}
          className="w-full mt-2 font-pixel text-[10px] px-4 py-2 text-muted-foreground hover:text-foreground">
          ← BACK
        </button>

      </form>
    </div>
  );
}
