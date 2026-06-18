import { useEffect, useState } from 'react';
import { subscribeStatus, drain, pendingCount, isOnline, type CloudStatus } from '@/game/syncQueue';
import { useAuth } from '@/hooks/useAuth';

interface Props { variant?: 'pill' | 'inline'; }

export default function CloudStatusBadge({ variant = 'pill' }: Props) {
  const { user } = useAuth();
  const [status, setStatus] = useState<CloudStatus>(isOnline() ? 'synced' : 'offline');
  const [pending, setPending] = useState(pendingCount());

  useEffect(() => {
    const off = subscribeStatus(({ status, pending }) => {
      setStatus(user ? status : 'synced');
      setPending(pending);
    });
    return off;
  }, [user]);

  const label = !user ? 'Local Save'
    : status === 'offline' ? 'Offline Mode'
    : status === 'syncing' ? 'Syncing…'
    : status === 'pending' ? `${pending} pending`
    : '✓ Synced';
  const color = status === 'offline' ? 'text-destructive border-destructive/40'
    : status === 'syncing' ? 'text-primary border-primary/40 animate-pulse'
    : status === 'pending' ? 'text-yellow-400 border-yellow-400/40'
    : 'text-primary border-primary/40';

  const base = `font-pixel text-[9px] px-2 py-1 rounded border bg-card/70 backdrop-blur-sm ${color}`;
  if (variant === 'inline') return <span className={`inline-block ${base}`}>{label}</span>;
  return (
    <button
      onClick={() => { drain().catch(() => {}); }}
      className={`fixed bottom-2 right-2 z-[60] ${base} hover:scale-105 transition-transform pointer-events-auto`}
      title="Click to force sync">
      {label}
    </button>
  );
}
