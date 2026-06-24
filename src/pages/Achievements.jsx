import { useState, useEffect, useMemo } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../db.js";
import { getDisciplineScore } from "../scoreActions.js";
import { computeAchievements } from "../utils/achievementEngine.js";
import HeroHeader from "../components/ui/HeroHeader.jsx";
import EmptyState from "../components/ui/EmptyState.jsx";


export default function Achievements() {
  const accounts = useLiveQuery(() => db.accounts.toArray(), []);
  const coinLogs = useLiveQuery(() => db.coinLogs.toArray(), []);
  const [disciplineScores, setDisciplineScores] = useState([]);

  useEffect(() => {
    if (!accounts || accounts.length === 0) return;
    let cancelled = false;
    async function loadScores() {
      const scores = [];
      for (const acc of accounts) {
        const result = await getDisciplineScore(acc.id);
        scores.push(result);
      }
      if (!cancelled) setDisciplineScores(scores);
    }
    loadScores();
    return () => { cancelled = true; };
  }, [accounts]);

  const achievements = useMemo(() => {
    if (!accounts || !coinLogs) return [];
    return computeAchievements(accounts, coinLogs, disciplineScores);
  }, [accounts, coinLogs, disciplineScores]);

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
        title="Aucun compte"
        description="Créez des comptes pour commencer à débloquer des achievements."
      />
    );
  }

  const unlocked = achievements.filter(a => a.unlocked).length;
  const total = achievements.length;
  const progressPct = total > 0 ? Math.round((unlocked / total) * 100) : 0;

  return (
    <div className="max-w-4xl mx-auto pb-12 space-y-8">
      <HeroHeader 
        title="Achievements"
        description="Débloquez des récompenses en atteignant vos objectifs."
      />

      {/* Progress Overview */}
      <div className="pro-card p-6 bg-gradient-to-br from-panel to-ink border-accent/20">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-xs font-bold text-accent uppercase tracking-widest mb-1">Progression Totale</p>
            <p className="text-4xl font-black text-white">{unlocked}<span className="text-textdim text-lg font-medium">/{total}</span></p>
          </div>
          <div className="text-right">
            <p className={`text-3xl font-black ${progressPct >= 100 ? 'text-accent' : 'text-white'}`}>{progressPct}%</p>
            <p className="text-xs text-textdim">complété</p>
          </div>
        </div>
        <div className="h-3 bg-ink rounded-full overflow-hidden">
          <div
            className="h-full rounded-full bg-accent transition-all duration-700"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      {/* Achievement Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {achievements.map(ach => (
          <div
            key={ach.id}
            className={`pro-card p-5 flex items-start gap-4 transition-all duration-300 ${
              ach.unlocked
                ? 'border-accent/20 bg-gradient-to-br from-accent/5 to-transparent'
                : 'opacity-60 grayscale'
            }`}
          >
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
              ach.unlocked ? 'bg-accent/15' : 'bg-white/5'
            }`}>
              <svg
                className={`w-6 h-6 ${ach.unlocked ? 'text-accent' : 'text-textdim'}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d={ach.icon} />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className={`text-sm font-bold ${ach.unlocked ? 'text-white' : 'text-textdim'}`}>{ach.title}</h3>
                <span className={`text-[9px] uppercase tracking-widest font-bold px-1.5 py-0.5 rounded ${
                  ach.unlocked ? 'bg-accent/10 text-accent border border-accent/20' : 'bg-white/5 text-textdim border border-white/10'
                }`}>
                  {ach.unlocked ? "Débloqué" : "Verrouillé"}
                </span>
              </div>
              <p className="text-xs text-textdim leading-relaxed">{ach.description}</p>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-[10px] uppercase tracking-widest text-textdim font-semibold">{ach.category}</span>
                {ach.date && (
                  <span className="text-[10px] text-textdim font-mono">• {ach.date}</span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
