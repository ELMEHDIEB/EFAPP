import React from "react";
import { AreaChart, Area, Tooltip, ResponsiveContainer } from "recharts";

export default function PortfolioChart({ portfolioHistory, totalCoins }) {
  if (!portfolioHistory || portfolioHistory.length === 0) return null;

  return (
    <div className="pro-card p-6 bg-surface h-64 flex flex-col relative overflow-hidden group">
      <div className="absolute top-0 right-0 p-6 z-10 text-right pointer-events-none">
        <p className="text-xs font-bold text-textdim uppercase tracking-wider mb-1">Total Portfolio Value</p>
        <p className="text-4xl font-black text-white drop-shadow-lg">{totalCoins.toLocaleString()}</p>
      </div>
      <div className="flex-1 w-full h-full -mx-4 -mb-4">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={portfolioHistory}>
            <defs>
              <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <Tooltip 
              contentStyle={{ backgroundColor: '#0a0a0a', borderColor: '#ffffff20', borderRadius: '8px' }}
              itemStyle={{ color: '#3b82f6', fontWeight: 'bold' }}
            />
            <Area type="monotone" dataKey="total" name="Total Coins" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorTotal)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
