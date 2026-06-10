import { useEffect, useState, useMemo } from 'react';
import { LANGUAGES, Language } from '@/game/types';
import { audioManager } from '@/game/audioManager';

interface MultiplayerLobbyProps {
  playerName: string;
  onBack: () => void;
  onMatchStart: (language: Language, roomCode: string, isHost: boolean) => void;
  mp: ReturnType<typeof import('@/game/useMultiplayer').useMultiplayer>;
  initialJoinCode?: string;
}

export default function MultiplayerLobby({ playerName, onBack, onMatchStart, mp, initialJoinCode }: MultiplayerLobbyProps) {
  const { room, players, error, joining, isHost, userId, createRoom, joinRoom, setReady, setLanguage, startMatch, leaveRoom } = mp;
  const [mode, setMode] = useState<'select' | 'create' | 'join'>(initialJoinCode ? 'join' : 'select');
  const [joinInput, setJoinInput] = useState(initialJoinCode || '');
  const [autoJoined, setAutoJoined] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  const me = players.find(p => p.user_id === userId);
  const both = players.length === 2;
  const allReady = both && players.every(p => p.ready);

  const inviteLink = useMemo(() => {
    if (!room) return '';
    return `${window.location.origin}/?join=${room.code}`;
  }, [room]);

  // Auto-join from deep link
  useEffect(() => {
    if (initialJoinCode && !autoJoined && !room) {
      setAutoJoined(true);
      joinRoom(initialJoinCode);
    }
  }, [initialJoinCode, autoJoined, room, joinRoom]);

  // Auto-transition into game when host flips status to playing
  useEffect(() => {
    if (room?.status === 'playing') {
      onMatchStart(room.language as Language, room.code, isHost);
    }
  }, [room?.status, room?.language, room?.code, isHost, onMatchStart]);

  const handleCreate = async () => {
    audioManager.resumeContext();
    const code = await createRoom('javascript');
    if (code) setMode('create');
  };

  const handleJoin = async () => {
    audioManager.resumeContext();
    const ok = await joinRoom(joinInput);
    if (ok) setMode('create'); // same waiting screen
  };

  const copy = async (text: string, label: string) => {
    try { await navigator.clipboard.writeText(text); setCopied(label); setTimeout(() => setCopied(null), 1500); } catch {}
  };

  const shareWhatsApp = () => {
    const msg = `Join my Syntax Saga coding adventure!\n\nRoom Code: ${room?.code}\n\nOr join instantly: ${inviteLink}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const nativeShare = async () => {
    if (navigator.share && room) {
      try {
        await navigator.share({ title: 'Syntax Saga - Join my room', text: `Room Code: ${room.code}`, url: inviteLink });
      } catch {}
    } else {
      copy(inviteLink, 'Link');
    }
  };

  const handleBack = async () => { await leaveRoom(); onBack(); };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background overflow-y-auto py-4">
      <div className="absolute inset-0 scanlines pointer-events-none" />

      <div className="relative z-10 w-full max-w-md mx-4">
        {mode === 'select' && !room && (
          <div className="text-center">
            <h2 className="font-display text-3xl font-black text-primary text-glow-primary mb-2">MULTIPLAYER</h2>
            <p className="font-pixel text-[9px] text-muted-foreground mb-8">Race a friend through coding challenges</p>
            <div className="flex flex-col gap-4">
              <button onClick={handleCreate} disabled={joining}
                className="p-6 border-2 border-primary rounded-lg bg-card/80 backdrop-blur-sm hover:bg-primary/10 transition-all box-glow-primary disabled:opacity-50">
                <div className="font-pixel text-base text-primary text-glow-primary">CREATE ROOM</div>
              </button>
              <button onClick={() => setMode('join')}
                className="p-6 border-2 border-secondary rounded-lg bg-card/80 backdrop-blur-sm hover:bg-secondary/10 transition-all">
                <div className="font-pixel text-base text-secondary text-glow-cyan">JOIN ROOM</div>
              </button>
              <button onClick={handleBack} className="font-pixel text-[10px] text-muted-foreground hover:text-foreground">← BACK</button>
            </div>
          </div>
        )}

        {mode === 'join' && !room && (
          <div className="text-center">
            <h2 className="font-display text-2xl font-black text-primary text-glow-primary mb-4">JOIN ROOM</h2>
            <div className="mb-4 border-2 border-border rounded-lg bg-card/80 backdrop-blur-sm p-6">
              <p className="font-mono text-xs text-muted-foreground mb-4">Enter Room Code</p>
              <input type="text" value={joinInput}
                onChange={(e) => setJoinInput(e.target.value.toUpperCase().slice(0, 5))}
                maxLength={5} placeholder="AB4KX" autoFocus
                className="w-full bg-muted border-2 border-border rounded px-4 py-3 font-mono text-2xl text-center tracking-[0.5em] text-foreground focus:outline-none focus:border-primary mb-3" />
              {error && <p className="font-pixel text-[9px] text-destructive mb-3">{error}</p>}
              <button onClick={handleJoin} disabled={joining || joinInput.length !== 5}
                className="w-full font-pixel text-[10px] px-8 py-4 border-2 border-primary text-primary hover:bg-primary hover:text-primary-foreground transition-all disabled:opacity-30">
                {joining ? 'JOINING...' : 'JOIN'}
              </button>
            </div>
            <button onClick={() => setMode('select')} className="font-pixel text-[10px] text-muted-foreground hover:text-foreground">← BACK</button>
          </div>
        )}

        {room && (
          <div>
            <h2 className="font-display text-2xl font-black text-primary text-glow-primary text-center mb-4">LOBBY</h2>

            <div className="border-2 border-border rounded-lg bg-card/80 backdrop-blur-sm p-5 mb-4">
              <p className="font-mono text-[10px] text-muted-foreground text-center mb-2">ROOM CODE</p>
              <p className="font-display text-4xl font-black text-secondary text-glow-cyan tracking-[0.3em] text-center mb-4">{room.code}</p>

              <div className="grid grid-cols-2 gap-2 mb-3">
                <button onClick={() => copy(room.code, 'Code')} className="font-pixel text-[8px] px-2 py-2 border border-primary text-primary hover:bg-primary/10 rounded">
                  {copied === 'Code' ? '✓ COPIED' : 'COPY CODE'}
                </button>
                <button onClick={() => copy(inviteLink, 'Link')} className="font-pixel text-[8px] px-2 py-2 border border-secondary text-secondary hover:bg-secondary/10 rounded">
                  {copied === 'Link' ? '✓ COPIED' : 'COPY LINK'}
                </button>
                <button onClick={shareWhatsApp} className="font-pixel text-[8px] px-2 py-2 border border-green-500 text-green-400 hover:bg-green-500/10 rounded">
                  WHATSAPP
                </button>
                <button onClick={nativeShare} className="font-pixel text-[8px] px-2 py-2 border border-border text-foreground hover:bg-muted rounded">
                  SHARE
                </button>
              </div>

              <p className="font-mono text-[10px] text-muted-foreground break-all text-center">{inviteLink}</p>
            </div>

            <div className="border-2 border-border rounded-lg bg-card/80 backdrop-blur-sm p-4 mb-4">
              <p className="font-pixel text-[10px] text-muted-foreground mb-3">PLAYERS: {players.length}/2</p>
              <div className="space-y-2">
                {players.map(p => (
                  <div key={p.user_id} className="flex items-center justify-between border border-border rounded px-3 py-2">
                    <div className="flex items-center gap-2">
                      <span className="text-green-400 text-xs">●</span>
                      <span className="font-mono text-sm text-foreground">{p.name}</span>
                      {p.is_host && <span className="font-pixel text-[7px] text-primary">HOST</span>}
                      {p.user_id === userId && <span className="font-pixel text-[7px] text-muted-foreground">(you)</span>}
                    </div>
                    <span className={`font-pixel text-[8px] ${p.ready ? 'text-green-400' : 'text-muted-foreground'}`}>
                      {p.ready ? '✓ READY' : 'WAITING'}
                    </span>
                  </div>
                ))}
                {players.length < 2 && (
                  <div className="border border-dashed border-border rounded px-3 py-2 text-center">
                    <span className="font-pixel text-[9px] text-muted-foreground">Waiting for another player...</span>
                  </div>
                )}
              </div>
            </div>

            {/* Language - host only */}
            {isHost && (
              <div className="border-2 border-border rounded-lg bg-card/80 backdrop-blur-sm p-4 mb-4">
                <p className="font-pixel text-[10px] text-muted-foreground mb-2">LANGUAGE (host picks)</p>
                <div className="grid grid-cols-3 gap-2">
                  {LANGUAGES.map(l => (
                    <button key={l.id} onClick={() => setLanguage(l.id)}
                      className={`font-pixel text-[8px] px-2 py-2 border rounded ${room.language === l.id ? 'border-primary text-primary bg-primary/10' : 'border-border text-muted-foreground hover:border-secondary'}`}>
                      {l.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {!isHost && (
              <div className="border-2 border-border rounded-lg bg-card/80 backdrop-blur-sm p-3 mb-4 text-center">
                <p className="font-pixel text-[9px] text-muted-foreground">
                  LANGUAGE: <span className="text-primary">{LANGUAGES.find(l => l.id === room.language)?.name || room.language}</span>
                </p>
              </div>
            )}

            {/* Ready + Start */}
            <div className="flex flex-col gap-2">
              <button onClick={() => setReady(!me?.ready)}
                className={`font-pixel text-xs px-6 py-3 border-2 rounded transition-all
                  ${me?.ready ? 'border-green-500 text-green-400 bg-green-500/10' : 'border-secondary text-secondary hover:bg-secondary/10'}`}>
                {me?.ready ? '✓ READY' : 'CLICK TO READY UP'}
              </button>

              {isHost && (
                <button onClick={() => startMatch()} disabled={!allReady}
                  className="font-pixel text-sm px-6 py-4 border-2 border-primary text-primary hover:bg-primary hover:text-primary-foreground transition-all box-glow-primary disabled:opacity-30 disabled:cursor-not-allowed">
                  {!both ? 'WAITING FOR PLAYER...' : !allReady ? 'WAITING FOR READY...' : '▶ START MATCH'}
                </button>
              )}
              {!isHost && (
                <p className="font-pixel text-[9px] text-center text-muted-foreground py-2">
                  {!both ? 'Waiting for everyone...' : !allReady ? 'Waiting for ready...' : 'Waiting for host to start...'}
                </p>
              )}

              <button onClick={handleBack} className="font-pixel text-[9px] text-muted-foreground hover:text-foreground py-2">
                ← LEAVE ROOM
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
