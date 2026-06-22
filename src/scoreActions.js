import { db } from "./db.js";
import { classifyImpulseRisk } from "./spinActions.js";

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

/**
 * Calculates the Discipline Score (0-100) for a given account.
 * Based on the last 30 days of activity.
 */
export async function getDisciplineScore(accountId) {
  const account = await db.accounts.get(accountId);
  if (!account) return { score: 100, isEvaluating: true, breakdown: null };

  const now = Date.now();
  const thirtyDaysAgoIso = new Date(now - THIRTY_DAYS_MS).toISOString().slice(0, 10);

  // Get recent spins
  const recentSpins = await db.spinLogs
    .where("accountId")
    .equals(accountId)
    .filter(log => log.date >= thirtyDaysAgoIso)
    .toArray();

  if (recentSpins.length === 0) {
    return { 
      score: 100, 
      isEvaluating: true,
      breakdown: { impulsiveCount: 0, regretCount: 0, streakDays: 0 }
    };
  }

  // Get recent regrets
  const recentSpinIds = recentSpins.map(s => s.id);
  const regrets = await db.regretLogs
    .where("spinId")
    .anyOf(recentSpinIds)
    .toArray();

  let score = 100;
  
  // Deductions: Impulsivity
  recentSpins.forEach(spin => {
    const risk = classifyImpulseRisk(spin);
    if (risk === "FOMO" || risk === "Chase Behavior") {
      score -= 10;
    } else if (risk === "Emotional") {
      score -= 5;
    }
  });

  // Deductions: Regrets
  const regretCount = regrets.filter(r => r.regret === true).length;
  score -= (regretCount * 5);

  // Deductions: Dips below 900
  if (account.currentCoins < 900) {
    score -= 15;
  }

  // Bonus: Streaks without impulsive spins
  const impulsiveSpins = recentSpins.filter(s => classifyImpulseRisk(s) !== "Rational");
  
  const lastImpulsiveDate = impulsiveSpins.length > 0 
    ? Math.max(...impulsiveSpins.map(s => new Date(s.date).getTime())) 
    : now - THIRTY_DAYS_MS;
  
  const daysSinceLastImpulsive = Math.floor((now - lastImpulsiveDate) / 86400000);
  
  const streakBonus = Math.floor(daysSinceLastImpulsive / 3) * 5;
  score += streakBonus;

  // Clamp between 0 and 100
  score = Math.max(0, Math.min(100, score));

  return { 
    score, 
    // Wait for at least 3 spins to give a definitive score
    isEvaluating: recentSpins.length < 3,
    breakdown: {
      impulsiveCount: impulsiveSpins.length,
      regretCount,
      streakDays: daysSinceLastImpulsive
    }
  };
}

/**
 * Averages the discipline score across all valid accounts.
 */
export async function getGlobalDisciplineScore() {
  const accounts = await db.accounts.toArray();
  if (accounts.length === 0) return { score: 100, isEvaluating: true };
  
  let totalScore = 0;
  let evaluatedCount = 0;
  
  for (const acc of accounts) {
    const result = await getDisciplineScore(acc.id);
    if (!result.isEvaluating) {
      totalScore += result.score;
      evaluatedCount++;
    }
  }
  
  if (evaluatedCount === 0) return { score: 100, isEvaluating: true };
  return { score: Math.round(totalScore / evaluatedCount), isEvaluating: false };
}
