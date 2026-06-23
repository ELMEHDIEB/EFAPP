import { getNextGoal } from "./goalEngine.js";

/**
 * Motivation Engine — generates contextual encouragement messages
 * based on account state and recent progression.
 * Pure utility, no side effects.
 */

/**
 * Returns a motivation message for a specific account.
 * @param {object} account
 * @param {Array} accounts - all accounts (for comparison)
 * @param {Array} coinLogs - all coin logs
 * @returns {{ message: string, type: "success"|"info"|"warn" }}
 */
export function getMotivationMessage(account, accounts, coinLogs) {
  if (!account) return { message: "", type: "info" };

  const { progressPct, remainingCoins } = getNextGoal(account.currentCoins);

  // Goal achieved
  if (account.currentCoins >= 900 && progressPct >= 100) {
    return { message: "Objectif atteint. Protégez votre progression.", type: "success" };
  }

  // Very close
  if (progressPct > 90) {
    return { message: `Plus que ${remainingCoins} coins — vous y êtes presque !`, type: "success" };
  }

  // Strong progress
  if (progressPct > 75) {
    return { message: "Progression solide. Maintenez le rythme.", type: "info" };
  }

  // Check if recent growth is above average
  if (coinLogs && accounts && accounts.length > 0) {
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 86400000).toISOString().slice(0, 10);

    const recentLogs = coinLogs.filter(
      l => l.accountId === account.id && l.date >= sevenDaysAgo
    );

    if (recentLogs.length > 0) {
      const recentDelta = recentLogs.reduce((sum, l) => sum + (l.newBalance - l.previousBalance), 0);

      // Global average delta per account over 7 days
      const allRecentLogs = coinLogs.filter(l => l.date >= sevenDaysAgo);
      const globalDelta = allRecentLogs.reduce((sum, l) => sum + (l.newBalance - l.previousBalance), 0);
      const avgDelta = accounts.length > 0 ? globalDelta / accounts.length : 0;

      if (recentDelta > avgDelta && recentDelta > 0) {
        return { message: "Votre progression dépasse la moyenne. Excellent !", type: "success" };
      }
    }
  }

  // Moderate progress
  if (progressPct > 50) {
    return { message: "À mi-chemin. Chaque coin compte.", type: "info" };
  }

  // Low progress
  if (progressPct > 25) {
    return { message: "Bonne fondation. Continuez l'accumulation.", type: "info" };
  }

  // Starting out
  return { message: "Chaque coin compte. Continuez l'accumulation.", type: "info" };
}

/**
 * Returns a portfolio-level summary motivation message.
 * @param {Array} accounts
 * @param {Array} coinLogs
 * @returns {{ message: string, type: "success"|"info"|"warn" }}
 */
export function getPortfolioMotivation(accounts, coinLogs) {
  if (!accounts || accounts.length === 0) {
    return { message: "Créez votre premier compte pour commencer.", type: "info" };
  }

  const above900 = accounts.filter(a => a.currentCoins >= 900).length;
  const ratio = above900 / accounts.length;

  if (ratio >= 1) {
    return { message: "Tous vos comptes ont atteint l'objectif. Performance exceptionnelle.", type: "success" };
  }
  if (ratio >= 0.5) {
    return { message: `${above900}/${accounts.length} comptes ont atteint l'objectif. Continuez sur cette lancée.`, type: "success" };
  }

  // Check weekly trend
  if (coinLogs && coinLogs.length > 0) {
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 86400000).toISOString().slice(0, 10);
    const recentLogs = coinLogs.filter(l => l.date >= sevenDaysAgo);
    const weeklyDelta = recentLogs.reduce((sum, l) => sum + (l.newBalance - l.previousBalance), 0);

    if (weeklyDelta > 0) {
      return { message: `Tendance positive cette semaine (+${weeklyDelta} coins). Maintenez l'effort.`, type: "info" };
    }
    if (weeklyDelta < 0) {
      return { message: "Semaine en baisse. Restez discipliné et évitez les dépenses impulsives.", type: "warn" };
    }
  }

  return { message: "La patience est votre meilleur atout. Chaque coin rapproche de l'objectif.", type: "info" };
}
