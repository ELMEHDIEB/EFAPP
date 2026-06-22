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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="card p-6 border-accent/20 bg-accent/5">
          <p className="text-xs font-semibold text-textdim uppercase tracking-widest mb-2">Émotion la plus fréquente</p>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white">{topOverall[0]}</span>
            <span className="text-sm text-textdim">({topOverall[1]} tirages)</span>
          </div>
        </div>
        
        <div className="card p-6 border-warn/20 bg-warn/5">
          <p className="text-xs font-semibold text-textdim uppercase tracking-widest mb-2">Déclencheur d'impulsivité N°1</p>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-warn">{topImpulsive[0]}</span>
            <span className="text-sm text-warn/80">({topImpulsive[1]} tirages impulsifs)</span>
          </div>
        </div>
      </div>

      <h2 className="text-lg font-semibold text-white mb-4">Historique Psycho-Financier</h2>
      
      {spinLogs.length === 0 ? (
        <div className="card p-8 text-center bg-panel2/50 border-dashed border-border/60">
          <p className="text-textdim">Aucun tirage enregistré. L'historique des émotions s'affichera ici.</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {spinLogs.map(spin => {
            const risk = classifyImpulseRisk(spin);
            const isRational = risk === "Rational";
            return (
              <div key={spin.id} className="bg-panel2 p-4 rounded-xl border border-border flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-textdim/30 transition-colors">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <span className="text-xs font-semibold text-textdim uppercase tracking-wider">{spin.date}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-widest ${isRational ? 'bg-accent/10 text-accent' : 'bg-warn/10 text-warn'}`}>
                      {risk}
                    </span>
                  </div>
                  <p className="text-white font-medium truncate">{spin.packName} <span className="text-danger ml-2 font-bold">-{spin.coinsSpent}</span></p>
                </div>
                
                <div className="flex items-center gap-4 bg-panel px-4 py-2 rounded-lg border border-border/50 shrink-0 shadow-inner">
                  <div>
                    <p className="text-[10px] text-textdim uppercase tracking-wider mb-0.5">Émotion avant</p>
                    <p className="text-sm font-medium text-white">{spin.emotionBefore || "—"}</p>
                  </div>
                  <div className="w-px h-8 bg-border"></div>
                  <div>
                    <p className="text-[10px] text-textdim uppercase tracking-wider mb-0.5">Satisfaction</p>
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
