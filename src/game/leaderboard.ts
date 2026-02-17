import { LeaderboardEntry } from './types';

const STORAGE_KEY = 'syntax-saga-leaderboard';
const MAX_ENTRIES = 10;

export function calculateScore(coins: number, levelsCompleted: number, timeTaken: number): number {
  // Higher coins and levels = better. Shorter time = better.
  const timeBonus = Math.max(0, 10000 - timeTaken * 10);
  return coins * 10 + levelsCompleted * 500 + timeBonus;
}

export function getLeaderboard(): LeaderboardEntry[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return [];
    return JSON.parse(data) as LeaderboardEntry[];
  } catch {
    return [];
  }
}

export function addLeaderboardEntry(entry: Omit<LeaderboardEntry, 'score' | 'date'>): LeaderboardEntry[] {
  const score = calculateScore(entry.coins, entry.levelsCompleted, entry.timeTaken);
  const full: LeaderboardEntry = {
    ...entry,
    score,
    date: new Date().toLocaleDateString(),
  };

  const board = getLeaderboard();
  board.push(full);
  board.sort((a, b) => b.score - a.score);
  const trimmed = board.slice(0, MAX_ENTRIES);

  localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
  return trimmed;
}

export function getPlayerName(): string | null {
  return localStorage.getItem('syntax-saga-player-name');
}

export function setPlayerName(name: string) {
  localStorage.setItem('syntax-saga-player-name', name);
}
