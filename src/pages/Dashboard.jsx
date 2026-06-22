import { useLiveQuery } from "dexie-react-hooks";
import { Link } from "react-router-dom";
import { db } from "../db.js";
import { progressPercent } from "../accountActions.js";
import { classifyImpulseRisk, getPendingRegrets, logRegret } from "../spinActions.js";
import { getGlobalDisciplineScore } from "../scoreActions.js";

export default function Dashboard() {
  const accounts = useLiveQuery(() => db.accounts.toArray(), []);
  const spinLogs = useLiveQuery(() => db.spinLogs.toArray(), []);
  const pendingRegrets = useLiveQuery(() => getPendingRegrets(), []);

  if (!accounts || !spinLogs) return <p className="text-textdim">Chargement…</p>;

  if (accounts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] text-center">
        <div className="w-16 h-16 bg-panel2 rounded-full flex items-center justify-center mb-4 border border-border shadow-card">
          <svg className="w-8 h-8 text-textdim" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
        </div>
        <h1 className="text-2xl font-semibold text-white mb-2 tracking-tight">Bienvenue sur Coin Manager Pro</h1>
        <p className="text-textdim max-w-md mb-8">
          Ajoutez votre premier compte pour débloquer le tableau de bord d'analyse comportementale.
        </p>
        <Link to="/accounts" className="btn-primary px-6 py-2.5">
          + Ajouter un compte
        </Link>
      </div>
    );
  }

  // 1. Discipline Score
  const disciplineScoreData = useLiveQuery(() => getGlobalDisciplineScore(), []) || { score: 100, isEvaluating: true };
  const disciplineScoreText = disciplineScoreData.isEvaluating ? "En évaluation" : `${disciplineScoreData.score}/100`;
  const scoreColor = disciplineScoreData.isEvaluating 
    ? "text-white" 
    : disciplineScoreData.score >= 80 
      ? "text-accent" 
      : disciplineScoreData.score >= 50 
        ? "text-warn" 
        : "text-danger";

  // 2. Comptes approchant 900
  const accountsApproaching900 = accounts.filter(a => a.currentCoins >= 750 && a.currentCoins < 900);

  // 3. Streak d'épargne en cours (jours sans spin impulsif)
  const impulsiveSpins = spinLogs.filter(s => classifyImpulseRisk(s) !== "Rational");
  const lastImpulsive = impulsiveSpins.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
  const streakDays = lastImpulsive 
    ? Math.floor((Date.now() - new Date(lastImpulsive.date).getTime()) / 86400000) 
    : "Aucun spin impulsif !";

  // 4. Coins préservés (Placeholder)
  const coinsPreserved = "0 (Placeholder)";

  // 5. Spins impulsifs évités (Placeholder)
  const avoidedImpulsiveSpins = "0 (Placeholder)";

  // 6. Total Coins
  const totalCoins = accounts.reduce((s, a) => s + a.currentCoins, 0);

  return (
    <div className="max-w-6xl mx-auto pb-12">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white tracking-tight">Dashboard Central</h1>
        <p className="text-sm text-textdim mt-1">Analyse comportementale et progression de vos comptes.</p>
      </div>

      {pendingRegrets && pendingRegrets.length > 0 && (
        <div className="mb-8 animate-in fade-in">
          <h2 className="text-sm font-semibold text-warn uppercase tracking-wider mb-4 flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            Évaluation des regrets en attente
          </h2>
          <div className="grid gap-3">
            {pendingRegrets.map(spin => (
              <div key={spin.id} className="bg-panel2 p-4 rounded-xl border border-warn/30 flex flex-col md:flex-row items-center justify-between gap-4">
                <div>
                  <p className="text-white font-medium flex items-center gap-2">
                    Tirage "{spin.packName}" 
                    <span className="text-xs bg-panel border border-border px-1.5 py-0.5 rounded text-danger">-{spin.coinsSpent} coins</span>
                  </p>
                  <p className="text-sm text-textdim mt-1">Le {spin.date} (Satisfaction: {spin.satisfactionScore}/10)</p>
                </div>
                <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0">
                  <span className="text-sm font-medium text-white">Regrettez-vous ce tirage ?</span>
                  <div className="flex gap-2">
                    <button onClick={() => logRegret(spin.id, true)} className="btn-base bg-panel hover:bg-danger/10 border border-danger/50 text-danger px-4 py-2">
                      Oui, je regrette
                    </button>
                    <button onClick={() => logRegret(spin.id, false)} className="btn-base bg-panel hover:bg-accent/10 border border-accent/50 text-accent px-4 py-2">
                      Non, ça valait le coup
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        
        {/* 1. Score de Discipline */}
        <div className="lg:col-span-2 card p-6 relative overflow-hidden flex flex-col justify-between shadow-[0_0_20px_rgba(16,185,129,0.05)] border-accent/20 bg-accent/5">
          <div className="absolute top-0 right-0 w-32 h-32 bg-accent/10 rounded-full blur-2xl -mr-10 -mt-10"></div>
          <div className="relative z-10">
            <p className="text-xs font-semibold text-textdim uppercase tracking-widest mb-2">Score de Discipline</p>
            <div className="flex items-baseline gap-2 mb-2">
              <span className={`text-3xl font-black tracking-tighter ${scoreColor}`}>{disciplineScoreText}</span>
            </div>
            <p className="text-sm text-textdim/90 leading-relaxed">
              {disciplineScoreData.isEvaluating 
                ? "Effectuez au moins 3 tirages pour obtenir votre première évaluation."
                : "Votre régularité et votre maîtrise de l'impulsivité sur les 30 derniers jours."}
            </p>
          </div>
        </div>

        {/* 3. Série (Streak) */}
        <StatCard label="Série d'Épargne" value={streakDays} subtext="Jours sans spin impulsif" color="text-white" />

        {/* 4. Coins Préservés */}
        <StatCard label="Coins Préservés" value={coinsPreserved} subtext="Grâce à la Protection 900" color="text-accent" />

        {/* 5. Spins Évités */}
        <StatCard label="Spins Impulsifs Évités" value={avoidedImpulsiveSpins} subtext="Tentations annulées" color="text-warn" />

        {/* 6. Total Coins */}
        <StatCard label="Total des Coins" value={totalCoins.toLocaleString()} subtext="Sur tous les comptes" color="text-white" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        
        {/* 2. Comptes approchant 900 */}
        <div className="card p-5 flex flex-col h-full">
          <h2 className="text-sm font-semibold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
             <div className="w-2 h-2 rounded-full bg-warn"></div> Comptes approchant 900
          </h2>
          <div className="flex-1 flex flex-col gap-4 overflow-y-auto pr-2">
            {accountsApproaching900.length > 0 ? (
              accountsApproaching900.sort((a, b) => b.currentCoins - a.currentCoins).map((acc) => {
                const pct = progressPercent(acc);
                const missing = 900 - acc.currentCoins;
                return (
                  <div key={acc.id} className="group">
                    <div className="flex justify-between items-end mb-1">
                      <span className="text-sm font-medium text-white">{acc.name}</span>
                      <span className="text-xs font-semibold text-warn">
                        Il manque {missing} coins
                      </span>
                    </div>
                    <div className="progress-track h-1.5">
                      <div
                        className="progress-fill"
                        style={{ width: `${pct}%`, backgroundColor: '#f59e0b' }}
                      />
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-sm text-textdim">Aucun compte à moins de 150 coins du seuil.</p>
            )}
          </div>
        </div>

        {/* Tous les comptes (Progression globale) */}
        <div className="card p-5 flex flex-col h-full">
          <h2 className="text-sm font-semibold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
             <div className="w-2 h-2 rounded-full bg-accent"></div> Progression des comptes
          </h2>
          <div className="flex-1 flex flex-col gap-4 overflow-y-auto pr-2">
            {accounts.sort((a, b) => b.currentCoins - a.currentCoins).slice(0, 5).map((acc) => {
              const pct = progressPercent(acc);
              const isReady = acc.currentCoins >= 900;
              return (
                <div key={acc.id} className="group">
                  <div className="flex justify-between items-end mb-1">
                    <span className="text-sm font-medium text-white">{acc.name}</span>
                    <span className={`text-xs font-semibold ${isReady ? 'text-accent' : 'text-textdim'}`}>
                      {acc.currentCoins.toLocaleString()} <span className="font-normal opacity-70">/ {acc.targetCoins}</span>
                    </span>
                  </div>
                  <div className="progress-track h-1.5">
                    <div
                      className={`progress-fill ${!isReady && 'opacity-70'}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
            {accounts.length > 5 && (
              <Link to="/accounts" className="text-xs text-textdim hover:text-white text-center pt-2">
                Voir tous les comptes →
              </Link>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

function StatCard({ label, value, subtext, color }) {
  return (
    <div className="card p-5 flex flex-col justify-between">
      <p className="text-xs font-semibold text-textdim uppercase tracking-widest mb-3">{label}</p>
      <div>
        <p className={`text-2xl font-bold tracking-tight mb-1 ${color}`}>{value}</p>
        <p className="text-xs font-medium text-textdim/80">{subtext}</p>
      </div>
    </div>
  );
}
