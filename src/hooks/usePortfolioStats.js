import { useMemo } from 'react';
import { getGoalDistribution } from '../utils/goalEngine.js';

export function usePortfolioStats(accounts, coinLogs) {
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
        worstDecline: { name: "-", diff: 0 },
        portfolioHistory: [],
        recentTransactions: []
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

    // Growth & Decline (from coinLogs variations)
    let totalGrowth = 0;
    let totalDecline = 0;
    
    let bestGrowth = { name: "-", diff: 0 };
    let worstDecline = { name: "-", diff: 0 };

    if (coinLogs && coinLogs.length > 0) {
      accounts.forEach(acc => {
        const logs = coinLogs.filter(l => l.accountId === acc.id).sort((a, b) => b.id - a.id);
        if (logs.length > 0) {
          const lastLog = logs[0];
          const diff = acc.currentCoins - lastLog.previousBalance;
          if (diff > bestGrowth.diff) bestGrowth = { name: acc.name, diff };
          if (diff < worstDecline.diff) worstDecline = { name: acc.name, diff };
        }
      });

      coinLogs.forEach(log => {
        const diff = log.newBalance - log.previousBalance;
        if (diff > 0) totalGrowth += diff;
        if (diff < 0) totalDecline += Math.abs(diff);
      });
    }

    // Calculate Global Portfolio Growth over time
    const portfolioHistory = (() => {
      if (!coinLogs || coinLogs.length === 0) return [];
      const accountBalances = {};
      const dataPoints = [];
      
      // Sort logs chronologically
      const sortedLogs = [...coinLogs].sort((a, b) => a.id - b.id);
      
      sortedLogs.forEach(log => {
        accountBalances[log.accountId] = log.newBalance;
        const total = Object.values(accountBalances).reduce((sum, val) => sum + val, 0);
        
        let label = log.date;
        if (log.createdAt) {
          const d = new Date(log.createdAt);
          label = `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}`;
        }
        
        dataPoints.push({
          label,
          total
        });
      });

      // Sub-sample if there are too many data points (keep last 30)
      return dataPoints.slice(-30);
    })();

    const recentTransactions = coinLogs ? [...coinLogs].sort((a, b) => b.id - a.id).slice(0, 5) : [];

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
      worstDecline,
      portfolioHistory,
      recentTransactions
    };
  }, [accounts, coinLogs]);
}
