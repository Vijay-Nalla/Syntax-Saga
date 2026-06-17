import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

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
        <button type="button" onClick={onBack}
          className="w-full mt-2 font-pixel text-[10px] px-4 py-2 text-muted-foreground hover:text-foreground">
          ← BACK
        </button>
      </form>
    </div>
  );
}
