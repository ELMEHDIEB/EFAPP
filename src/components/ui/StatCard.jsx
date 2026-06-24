import React from "react";

/**
 * Universal StatCard matching the Linear/Stripe design system.
 * Replaces InfoCard, MetricCard, and StatusCard.
 */
export default function StatCard({ 
  label, 
  value, 
  sub, 
  icon, 
  statusColor, 
  valueColor = "text-white",
  action,
  className = "" 
}) {
  return (
    <div className={`flex flex-col p-5 bg-surface border border-border rounded-xl transition-all duration-200 hover:border-white/10 hover:bg-surfaceElevated ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold tracking-wider text-textdim uppercase">
          {label}
        </span>
        {icon && (
          <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-textdim">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={icon} />
            </svg>
          </div>
        )}
      </div>

      <div className="flex items-center gap-3">
        {statusColor && <div className={`w-2.5 h-2.5 rounded-full ${statusColor}`} />}
        <span className={`text-2xl font-bold tracking-tight ${valueColor}`}>
          {value}
        </span>
      </div>

      {(sub || action) && (
        <div className="mt-4 flex items-center justify-between">
          {sub && <span className="text-sm font-medium text-textmuted">{sub}</span>}
          {action && <div className="ml-auto">{action}</div>}
        </div>
      )}
    </div>
  );
}
