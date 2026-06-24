/**
 * Shared Achievement Engine.
 * Extracted from Achievements.jsx so both the Achievements page
 * and the Settings Achievement Tracker can use the same logic.
 */

export const ACHIEVEMENT_DEFS = [
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

/**
 * Computes achievement unlock status from real data.
 * @param {Array} accounts
 * @param {Array} coinLogs
 * @param {Array} disciplineScores - array of { score, isEvaluating }
 * @returns {Array} achievements with unlocked status
 */
export function computeAchievements(accounts, coinLogs, disciplineScores) {
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
