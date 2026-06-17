import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export default function ForgotPassword({ onBack }: { onBack: () => void }) {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background px-4">
      <div className="relative z-20 w-full max-w-sm border-2 border-primary/40 rounded-lg p-6 bg-card/70 backdrop-blur-md">
        <h2 className="font-display text-2xl font-bold text-primary mb-1">FORGOT PASSWORD</h2>
        <p className="font-mono text-xs text-muted-foreground mb-4">Enter your recovery email</p>
        <input type="email" value={email} onChange={e => setEmail(e.target.value)}
          className="w-full mb-4 px-3 py-2 bg-background border border-border rounded font-mono text-sm focus:border-primary outline-none" />
        <button onClick={async () => {
          setBusy(true);
          const { error } = await resetPassword(email);
          setBusy(false);
          if (error) toast.error(error.message);
          else toast.success('Recovery link sent if the email is registered');
        }} disabled={busy || !email}
          className="w-full font-pixel text-xs px-4 py-3 rounded border-2 border-primary text-primary bg-primary/5 hover:bg-primary/15 disabled:opacity-50">
          {busy ? 'SENDING…' : 'SEND RESET LINK'}
        </button>
        <button onClick={onBack} className="w-full mt-2 font-pixel text-[10px] px-4 py-2 text-muted-foreground hover:text-foreground">
          ← BACK
        </button>
      </div>
    </div>
  );
}
