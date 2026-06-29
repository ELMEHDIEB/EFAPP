import { useMemo } from "react";

export function getPriorityLevel(distance) {
  if (distance <= 100) return { label: "Critical", color: "text-accent bg-accent/10 border-accent/20" };
  if (distance <= 250) return { label: "High", color: "text-warn bg-warn/10 border-warn/20" };
  if (distance <= 500) return { label: "Medium", color: "text-blue-400 bg-blue-400/10 border-blue-400/20" };
  return { label: "Low", color: "text-textdim bg-white/5 border-white/10" };
}

export default function GoalRadar({ accounts, coinLogs }) {
  const radarData = useMemo(() => {
    if (!accounts || accounts.length === 0) return [];

    const now = Date.now();
    const sevenDaysAgo = new Date(now - 7 * 86400000).toISOString().slice(0, 10);

    return accounts
      .filter(a => a.currentCoins < 900)
      .map(acc => {
        const distance = 900 - acc.currentCoins;
        const progress = Math.round((acc.currentCoins / 900) * 100);
        const priority = getPriorityLevel(distance);
        
        // Time estimation based on weekly velocity
        const recentLogs = coinLogs ? coinLogs.filter(l => l.accountId === acc.id && l.date >= sevenDaysAgo) : [];
        const weeklyVelocity = recentLogs.reduce((sum, l) => sum + (l.newBalance - l.previousBalance), 0);
        
        let estWeeks = -1;
        if (weeklyVelocity > 0) {
          estWeeks = Math.ceil(distance / weeklyVelocity);
        }

        return { ...acc, distance, progress, priority, estWeeks };
      })
      .sort((a, b) => a.distance - b.distance);
  }, [accounts, coinLogs]);

  if (radarData.length === 0) {
    return null;
  }

  return (
    <div className="pro-card p-6 bg-gradient-to-br from-panel to-ink">
      <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
        <svg className="w-5 h-5 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
        Goal Radar
      </h2>
      <div className="space-y-3">
        {radarData.map(acc => (
          <div key={acc.id} className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-xl border border-white/5 bg-ink">
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider border ${acc.priority.color}`}>
                {acc.priority.label}
              </div>
              <span className="font-bold text-white">{acc.name}</span>
            </div>
            
            <div className="flex items-center gap-6 w-full sm:w-auto justify-between sm:justify-end">
              <div className="text-right">
                <p className="text-sm font-bold text-warn">{acc.distance} <span className="text-[10px] text-textdim font-normal">restants</span></p>
                <div className="w-24 h-1.5 bg-white/5 rounded-full mt-1 overflow-hidden">
                  <div className="h-full bg-warn" style={{ width: `${acc.progress}%` }}></div>
                </div>
              </div>
              <div className="text-right min-w-[80px]">
                <p className="text-[10px] text-textdim uppercase tracking-wider font-bold">ETA</p>
                <p className="text-sm font-medium text-white">
                  {acc.estWeeks > 0 ? `${acc.estWeeks} sem.` : "—"}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
