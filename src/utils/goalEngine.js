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
