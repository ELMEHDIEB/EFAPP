import { useState, useEffect } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../db.js";
import HeroHeader from "../components/ui/HeroHeader.jsx";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

export default function ActivityTimeline() {
  const accounts = useLiveQuery(() => db.accounts.toArray(), []);
  const coinLogs = useLiveQuery(() => db.coinLogs.toArray(), []);
  const spinLogs = useLiveQuery(() => db.spinLogs.toArray(), []);
  const auditLogs = useLiveQuery(() => db.auditLogs.toArray(), []);

  const [filter, setFilter] = useState("ALL"); // ALL, COINS, SPINS, SYSTEM
  const [fusedLogs, setFusedLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!accounts || !coinLogs || !spinLogs || !auditLogs) return;

    // Simulate async processing/network for skeleton loader
    setIsLoading(true);
    setTimeout(() => {
      let combined = [];

      // Add Coin Logs
      coinLogs.forEach(log => {
        const acc = accounts.find(a => a.id === log.accountId);
        const diff = log.newBalance - log.previousBalance;
        combined.push({
          id: `coin-${log.id}`,
          type: 'COINS',
          dateStr: log.date,
          timestamp: new Date(log.date).getTime() + log.id, // Add ID for stable sort on same day
          title: `Solde modifié : ${acc?.name || 'Inconnu'}`,
          description: log.reason,
          badge: diff > 0 ? `+${diff} coins` : `${diff} coins`,
          isPositive: diff > 0
        });
      });

      // Add Spin Logs
      spinLogs.forEach(log => {
        const acc = accounts.find(a => a.id === log.accountId);
        combined.push({
          id: `spin-${log.id}`,
          type: 'SPINS',
          dateStr: log.date,
          timestamp: new Date(log.date).getTime() + log.id + 0.1,
          title: `Tirage effectué : ${acc?.name || 'Inconnu'}`,
          description: `${log.packName} (${log.spins} spins)`,
          badge: `-${log.coinsSpent} coins`,
          isPositive: false
        });
      });

      // Add Audit Logs
      auditLogs.forEach(log => {
        combined.push({
          id: `audit-${log.id}`,
          type: 'SYSTEM',
          dateStr: log.date,
          timestamp: new Date(log.date).getTime() + log.id + 0.2,
          title: `Système : ${log.actionType}`,
          description: log.details,
          badge: "Info",
          isPositive: true // neutral mostly
        });
      });

      combined.sort((a, b) => b.timestamp - a.timestamp);
      setFusedLogs(combined);
      setIsLoading(false);
    }, 600); // 600ms skeleton visible
  }, [accounts, coinLogs, spinLogs, auditLogs]);

  const filteredLogs = fusedLogs.filter(log => filter === "ALL" || log.type === filter);

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      <HeroHeader 
        title="Activity Timeline"
        description="Traçabilité complète de l'activité du portefeuille et du système."
      />

      <div className="pro-card p-6 bg-surface">
        <div className="flex flex-wrap gap-2 mb-6 border-b border-white/5 pb-4">
          {["ALL", "COINS", "SPINS", "SYSTEM"].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition-colors ${
                filter === f ? 'bg-accent text-white' : 'bg-ink text-textdim hover:bg-white/5 hover:text-white'
              }`}
            >
              {f === "ALL" ? "Tout" : f}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="flex gap-4 p-4 rounded-xl border border-white/5 animate-pulse">
                <div className="w-10 h-10 rounded bg-white/10 shrink-0"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-white/10 rounded w-1/3"></div>
                  <div className="h-3 bg-white/5 rounded w-1/2"></div>
                </div>
                <div className="h-6 w-16 bg-white/10 rounded-full"></div>
              </div>
            ))}
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="py-12 text-center border border-dashed border-white/10 rounded-xl">
            <p className="text-textdim">Aucune activité enregistrée.</p>
          </div>
        ) : (
          <div className="relative">
            <div className="absolute top-0 bottom-0 left-5 w-px bg-border"></div>
            <div className="space-y-6">
              {filteredLogs.map(log => (
                <div key={log.id} className="relative pl-12 group">
                  <div className={`absolute left-[17px] top-1.5 w-2 h-2 rounded-full border-2 border-surface bg-ink ${log.isPositive ? 'bg-accent' : 'bg-red-400'}`}></div>
                  <div className="bg-ink p-4 rounded-xl border border-border group-hover:border-white/20 transition-colors">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 mb-1">
                      <div>
                        <h3 className="text-sm font-bold text-white tracking-tight">{log.title}</h3>
                        <p className="text-xs text-textdim mt-0.5">{log.description}</p>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase ${log.isPositive ? 'bg-accent/10 text-accent' : 'bg-red-400/10 text-red-400'}`}>
                          {log.badge}
                        </span>
                      </div>
                    </div>
                    <div className="mt-3">
                      <span className="text-[10px] font-mono font-semibold text-textdim/70">
                        {format(new Date(log.dateStr), "dd MMM yyyy", { locale: fr })}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
