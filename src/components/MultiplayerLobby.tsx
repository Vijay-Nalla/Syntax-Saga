import { useState, useCallback } from 'react';
import { audioManager } from '@/game/audioManager';

interface MultiplayerLobbyProps {
  onBack: () => void;
  onCreateRoom: (code: string) => void;
  onJoinRoom: (code: string) => void;
}

export default function MultiplayerLobby({
  onBack,
  onCreateRoom,
  onJoinRoom
}: MultiplayerLobbyProps) {
  const [mode, setMode] = useState<'select' | 'create' | 'join'>('select');
  const [roomCode, setRoomCode] = useState('');
  const [joinInputCode, setJoinInputCode] = useState('');
  const [error, setError] = useState('');
  const [playersInRoom, setPlayersInRoom] = useState<string[]>([]);
  const [countdown, setCountdown] = useState(0);

  // Generate random room code (5 chars: uppercase and numbers)
  const generateRoomCode = useCallback(() => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 5; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }, []);

  const handleCreateRoom = useCallback(() => {
    audioManager.resumeContext();
    const newCode = generateRoomCode();
    setRoomCode(newCode);
    setMode('create');
    setPlayersInRoom(['You']);
    onCreateRoom(newCode);
  }, [generateRoomCode, onCreateRoom]);

  const handleJoinRoom = useCallback(() => {
    const trimmed = joinInputCode.trim().toUpperCase();
    if (!trimmed) {
      setError('Enter a valid room code.');
      return;
    }
    if (trimmed.length !== 5) {
      setError('Room code must be 5 characters.');
      return;
    }
    setError('');
    setPlayersInRoom(['You', 'Friend']);
    onJoinRoom(trimmed);
  }, [joinInputCode, onJoinRoom]);

  const handleCopyCode = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(roomCode);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  }, [roomCode]);

  // Simulate countdown when both players are in
  if (mode === 'create' && playersInRoom.length === 2 && countdown === 0) {
    setCountdown(3);
    let count = 3;
    const interval = setInterval(() => {
      count--;
      setCountdown(count);
      if (count === 0) {
        clearInterval(interval);
      }
    }, 1000);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background">
      <div className="absolute inset-0 scanlines pointer-events-none" />

      <div className="relative z-10 w-full max-w-md mx-4">
        {mode === 'select' && (
          <div className="text-center">
            <h2 className="font-display text-3xl font-black text-primary text-glow-primary mb-8">MULTIPLAYER LOBBY</h2>
            <div className="flex flex-col gap-4">
              <button
                onClick={handleCreateRoom}
                className="p-6 border-2 border-primary rounded-lg bg-card/80 backdrop-blur-sm
                  hover:bg-primary/10 transition-all box-glow-primary"
              >
                <div className="font-pixel text-lg text-primary text-glow-primary">CREATE ROOM</div>
              </button>
              <button
                onClick={() => setMode('join')}
                className="p-6 border-2 border-secondary rounded-lg bg-card/80 backdrop-blur-sm
                  hover:bg-secondary/10 transition-all"
              >
                <div className="font-pixel text-lg text-secondary text-glow-cyan">JOIN ROOM</div>
              </button>
              <button
                onClick={onBack}
                className="font-pixel text-[10px] text-muted-foreground hover:text-foreground transition-all"
              >
                ← BACK
              </button>
            </div>
          </div>
        )}

        {mode === 'create' && (
          <div className="text-center">
            <h2 className="font-display text-2xl font-black text-primary text-glow-primary mb-4">MULTIPLAYER LOBBY</h2>
            <div className="mb-6 border-2 border-border rounded-lg bg-card/80 backdrop-blur-sm p-6">
              <p className="font-mono text-xs text-muted-foreground mb-2">Room Code:</p>
              <div className="flex gap-2 justify-center items-center mb-6">
                <span className="font-display text-3xl font-black text-secondary text-glow-cyan tracking-[0.3em]">{roomCode}</span>
                <button
                  onClick={handleCopyCode}
                  className="border border-primary text-primary p-2 rounded hover:bg-primary/10 transition-all"
                >
                  📋
                </button>
              </div>
              <p className="font-pixel text-[10px] text-muted-foreground">Waiting for Friend...</p>
              <div className="mt-4 space-y-2">
                {playersInRoom.map((name, i) => (
                  <div key={i} className="font-mono text-sm text-foreground flex items-center gap-2 justify-center">
                    <span className="text-green-400">●</span> {name} Joined
                  </div>
                ))}
              </div>
              {countdown > 0 && (
                <div className="mt-6">
                  <p className="font-display text-lg text-secondary">MATCH FOUND</p>
                  <p className="font-display text-6xl font-black text-primary text-glow-primary mt-2">{countdown}</p>
                  <p className="font-pixel text-xs text-muted-foreground mt-1">Preparing Adventure...</p>
                </div>
              )}
            </div>
            <button
              onClick={onBack}
              className="font-pixel text-[10px] text-muted-foreground hover:text-foreground transition-all"
            >
              ← BACK
            </button>
          </div>
        )}

        {mode === 'join' && (
          <div className="text-center">
            <h2 className="font-display text-2xl font-black text-primary text-glow-primary mb-4">JOIN ROOM</h2>
            <div className="mb-6 border-2 border-border rounded-lg bg-card/80 backdrop-blur-sm p-6">
              <p className="font-mono text-xs text-muted-foreground mb-4">Enter Room Code</p>
              <input
                type="text"
                value={joinInputCode}
                onChange={(e) => { setJoinInputCode(e.target.value.toUpperCase()); setError(''); }}
                maxLength={5}
                placeholder="AB4KX"
                autoFocus
                className="w-full bg-muted border-2 border-border rounded px-4 py-3 font-mono text-2xl text-center tracking-[0.5em] text-foreground
                  focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary
                  placeholder:text-muted-foreground mb-2"
              />
              {error && <p className="font-pixel text-[8px] text-destructive mb-4">{error}</p>}
              <button
                onClick={handleJoinRoom}
                className="w-full font-pixel text-[10px] px-8 py-4 border-2 border-primary text-primary
                  hover:bg-primary hover:text-primary-foreground transition-all box-glow-primary"
              >
                JOIN
              </button>
            </div>
            <button
              onClick={() => setMode('select')}
              className="font-pixel text-[10px] text-muted-foreground hover:text-foreground transition-all"
            >
              ← BACK
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
