import { LeaderboardEntry } from './types';

// Use backend URL from environment or default to the new deployed Render URL
const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://syntax-saga-api.onrender.com/api';

const STORAGE_KEY = 'syntax-saga-leaderboard';
const MAX_ENTRIES = 10;

export function calculateScore(coins: number, levelsCompleted: number, timeTaken: number): number {
  // Higher coins and levels = better. Shorter time = better.
  const timeBonus = Math.max(0, 10000 - timeTaken * 10);
  return coins * 10 + levelsCompleted * 500 + timeBonus;
}

export async function getLeaderboard(): Promise<LeaderboardEntry[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/leaderboard`);
    if (!response.ok) throw new Error('Failed to fetch leaderboard');
    return await response.json();
  } catch (error) {
    console.error('Error fetching leaderboard from backend:', error);
    // Fallback to local storage if backend is unavailable
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  }
}

export async function addLeaderboardEntry(entry: Omit<LeaderboardEntry, 'score' | 'date'>): Promise<LeaderboardEntry[]> {
  const score = calculateScore(entry.coins, entry.levelsCompleted, entry.timeTaken);
  const full = {
    ...entry,
    score,
  };

  try {
    const response = await fetch(`${API_BASE_URL}/leaderboard`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(full),
    });
    if (!response.ok) throw new Error('Failed to post leaderboard entry');
    return await response.json();
  } catch (error) {
    console.error('Error posting leaderboard entry to backend:', error);
    // Fallback to local storage
    const localEntry: LeaderboardEntry = { ...full, date: new Date().toLocaleDateString() };
    const board = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]') as LeaderboardEntry[];
    board.push(localEntry);
    board.sort((a, b) => b.score - a.score);
    const trimmed = board.slice(0, MAX_ENTRIES);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
    return trimmed;
  }
}

export function getPlayerName(): string | null {
  return localStorage.getItem('syntax-saga-player-name');
}

export function setPlayerName(name: string) {
  localStorage.setItem('syntax-saga-player-name', name);
}
