import React from "react";

export const ProCard = React.memo(function ProCard({ title, value, sub, color = "text-white" }) {
  return (
    <div className="pro-card justify-between gap-4 p-5 bg-surface">
      <p className="text-xs font-bold text-textdim uppercase tracking-wider">{title}</p>
      <div>
        <p className={`text-3xl font-black tracking-tight mb-1 truncate ${color}`}>{value}</p>
        <p className="text-xs font-medium text-textdim truncate">{sub}</p>
      </div>
    </div>
  );
});
