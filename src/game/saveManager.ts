// ============= Save Manager =============
// Centralizes all localStorage persistence for game progress

import { Language, ControlMode } from './types';

const PROGRESS_KEY = 'syntax-saga-progress';

export interface SavedProgress {
  playerName: string;
  language: Language;
  coins: number;
  xp: number;
  currentLevel: number;
  completedLevels: number[];
  bestScore: number;
  controlMode?: ControlMode;
}

export function saveProgress(data: SavedProgress) {
  localStorage.setItem(PROGRESS_KEY, JSON.stringify(data));
}

export function loadProgress(): SavedProgress | null {
  try {
    const raw = localStorage.getItem(PROGRESS_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function clearProgress() {
  localStorage.removeItem(PROGRESS_KEY);
}
