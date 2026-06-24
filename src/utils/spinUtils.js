/**
 * EFAPP Spin Utilities
 * Rule: 1 Spin = 100 Coins
 */

const SPIN_COST = 100;

export function coinsToSpins(coins) {
  const parsed = Number(coins);
  if (isNaN(parsed) || parsed < 0) return 0;
  return Math.floor(parsed / SPIN_COST);
}

export function spinsToCoins(spins) {
  const parsed = Number(spins);
  if (isNaN(parsed) || parsed < 0) return 0;
  return parsed * SPIN_COST;
}

export function isValidSpinCost(coins) {
  const parsed = Number(coins);
  if (isNaN(parsed) || parsed <= 0) return false;
  return parsed % SPIN_COST === 0;
}
