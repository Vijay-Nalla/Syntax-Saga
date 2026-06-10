import { useEffect, useRef, useState, useCallback } from 'react';
import { MultiplayerSession, PlayerRow, RoomRow, RemotePos, generateRoomCode, getUserId } from './multiplayerClient';
import type { Language } from './types';

export interface UseMultiplayerOptions {
  playerName: string;
}

export function useMultiplayer({ playerName }: UseMultiplayerOptions) {
  const sessionRef = useRef<MultiplayerSession | null>(null);
  const [room, setRoom] = useState<RoomRow | null>(null);
  const [players, setPlayers] = useState<PlayerRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [joining, setJoining] = useState(false);

  const userId = getUserId();
  const isHost = !!room && room.host_id === userId;

  const wire = useCallback((s: MultiplayerSession) => {
    s.onRoom(setRoom);
    s.onPlayers(setPlayers);
    s.subscribe();
  }, []);

  const createRoom = useCallback(async (language: Language = 'javascript') => {
    setJoining(true); setError(null);
    const code = generateRoomCode();
    const s = new MultiplayerSession(code, true, playerName || 'Host');
    const { error } = await s.createRoom(language);
    if (error) { setError(error); setJoining(false); return null; }
    sessionRef.current = s;
    wire(s);
    setJoining(false);
    return code;
  }, [playerName, wire]);

  const joinRoom = useCallback(async (code: string) => {
    setJoining(true); setError(null);
    const upper = code.trim().toUpperCase();
    if (upper.length !== 5) { setError('Room code must be 5 characters.'); setJoining(false); return false; }
    const s = new MultiplayerSession(upper, false, playerName || 'Player');
    const { error } = await s.joinRoom();
    if (error) { setError(error); setJoining(false); return false; }
    sessionRef.current = s;
    wire(s);
    setJoining(false);
    return true;
  }, [playerName, wire]);

  const setReady = useCallback((r: boolean) => sessionRef.current?.setReady(r), []);
  const setLanguage = useCallback((l: Language) => sessionRef.current?.setLanguage(l), []);
  const startMatch = useCallback(() => sessionRef.current?.startMatch(), []);
  const leaveRoom = useCallback(async () => {
    await sessionRef.current?.leave();
    sessionRef.current = null;
    setRoom(null); setPlayers([]);
  }, []);

  useEffect(() => {
    return () => { sessionRef.current?.leave(); };
  }, []);

  return {
    session: sessionRef,
    room, players, error, joining, isHost, userId,
    createRoom, joinRoom, setReady, setLanguage, startMatch, leaveRoom,
  };
}

export type { RemotePos };
