import { useLiveQuery } from "dexie-react-hooks";
import { Link } from "react-router-dom";
import { db } from "../db.js";
import { progressPercent } from "../accountActions.js";
import { classifyImpulseRisk, getPendingRegrets, logRegret } from "../spinActions.js";
import { getGlobalDisciplineScore } from "../scoreActions.js";

export default function Dashboard() {
  const accounts = useLiveQuery(() => db.accounts.toArray(), []);
  const spinLogs = useLiveQuery(() => db.spinLogs.toArray(), []);
  const coinLogs = useLiveQuery(() => db.coinLogs.toArray(), []);
  const pendingRegrets = useLiveQuery(() => getPendingRegrets(), []);
  const disciplineScoreData = useLiveQuery(() => getGlobalDisciplineScore(), []) || { score: 100, isEvaluating: true };

  if (!accounts || !spinLogs || !coinLogs) {
    return (
      <div className="flex h-[70vh] items-center justify-center">
        <div className="w-8 h-8 border-2 border-white/10 border-t-white rounded-full animate-spin"></div>
      </div>
    );
  }

  if (accounts.length === 0) {
    return <DashboardEmptyState />;
  }

  // --- Real Metrics Calculations ---

  // 1. Discipline Score
  const disciplineScoreText = disciplineScoreData.isEvaluating ? "En évaluation" : `${disciplineScoreData.score}/100`;
  const dsColor = disciplineScoreData.isEvaluating ? "text-white" : disciplineScoreData.score >= 80 ? "text-accent" : disciplineScoreData.score >= 50 ? "text-warn" : "text-danger";

  // 2. Emotional Status
  const recentSpins = [...spinLogs].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 10);
  const emotionCounts = recentSpins.reduce((acc, spin) => {
    if(spin.emotionBefore) acc[spin.emotionBefore] = (acc[spin.emotionBefore] || 0) + 1;
    return acc;
  }, {});
  const topEmotion = Object.entries(emotionCounts).sort((a,b)=>b[1]-a[1])[0]?.[0] || "Neutre";

  // 3. Accounts Approaching 900
  const accountsApproaching900 = accounts.filter(a => a.currentCoins >= 750 && a.currentCoins < 900);

  // 4. Total Coins
  const totalCoins = accounts.reduce((s, a) => s + a.currentCoins, 0);
  const totalTarget = accounts.reduce((s, a) => s + a.targetCoins, 0);

  // 5. Weekly Spending
  const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString();
  const weeklySpends = spinLogs.filter(s => (s.createdAt && s.createdAt >= sevenDaysAgo) || s.date >= sevenDaysAgo.slice(0,10));
  const weeklySpending = weeklySpends.reduce((s, spin) => s + spin.coinsSpent, 0);

  // 6. Weekly Savings
  const weeklyAdds = coinLogs.filter(c => c.action === "ADD" && c.date >= sevenDaysAgo.slice(0,10));
  const weeklySavings = weeklyAdds.reduce((s, log) => s + log.amount, 0);

  // 7. Behavioral Summary
  const impulsiveCount = spinLogs.filter(s => classifyImpulseRisk(s) !== "Rational").length;
  const rationalCount = spinLogs.length - impulsiveCount;
  const behaviorText = spinLogs.length === 0 ? "Aucun historique" : impulsiveCount > rationalCount ? "Risque Impulsif" : "Majeurement Rationnel";

  // 8. Progress Overview
  const overallProgress = totalTarget > 0 ? Math.min(100, Math.round((totalCoins / totalTarget) * 100)) : 0;

  // 9. Recent Activity
  const recentActivity = [...spinLogs].sort((a,b) => b.id - a.id).slice(0, 4);

  // 10. Risk Indicators
  const riskLevel = (accountsApproaching900.length > 0 && impulsiveCount > 0) ? "Élevé" : accountsApproaching900.length > 0 ? "Modéré" : "Faible";

  // 11. Top Account
  const topAccount = accounts.length > 0 ? [...accounts].sort((a,b) => b.currentCoins - a.currentCoins)[0] : null;

  // 12. Trend Analysis
  const fourteenDaysAgo = new Date(Date.now() - 14 * 86400000).toISOString();
  const lastWeekSpends = spinLogs.filter(s => {
    const isAfter14 = (s.createdAt && s.createdAt >= fourteenDaysAgo) || s.date >= fourteenDaysAgo.slice(0,10);
    const isBefore7 = (s.createdAt && s.createdAt < sevenDaysAgo) || s.date < sevenDaysAgo.slice(0,10);
    return isAfter14 && isBefore7;
  });
  const lastWeekSpending = lastWeekSpends.reduce((s, spin) => s + spin.coinsSpent, 0);
  const trendDiff = weeklySpending - lastWeekSpending;
  const trendText = trendDiff > 0 ? `+${trendDiff} vs semaine préc.` : trendDiff < 0 ? `${trendDiff} vs semaine préc.` : "Stable vs semaine préc.";
  const trendColor = trendDiff > 0 ? "text-danger" : trendDiff < 0 ? "text-accent" : "text-textdim";

  return (
    <div className="max-w-7xl mx-auto pb-12 animate-in fade-in duration-500">
      <header className="mb-10">
        <h1 className="text-3xl font-bold text-white tracking-tight">Executive Dashboard</h1>
        <p className="text-sm text-textdim mt-1">Vue d'ensemble analytique et comportementale.</p>
      </header>

      {/* Regrets Alert */}
      {pendingRegrets && pendingRegrets.length > 0 && (
        <div className="mb-8">
          <div className="pro-card border-warn/30 bg-warn/5">
            <h2 className="pro-heading text-warn mb-4">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              Évaluation en attente
            </h2>
            <div className="grid gap-3">
              {pendingRegrets.map(spin => (
                <div key={spin.id} className="bg-ink p-4 rounded-lg border border-white/5 flex flex-col md:flex-row items-center justify-between gap-4">
                  <div>
                    <p className="text-white font-medium flex items-center gap-2">
                      {spin.packName} 
                      <span className="text-[10px] bg-danger/10 text-danger px-1.5 py-0.5 rounded font-mono border border-danger/20">-{spin.coinsSpent}</span>
                    </p>
                    <p className="text-xs text-textdim mt-1">Satisfaction: {spin.satisfactionScore !== undefined ? spin.satisfactionScore : "—"}/10</p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button onClick={() => logRegret(spin.id, true)} className="btn-base bg-danger/10 text-danger hover:bg-danger hover:text-white transition-colors">
                      Je regrette
                    </button>
                    <button onClick={() => logRegret(spin.id, false)} className="btn-base bg-white/5 text-white hover:bg-white hover:text-ink transition-colors">
                      Valable
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Row 1: Core KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-4">
        <ProCard title="Discipline Score" value={disciplineScoreText} sub={disciplineScoreData.isEvaluating ? "3 spins requis" : "Sur les 30 derniers jours"} color={dsColor} />
        <ProCard title="Total Coins" value={totalCoins.toLocaleString()} sub={`Progression: ${overallProgress}% de l'objectif global`} />
        <ProCard title="Dépenses Hebdo" value={`-${weeklySpending}`} sub={trendText} subColor={trendColor} color={weeklySpending > 0 ? "text-danger" : "text-white"} />
        <ProCard title="Épargne Hebdo" value={`+${weeklySavings}`} sub="Coins ajoutés sur 7 jours" color="text-accent" />
      </div>

      {/* Row 2: Behavioral KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        <ProCard title="Status Émotionnel" value={topEmotion} sub="Émotion dominante (10 derniers spins)" />
        <ProCard title="Profil Comportemental" value={behaviorText} sub={`${rationalCount} Rationnels / ${impulsiveCount} Impulsifs`} color={impulsiveCount > rationalCount ? "text-warn" : "text-white"} />
        <ProCard title="Risque Global" value={riskLevel} sub="Croisement solde / impulsivité" color={riskLevel === "Élevé" ? "text-danger" : riskLevel === "Modéré" ? "text-warn" : "text-accent"} />
        <ProCard title="Top Compte" value={topAccount ? topAccount.currentCoins.toLocaleString() : "0"} sub={topAccount ? topAccount.name : "Aucun"} color="text-white" />
      </div>

      {/* Row 3: Lists & Deep Dives */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        
        {/* Approaching 900 */}
        <div className="pro-card">
          <h2 className="pro-heading mb-6">
            <div className="w-2 h-2 rounded-full bg-warn"></div> Focus Seuil 900
          </h2>
          <div className="flex-1 overflow-y-auto pr-2 space-y-4">
            {accountsApproaching900.length > 0 ? (
              accountsApproaching900.sort((a, b) => b.currentCoins - a.currentCoins).map((acc) => {
                const pct = progressPercent(acc);
                const missing = 900 - acc.currentCoins;
                return (
                  <div key={acc.id} className="group">
                    <div className="flex justify-between items-end mb-1.5">
                      <span className="text-sm font-medium text-white">{acc.name}</span>
                      <span className="text-xs font-medium text-warn">{missing} manquants</span>
                    </div>
                    <div className="progress-track bg-ink">
                      <div className="progress-fill bg-warn" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="h-full flex items-center justify-center">
                <p className="text-sm text-textdim">Aucun compte dans la zone critique (750-899).</p>
              </div>
            )}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="pro-card">
          <h2 className="pro-heading mb-6">
            <div className="w-2 h-2 rounded-full bg-white"></div> Activité Récente
          </h2>
          <div className="flex-1 overflow-y-auto pr-2 space-y-3">
            {recentActivity.length > 0 ? (
              recentActivity.map(spin => {
                const risk = classifyImpulseRisk(spin);
                return (
                  <div key={spin.id} className="flex items-center justify-between p-3 rounded-lg bg-ink border border-white/5 hover:border-white/10 transition-colors">
                    <div>
                      <p className="text-sm font-medium text-white">{spin.packName}</p>
                      <p className="text-xs text-textdim mt-0.5">{spin.date} • {risk}</p>
                    </div>
                    <span className="text-sm font-mono text-danger font-bold">-{spin.coinsSpent}</span>
                  </div>
                );
              })
            ) : (
              <div className="h-full flex items-center justify-center">
                <p className="text-sm text-textdim">Aucun historique de spin.</p>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

// --- Premium Components ---

function ProCard({ title, value, sub, color = "text-white", subColor = "text-textdim" }) {
  return (
    <div className="pro-card justify-between gap-6">
      <p className="text-[10px] font-semibold text-textdim uppercase tracking-widest">{title}</p>
      <div>
        <p className={`text-3xl font-black tracking-tight mb-1 truncate ${color}`}>{value}</p>
        <p className={`text-xs font-medium truncate ${subColor}`}>{sub}</p>
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
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
        <h1 className="text-4xl font-black text-white tracking-tight mb-4">Bienvenue sur Coin Manager Pro</h1>
        <p className="text-lg text-textdim max-w-2xl mx-auto leading-relaxed">
          Reprenez le contrôle de votre économie eFootball. Analysez vos tirages, maîtrisez vos impulsions et atteignez vos objectifs avec notre Mental Coach intégré.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
        <div className="bg-ink border border-white/5 rounded-2xl p-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full blur-2xl -mr-8 -mt-8 transition-transform group-hover:scale-150"></div>
          <svg className="w-8 h-8 text-white mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          <h3 className="text-white font-bold mb-2">Suivi des Coins</h3>
          <p className="text-sm text-textdim">Gérez vos économies et surveillez vos dépenses de près sur de multiples comptes.</p>
        </div>
        <div className="bg-ink border border-white/5 rounded-2xl p-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-warn/10 rounded-full blur-2xl -mr-8 -mt-8 transition-transform group-hover:scale-150"></div>
          <svg className="w-8 h-8 text-warn mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
          <h3 className="text-white font-bold mb-2">Mental Coach</h3>
          <p className="text-sm text-textdim">Notre algorithme classifie vos risques d'impulsivité et bloque préventivement les actions FOMO.</p>
        </div>
        <div className="bg-ink border border-white/5 rounded-2xl p-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-accent/10 rounded-full blur-2xl -mr-8 -mt-8 transition-transform group-hover:scale-150"></div>
          <svg className="w-8 h-8 text-accent mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
          <h3 className="text-white font-bold mb-2">Journal Émotionnel</h3>
          <p className="text-sm text-textdim">Découvrez quelles émotions déclenchent vos pires spins et optimisez votre satisfaction.</p>
        </div>
      </div>

      <div className="flex justify-center">
        <Link to="/accounts" className="btn-primary px-10 py-4 rounded-xl text-base tracking-wide flex items-center gap-3 shadow-[0_0_30px_rgba(255,255,255,0.2)] hover:shadow-[0_0_40px_rgba(255,255,255,0.4)] transition-all">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
          Connecter le premier compte
        </Link>
      </div>
    </div>
  );
}
