import { useState, useEffect, useMemo } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../db.js";
import { getDisciplineScore } from "../scoreActions.js";
import HeroHeader from "../components/ui/HeroHeader.jsx";
import EmptyState from "../components/ui/EmptyState.jsx";

const ACHIEVEMENT_DEFS = [
  {
    id: "goal_hunter",
    title: "Goal Hunter",
    description: "Premier compte ayant atteint 900 coins.",
    icon: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z",
    category: "Objectif"
  },
  {
    id: "elite_collector",
    title: "Elite Collector",
    description: "3 comptes ou plus ayant atteint 900 coins.",
    icon: "M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z",
    category: "Objectif"
  },
  {
    id: "consistency_master",
    title: "Consistency Master",
    description: "7 jours consécutifs de progression positive.",
    icon: "M13 7h8m0 0v8m0-8l-8 8-4-4-6 6",
    category: "Discipline"
  },
  {
    id: "discipline_master",
    title: "Discipline Master",
    description: "Score de discipline ≥ 90 sur au moins un compte.",
    icon: "M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z",
    category: "Discipline"
  },
  {
    id: "comeback",
    title: "Comeback",
    description: "Un compte est remonté au-dessus de 900 après être tombé sous 500.",
    icon: "M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15",
    category: "Résilience"
  },
  {
    id: "marathon_builder",
    title: "Marathon Builder",
    description: "Un compte suivi depuis plus de 30 jours.",
    icon: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z",
    category: "Endurance"
  }
];

function computeAchievements(accounts, coinLogs, disciplineScores) {
  const results = [];

  // Goal Hunter: first account >= 900
  const goalHunter = accounts.some(a => a.currentCoins >= 900);
  let goalHunterDate = null;
  if (goalHunter && coinLogs.length > 0) {
    const log = coinLogs
      .filter(l => l.newBalance >= 900)
      .sort((a, b) => new Date(a.date) - new Date(b.date))[0];
    if (log) goalHunterDate = log.date;
  }
  results.push({ ...ACHIEVEMENT_DEFS[0], unlocked: goalHunter, date: goalHunterDate });

  // Elite Collector: 3+ accounts >= 900
  const eliteCount = accounts.filter(a => a.currentCoins >= 900).length;
  results.push({ ...ACHIEVEMENT_DEFS[1], unlocked: eliteCount >= 3, date: null });

  // Consistency Master: 7 consecutive days of positive progression
  let consistencyUnlocked = false;
  if (coinLogs.length > 0) {
    const byDate = {};
    coinLogs.forEach(l => {
      if (!byDate[l.date]) byDate[l.date] = 0;
      byDate[l.date] += (l.newBalance - l.previousBalance);
    });
    const sortedDates = Object.keys(byDate).sort();
    let streak = 0;
    let maxStreak = 0;
    for (let i = 0; i < sortedDates.length; i++) {
      if (byDate[sortedDates[i]] > 0) {
        streak++;
        maxStreak = Math.max(maxStreak, streak);
      } else {
        streak = 0;
      }
    }
    consistencyUnlocked = maxStreak >= 7;
  }
  results.push({ ...ACHIEVEMENT_DEFS[2], unlocked: consistencyUnlocked, date: null });

  // Discipline Master: any account with score >= 90
  const disciplineMaster = disciplineScores.some(ds => ds.score >= 90 && !ds.isEvaluating);
  results.push({ ...ACHIEVEMENT_DEFS[3], unlocked: disciplineMaster, date: null });

  // Comeback: account went below 500 then back above 900
  let comebackUnlocked = false;
  if (coinLogs.length > 0) {
    const accountIds = [...new Set(coinLogs.map(l => l.accountId))];
    for (const accId of accountIds) {
      const logs = coinLogs
        .filter(l => l.accountId === accId)
        .sort((a, b) => new Date(a.date) - new Date(b.date));
      let wentBelow500 = false;
      let cameBackAbove900 = false;
      for (const log of logs) {
        if (log.newBalance < 500) wentBelow500 = true;
        if (wentBelow500 && log.newBalance >= 900) {
          cameBackAbove900 = true;
          break;
        }
      }
      if (cameBackAbove900) {
        comebackUnlocked = true;
        break;
      }
    }
  }
  results.push({ ...ACHIEVEMENT_DEFS[4], unlocked: comebackUnlocked, date: null });

  // Marathon Builder: any account tracked for 30+ days
  const now = Date.now();
  const marathonUnlocked = accounts.some(a => {
    if (!a.createdAt) return false;
    const created = new Date(a.createdAt).getTime();
    return (now - created) >= 30 * 86400000;
  });
  results.push({ ...ACHIEVEMENT_DEFS[5], unlocked: marathonUnlocked, date: null });

  return results;
}

export default function Achievements() {
  const accounts = useLiveQuery(() => db.accounts.toArray(), []);
  const [coinLogs, setCoinLogs] = useState(null);

  useEffect(() => {
    db.coinLogs.toArray().then(setCoinLogs);
  }, []);
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
