export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
}

export const ACHIEVEMENTS: Achievement[] = [
  { id: 'first_victory', title: 'First Victory', description: 'Complete your first level', icon: '🏆' },
  { id: 'ten_levels',    title: '10 Levels Cleared', description: 'Complete 10 levels', icon: '⭐' },
  { id: 'fifty_levels',  title: '50 Levels Cleared', description: 'Complete 50 levels', icon: '🌟' },
  { id: 'hundred_chal',  title: '100 Challenges',    description: 'Solve 100 coding challenges', icon: '💯' },
  { id: 'python_explorer', title: 'Python Explorer', description: 'Play 5 Python levels', icon: '🐍' },
  { id: 'java_warrior',  title: 'Java Warrior',      description: 'Play 5 Java levels', icon: '☕' },
  { id: 'algo_master',   title: 'Algorithm Master',  description: 'Earn 30 stars total', icon: '🧠' },
  { id: 'perfect_acc',   title: 'Perfect Accuracy',  description: 'Finish a level with no mistakes', icon: '🎯' },
  { id: 'speed_runner',  title: 'Speed Runner',      description: 'Finish a level in under 60s', icon: '⚡' },
];

export function evaluateAchievements(stats: {
  levelsCompleted: number;
  challengesSolved: number;
  totalStars: number;
  langCounts: Record<string, number>;
  lastLevel?: { mistakes: number; timeMs: number };
}): string[] {
  const unlocked: string[] = [];
  if (stats.levelsCompleted >= 1) unlocked.push('first_victory');
  if (stats.levelsCompleted >= 10) unlocked.push('ten_levels');
  if (stats.levelsCompleted >= 50) unlocked.push('fifty_levels');
  if (stats.challengesSolved >= 100) unlocked.push('hundred_chal');
  if ((stats.langCounts['python'] || 0) >= 5) unlocked.push('python_explorer');
  if ((stats.langCounts['java'] || 0) >= 5) unlocked.push('java_warrior');
  if (stats.totalStars >= 30) unlocked.push('algo_master');
  if (stats.lastLevel?.mistakes === 0) unlocked.push('perfect_acc');
  if (stats.lastLevel && stats.lastLevel.timeMs < 60_000) unlocked.push('speed_runner');
  return unlocked;
}
