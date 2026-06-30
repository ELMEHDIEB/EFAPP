import React, { useState } from 'react';
import { db } from '../../db';

const EMOTIONS = [
  { id: 'Zen', emoji: '🧘‍♂️', color: 'bg-green-500/20 text-green-400 border-green-500/50' },
  { id: 'Hype', emoji: '🔥', color: 'bg-orange-500/20 text-orange-400 border-orange-500/50' },
  { id: 'Frustré', emoji: '😤', color: 'bg-red-500/20 text-red-400 border-red-500/50' },
  { id: 'Neutre', emoji: '😐', color: 'bg-gray-500/20 text-gray-400 border-gray-500/50' },
];

export default function DailyCheckinModal({ onClose }) {
  const [selected, setSelected] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  async function handleSave() {
    if (!selected) return;
    setIsSaving(true);
    try {
      await db.emotionalLogs.add({
        accountId: 'global', // Not tied to a specific account
        date: new Date().toISOString().slice(0, 10),
        emotion: selected,
        createdAt: new Date().toISOString()
      });
      onClose();
    } catch (e) {
      console.error(e);
      setIsSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="pro-card bg-surfaceElevated p-8 max-w-md w-full mx-4 shadow-[0_0_50px_rgba(0,0,0,0.5)] border border-white/10 relative overflow-hidden">
        {/* Glow effect */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-32 bg-blue-500/10 blur-[50px] pointer-events-none" />

        <div className="text-center space-y-2 mb-8 relative z-10">
          <h2 className="text-2xl font-black tracking-tight text-white">Daily Check-in</h2>
          <p className="text-sm text-gray-400">
            Prenez 2 secondes pour évaluer votre état d'esprit avant d'ouvrir eFootball aujourd'hui.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-8 relative z-10">
          {EMOTIONS.map(emo => {
            const isSelected = selected === emo.id;
            return (
              <button
                key={emo.id}
                onClick={() => setSelected(emo.id)}
                className={`p-4 rounded-xl border flex flex-col items-center gap-2 transition-all duration-300
                  ${isSelected ? emo.color + ' scale-105 shadow-lg' : 'bg-surface border-white/5 text-gray-400 hover:bg-white/5'}
                `}
              >
                <span className="text-3xl">{emo.emoji}</span>
                <span className="font-semibold">{emo.id}</span>
              </button>
            );
          })}
        </div>

        <button
          onClick={handleSave}
          disabled={!selected || isSaving}
          className="w-full btn-primary py-3 relative z-10 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSaving ? "Enregistrement..." : "Valider mon état"}
        </button>
      </div>
    </div>
  );
}
