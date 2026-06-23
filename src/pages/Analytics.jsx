import React, { useMemo } from 'react';
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../db.js";
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar, Legend
} from 'recharts';
import { getNextGoal, getGoalDistribution } from "../utils/goalEngine.js";
import ExportCenter from "../components/ExportCenter.jsx";

// Couleurs de la charte graphique UI Pro Max
const COLORS = ['#ffffff', '#888888', '#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];

export default function Analytics() {
  const accounts = useLiveQuery(() => db.accounts.toArray(), []);
  const coinLogs = useLiveQuery(() => db.coinLogs.toArray(), []);

  const { multiLineData, pieData, growthData, reportTable, goalDistData } = useMemo(() => {
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
    // We want a snapshot of each account's balance per day
    const dates = [...new Set(coinLogs.map(l => l.date))].sort((a, b) => new Date(a) - new Date(b));
    
    // We simulate the balance of each account at the end of each date
    const accountBalances = {};
    accounts.forEach(a => accountBalances[a.name] = 0);

    const multiLineData = dates.map(date => {
      const dailyPoint = { date };
      // Apply logs for this date
      const logsForDate = coinLogs.filter(l => l.date === date).sort((a, b) => a.id - b.id);
      logsForDate.forEach(log => {
        const acc = accounts.find(a => a.id === log.accountId);
        if (acc) {
          accountBalances[acc.name] = log.newBalance;
        }
      });
      // Copy current known balances into point
      Object.keys(accountBalances).forEach(name => {
        dailyPoint[name] = accountBalances[name];
      });
      return dailyPoint;
    });

    // Ensure we have at least something to show
    if (multiLineData.length === 0 && accounts.length > 0) {
      const pt = { date: new Date().toISOString().slice(0, 10) };
      accounts.forEach(a => pt[a.name] = a.currentCoins);
      multiLineData.push(pt);
    }

    // --- 5. Goal Distribution ---
    const distributionRaw = getGoalDistribution(accounts);
    const goalDistData = Object.entries(distributionRaw).map(([name, count]) => ({
      name,
      Comptes: count
    }));

    return { multiLineData, pieData, growthData, reportTable, goalDistData };
  }, [accounts, coinLogs]);

  if (!accounts || !coinLogs) {
    return (
      <div className="flex h-[70vh] items-center justify-center">
        <div className="w-8 h-8 border-2 border-white/10 border-t-white rounded-full animate-spin"></div>
      </div>
    );
  }

  if (accounts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-center animate-in fade-in">
        <div className="w-20 h-20 mb-6 rounded-3xl bg-white/5 flex items-center justify-center">
          <svg className="w-10 h-10 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Aucune donnée analytique</h2>
        <p className="text-textdim">Créez des comptes et effectuez des transactions pour générer le bilan comptable.</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto pb-12 animate-in fade-in duration-500 space-y-6">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-white tracking-tight">Analytics & Bilan</h1>
        <p className="text-sm text-textdim mt-1">Analyse détaillée de l'évolution du portefeuille comptable.</p>
      </header>

      {/* Row 1: Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Multi-Line Evolution */}
        <div className="lg:col-span-2 pro-card p-6 h-[400px] flex flex-col">
          <h2 className="pro-heading mb-6">Évolution Historique des Comptes</h2>
          <div className="flex-1 w-full h-full min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={multiLineData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  {accounts.map((acc, i) => (
                    <linearGradient key={`grad-${acc.id}`} id={`color-${i}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={COLORS[i % COLORS.length]} stopOpacity={0.1}/>
                      <stop offset="95%" stopColor={COLORS[i % COLORS.length]} stopOpacity={0}/>
                    </linearGradient>
                  ))}
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff" strokeOpacity={0.05} vertical={false} />
                <XAxis dataKey="date" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                <RechartsTooltip contentStyle={{ backgroundColor: '#0a0a0a', borderColor: '#ffffff20', borderRadius: '8px' }} />
                {accounts.map((acc, i) => (
                  <Area 
                    key={acc.id}
                    type="monotone" 
                    dataKey={acc.name} 
                    stroke={COLORS[i % COLORS.length]} 
                    fillOpacity={1} 
                    fill={`url(#color-${i})`} 
                  />
                ))}
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pie Chart (Distribution) */}
        <div className="pro-card p-6 h-[400px] flex flex-col">
          <h2 className="pro-heading mb-6">Distribution du Portefeuille</h2>
          <div className="flex-1 w-full h-full min-h-0 relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="45%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <RechartsTooltip 
                  formatter={(value, name, props) => [`${value} (${props.payload.percent}%)`, name]}
                  contentStyle={{ backgroundColor: '#0a0a0a', borderColor: '#ffffff20', borderRadius: '8px' }} 
                />
              </PieChart>
            </ResponsiveContainer>
            {/* Custom Legend */}
            <div className="absolute bottom-0 w-full flex flex-wrap justify-center gap-3">
              {pieData.map((entry, i) => (
                <div key={i} className="flex items-center gap-1.5 text-[10px] text-textdim">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }}></div>
                  {entry.name}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Row 2: Growth vs Decline & Export Table */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Growth vs Decline Bar Chart */}
        <div className="pro-card p-6 h-[400px] flex flex-col">
          <h2 className="pro-heading mb-6">Gains vs Dépenses (Net)</h2>
          <div className="flex-1 w-full h-full min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={growthData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff" strokeOpacity={0.05} vertical={false} />
                <XAxis dataKey="date" hide />
                <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                <RechartsTooltip 
                  cursor={{fill: '#ffffff05'}}
                  contentStyle={{ backgroundColor: '#0a0a0a', borderColor: '#ffffff20', borderRadius: '8px' }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
                <Bar dataKey="Growth" name="Gains (+)" stackId="a" fill="#10b981" radius={[2,2,0,0]} />
                <Bar dataKey="Decline" name="Dépenses (-)" stackId="a" fill="#ef4444" radius={[0,0,2,2]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Bilan Report Table */}
        <div className="lg:col-span-2 pro-card p-6 flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h2 className="pro-heading">Bilan Report View</h2>
            <ExportCenter reportTable={reportTable} />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead>
                <tr className="border-b border-border text-textdim">
                  <th className="pb-3 font-medium w-12">#</th>
                  <th className="pb-3 font-medium">Compte</th>
                  <th className="pb-3 font-medium text-right">Ancien Solde</th>
                  <th className="pb-3 font-medium text-right">Actuel</th>
                  <th className="pb-3 font-medium text-right">Variation</th>
                  <th className="pb-3 font-medium text-center">Objectif (900)</th>
                  <th className="pb-3 font-medium text-right">Statut</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {reportTable.map((row) => (
                  <tr key={row.name} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-3 font-bold text-textdim">{row.rank}</td>
                    <td className="py-3 font-bold text-white">{row.name}</td>
                    <td className="py-3 text-right text-textdim">{row.previousCoins}</td>
                    <td className="py-3 text-right text-white font-medium">{row.currentCoins}</td>
                    <td className="py-3 text-right font-medium">
                      {row.variation === 0 ? (
                        <span className="text-textdim">-</span>
                      ) : (
                        <span className={row.variation > 0 ? "text-accent" : "text-red-400"}>
                          {row.variation > 0 ? "+" : ""}{row.variation} ({row.variation > 0 ? "+" : ""}{row.variationPct}%)
                        </span>
                      )}
                    </td>
                    <td className="py-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-16 h-1.5 bg-ink rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full ${row.goalPct >= 100 ? 'bg-accent' : 'bg-white'}`}
                            style={{ width: `${row.goalPct}%` }}
                          />
                        </div>
                        <span className="text-[10px] w-6">{row.goalPct}%</span>
                      </div>
                    </td>
                    <td className="py-3 text-right">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                        row.status === "Prêt" ? "bg-accent/10 text-accent border border-accent/20" : 
                        row.status === "Proche" ? "bg-warn/10 text-warn border border-warn/20" : 
                        "bg-white/5 text-textdim border border-white/10"
                      }`}>
                        {row.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Row 3: Goal Distribution Chart */}
      <div className="grid grid-cols-1 gap-6">
        <div className="pro-card p-6 h-[400px] flex flex-col">
          <h2 className="pro-heading mb-6">Goal Distribution & Milestone Achievement</h2>
          <div className="flex-1 w-full h-full min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={goalDistData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff" strokeOpacity={0.05} vertical={false} />
                <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                <RechartsTooltip 
                  cursor={{fill: '#ffffff05'}}
                  contentStyle={{ backgroundColor: '#0a0a0a', borderColor: '#ffffff20', borderRadius: '8px' }}
                />
                <Bar dataKey="Comptes" fill="#3b82f6" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Row 4: Goal Achievement Analytics */}
      <div className="grid grid-cols-1 gap-6">
        <h2 className="text-xl font-bold text-white tracking-tight">Goal Achievement Analytics</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Goal Completion */}
          <div className="pro-card p-5 justify-between gap-4">
            <p className="text-xs font-bold text-textdim uppercase tracking-wider">Goal Completion</p>
            <div>
              <p className="text-3xl font-black tracking-tight mb-1 text-accent">
                {accounts.filter(a => a.currentCoins >= 900).length}
              </p>
              <p className="text-xs font-medium text-textdim">compte(s) ≥ 900 coins</p>
            </div>
          </div>

          {/* Average Coins */}
          <div className="pro-card p-5 justify-between gap-4">
            <p className="text-xs font-bold text-textdim uppercase tracking-wider">Average Coins</p>
            <div>
              <p className="text-3xl font-black tracking-tight mb-1 text-white">
                {accounts.length > 0 ? Math.round(accounts.reduce((s, a) => s + a.currentCoins, 0) / accounts.length).toLocaleString() : 0}
              </p>
              <p className="text-xs font-medium text-textdim">Moyenne globale</p>
            </div>
          </div>

          {/* Best Account */}
          <div className="pro-card p-5 justify-between gap-4">
            <p className="text-xs font-bold text-textdim uppercase tracking-wider">Best Account</p>
            <div>
              <p className="text-3xl font-black tracking-tight mb-1 text-white truncate">
                {(() => {
                  const best = [...accounts].sort((a, b) => b.currentCoins - a.currentCoins)[0];
                  return best ? best.name : "-";
                })()}
              </p>
              <p className="text-xs font-medium text-textdim">
                {(() => {
                  const best = [...accounts].sort((a, b) => b.currentCoins - a.currentCoins)[0];
                  return best ? `${best.currentCoins.toLocaleString()} coins` : "Aucun compte";
                })()}
              </p>
            </div>
          </div>

          {/* Average Goal Time */}
          <div className="pro-card p-5 justify-between gap-4">
            <p className="text-xs font-bold text-textdim uppercase tracking-wider">Avg Goal Time</p>
            <div>
              <p className="text-3xl font-black tracking-tight mb-1 text-white">
                {(() => {
                  // Calculate average time to reach 900 from coinLogs
                  const goalTimes = [];
                  accounts.forEach(acc => {
                    if (acc.currentCoins >= 900) {
                      const accLogs = coinLogs.filter(l => l.accountId === acc.id).sort((a, b) => new Date(a.date) - new Date(b.date));
                      if (accLogs.length >= 2) {
                        const firstDate = new Date(accLogs[0].date);
                        const reachedLog = accLogs.find(l => l.newBalance >= 900);
                        if (reachedLog) {
                          const reachedDate = new Date(reachedLog.date);
                          const days = Math.round((reachedDate - firstDate) / 86400000);
                          if (days > 0) goalTimes.push(days);
                        }
                      }
                    }
                  });
                  if (goalTimes.length === 0) return "—";
                  return `${Math.round(goalTimes.reduce((s, d) => s + d, 0) / goalTimes.length)}j`;
                })()}
              </p>
              <p className="text-xs font-medium text-textdim">
                {(() => {
                  const goaled = accounts.filter(a => a.currentCoins >= 900).length;
                  return goaled > 0 ? `Basé sur ${goaled} compte(s)` : "Pas assez de données";
                })()}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
