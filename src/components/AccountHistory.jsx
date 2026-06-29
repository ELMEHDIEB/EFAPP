import { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../db.js";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

export default function AccountHistory({ accountId = null }) {
  const [limit, setLimit] = useState(4);

  // If accountId is provided, filter by it. Otherwise show all.
  const logs = useLiveQuery(async () => {
    if (accountId) {
      return await db.coinLogs
        .where("accountId")
        .equals(accountId)
        .reverse()
        .limit(limit)
        .toArray();
    }
    return await db.coinLogs
      .orderBy("id")
      .reverse()
      .limit(limit)
      .toArray();
  }, [accountId, limit]);

  const accounts = useLiveQuery(() => db.accounts.toArray(), []);

  if (!logs || !accounts) {
    return <div className="text-textdim text-sm py-4">Chargement de l'historique...</div>;
  }

  const accountMap = accounts.reduce((acc, a) => {
    acc[a.id] = a.name;
    return acc;
  }, {});

  if (logs.length === 0) {
    return (
      <div className="pro-card p-8 text-center bg-panel border-dashed">
        <p className="text-textdim">Aucun historique comptable disponible.</p>
      </div>
    );
  }

  return (
    <div className="pro-card p-6 bg-panel overflow-hidden">
      <h2 className="text-lg font-bold text-white mb-6">Historique Comptable (Ledger)</h2>
      <div className="relative">
        <div className="absolute top-0 bottom-0 left-4 w-px bg-border"></div>
        <div className="space-y-6">
          {logs.map((log) => {
            const isPositive = log.newBalance >= log.previousBalance;
            const diff = log.newBalance - log.previousBalance;
            const pct = log.previousBalance === 0 ? (diff > 0 ? 100 : 0) : ((diff / log.previousBalance) * 100).toFixed(1);

            return (
              <div key={log.id} className="relative pl-10">
                <div className={`absolute left-[11px] top-1.5 w-2 h-2 rounded-full border-2 border-panel bg-ink ${isPositive ? 'bg-accent' : 'bg-red-400'}`}></div>
                <div className="bg-ink rounded-lg p-4 border border-border hover:border-white/20 transition-colors">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-semibold uppercase tracking-wider text-textdim">
                        {format(new Date(log.date), "dd MMM yyyy", { locale: fr })}
                      </span>
                      {!accountId && (
                        <span className="px-2 py-0.5 rounded text-xs bg-white/5 text-white">
                          {accountMap[log.accountId] || "Inconnu"}
                        </span>
                      )}
                    </div>
                    <span className={`text-sm font-bold ${isPositive ? 'text-accent' : 'text-red-400'}`}>
                      {isPositive ? "+" : ""}{diff} ({isPositive ? "+" : ""}{pct}%)
                    </span>
                  </div>
                  <div className="flex justify-between items-end">
                    <p className="text-sm text-textdim max-w-md">{log.reason}</p>
                    <div className="text-right">
                      <p className="text-xs text-textdim line-through opacity-70">{log.previousBalance}</p>
                      <p className="text-base font-bold text-white">{log.newBalance}</p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        {logs.length === limit && (
          <div className="mt-8 text-center">
            <button
              onClick={() => setLimit(l => l + 10)}
              className="px-4 py-2 bg-panel2 hover:bg-white/10 text-white rounded-md text-sm transition-colors border border-border font-medium"
            >
              Voir plus
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
