import { useMemo } from 'react';
import { getNextGoal, getGoalDistribution } from '../utils/goalEngine.js';

// Couleurs de la charte graphique UI Pro Max
const COLORS = ['#ffffff', '#888888', '#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];

export function useAnalyticsData(accounts, coinLogs) {
  return useMemo(() => {
    if (!accounts || !coinLogs || accounts.length === 0) {
      return { multiLineData: [], pieData: [], growthData: [], reportTable: [], goalDistData: [] };
    }

    // --- 1. Pie Chart (Distribution) ---
    const totalCoins = accounts.reduce((sum, a) => sum + a.currentCoins, 0);
    const pieData = accounts
      .filter(a => a.currentCoins > 0)
      .map((a, i) => ({
        name: a.name,
        value: a.currentCoins,
        percent: totalCoins > 0 ? ((a.currentCoins / totalCoins) * 100).toFixed(1) : 0,
        color: COLORS[i % COLORS.length]
      }))
      .sort((a, b) => b.value - a.value);

    // --- 2. Report Table ---
    const sortedAccounts = [...accounts].sort((a, b) => b.currentCoins - a.currentCoins);
    const reportTable = sortedAccounts.map((acc, index) => {
      // Find previous balance (by finding the last SET_BALANCE or inferring from logs)
      const accLogs = coinLogs.filter(l => l.accountId === acc.id).sort((a, b) => b.id - a.id);
      
      const lastLog = accLogs[0];
      const previousCoins = lastLog ? lastLog.previousBalance : acc.currentCoins;
      const variation = acc.currentCoins - previousCoins;
      const variationPct = previousCoins > 0 ? ((variation / previousCoins) * 100).toFixed(1) : (variation > 0 ? 100 : 0);
      
      const { nextGoal, remainingCoins, progressPct } = getNextGoal(acc.currentCoins);
      
      return {
        rank: index + 1,
        name: acc.name,
        currentCoins: acc.currentCoins,
        previousCoins,
        variation,
        variationPct,
        goalPct: progressPct,
        nextGoal,
        remainingCoins,
        status: progressPct >= 100 ? "Prêt" : progressPct >= 75 ? "Proche" : "En cours"
      };
    });

    // --- 3. Growth vs Decline Chart ---
    // Group variations by date
    const byDateGrowth = {};
    coinLogs.forEach(log => {
      const d = log.date;
      if (!byDateGrowth[d]) byDateGrowth[d] = { date: d, Growth: 0, Decline: 0 };
      
      const diff = log.newBalance - log.previousBalance;
      if (diff > 0) byDateGrowth[d].Growth += diff;
      else if (diff < 0) byDateGrowth[d].Decline += Math.abs(diff);
    });
    const growthData = Object.values(byDateGrowth).sort((a, b) => new Date(a.date) - new Date(b.date)).slice(-14);

    // --- 4. Multi-Line Evolution ---
    const accountBalances = {};
    accounts.forEach(a => accountBalances[a.name] = 0);

    const sortedLogs = [...coinLogs].sort((a, b) => a.id - b.id);
    const multiLineData = sortedLogs.map(log => {
      const acc = accounts.find(a => a.id === log.accountId);
      if (acc) {
        accountBalances[acc.name] = log.newBalance;
      }
      
      let label = log.date;
      if (log.createdAt) {
        const d = new Date(log.createdAt);
        const day = d.getDate().toString().padStart(2, '0');
        const month = (d.getMonth() + 1).toString().padStart(2, '0');
        const hrs = d.getHours().toString().padStart(2, '0');
        const mins = d.getMinutes().toString().padStart(2, '0');
        label = `${day}/${month} ${hrs}:${mins}`;
      }

      const point = { label };
      Object.keys(accountBalances).forEach(name => {
        point[name] = accountBalances[name];
      });
      return point;
    });

    // Ensure we have at least something to show
    if (multiLineData.length === 0 && accounts.length > 0) {
      const pt = { label: new Date().toISOString().slice(0, 10) };
      accounts.forEach(a => pt[a.name] = a.currentCoins);
      multiLineData.push(pt);
    }

    // --- 5. Goal Distribution ---
    const distributionRaw = getGoalDistribution(accounts);
    const goalDistData = Object.entries(distributionRaw).map(([name, count]) => ({
      name,
      Comptes: count
    }));

    return { multiLineData, pieData, growthData, reportTable, goalDistData, COLORS };
  }, [accounts, coinLogs]);
}
