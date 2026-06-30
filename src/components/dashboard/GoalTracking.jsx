import React from "react";
import { getNextGoal } from "../../utils/goalEngine.js";

export default function GoalTracking({ sortedAccounts }) {
  return (
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
  );
}
