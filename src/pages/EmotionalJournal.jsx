import { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../db.js";
import { classifyImpulseRisk } from "../spinActions.js";

export default function EmotionalJournal() {
  const spinLogs = useLiveQuery(() => db.spinLogs.reverse().toArray(), []);
  
  if (!spinLogs) return <p className="text-textdim">Chargement…</p>;

  // Basic analytics
  const emotionCounts = {};
  const impulsiveEmotionCounts = {};
  
  spinLogs.forEach(spin => {
    const emo = spin.emotionBefore;
    if (!emo) return;
    
    emotionCounts[emo] = (emotionCounts[emo] || 0) + 1;
    
    const risk = classifyImpulseRisk(spin);
    if (risk !== "Rational") {
      impulsiveEmotionCounts[emo] = (impulsiveEmotionCounts[emo] || 0) + 1;
    }
  });

  const getTopEmotion = (counts) => {
    return Object.entries(counts).sort((a,b) => b[1] - a[1])[0] || ["Aucune", 0];
  };

  const topOverall = getTopEmotion(emotionCounts);
  const topImpulsive = getTopEmotion(impulsiveEmotionCounts);

  return (
    <div className="max-w-4xl mx-auto pb-12 animate-in fade-in">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white tracking-tight">Journal Émotionnel</h1>
        <p className="text-sm text-textdim mt-1">Comprenez comment vos émotions influencent vos dépenses.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
        <div className="pro-card border-accent/20 bg-accent/5">
          <p className="text-[10px] font-semibold text-textdim uppercase tracking-widest mb-2">Émotion la plus fréquente</p>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-white">{topOverall[0]}</span>
            <span className="text-sm font-medium text-textdim">({topOverall[1]} tirages)</span>
          </div>
        </div>
        
        <div className="pro-card border-warn/20 bg-warn/5">
          <p className="text-[10px] font-semibold text-textdim uppercase tracking-widest mb-2">Déclencheur d'impulsivité N°1</p>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-warn">{topImpulsive[0]}</span>
            <span className="text-sm font-medium text-warn/80">({topImpulsive[1]} tirages impulsifs)</span>
          </div>
        </div>
      </div>

      <h2 className="text-lg font-semibold text-white mb-4">Historique Psycho-Financier</h2>
      
      {spinLogs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center animate-in fade-in">
          <div className="w-16 h-16 mb-6 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
            <svg className="w-8 h-8 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <p className="text-sm text-textdim max-w-sm">
            Aucun tirage enregistré. L'historique des émotions s'affichera ici pour vous aider à analyser vos déclencheurs comportementaux.
          </p>
        </div>
      ) : (
        <div className="grid gap-3">
          {spinLogs.map(spin => {
            const risk = classifyImpulseRisk(spin);
            const isRational = risk === "Rational";
            return (
              <div key={spin.id} className="pro-card p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 group hover:border-white/20">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1.5">
                    <span className="text-[10px] font-mono font-semibold text-textdim uppercase tracking-wider">{spin.date}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-widest ${isRational ? 'bg-accent/10 text-accent border border-accent/20' : 'bg-warn/10 text-warn border border-warn/20'}`}>
                      {risk}
                    </span>
                  </div>
                  <p className="text-base font-bold text-white tracking-tight truncate flex items-center gap-2">
                    {spin.packName} 
                    <span className="text-[10px] bg-danger/10 text-danger border border-danger/20 rounded px-1.5 py-0.5 font-mono">-{spin.coinsSpent}</span>
                  </p>
                </div>
                
                <div className="flex items-center gap-6 bg-ink px-5 py-3 rounded-xl border border-white/5 shrink-0">
                  <div>
                    <p className="text-[10px] font-semibold text-textdim uppercase tracking-wider mb-1">Émotion avant</p>
                    <p className="text-sm font-bold text-white">{spin.emotionBefore || "—"}</p>
                  </div>
                  <div className="w-px h-8 bg-border"></div>
                  <div>
                    <p className="text-[10px] font-semibold text-textdim uppercase tracking-wider mb-1">Satisfaction</p>
                    <p className={`text-sm font-bold ${spin.satisfactionScore === undefined || spin.satisfactionScore === null ? 'text-textdim' : spin.satisfactionScore >= 7 ? 'text-accent' : spin.satisfactionScore <= 4 ? 'text-danger' : 'text-warn'}`}>
                      {spin.satisfactionScore !== undefined && spin.satisfactionScore !== null ? `${spin.satisfactionScore}/10` : "—"}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
