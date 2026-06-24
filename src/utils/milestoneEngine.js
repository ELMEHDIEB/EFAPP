export function getMilestoneStatus(account) {
  const currentCoins = account.currentCoins;
  const target = account.targetCoins || 900;
  const interval = target / 3;
  
  let currentTier = 0;
  let nextGoal = interval;

  if (currentCoins >= target) {
    const multiples = Math.floor(currentCoins / target);
    currentTier = target * multiples;
    nextGoal = currentTier + target;
  } else if (currentCoins >= interval * 2) {
    currentTier = interval * 2;
    nextGoal = target;
  } else if (currentCoins >= interval) {
    currentTier = interval;
    nextGoal = interval * 2;
  }

  return { currentTier, nextGoal };
}

export function checkMilestoneCrossed(oldCoins, newCoins, targetCoins = 900) {
  const oldStatus = getMilestoneStatus({ currentCoins: oldCoins, targetCoins });
  const newStatus = getMilestoneStatus({ currentCoins: newCoins, targetCoins });

  if (newStatus.currentTier > oldStatus.currentTier && newStatus.currentTier > 0) {
    window.dispatchEvent(new CustomEvent('milestone_passed', {
      detail: {
        tier: newStatus.currentTier,
        coins: newCoins
      }
    }));
  }
}
