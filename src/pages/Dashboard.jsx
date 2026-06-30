import React from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { useNavigate } from "react-router-dom";
import { usePortfolioStats } from "../hooks/usePortfolioStats.js";
import { useStreakData } from "../hooks/useStreakData.js";
import { db } from "../db.js";
import { getNextGoal, getGoalDistribution } from "../utils/goalEngine.js";
import HeroHeader from "../components/ui/HeroHeader.jsx";
import EmptyState from "../components/ui/EmptyState.jsx";
import StreakWidget from "../components/ui/StreakWidget.jsx";
import DailyCheckinModal from "../components/ui/DailyCheckinModal.jsx";
import { AreaChart, Area, Tooltip, ResponsiveContainer } from "recharts";

export default function Dashboard() {
  const navigate = useNavigate();
  const accounts = useLiveQuery(() => db.accounts.toArray(), []);
  const recentTransactions = useLiveQuery(() => db.coinLogs.reverse().limit(5).toArray(), []) || [];
  const [portfolioHistory, setPortfolioHistory] = React.useState([]);
  const { streakDays, needsCheckin, isLoading: isStreakLoading } = useStreakData();

  const {
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
  } = usePortfolioStats(accounts);

  React.useEffect(() => {
    if (!accounts || accounts.length === 0) return;
    const fetchHistory = async () => {
      const logs = await db.coinLogs.toArray();
      if (!logs || logs.length === 0) return;
      
      const accountBalances = {};
      const dataPoints = [];
      const sortedLogs = logs.sort((a, b) => a.id - b.id);
      
      sortedLogs.forEach(log => {
        accountBalances[log.accountId] = log.newBalance;
        const total = Object.values(accountBalances).reduce((sum, val) => sum + val, 0);
        
        let label = log.date;
        if (log.createdAt) {
          const d = new Date(log.createdAt);
          label = `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}`;
        }
        
        dataPoints.push({ label, total });
      });
      
      setPortfolioHistory(dataPoints.slice(-30));
    };
    fetchHistory();
  }, [totalCoins, accounts?.length]);

  if (!accounts) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-8 h-8 border-2 border-white/10 border-t-white rounded-full animate-spin"></div>
      </div>
    );
  }

  if (accounts.length === 0) {
    return (
      <EmptyState 
        variant="empty"
        title="Coin Manager Pro"
        description="Votre plateforme comptable pour la gestion et le suivi du patrimoine eFootball."
        action={
          <button onClick={() => navigate("/accounts")} className="btn-primary flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
            Créer un compte
          </button>
        }
      />
    );
  }

  return (
    <div className="max-w-7xl mx-auto pb-12 space-y-8 animate-in fade-in duration-500">
      {!isStreakLoading && needsCheckin && <DailyCheckinModal onClose={() => {}} />}
      {!isStreakLoading && <StreakWidget streakDays={streakDays} />}
      <HeroHeader 
        title="Executive Dashboard"
        description="Vue d'ensemble financière et suivi du patrimoine."
        stats={[
          { label: "Accounts", value: totalAccounts },
          { label: "Total Coins", value: totalCoins.toLocaleString() }
        ]}
      />

      {/* Global Portfolio Chart */}
      {portfolioHistory.length > 0 && (
        <div className="pro-card p-6 bg-surface h-64 flex flex-col relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-6 z-10 text-right pointer-events-none">
            <p className="text-xs font-bold text-textdim uppercase tracking-wider mb-1">Total Portfolio Value</p>
            <p className="text-4xl font-black text-white drop-shadow-lg">{totalCoins.toLocaleString()}</p>
          </div>
          <div className="flex-1 w-full h-full -mx-4 -mb-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={portfolioHistory}>
                <defs>
                  <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0a0a0a', borderColor: '#ffffff20', borderRadius: '8px' }}
                  itemStyle={{ color: '#3b82f6', fontWeight: 'bold' }}
                />
                <Area type="monotone" dataKey="total" name="Total Coins" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorTotal)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Row 1: Core Financials */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <ProCard title="Total Coins" value={totalCoins.toLocaleString()} sub={`${totalAccounts} comptes actifs`} />
        <ProCard title="Moyenne par Compte" value={averageCoins.toLocaleString()} sub="Coins / compte" />
        <ProCard title="Croissance Globale" value={`+${totalGrowth.toLocaleString()}`} color="text-accent" sub="Total des gains historiques" />
        <ProCard title="Pertes Globales" value={`-${totalDecline.toLocaleString()}`} color="text-red-400" sub="Total des dépenses/pertes" />
      </div>

      {/* Row 2: Bilan Comparison Upgrade */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <ProCard title="Comptes Prêts (≥900)" value={above900} sub={`${Math.round((above900/totalAccounts)*100)}% du portfolio`} color="text-accent" />
        <ProCard title="Comptes à Risque (<900)" value={below900} sub={`${Math.round((below900/totalAccounts)*100)}% du portfolio`} color="text-warn" />
        <ProCard title="Meilleure Croissance" value={`+${bestGrowth.diff}`} sub={bestGrowth.name} color="text-accent" />
        <ProCard title="Pire Déclin" value={`${worstDecline.diff}`} sub={worstDecline.name} color="text-red-400" />
      </div>

      {/* Row 3: Goal Tier Distribution */}
      <div className="pro-card bg-surface p-6">
        <h2 className="text-sm font-bold text-white uppercase tracking-wider mb-4">Portfolio Distribution (Tiers)</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <TierWidget title="< 900" count={distribution["< 900"]} total={totalAccounts} color="text-red-400" />
          <TierWidget title="≥ 900" count={distribution[">= 900"]} total={totalAccounts} color="text-accent" />
          <TierWidget title="≥ 1800" count={distribution[">= 1800"]} total={totalAccounts} color="text-purple-400" />
          <TierWidget title="≥ 2700" count={distribution[">= 2700"]} total={totalAccounts} color="text-blue-400" />
          <TierWidget title="≥ 3600" count={distribution[">= 3600"]} total={totalAccounts} color="text-yellow-400" />
          <TierWidget title="≥ 4500" count={distribution[">= 4500"]} total={totalAccounts} color="text-pink-400" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Multi-Goal Tracking */}
        <div className="pro-card bg-surface p-6">
          <h2 className="text-lg font-bold text-white mb-6">Multi-Goal Tracking</h2>
          <div className="space-y-5">
            {sortedAccounts.slice(0, 8).map(acc => {
              const { currentTier, nextGoal, remainingCoins, progressPct } = getNextGoal(acc.currentCoins);
              let colorClass = "bg-red-500";
              let textClass = "text-red-400";
              
              if (progressPct >= 100) {
                colorClass = "bg-accent";
                textClass = "text-accent";
              } else if (progressPct >= 50) {
                colorClass = "bg-warn";
                textClass = "text-warn";
              }

              return (
                <div key={acc.id} className="group">
                  <div className="flex justify-between items-end mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-white">{acc.name}</span>
                      <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-white/10 text-textdim">Tier {currentTier}</span>
                    </div>
                    <span className={`text-sm font-bold ${textClass}`}>{progressPct}%</span>
                  </div>
                  <div className="h-2 bg-background rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${colorClass}`} 
                      style={{ width: `${Math.min(100, progressPct)}%` }} 
                    />
                  </div>
                  <div className="flex justify-between mt-1">
                    <span className="text-[10px] text-textdim">{acc.currentCoins} coins</span>
                    <span className="text-[10px] text-textdim">Goal {nextGoal} ({remainingCoins} restants)</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Account Ranking System */}
        <div className="pro-card bg-surface p-6">
          <h2 className="text-lg font-bold text-white mb-6">Classement des Comptes</h2>
          <div className="space-y-2">
            {sortedAccounts.map((acc, index) => {
              const isTop3 = index < 3;
              return (
                <div key={acc.id} className="flex items-center justify-between p-3 rounded-lg bg-background border border-border hover:border-textdim/20 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${isTop3 ? 'bg-surfaceElevated text-white' : 'bg-transparent text-textdim'}`}>
                      #{index + 1}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white">{acc.name}</p>
                      <p className="text-xs text-textdim">{acc.currentCoins.toLocaleString()} coins</p>
                    </div>
                  </div>
                  <div className={`text-sm font-black ${getNextGoal(acc.currentCoins).progressPct >= 100 ? 'text-accent' : 'text-white'}`}>
                    {getNextGoal(acc.currentCoins).progressPct}%
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Row 3.5: Recent Activity Feed */}
      {recentTransactions.length > 0 && (
        <div className="pro-card bg-surface p-6">
          <h2 className="text-lg font-bold text-white mb-6">Dernières Transactions</h2>
          <div className="space-y-3">
            {recentTransactions.map(log => {
              const acc = accounts.find(a => a.id === log.accountId);
              const diff = log.newBalance - log.previousBalance;
              const isPositive = diff > 0;
              return (
                <div key={log.id} className="flex items-center justify-between p-3 rounded-lg bg-background border border-border">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center bg-opacity-10 ${isPositive ? 'bg-accent text-accent' : 'bg-danger text-danger'}`}>
                      {isPositive ? (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
                      ) : (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 12H4" /></svg>
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white">{acc ? acc.name : 'Compte Inconnu'}</p>
                      <p className="text-xs text-textdim">{log.reason || 'Mise à jour du solde'}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-black ${isPositive ? 'text-accent' : 'text-danger'}`}>
                      {isPositive ? '+' : ''}{diff}
                    </p>
                    <p className="text-[10px] text-textdim font-mono">{log.date}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Row 4: High Value Features (Phase 11) */}
      <div>
        <h2 className="text-xl font-bold text-white tracking-tight mb-4 mt-4">Premium Intelligence</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Portfolio Health Score */}
          <div className="pro-card bg-gradient-to-br from-surface to-background p-6 border-accent/20">
            <h3 className="text-xs font-bold text-accent uppercase tracking-wider mb-4 flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" /></svg>
              Health Score
            </h3>
            <div className="flex items-end gap-2 mb-2">
              <span className="text-4xl font-black text-white">
                {totalAccounts === 0 ? 0 : Math.min(100, Math.round(((totalCoins / (totalAccounts * 900)) * 50) + (totalGrowth >= totalDecline ? 50 : 20)))}
              </span>
              <span className="text-textdim mb-1 font-medium">/ 100</span>
            </div>
            <p className="text-xs text-textdim mt-2">Basé sur la stabilité (Gains vs Pertes) et la progression globale vers 900.</p>
          </div>

          {/* Forecast Engine */}
          <div className="pro-card bg-surface p-6">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
              <svg className="w-4 h-4 text-textdim" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
              Forecast Engine
            </h3>
            {closestTo900 ? (
              <>
                <p className="text-sm font-bold text-white mb-1">{closestTo900.name} (Objectif 900)</p>
                <div className="text-2xl font-black text-accent mb-2">
                  ~ {Math.ceil((900 - closestTo900.currentCoins) / (totalGrowth > 0 ? (totalGrowth / 14) : 10))} jours
                </div>
                <p className="text-xs text-textdim">Estimation basée sur la croissance historique moyenne (14j).</p>
              </>
            ) : (
              <p className="text-sm text-textdim mt-4">Aucun compte en attente d'objectif.</p>
            )}
          </div>

          {/* Smart Alerts */}
          <div className="pro-card bg-surface p-6">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
              <svg className="w-4 h-4 text-textdim" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
              Smart Alerts
            </h3>
            <div className="space-y-3">
              {above900 > 0 && (
                <div className="bg-success/10 border border-success/20 rounded p-2 text-xs text-success font-medium">
                  • {above900} compte(s) ont franchi le seuil des 900 coins. Prêt(s) pour le pass.
                </div>
              )}
              {totalDecline > totalGrowth && (
                <div className="bg-danger/10 border border-danger/20 rounded p-2 text-xs text-danger font-medium">
                  • Attention : Les dépenses globales dépassent la croissance. Risque de déclin du portefeuille.
                </div>
              )}
              {totalAccounts > 0 && totalDecline <= totalGrowth && above900 === 0 && (
                <div className="bg-surfaceElevated border border-border rounded p-2 text-xs text-textdim font-medium">
                  • Croissance stable détectée. Maintenez vos efforts.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const ProCard = React.memo(function ProCard({ title, value, sub, color = "text-white" }) {
  return (
    <div className="pro-card justify-between gap-4 p-5 bg-surface">
      <p className="text-xs font-bold text-textdim uppercase tracking-wider">{title}</p>
      <div>
        <p className={`text-3xl font-black tracking-tight mb-1 truncate ${color}`}>{value}</p>
        <p className="text-xs font-medium text-textdim truncate">{sub}</p>
      </div>
    </div>
  );
});

const TierWidget = React.memo(function TierWidget({ title, count, total, color }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="bg-background p-3 rounded-lg border border-border">
      <p className="text-[10px] text-textdim font-bold tracking-wider mb-1 uppercase">{title}</p>
      <div className="flex items-end gap-2">
        <span className={`text-2xl font-black ${color}`}>{count}</span>
        <span className="text-xs text-textdim mb-1 opacity-60">({pct}%)</span>
      </div>
    </div>
  );
});
