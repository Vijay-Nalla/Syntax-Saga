import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { isUsernameAvailable } from '@/game/saveSystem';
import { toast } from 'sonner';

interface Props { onSuccess: () => void; onBack: () => void; }

const USERNAME_RE = /^[A-Za-z0-9_]{3,20}$/;
const FORBIDDEN = ['admin', 'root', 'fuck', 'shit', 'bitch', 'damn', 'asshole'];

function validateUsername(u: string): string | null {
  if (!USERNAME_RE.test(u)) return 'Letters, numbers, underscore — 3-20 chars';
  if (FORBIDDEN.some(w => u.toLowerCase().includes(w))) return 'Username not allowed';
  return null;
}

function passwordStrength(p: string): { ok: boolean; label: string } {
  if (p.length < 8) return { ok: false, label: 'Too short (min 8)' };
  if (p.length > 64) return { ok: false, label: 'Too long (max 64)' };
  if (!/[A-Z]/.test(p)) return { ok: false, label: 'Needs an uppercase letter' };
  if (!/[a-z]/.test(p)) return { ok: false, label: 'Needs a lowercase letter' };
  if (!/[0-9]/.test(p)) return { ok: false, label: 'Needs a number' };
  if (!/[^A-Za-z0-9]/.test(p)) return { ok: false, label: 'Needs a special character' };
  return { ok: true, label: 'Strong password' };
}

export default function AuthSignup({ onSuccess, onBack }: Props) {
  const { signUp } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [recoveryEmail, setRecoveryEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [available, setAvailable] = useState<null | boolean>(null);

  const usernameErr = username ? validateUsername(username) : null;
  const pw = passwordStrength(password);
  const match = confirm === '' || password === confirm;

  useEffect(() => {
    if (!username || usernameErr) { setAvailable(null); return; }
    let cancelled = false;
    const t = setTimeout(async () => {
      const ok = await isUsernameAvailable(username);
      if (!cancelled) setAvailable(ok);
    }, 350);
    return () => { cancelled = true; clearTimeout(t); };
  }, [username, usernameErr]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (usernameErr || !pw.ok || !match || available === false) return;
    setBusy(true);
    const { error } = await signUp(username, password, recoveryEmail || undefined);
    setBusy(false);
    if (error) { toast.error(error.message || 'Sign up failed'); return; }
    toast.success('Account created — progress preserved');
    onSuccess();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background px-4 overflow-y-auto py-6">
      <div className="absolute inset-0 scanlines pointer-events-none z-10" />
      <form onSubmit={submit} className="relative z-20 w-full max-w-sm border-2 border-destructive/40 rounded-lg p-6 bg-card/70 backdrop-blur-md shadow-[0_0_30px_rgba(244,63,94,0.18)]">
        <h2 className="font-display text-2xl font-bold text-destructive mb-1">CREATE ACCOUNT</h2>
        <p className="font-mono text-xs text-muted-foreground mb-5">Save progress to the cloud</p>

        <label className="font-pixel text-[10px] text-muted-foreground">USERNAME</label>
        <input value={username} onChange={e => setUsername(e.target.value)}
          className="w-full mt-1 px-3 py-2 bg-background border border-border rounded font-mono text-sm focus:border-primary outline-none" />
        <div className="text-[11px] font-mono mb-3 mt-1 min-h-[14px]">
          {usernameErr && <span className="text-destructive">✗ {usernameErr}</span>}
          {!usernameErr && available === true && <span className="text-primary">✓ Username Available</span>}
          {!usernameErr && available === false && <span className="text-destructive">✗ Username Already Exists</span>}
        </div>

        <label className="font-pixel text-[10px] text-muted-foreground">PASSWORD</label>
        <input type="password" value={password} onChange={e => setPassword(e.target.value)}
          className="w-full mt-1 px-3 py-2 bg-background border border-border rounded font-mono text-sm focus:border-primary outline-none" />
        <div className="text-[11px] font-mono mb-3 mt-1 min-h-[14px]">
          {password && (pw.ok
            ? <span className="text-primary">✓ {pw.label}</span>
            : <span className="text-destructive">✗ {pw.label}</span>)}
        </div>

        <label className="font-pixel text-[10px] text-muted-foreground">CONFIRM PASSWORD</label>
        <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)}
          className="w-full mt-1 px-3 py-2 bg-background border border-border rounded font-mono text-sm focus:border-primary outline-none" />
        <div className="text-[11px] font-mono mb-3 mt-1 min-h-[14px]">
          {!match && <span className="text-destructive">✗ Passwords do not match</span>}
        </div>

        <label className="font-pixel text-[10px] text-muted-foreground">RECOVERY EMAIL (optional)</label>
        <input type="email" value={recoveryEmail} onChange={e => setRecoveryEmail(e.target.value)}
          placeholder="for password reset"
          className="w-full mt-1 mb-5 px-3 py-2 bg-background border border-border rounded font-mono text-sm focus:border-primary outline-none" />

        <button type="submit" disabled={busy || !!usernameErr || !pw.ok || !match || available === false}
          className="w-full font-pixel text-xs px-4 py-3 rounded border-2 border-destructive text-destructive bg-destructive/5 hover:bg-destructive/15 disabled:opacity-50">
          {busy ? 'CREATING…' : 'CREATE ACCOUNT'}
        </button>
        <button type="button" onClick={onBack}
          className="w-full mt-2 font-pixel text-[10px] px-4 py-2 text-muted-foreground hover:text-foreground">
          ← BACK
        </button>
      </form>
    </div>
  );
}
