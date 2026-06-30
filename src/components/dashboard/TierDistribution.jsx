import React from "react";

const TierWidget = React.memo(function TierWidget({ title, count, total, color }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="bg-background p-3 rounded-lg border border-border">
      <p className="text-[10px] text-textdim font-bold tracking-wider mb-1 uppercase">{title}</p>
      <div className="flex items-end gap-2">
        <span className={`text-2xl font-black ${color}`}>{count}</span>
        <span className="text-xs text-textdim mb-1 opacity-60">({pct}%)</span>
      </div>
    </div>
  );
});

export default function TierDistribution({ distribution, totalAccounts }) {
  return (
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
  );
}
