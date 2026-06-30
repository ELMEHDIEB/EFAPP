import React, { useState, useEffect, useMemo } from 'react';
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../db.js";
import { useAnalyticsData } from "../hooks/useAnalyticsData.js";
import { useAccountScores } from "../hooks/useAccountScores.js";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer
} from 'recharts';
import { EvolutionChart } from '../components/analytics/EvolutionChart.jsx';
import { DistributionPie } from '../components/analytics/DistributionPie.jsx';
import { GrowthBarChart } from '../components/analytics/GrowthBarChart.jsx';
import { getNextGoal, getGoalDistribution } from "../utils/goalEngine.js";
import { getHealthScore } from "../utils/healthScore.js";
import ExportCenter from "../components/ExportCenter.jsx";
import DataTable from "../components/ui/DataTable.jsx";
import GoalRadar from "../components/GoalRadar.jsx";
import MilestoneTimeline from "../components/MilestoneTimeline.jsx";
import HeroHeader from "../components/ui/HeroHeader.jsx";
import EmptyState from "../components/ui/EmptyState.jsx";

export default function Analytics() {
  const accounts = useLiveQuery(() => db.accounts.toArray(), []);
  const coinLogs = useLiveQuery(() => db.coinLogs.toArray(), []);
  const healthData = useAccountScores(accounts, getHealthScore);

  const { multiLineData, pieData, growthData, reportTable, goalDistData, COLORS } = useAnalyticsData(accounts, coinLogs);

  if (!accounts || !coinLogs) {
    return (
      <div className="flex h-[70vh] items-center justify-center">
        <div className="w-8 h-8 border-2 border-white/10 border-t-white rounded-full animate-spin"></div>
      </div>
    );
  }

  if (accounts.length === 0) {
    return (
      <EmptyState 
        variant="empty"
        title="Aucune donnée analytique"
        description="Créez des comptes et effectuez des transactions pour générer le bilan comptable."
      />
    );
  }

  return (
    <div className="max-w-7xl mx-auto pb-12 space-y-6">
      <HeroHeader 
        title="Analytics & Bilan"
        description="Analyse détaillée de l'évolution du portefeuille comptable."
      />

      {/* Row 1: Charts */}
      <div id="analytics-charts-export" className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <EvolutionChart accounts={accounts} multiLineData={multiLineData} COLORS={COLORS} />
        <DistributionPie pieData={pieData} />
      </div>

      {/* Row 2: Growth vs Decline & Export Table */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <GrowthBarChart growthData={growthData} />

        {/* Bilan Report Table */}
        <div className="lg:col-span-2 pro-card p-6 flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h2 className="pro-heading">Bilan Report View</h2>
            <ExportCenter reportTable={reportTable} />
          </div>
          <div className="w-full">
            <DataTable 
              columns={[
                {
                  key: 'rank',
                  label: '#',
                  sortable: false,
                  align: 'left',
                  render: (row) => <span className="font-bold text-textdim">{row.rank}</span>
                },
                {
                  key: 'name',
                  label: 'Compte',
                  sortValue: (row) => row.name.toLowerCase(),
                  render: (row) => <span className="font-bold text-white">{row.name}</span>
                },
                {
                  key: 'previousCoins',
                  label: 'Ancien Solde',
                  align: 'right',
                  render: (row) => <span className="text-textdim">{row.previousCoins}</span>
                },
                {
                  key: 'currentCoins',
                  label: 'Actuel',
                  align: 'right',
                  render: (row) => <span className="text-white font-medium">{row.currentCoins}</span>
                },
                {
                  key: 'variation',
                  label: 'Variation',
                  align: 'right',
                  render: (row) => {
                    if (row.variation === 0) return <span className="text-textdim">-</span>;
                    const isPos = row.variation > 0;
                    return (
                      <span className={isPos ? "text-accent" : "text-red-400"}>
                        {isPos ? "+" : ""}{row.variation} ({isPos ? "+" : ""}{row.variationPct}%)
                      </span>
                    );
                  }
                },
                {
                  key: 'goalPct',
                  label: 'Objectif (900)',
                  align: 'center',
                  render: (row) => (
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-16 h-1.5 bg-ink rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full ${row.goalPct >= 100 ? 'bg-accent' : 'bg-white'}`}
                          style={{ width: `${Math.min(row.goalPct, 100)}%` }}
                        />
                      </div>
                      <span className="text-[10px] w-6">{row.goalPct}%</span>
                    </div>
                  )
                },
                {
                  key: 'status',
                  label: 'Statut',
                  align: 'right',
                  sortValue: (row) => row.goalPct,
                  render: (row) => (
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                      row.status === "Prêt" ? "bg-accent/10 text-accent border border-accent/20" : 
                      row.status === "Proche" ? "bg-warn/10 text-warn border border-warn/20" : 
                      "bg-white/5 text-textdim border border-white/10"
                    }`}>
                      {row.status}
                    </span>
                  )
                }
              ]}
              data={reportTable}
              defaultSortKey="currentCoins"
            />
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

      {/* Row 5: Advanced Intelligence */}
      <div className="grid grid-cols-1 gap-6">
        <h2 className="text-xl font-bold text-white tracking-tight">Advanced Intelligence</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Goal Success Rate */}
          <div className="pro-card p-5 justify-between gap-4 bg-panel">
            <p className="text-xs font-bold text-textdim uppercase tracking-wider flex items-center gap-2">
              <svg className="w-4 h-4 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              Success Rate
            </p>
            <div>
              <p className="text-3xl font-black tracking-tight mb-1 text-white">
                {accounts.length > 0 ? Math.round((accounts.filter(a => a.currentCoins >= 900).length / accounts.length) * 100) : 0}%
              </p>
              <p className="text-xs font-medium text-textdim">des comptes ont atteint l'objectif</p>
            </div>
          </div>

          {/* Best Performer */}
          <div className="pro-card p-5 justify-between gap-4 bg-panel">
            <p className="text-xs font-bold text-textdim uppercase tracking-wider flex items-center gap-2">
              <svg className="w-4 h-4 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
              Best Performer (7j)
            </p>
            <div>
              {(() => {
                const now = new Date();
                const sevenDaysAgo = new Date(now.getTime() - 7 * 86400000).toISOString().slice(0, 10);
                const recentLogs = coinLogs.filter(l => l.date >= sevenDaysAgo);
                
                const performance = {};
                recentLogs.forEach(log => {
                  if (!performance[log.accountId]) performance[log.accountId] = 0;
                  performance[log.accountId] += (log.newBalance - log.previousBalance);
                });

                let bestId = null;
                let maxDelta = -Infinity;
                for (const [id, delta] of Object.entries(performance)) {
                  if (delta > maxDelta) {
                    maxDelta = delta;
                    bestId = Number(id);
                  }
                }

                const bestAcc = accounts.find(a => a.id === bestId);
                
                if (bestAcc && maxDelta > 0) {
                  return (
                    <>
                      <p className="text-2xl font-black tracking-tight mb-1 text-white truncate">{bestAcc.name}</p>
                      <p className="text-xs font-medium text-accent">+{maxDelta} coins générés</p>
                    </>
                  );
                }
                return (
                  <>
                    <p className="text-2xl font-black tracking-tight mb-1 text-textdim">—</p>
                    <p className="text-xs font-medium text-textdim">Pas de croissance récente</p>
                  </>
                );
              })()}
            </div>
          </div>

          {/* Recovery Rate */}
          <div className="pro-card p-5 justify-between gap-4 bg-panel">
            <p className="text-xs font-bold text-textdim uppercase tracking-wider flex items-center gap-2">
              <svg className="w-4 h-4 text-warn" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
              Recovery Rate
            </p>
            <div>
              {(() => {
                let recoveredCount = 0;
                let totalFallen = 0;
                
                const accountIds = [...new Set(coinLogs.map(l => l.accountId))];
                for (const accId of accountIds) {
                  const logs = coinLogs
                    .filter(l => l.accountId === accId)
                    .sort((a, b) => new Date(a.date) - new Date(b.date));
                  
                  let wentBelow900 = false;
                  let cameBackAbove900 = false;
                  
                  for (const log of logs) {
                    if (log.previousBalance >= 900 && log.newBalance < 900) {
                      wentBelow900 = true;
                    }
                    if (wentBelow900 && log.newBalance >= 900) {
                      cameBackAbove900 = true;
                    }
                  }
                  
                  if (wentBelow900) totalFallen++;
                  if (cameBackAbove900) recoveredCount++;
                }

                if (totalFallen === 0) {
                   return (
                    <>
                      <p className="text-3xl font-black tracking-tight mb-1 text-white">N/A</p>
                      <p className="text-xs font-medium text-textdim">Aucune chute sous 900 enregistrée</p>
                    </>
                  );
                }

                const rate = Math.round((recoveredCount / totalFallen) * 100);
                return (
                  <>
                    <p className={`text-3xl font-black tracking-tight mb-1 ${rate > 50 ? 'text-accent' : 'text-warn'}`}>{rate}%</p>
                    <p className="text-xs font-medium text-textdim">{recoveredCount} récupérations sur {totalFallen} chutes</p>
                  </>
                );
              })()}
            </div>
          </div>

          {/* Health Score Distribution */}
          <div className="pro-card p-5 justify-between gap-4 bg-panel">
            <p className="text-xs font-bold text-textdim uppercase tracking-wider flex items-center gap-2">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" /></svg>
              Health Profile
            </p>
            <div>
              {(() => {
                if (Object.keys(healthData).length === 0) return <p className="text-xs text-textdim">Chargement...</p>;
                
                const dist = { Elite: 0, Good: 0, Average: 0, Risky: 0 };
                let total = 0;
                Object.values(healthData).forEach(hs => {
                  dist[hs.label]++;
                  total++;
                });

                if (total === 0) return <p className="text-xs text-textdim">Pas de données</p>;

                return (
                  <div className="flex w-full h-3 rounded-full overflow-hidden mb-2 bg-ink">
                    {dist.Elite > 0 && <div className="bg-accent h-full" style={{ width: `${(dist.Elite/total)*100}%` }} title={`Elite: ${dist.Elite}`} />}
                    {dist.Good > 0 && <div className="bg-white h-full" style={{ width: `${(dist.Good/total)*100}%` }} title={`Good: ${dist.Good}`} />}
                    {dist.Average > 0 && <div className="bg-warn h-full" style={{ width: `${(dist.Average/total)*100}%` }} title={`Average: ${dist.Average}`} />}
                    {dist.Risky > 0 && <div className="bg-danger h-full" style={{ width: `${(dist.Risky/total)*100}%` }} title={`Risky: ${dist.Risky}`} />}
                  </div>
                );
              })()}
              <div className="flex gap-2 text-[9px] uppercase tracking-widest text-textdim font-bold justify-between">
                <span className="text-accent">Elite</span>
                <span className="text-white">Good</span>
                <span className="text-warn">Avg</span>
                <span className="text-danger">Risk</span>
              </div>
            </div>
          </div>

          {/* Achievement Progress */}
          <div className="pro-card p-5 justify-between gap-4 bg-panel">
            <p className="text-xs font-bold text-textdim uppercase tracking-wider flex items-center gap-2">
              <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg>
              Achievements
            </p>
            <div>
              {(() => {
                // Approximate calculation (similar to Achievements page but simpler)
                let unlockedCount = 0;
                if (accounts.some(a => a.currentCoins >= 900)) unlockedCount++; // Goal Hunter
                if (accounts.filter(a => a.currentCoins >= 900).length >= 3) unlockedCount++; // Elite Collector
                
                // Consistency
                const byDate = {};
                coinLogs.forEach(l => {
                  if (!byDate[l.date]) byDate[l.date] = 0;
                  byDate[l.date] += (l.newBalance - l.previousBalance);
                });
                let streak = 0, maxStreak = 0;
                Object.keys(byDate).sort().forEach(d => {
                  if (byDate[d] > 0) { streak++; maxStreak = Math.max(maxStreak, streak); } else streak = 0;
                });
                if (maxStreak >= 7) unlockedCount++;

                // Discipline
                if (Object.values(healthData).some(hs => hs.score >= 90)) unlockedCount++;

                // Comeback
                let comeback = false;
                const accountIds = [...new Set(coinLogs.map(l => l.accountId))];
                for (const accId of accountIds) {
                  let wentBelow500 = false;
                  for (const log of coinLogs.filter(l => l.accountId === accId).sort((a, b) => new Date(a.date) - new Date(b.date))) {
                    if (log.newBalance < 500) wentBelow500 = true;
                    if (wentBelow500 && log.newBalance >= 900) { comeback = true; break; }
                  }
                  if (comeback) break;
                }
                if (comeback) unlockedCount++;

                // Marathon
                if (accounts.some(a => a.createdAt && (Date.now() - new Date(a.createdAt).getTime()) >= 30 * 86400000)) unlockedCount++;

                const progress = Math.round((unlockedCount / 6) * 100);

                return (
                  <>
                    <p className="text-3xl font-black tracking-tight mb-1 text-white">{unlockedCount} / 6</p>
                    <div className="w-full h-1 bg-ink rounded-full overflow-hidden mt-2 mb-1">
                      <div className="h-full rounded-full bg-purple-400" style={{ width: `${progress}%` }} />
                    </div>
                  </>
                );
              })()}
            </div>
          </div>

          {/* Goal Completion Trend */}
          <div className="pro-card p-5 justify-between gap-4 bg-panel">
            <p className="text-xs font-bold text-textdim uppercase tracking-wider flex items-center gap-2">
              <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" /></svg>
              Goal Trend (14j)
            </p>
            <div className="flex items-end gap-1 h-10 w-full">
              {(() => {
                const now = new Date();
                const days = [];
                for (let i = 13; i >= 0; i--) {
                  const d = new Date(now.getTime() - i * 86400000).toISOString().slice(0, 10);
                  days.push(d);
                }

                // Simulate accounts balance per day
                const accBalances = {};
                accounts.forEach(a => accBalances[a.id] = 0);
                
                const trendData = days.map(d => {
                  const logsToDate = coinLogs.filter(l => l.date <= d).sort((a, b) => a.id - b.id);
                  logsToDate.forEach(l => accBalances[l.accountId] = l.newBalance);
                  let goaled = 0;
                  accounts.forEach(a => { if (accBalances[a.id] >= 900) goaled++; });
                  return goaled;
                });

                const max = Math.max(...trendData, 1); // Avoid div by 0

                return trendData.map((val, i) => (
                  <div key={i} className="flex-1 bg-blue-400/20 rounded-t-sm flex items-end justify-center group relative">
                    <div className="w-full bg-blue-400 rounded-t-sm transition-all" style={{ height: `${(val/max)*100}%`, minHeight: '4px' }} />
                    <div className="absolute -top-6 bg-ink text-white text-[10px] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                      {val}
                    </div>
                  </div>
                ));
              })()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
