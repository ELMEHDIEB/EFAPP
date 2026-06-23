/**
 * Centralized Engine for Multi-Goal Tracking.
 * Defines milestones: 900, 1800, 2700, 3600, 4500.
 */

export const GOALS = [900, 1800, 2700, 3600, 4500];

/**
 * Returns the current goal parameters for a given coin balance.
 * @param {number} currentCoins 
 */
export function getNextGoal(currentCoins) {
  // Find the first goal that is strictly strictly greater than currentCoins
  // Or if we've reached the max goal, return the max goal with 100% progress
  let nextGoal = GOALS[0];
  let currentTierIndex = -1;

  for (let i = 0; i < GOALS.length; i++) {
    if (currentCoins < GOALS[i]) {
      nextGoal = GOALS[i];
      currentTierIndex = i;
      break;
    }
  }

  // If above max goal
  if (currentTierIndex === -1) {
    return {
      currentTier: GOALS.length,
      nextGoal: GOALS[GOALS.length - 1],
      remainingCoins: 0,
      progressPct: 100
    };
  }

  // If at first tier, previous milestone is 0. Otherwise it's the previous goal.
  const previousMilestone = currentTierIndex === 0 ? 0 : GOALS[currentTierIndex - 1];
  const coinsNeededForThisTier = nextGoal - previousMilestone;
  const coinsAcquiredInThisTier = currentCoins - previousMilestone;
  
  // Progress is relative to the current tier segment (e.g. 900 to 1800)
  const progressPct = Math.min(100, Math.round((coinsAcquiredInThisTier / coinsNeededForThisTier) * 100));
  const remainingCoins = nextGoal - currentCoins;

  return {
    currentTier: currentTierIndex, // 0 = 0-899, 1 = 900-1799, etc.
    nextGoal,
    remainingCoins,
    progressPct
  };
}

/**
 * Calculates the distribution of accounts across goal tiers.
 * @param {Array} accounts 
 */
export function getGoalDistribution(accounts) {
  const distribution = {
    "< 900": 0,
    ">= 900": 0,
    ">= 1800": 0,
    ">= 2700": 0,
    ">= 3600": 0,
    ">= 4500": 0
  };

  accounts.forEach(acc => {
    const coins = acc.currentCoins;
    if (coins < 900) distribution["< 900"]++;
    if (coins >= 900) distribution[">= 900"]++;
    if (coins >= 1800) distribution[">= 1800"]++;
    if (coins >= 2700) distribution[">= 2700"]++;
    if (coins >= 3600) distribution[">= 3600"]++;
    if (coins >= 4500) distribution[">= 4500"]++;
  });

  return distribution;
}

/**
 * Computes forecast data for a specific account based on coinLogs.
 * Returns average daily gains over 7d, 30d, 60d windows, 
 * plus an estimated goal date.
 * If delta <= 0, returns "Pas de progression actuellement" instead of a date.
 * 
 * @param {Array} coinLogs - All coin logs (pre-filtered or full)
 * @param {object} account - The account object
 * @returns {{ forecast7d: number, forecast30d: number, forecast60d: number, estimatedGoalDate: string }}
 */
export function getForecast(coinLogs, account) {
  if (!coinLogs || !account) {
    return { forecast7d: 0, forecast30d: 0, forecast60d: 0, estimatedGoalDate: "Pas assez de données" };
  }

  const accountLogs = coinLogs
    .filter(l => l.accountId === account.id)
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  if (accountLogs.length === 0) {
    return { forecast7d: 0, forecast30d: 0, forecast60d: 0, estimatedGoalDate: "Pas assez de données" };
  }

  const now = new Date();
  const msPerDay = 86400000;

  function avgDailyGain(days) {
    const cutoff = new Date(now.getTime() - days * msPerDay).toISOString().slice(0, 10);
    const recentLogs = accountLogs.filter(l => l.date >= cutoff);
    if (recentLogs.length === 0) return 0;

    let totalDelta = 0;
    recentLogs.forEach(log => {
      totalDelta += (log.newBalance - log.previousBalance);
    });

    return totalDelta / days;
  }

  const forecast7d = Math.round(avgDailyGain(7) * 100) / 100;
  const forecast30d = Math.round(avgDailyGain(30) * 100) / 100;
  const forecast60d = Math.round(avgDailyGain(60) * 100) / 100;

  // Estimate goal date using 30d average (most stable)
  const { nextGoal, remainingCoins } = getNextGoal(account.currentCoins);
  let estimatedGoalDate = "Pas de progression actuellement";

  const bestAvg = forecast30d > 0 ? forecast30d : (forecast7d > 0 ? forecast7d : forecast60d);

  if (bestAvg > 0 && remainingCoins > 0) {
    const daysToGoal = Math.ceil(remainingCoins / bestAvg);
    const goalDate = new Date(now.getTime() + daysToGoal * msPerDay);
    estimatedGoalDate = goalDate.toISOString().slice(0, 10);
  } else if (remainingCoins <= 0) {
    estimatedGoalDate = "Objectif atteint";
  }

  return { forecast7d, forecast30d, forecast60d, estimatedGoalDate };
}
