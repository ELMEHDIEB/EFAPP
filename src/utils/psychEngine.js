import { getNextGoal } from "./goalEngine.js";

/**
 * Psychological Support Engine — graduated loss support and recovery planning.
 * Pure utility, no side effects, no DB access.
 */

/**
 * Returns graduated psychological support message based on loss severity.
 * @param {number} lossAmount - coins lost in this transaction
 * @param {number} currentCoins - balance BEFORE the loss
 * @param {number} targetCoins - goal (usually 900)
 * @returns {{ severity: "low"|"medium"|"high", message: string, advice: string }}
 */
export function getLossSupport(lossAmount, currentCoins, targetCoins = 900) {
  if (!lossAmount || lossAmount <= 0) {
    return { severity: "low", message: "", advice: "" };
  }

  const lossPct = currentCoins > 0 ? (lossAmount / currentCoins) * 100 : 100;
  const balanceAfter = currentCoins - lossAmount;
  const wasAboveGoal = currentCoins >= targetCoins;
  const nowBelowGoal = balanceAfter < targetCoins;

  // High severity: loss > 30% OR drops from above to below goal
  if (lossPct > 30 || (wasAboveGoal && nowBelowGoal)) {
    return {
      severity: "high",
      message: "Perte importante détectée.",
      advice: "Évitez les décisions impulsives. Analysez votre progression avant une nouvelle dépense."
    };
  }

  // Medium severity: loss 10-30%
  if (lossPct > 10) {
    return {
      severity: "medium",
      message: "Perte modérée.",
      advice: "L'objectif reste atteignable. Maintenez votre stratégie d'accumulation."
    };
  }

  // Low severity: loss < 10%
  return {
    severity: "low",
    message: "Perte mineure.",
    advice: "Cette perte ne remet pas en cause votre progression."
  };
}

/**
 * Returns a dynamic recovery plan for an account after a loss.
 * @param {object} account - the account object
 * @param {Array} coinLogs - all coin logs
 * @returns {{ currentCoins: number, progressPct: number, distanceTo900: number, recoveryMessage: string, estimatedDays: number|null }}
 */
export function getRecoveryPlan(account, coinLogs) {
  if (!account) {
    return {
      currentCoins: 0,
      progressPct: 0,
      distanceTo900: 900,
      recoveryMessage: "Aucun compte sélectionné.",
      estimatedDays: null
    };
  }

  const { progressPct, remainingCoins } = getNextGoal(account.currentCoins);
  const distanceTo900 = account.currentCoins < 900 ? 900 - account.currentCoins : 0;

  // Calculate average daily gain from recent logs
  let avgDailyGain = 0;
  if (coinLogs && coinLogs.length > 0) {
    const accountLogs = coinLogs
      .filter(l => l.accountId === account.id)
      .sort((a, b) => new Date(a.date) - new Date(b.date));

    if (accountLogs.length >= 2) {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);
      const recentLogs = accountLogs.filter(l => l.date >= thirtyDaysAgo);

      if (recentLogs.length > 0) {
        const totalDelta = recentLogs.reduce((sum, l) => sum + (l.newBalance - l.previousBalance), 0);
        avgDailyGain = totalDelta / 30;
      }
    }
  }

  let recoveryMessage;
  let estimatedDays = null;

  if (distanceTo900 <= 0) {
    recoveryMessage = "Votre compte est au-dessus de l'objectif. Protégez votre progression.";
  } else if (avgDailyGain > 0) {
    estimatedDays = Math.ceil(distanceTo900 / avgDailyGain);
    recoveryMessage = `Il manque ${distanceTo900} coins pour revenir à l'objectif. À votre rythme actuel, environ ${estimatedDays} jour(s) de progression.`;
  } else {
    recoveryMessage = `Il manque ${distanceTo900} coins pour revenir à l'objectif. Continuer l'accumulation est la stratégie recommandée.`;
  }

  return {
    currentCoins: account.currentCoins,
    progressPct,
    distanceTo900,
    recoveryMessage,
    estimatedDays
  };
}
