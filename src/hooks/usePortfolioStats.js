import { useMemo } from 'react';
import { getGoalDistribution } from '../utils/goalEngine.js';

export function usePortfolioStats(accounts) {
  return useMemo(() => {
    if (!accounts || accounts.length === 0) {
      return {
        sortedAccounts: [],
        totalAccounts: 0,
        totalCoins: 0,
        averageCoins: 0,
        above900: 0,
        below900: 0,
        highestAccount: null,
        lowestAccount: null,
        closestTo900: null,
        distribution: {},
        totalGrowth: 0,
        totalDecline: 0,
        bestGrowth: { name: "-", diff: 0 },
        worstDecline: { name: "-", diff: 0 }
      };
    }

    const sortedAccounts = [...accounts].sort((a, b) => b.currentCoins - a.currentCoins);
    
    // KPIs
    const totalAccounts = accounts.length;
    const totalCoins = accounts.reduce((sum, a) => sum + a.currentCoins, 0);
    const averageCoins = totalAccounts > 0 ? Math.round(totalCoins / totalAccounts) : 0;
    
    const above900 = accounts.filter(a => a.currentCoins >= 900).length;
    const below900 = accounts.filter(a => a.currentCoins < 900).length;
    
    const highestAccount = sortedAccounts[0];
    const lowestAccount = sortedAccounts[sortedAccounts.length - 1];
    
    const closestTo900 = [...accounts]
      .filter(a => a.currentCoins < 900)
      .sort((a, b) => (900 - a.currentCoins) - (900 - b.currentCoins))[0];

    const distribution = getGoalDistribution(accounts);

    // Growth & Decline (from precalculated account metrics)
    let totalGrowth = 0;
    let totalDecline = 0;
    
    let bestGrowth = { name: "-", diff: 0 };
    let worstDecline = { name: "-", diff: 0 };

    accounts.forEach(acc => {
      totalGrowth += (acc.totalGrowth || 0);
      totalDecline += (acc.totalDecline || 0);
      
      const lastDiff = acc.lastTransactionDiff || 0;
      if (lastDiff > bestGrowth.diff) bestGrowth = { name: acc.name, diff: lastDiff };
      if (lastDiff < worstDecline.diff) worstDecline = { name: acc.name, diff: lastDiff };
    });

    return {
      sortedAccounts,
      totalAccounts,
      totalCoins,
      averageCoins,
      above900,
      below900,
      highestAccount,
      lowestAccount,
      closestTo900,
      distribution,
      totalGrowth,
      totalDecline,
      bestGrowth,
      worstDecline
    };
  }, [accounts]);
}
