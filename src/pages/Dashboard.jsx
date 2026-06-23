import { useLiveQuery } from "dexie-react-hooks";
import { Link } from "react-router-dom";
import { db } from "../db.js";
import { getNextGoal, getGoalDistribution } from "../utils/goalEngine.js";
import { getPortfolioMotivation } from "../utils/motivationEngine.js";

export default function Dashboard() {
  const accounts = useLiveQuery(() => db.accounts.toArray(), []);
  const coinLogs = useLiveQuery(() => db.coinLogs.toArray(), []);

  if (!accounts || !coinLogs) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-8 h-8 border-2 border-white/10 border-t-white rounded-full animate-spin"></div>
      </div>
    );
  }

  if (accounts.length === 0) {
    return <DashboardEmptyState />;
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
  
  // Find best growth and worst decline by looking at recent account changes
  // Easiest way: look at the variation of currentCoins - last log's previousBalance
  let bestGrowth = { name: "-", diff: 0 };
  let worstDecline = { name: "-", diff: 0 };

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

  return (
    <div className="max-w-7xl mx-auto pb-12 animate-in fade-in duration-500 space-y-8">
      <header>
        <h1 className="text-3xl font-bold text-white tracking-tight">Executive Dashboard</h1>
        <p className="text-sm text-textdim mt-1">Vue d'ensemble financière et suivi du patrimoine.</p>
        
        {(() => {
          const motivation = getPortfolioMotivation(accounts, coinLogs);
          return (
            <div className={`mt-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium ${
              motivation.type === 'success' ? 'bg-accent/10 text-accent border-accent/20' :
              motivation.type === 'warn' ? 'bg-warn/10 text-warn border-warn/20' :
              'bg-white/5 text-textdim border-white/10'
            }`}>
              <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={
                  motivation.type === 'success' ? "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" :
                  motivation.type === 'warn' ? "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" :
                  "M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                } />
              </svg>
              {motivation.message}
            </div>
          );
        })()}
      </header>

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
      <div className="pro-card bg-panel p-6">
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
        <div className="pro-card bg-panel p-6">
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
                  <div className="h-2 bg-ink rounded-full overflow-hidden">
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
        <div className="pro-card bg-panel p-6">
          <h2 className="text-lg font-bold text-white mb-6">Classement des Comptes</h2>
          <div className="space-y-2">
            {sortedAccounts.map((acc, index) => {
              const isTop3 = index < 3;
              return (
                <div key={acc.id} className="flex items-center justify-between p-3 rounded-lg bg-ink border border-border hover:border-white/10 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${isTop3 ? 'bg-white/10 text-white' : 'bg-transparent text-textdim'}`}>
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

      {/* Row 4: High Value Features (Phase 11) */}
      <div>
        <h2 className="text-xl font-bold text-white tracking-tight mb-4 mt-4">Premium Intelligence</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Portfolio Health Score */}
          <div className="pro-card bg-gradient-to-br from-panel to-ink p-6 border-accent/20">
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
          <div className="pro-card bg-panel p-6">
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
          <div className="pro-card bg-panel p-6">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
              <svg className="w-4 h-4 text-textdim" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
              Smart Alerts
            </h3>
            <div className="space-y-3">
              {above900 > 0 && (
                <div className="bg-accent/10 border border-accent/20 rounded p-2 text-xs text-accent font-medium">
                  • {above900} compte(s) ont franchi le seuil des 900 coins. Prêt(s) pour le pass.
                </div>
              )}
              {totalDecline > totalGrowth && (
                <div className="bg-red-500/10 border border-red-500/20 rounded p-2 text-xs text-red-400 font-medium">
                  • Attention : Les dépenses globales dépassent la croissance. Risque de déclin du portefeuille.
                </div>
              )}
              {totalAccounts > 0 && totalDecline <= totalGrowth && above900 === 0 && (
                <div className="bg-white/5 border border-white/10 rounded p-2 text-xs text-textdim font-medium">
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

function ProCard({ title, value, sub, color = "text-white" }) {
  return (
    <div className="pro-card justify-between gap-4 p-5 bg-panel">
      <p className="text-xs font-bold text-textdim uppercase tracking-wider">{title}</p>
      <div>
        <p className={`text-3xl font-black tracking-tight mb-1 truncate ${color}`}>{value}</p>
        <p className="text-xs font-medium text-textdim truncate">{sub}</p>
      </div>
    </div>
  );
}

function DashboardEmptyState() {
  return (
    <div className="max-w-4xl mx-auto py-12 animate-in fade-in duration-700">
      <div className="text-center mb-16">
        <div className="w-24 h-24 mx-auto mb-8 rounded-3xl bg-gradient-to-br from-white/10 to-white/5 border border-white/10 flex items-center justify-center shadow-[0_0_60px_rgba(255,255,255,0.05)]">
          <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h1 className="text-4xl font-black text-white tracking-tight mb-4">Coin Manager Pro</h1>
        <p className="text-lg text-textdim max-w-2xl mx-auto leading-relaxed">
          Votre plateforme comptable pour la gestion et le suivi du patrimoine eFootball.
        </p>
      </div>

      <div className="flex justify-center">
        <Link to="/accounts" className="btn-primary px-10 py-4 rounded-xl text-base tracking-wide flex items-center gap-3">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
          Créer un compte
        </Link>
      </div>
    </div>
  );
}

function TierWidget({ title, count, total, color }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="bg-ink p-3 rounded-lg border border-border">
      <p className="text-[10px] text-textdim font-bold tracking-wider mb-1 uppercase">{title}</p>
      <div className="flex items-end gap-2">
        <span className={`text-2xl font-black ${color}`}>{count}</span>
        <span className="text-xs text-textdim mb-1 opacity-60">({pct}%)</span>
      </div>
    </div>
  );
}
