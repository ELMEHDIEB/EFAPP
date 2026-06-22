import React, { useMemo } from 'react';
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../db.js";
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Legend, Cell
} from 'recharts';
import { classifyImpulseRisk } from "../spinActions.js";

export default function Analytics() {
  const spinLogs = useLiveQuery(() => db.spinLogs.toArray(), []);

  const { trendData, emotionData, totalSpent } = useMemo(() => {
    if (!spinLogs || spinLogs.length === 0) return { trendData: [], emotionData: [], totalSpent: 0 };

    // Total Spent
    const totalSpent = spinLogs.reduce((acc, log) => acc + log.coinsSpent, 0);

    // Group by Date for Trend
    const byDate = spinLogs.reduce((acc, log) => {
      const date = log.date;
      if (!acc[date]) acc[date] = { date, spent: 0, rational: 0, impulsive: 0 };
      acc[date].spent += log.coinsSpent;
      const risk = classifyImpulseRisk(log);
      if (risk === "Rational") acc[date].rational += log.coinsSpent;
      else acc[date].impulsive += log.coinsSpent;
      return acc;
    }, {});

    const trendData = Object.values(byDate).sort((a, b) => new Date(a.date) - new Date(b.date)).slice(-14);

    // Group by Emotion
    const byEmotion = spinLogs.reduce((acc, log) => {
      if (!log.emotionBefore) return acc;
      if (!acc[log.emotionBefore]) acc[log.emotionBefore] = { name: log.emotionBefore, count: 0 };
      acc[log.emotionBefore].count += 1;
      return acc;
    }, {});

    const emotionData = Object.values(byEmotion).sort((a, b) => b.count - a.count);

    return { trendData, emotionData, totalSpent };
  }, [spinLogs]);

  if (!spinLogs) {
    return (
      <div className="flex h-[70vh] items-center justify-center">
        <div className="w-8 h-8 border-2 border-white/10 border-t-white rounded-full animate-spin"></div>
      </div>
    );
  }

  if (spinLogs.length === 0) {
    return (
      <div className="max-w-4xl mx-auto pb-12 animate-in fade-in">
        <div className="flex flex-col items-center justify-center py-32 text-center">
          <div className="w-20 h-20 mb-6 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center">
            <svg className="w-10 h-10 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight mb-2">Aucune donnée analytique</h2>
          <p className="text-base text-textdim max-w-md mx-auto">
            Commencez à enregistrer vos tirages (spins) pour générer des graphiques comportementaux et de dépense.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto pb-12 animate-in fade-in duration-500">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white tracking-tight">Analytics Profiling</h1>
        <p className="text-sm text-textdim mt-1">Analyse comportementale et tendances de dépenses sur vos {spinLogs.length} derniers tirages.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Main Chart */}
        <div className="lg:col-span-2 pro-card p-6 h-[400px] flex flex-col">
          <h2 className="pro-heading mb-6">Tendance des Dépenses (14 derniers jours)</h2>
          <div className="flex-1 w-full h-full min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorSpent" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ffffff" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#ffffff" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff" strokeOpacity={0.05} vertical={false} />
                <XAxis dataKey="date" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={val => `${val}`} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0a0a0a', borderColor: '#ffffff20', borderRadius: '12px', color: '#fff' }}
                  itemStyle={{ color: '#fff' }}
                />
                <Area type="monotone" dataKey="spent" name="Coins Dépensés" stroke="#ffffff" strokeWidth={2} fillOpacity={1} fill="url(#colorSpent)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Emotion Chart */}
        <div className="pro-card p-6 h-[400px] flex flex-col">
          <h2 className="pro-heading mb-6">Déclencheurs Émotionnels</h2>
          <div className="flex-1 w-full h-full min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={emotionData} layout="vertical" margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff" strokeOpacity={0.05} horizontal={true} vertical={false} />
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} width={80} />
                <Tooltip 
                  cursor={{fill: '#ffffff05'}}
                  contentStyle={{ backgroundColor: '#0a0a0a', borderColor: '#ffffff20', borderRadius: '12px', color: '#fff' }}
                />
                <Bar dataKey="count" name="Fréquence" radius={[0, 4, 4, 0]}>
                  {emotionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index === 0 ? '#ef4444' : '#ffffff40'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
