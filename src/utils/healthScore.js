import { db } from "../db.js";
import { getDisciplineScore } from "../scoreActions.js";
import { getNextGoal } from "./goalEngine.js";

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

export async function getHealthScore(accountId) {
  const account = await db.accounts.get(accountId);
  if (!account) return { score: 0, label: "Risky", breakdown: {} };

  const now = Date.now();
  const sevenDaysAgo = new Date(now - SEVEN_DAYS_MS).toISOString().slice(0, 10);
  const thirtyDaysAgo = new Date(now - THIRTY_DAYS_MS).toISOString().slice(0, 10);

  // 1. Progression (40%)
  const { progressPct } = getNextGoal(account.currentCoins);
  const progressionScore = Math.min(100, progressPct);
  const progressionWeighted = progressionScore * 0.40;

  // 2. Discipline (30%)
  const disciplineResult = await getDisciplineScore(accountId);
  const disciplineScore = disciplineResult.score;
  const disciplineWeighted = disciplineScore * 0.30;

  // 3. Recovery (20%) - Based on recent gains after losses, or simply positive weekly delta
  const recentLogs = await db.coinLogs
    .where("accountId")
    .equals(accountId)
    .filter(l => l.date >= sevenDaysAgo)
    .toArray();
    
  let recoveryScore = 50; // Default average
  if (recentLogs.length > 0) {
    const weeklyDelta = recentLogs.reduce((sum, l) => sum + (l.newBalance - l.previousBalance), 0);
    if (weeklyDelta > 0) {
      recoveryScore = Math.min(100, 50 + (weeklyDelta / 10)); // Bonus for positive
    } else if (weeklyDelta < 0) {
      recoveryScore = Math.max(0, 50 + (weeklyDelta / 10)); // Penalty for negative
    }
  } else {
    // No recent logs, if they are >= 900 they don't need recovery
    if (account.currentCoins >= 900) recoveryScore = 100;
  }
  const recoveryWeighted = recoveryScore * 0.20;

  // 4. Activity (10%) - Based on engagement in the last 30 days
  const monthlyLogs = await db.coinLogs
    .where("accountId")
    .equals(accountId)
    .filter(l => l.date >= thirtyDaysAgo)
    .toArray();
    
  let activityScore = Math.min(100, monthlyLogs.length * 10); // 10 logs per month = 100%
  const activityWeighted = activityScore * 0.10;

  // Total
  const finalScore = Math.round(progressionWeighted + disciplineWeighted + recoveryWeighted + activityWeighted);

  let label = "Risky";
  if (finalScore >= 90) label = "Elite";
  else if (finalScore >= 75) label = "Good";
  else if (finalScore >= 50) label = "Average";

  return {
    score: finalScore,
    label,
    breakdown: {
      progression: Math.round(progressionWeighted),
      discipline: Math.round(disciplineWeighted),
      recovery: Math.round(recoveryWeighted),
      activity: Math.round(activityWeighted)
    }
  };
}
