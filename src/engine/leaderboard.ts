import type { GameState, LeaderboardEntry } from '../types';

export function computeLeaderboard(state: GameState): LeaderboardEntry[] {
  const entries: LeaderboardEntry[] = [];
  let rank = 1;

  // 1. Average Prompt Score
  const promptScores: number[] = [];
  for (const attempts of Object.values(state.completedLevels)) {
    const best = attempts
      .filter(a => a.mode === 'prompt' && a.promptScore)
      .sort((a, b) => (b.promptScore?.total ?? 0) - (a.promptScore?.total ?? 0))[0];
    if (best?.promptScore) {
      promptScores.push(best.promptScore.total);
    }
  }
  const avgScore = promptScores.length > 0
    ? Math.round(promptScores.reduce((s, v) => s + v, 0) / promptScores.length)
    : 0;
  entries.push({ dimension: 'avgScore', label: 'Avg Prompt Score', value: avgScore, rank: rank++ });

  // 2. Total XP
  entries.push({ dimension: 'totalXp', label: 'Total XP', value: state.xp, rank: rank++ });

  // 3. Total Prompt Length (shorter = better)
  entries.push({ dimension: 'totalPromptLength', label: 'Total Prompt Length', value: state.totalPromptLength, rank: rank++ });

  // 4. Max Combo
  entries.push({ dimension: 'maxCombo', label: 'Max Combo', value: state.maxCombo, rank: rank++ });

  // 5. Manual Clears
  let manualClears = 0;
  for (const attempts of Object.values(state.completedLevels)) {
    if (attempts.some(a => a.mode === 'manual' && (a.judgeResult.status === 'perfect' || a.judgeResult.status === 'pass'))) {
      manualClears++;
    }
  }
  entries.push({ dimension: 'manualClears', label: 'Manual Clears', value: manualClears, rank: rank++ });

  // 6. Levels Completed
  let levelsCompleted = 0;
  for (const attempts of Object.values(state.completedLevels)) {
    if (attempts.some(a => a.judgeResult.status === 'perfect' || a.judgeResult.status === 'pass')) {
      levelsCompleted++;
    }
  }
  entries.push({ dimension: 'levelsCompleted', label: 'Levels Completed', value: levelsCompleted, rank: rank++ });

  // 7. Achievements
  entries.push({ dimension: 'achievements', label: 'Achievements', value: state.unlockedAchievements.length, rank: rank++ });

  return entries;
}
