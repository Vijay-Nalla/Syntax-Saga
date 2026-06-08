import { useState, useCallback, useRef, useEffect } from 'react';
import { RemotePlayerState, PlayerState, MatchStats, PlayerPerformance } from './types';

export function useMultiplayer() {
  const [roomCode, setRoomCode] = useState<string | null>(null);
  const [remotePlayer, setRemotePlayer] = useState<RemotePlayerState | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isRoomReady, setIsRoomReady] = useState(false);
  const [matchStats, setMatchStats] = useState<MatchStats | null>(null);

  // Mock socket implementation (replace with real Socket.io later)
  const mockSocket = useRef<any>(null);

  const createRoom = useCallback((code: string) => {
    setRoomCode(code);
    setIsConnected(true);
    // Mock second player joining after 2 seconds
    setTimeout(() => {
      setRemotePlayer({
        id: 'player2',
        name: 'Friend',
        x: 100,
        y: 400,
        vx: 0,
        vy: 0,
        width: 32,
        height: 48,
        onGround: true,
        facing: 'right',
        health: 100,
        xp: 0,
        level: 1,
        language: 'javascript',
        coins: 0,
        isConnected: true,
      });
      setIsRoomReady(true);
    }, 2000);
  }, []);

  const joinRoom = useCallback((code: string) => {
    setRoomCode(code);
    setIsConnected(true);
    // Mock host already there
    setTimeout(() => {
      setRemotePlayer({
        id: 'player1',
        name: 'Host',
        x: 100,
        y: 400,
        vx: 0,
        vy: 0,
        width: 32,
        height: 48,
        onGround: true,
        facing: 'right',
        health: 100,
        xp: 0,
        level: 1,
        language: 'javascript',
        coins: 0,
        isConnected: true,
      });
      setIsRoomReady(true);
    }, 1000);
  }, []);

  const sendPlayerState = useCallback((player: PlayerState) => {
    // In real implementation, send via socket
    if (!mockSocket.current) return;
  }, []);

  const endMatch = useCallback((stats: MatchStats) => {
    setMatchStats(stats);
  }, []);

  const generateMockStats = useCallback((playerName: string) => {
    const topics = ['Variables', 'Loops', 'Functions', 'Arrays', 'Strings', 'OOP', 'Recursion'];
    const performance: PlayerPerformance[] = topics.map(topic => ({
      topic,
      accuracy: Math.floor(Math.random() * 50) + 50,
      avgResponseTime: Math.floor(Math.random() * 10) + 5,
      totalCorrect: Math.floor(Math.random() * 20) + 10,
      totalIncorrect: Math.floor(Math.random() * 5)
    }));

    return {
      player1: {
        name: playerName,
        score: Math.floor(Math.random() * 500) + 200,
        coins: Math.floor(Math.random() * 30) + 10,
        performance,
        achievements: ['Fast Thinker', 'Perfect Loops']
      },
      player2: {
        name: 'Friend',
        score: Math.floor(Math.random() * 500) + 200,
        coins: Math.floor(Math.random() * 30) + 10,
        performance,
        achievements: ['Code Ninja']
      }
    };
  }, []);

  const leaveRoom = useCallback(() => {
    setRoomCode(null);
    setRemotePlayer(null);
    setIsConnected(false);
    setIsRoomReady(false);
  }, []);

  return {
    roomCode,
    remotePlayer,
    isConnected,
    isRoomReady,
    matchStats,
    createRoom,
    joinRoom,
    sendPlayerState,
    endMatch,
    generateMockStats,
    leaveRoom
  };
}
