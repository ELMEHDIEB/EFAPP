import { useState, useMemo } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { Link, useNavigate } from "react-router-dom";
import { db } from "../db.js";
import { getNextGoal, getGoalDistribution } from "../utils/goalEngine.js";
import { getPortfolioMotivation } from "../utils/motivationEngine.js";
import HeroHeader from "../components/ui/HeroHeader.jsx";
import EmptyState from "../components/ui/EmptyState.jsx";
import StatCard from "../components/ui/StatCard.jsx";
import GoalRadar from "../components/GoalRadar.jsx";

export default function Dashboard() {
  const navigate = useNavigate();
  const [showGoalRadar, setShowGoalRadar] = useState(false);
  const [dismissedWarning, setDismissedWarning] = useState(false);
  const accounts = useLiveQuery(() => db.accounts.toArray(), []);
  const coinLogs = useLiveQuery(() => db.coinLogs.toArray(), []);
  const settings = useLiveQuery(() => db.settings.toArray(), []);

  const stats = useMemo(() => {
    if (!accounts || accounts.length === 0) {
      return {
        totalAccounts: 0, totalCoins: 0, averageCoins: 0, above900: 0, below900: 0,
        sortedAccounts: [], closestTo900: null, distribution: { "< 900": 0, ">= 900": 0, ">= 1800": 0, ">= 2700": 0, ">= 3600": 0, ">= 4500": 0 },
        totalGrowth: 0, totalDecline: 0, bestGrowth: { name: "-", diff: 0 }, worstDecline: { name: "-", diff: 0 }
      };
    }

    const totalAccounts = accounts.length;
    const totalCoins = accounts.reduce((sum, a) => sum + a.currentCoins, 0);
    const averageCoins = totalAccounts > 0 ? Math.round(totalCoins / totalAccounts) : 0;
    
    const above900 = accounts.filter(a => a.currentCoins >= 900).length;
    const below900 = accounts.filter(a => a.currentCoins < 900).length;
    
    const sortedAccounts = [...accounts].sort((a, b) => b.currentCoins - a.currentCoins);
    const closestTo900 = [...accounts]
      .filter(a => a.currentCoins < 900)
      .sort((a, b) => (900 - a.currentCoins) - (900 - b.currentCoins))[0];

    const distribution = getGoalDistribution(accounts);

    let totalGrowth = 0;
    let totalDecline = 0;
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

    return {
      totalAccounts, totalCoins, averageCoins, above900, below900,
      sortedAccounts, closestTo900, distribution,
      totalGrowth, totalDecline, bestGrowth, worstDecline
    };
  }, [accounts, coinLogs]);

  const { 
    totalAccounts, totalCoins, averageCoins, above900, below900, 
    sortedAccounts, closestTo900, distribution, 
    totalGrowth, totalDecline, bestGrowth, worstDecline 
  } = stats;

  const backupMeta = settings?.find(s => s.key === "backupMeta")?.value;
  let showBackupWarning = false;
  if (!dismissedWarning && settings) {
    if (!backupMeta?.lastBackupDate) {
      showBackupWarning = true;
    } else {
      const daysSince = (Date.now() - new Date(backupMeta.lastBackupDate).getTime()) / 86400000;
      if (daysSince > 14) showBackupWarning = true;
    }
  }

  if (!accounts || !coinLogs) {
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
    <div className="max-w-7xl mx-auto pb-12 space-y-8">
      <HeroHeader 
        title="Executive Dashboard"
        description="Vue d'ensemble financière et suivi du patrimoine."
        stats={[
          { label: "Accounts", value: totalAccounts, trend: "+12%", trendType: "positive" },
          { label: "Coins", value: totalCoins }
        ]}
      />

      {showBackupWarning && (
        <div className="pro-card p-4 bg-warn/10 border-warn/20 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <svg className="w-6 h-6 text-warn" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
            <div>
              <p className="text-sm font-bold text-warn">Sauvegarde Recommandée</p>
              <p className="text-xs text-textdim mt-0.5">Aucune sauvegarde récente trouvée (&gt;14 jours). Protégez vos données.</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/settings/data-management" className="btn-secondary text-xs">Aller au Centre de Sauvegarde</Link>
            <button onClick={() => setDismissedWarning(true)} className="p-2 text-textdim hover:text-white transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
        </div>
      )}

      {/* Row 1: Core Financials */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Coins" value={totalCoins.toLocaleString()} sub={`${totalAccounts} comptes actifs`} />
        <StatCard label="Moyenne par Compte" value={averageCoins.toLocaleString()} sub="Coins / compte" />
        <StatCard label="Croissance Globale" value={`+${totalGrowth.toLocaleString()}`} valueColor="text-accent" sub="Total des gains historiques" />
        <StatCard label="Pertes Globales" value={`-${totalDecline.toLocaleString()}`} valueColor="text-red-400" sub="Total des dépenses/pertes" />
      </div>

      {/* Row 2: Bilan Comparison Upgrade */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Comptes Prêts (≥900)" value={above900} sub={`${Math.round((above900/totalAccounts)*100)}% du portfolio`} valueColor="text-accent" />
        <StatCard label="Comptes à Risque (<900)" value={below900} sub={`${Math.round((below900/totalAccounts)*100)}% du portfolio`} valueColor="text-warn" />
        <StatCard label="Meilleure Croissance" value={`+${bestGrowth.diff}`} sub={bestGrowth.name} valueColor="text-accent" />
        <StatCard label="Pire Déclin" value={`${worstDecline.diff}`} sub={worstDecline.name} valueColor="text-red-400" />
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

      {/* ═══════════════════════════════════════════════════════
          FEATURE 9: GOAL COMMAND CENTER
          ═══════════════════════════════════════════════════════ */}
      <div className="pro-card bg-gradient-to-br from-panel to-ink p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <svg className="w-5 h-5 text-warn" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            Accounts Close To Goal
          </h2>
          <button
            onClick={() => setShowGoalRadar(!showGoalRadar)}
            className="btn-secondary text-xs flex items-center gap-1.5"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /></svg>
            {showGoalRadar ? 'Close Radar' : 'Open Goal Radar'}
          </button>
        </div>

        {(() => {
          const closeToGoal = [...accounts]
            .filter(a => a.currentCoins < 900)
            .map(a => ({ ...a, distance: 900 - a.currentCoins }))
            .sort((a, b) => a.distance - b.distance)
            .slice(0, 6);

          if (closeToGoal.length === 0) {
            return (
              <p className="text-sm text-textdim py-4 text-center border border-dashed border-border rounded-xl">
                All accounts have reached the 900 goal! 🎉
              </p>
            );
          }

          return (
            <div className="space-y-2">
              {closeToGoal.map(acc => {
                const pct = Math.round((acc.currentCoins / 900) * 100);
                return (
                  <div key={acc.id} className="flex items-center gap-3 p-3 rounded-xl bg-ink border border-white/5 hover:border-white/10 transition-colors">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-bold text-white truncate">{acc.name}</span>
                        <span className="text-sm font-bold text-warn">{acc.distance} <span className="text-[10px] text-textdim font-normal">coins left</span></span>
                      </div>
                      <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-warn to-accent rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                    <span className="text-xs font-mono text-textdim shrink-0">{pct}%</span>
                  </div>
                );
              })}
            </div>
          );
        })()}
      </div>

      {/* Goal Radar (toggled by button) */}
      {showGoalRadar && (
        <GoalRadar accounts={accounts} coinLogs={coinLogs} />
      )}
    </div>
  );
}

function TierWidget({ title, count, total, color }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="bg-background p-3 rounded-lg border border-border flex flex-col justify-between">
      <p className="text-[10px] text-textdim font-bold tracking-wider mb-1 uppercase">{title}</p>
      <div className="flex items-end gap-2">
        <span className={`text-2xl font-black ${color}`}>{count}</span>
        <span className="text-xs text-textdim mb-1 opacity-60">({pct}%)</span>
      </div>
    </div>
  );
}
