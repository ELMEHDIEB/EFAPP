import React from "react";
import { getNextGoal } from "../../utils/goalEngine.js";

export default function AccountRanking({ sortedAccounts }) {
  return (
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
  );
}
