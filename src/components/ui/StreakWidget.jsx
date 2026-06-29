import React from 'react';

export default function StreakWidget({ streakDays }) {
  // Gamification levels based on streak
  let flameColor = "text-gray-500";
  let glowColor = "shadow-none";
  let title = "Débutant";
  
  if (streakDays > 0) {
    flameColor = "text-orange-400";
    title = "En bonne voie";
  }
  if (streakDays >= 3) {
    flameColor = "text-orange-500";
    glowColor = "shadow-[0_0_15px_rgba(249,115,22,0.3)]";
    title = "Série Chaude";
  }
  if (streakDays >= 7) {
    flameColor = "text-red-500";
    glowColor = "shadow-[0_0_20px_rgba(239,68,68,0.5)]";
    title = "Intouchable";
  }
  if (streakDays >= 14) {
    flameColor = "text-purple-500";
    glowColor = "shadow-[0_0_25px_rgba(168,85,247,0.6)]";
    title = "Maître Zen";
  }
  if (streakDays >= 30) {
    flameColor = "text-blue-400";
    glowColor = "shadow-[0_0_30px_rgba(96,165,250,0.8)]";
    title = "Légende de Fer";
  }

  return (
    <div className={`pro-card bg-surface p-4 flex items-center justify-between transition-all duration-500 ${glowColor}`}>
      <div className="flex items-center gap-4">
        <div className={`p-3 rounded-full bg-white/5 ${flameColor} animate-pulse-slow`}>
          <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
            <path d="M17.5 12.5c0 2.5-1.5 4.5-3.5 5.5v-1.5c1.5-.5 2.5-2 2.5-4 0-1.5-1-3-2.5-3.5 0 2-1.5 3.5-3.5 3.5s-3.5-1.5-3.5-3.5c-1.5.5-2.5 2-2.5 3.5 0 2 1 3.5 2.5 4v1.5c-2-1-3.5-3-3.5-5.5 0-3 2.5-5.5 5.5-6.5v2.5c2 0 3.5 1.5 3.5 3.5 0-2 1.5-3.5 3.5-3.5v-2.5c3 1 5.5 3.5 5.5 6.5z" />
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z" opacity=".2" />
            <path d="M12 4.5c-1.5 0-3 1-3.5 2.5h1.5c.5-.5 1-1 2-1s1.5.5 2 1h1.5c-.5-1.5-2-2.5-3.5-2.5z" />
          </svg>
        </div>
        <div>
          <p className="text-sm text-gray-400 font-medium">Mental Coach</p>
          <h3 className="text-xl font-bold text-white tracking-wide">{title}</h3>
        </div>
      </div>
      <div className="text-right">
        <div className="text-3xl font-black text-white">{streakDays}</div>
        <p className="text-xs text-gray-400 uppercase tracking-widest mt-1">Jours Sans Spin</p>
      </div>
    </div>
  );
}
