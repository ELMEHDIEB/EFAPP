export function getNextGoal(currentCoins) {
  const target = currentCoins < 900 ? 900 : Math.ceil((currentCoins + 1) / 900) * 900;
  const currentTier = Math.floor(currentCoins / 900) + 1;
  const nextGoal = target;
  const remainingCoins = nextGoal - currentCoins;
  const progressPct = currentCoins >= nextGoal ? 100 : Math.round((currentCoins / nextGoal) * 100);

  return { currentTier, nextGoal, remainingCoins, progressPct };
}

export function getGoalDistribution(accounts) {
  const distribution = {
    "< 900": 0,
    ">= 900": 0,
    ">= 1800": 0,
    ">= 2700": 0,
    ">= 3600": 0,
    ">= 4500": 0
  };

  if (!accounts || accounts.length === 0) return distribution;

  accounts.forEach(acc => {
    const coins = acc.currentCoins;
    if (coins < 900) distribution["< 900"]++;
    else if (coins >= 4500) distribution[">= 4500"]++;
    else if (coins >= 3600) distribution[">= 3600"]++;
    else if (coins >= 2700) distribution[">= 2700"]++;
    else if (coins >= 1800) distribution[">= 1800"]++;
    else distribution[">= 900"]++;
  });

  return distribution;
}
