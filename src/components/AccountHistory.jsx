import { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../db.js";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

export default function AccountHistory({ accountId = null }) {
  const [filterAccount, setFilterAccount] = useState("");
  const [filterAction, setFilterAction] = useState("");
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");

  const logs = useLiveQuery(async () => {
    let collection = db.coinLogs;
    if (accountId) {
      collection = collection.where("accountId").equals(accountId);
    }
    const result = await collection.toArray();
    return result.sort((a, b) => b.id - a.id);
  }, [accountId]);

  const accounts = useLiveQuery(() => db.accounts.toArray(), []);

  if (!logs || !accounts) {
    return <div className="text-textdim text-sm py-4">Chargement de l'historique...</div>;
  }

  const accountMap = accounts.reduce((acc, a) => {
    acc[a.id] = a.name;
    return acc;
  }, {});

  const filteredLogs = logs.filter(log => {
    if (filterAccount && log.accountId !== Number(filterAccount)) return false;
    if (filterAction && log.action !== filterAction) return false;
    if (filterDateFrom && log.date < filterDateFrom) return false;
    if (filterDateTo && log.date > filterDateTo) return false;
    return true;
  });

  return (
    <div className="pro-card p-6 bg-panel overflow-hidden">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <h2 className="text-lg font-bold text-white">Historique Comptable (Ledger)</h2>
        
        {/* Advanced Filters */}
        <div className="flex flex-wrap gap-2 w-full md:w-auto">
          {!accountId && (
            <select 
              value={filterAccount} 
              onChange={e => setFilterAccount(e.target.value)}
              className="input text-xs py-1"
            >
              <option value="">Tous les comptes</option>
              {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          )}
          <select 
            value={filterAction} 
            onChange={e => setFilterAction(e.target.value)}
            className="input text-xs py-1"
          >
            <option value="">Toutes les actions</option>
            <option value="ADD">Ajout (+)</option>
            <option value="REMOVE">Retrait (-)</option>
            <option value="SET_BALANCE">Snapshot (=)</option>
          </select>
          <input 
            type="date" 
            value={filterDateFrom}
            onChange={e => setFilterDateFrom(e.target.value)}
            className="input text-xs py-1 w-32"
          />
          <span className="text-textdim flex items-center">-</span>
          <input 
            type="date" 
            value={filterDateTo}
            onChange={e => setFilterDateTo(e.target.value)}
            className="input text-xs py-1 w-32"
          />
        </div>
      </div>

      {filteredLogs.length === 0 ? (
        <div className="p-8 text-center border border-dashed border-white/10 rounded-xl">
          <p className="text-textdim text-sm">Aucun historique comptable ne correspond aux filtres.</p>
        </div>
      ) : (
        <div className="relative">
          <div className="absolute top-0 bottom-0 left-4 w-px bg-border"></div>
          <div className="space-y-6">
            {filteredLogs.map((log) => {
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
                        {log.action && (
                          <span className="text-[9px] uppercase tracking-widest text-textdim font-bold">
                            {log.action}
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
        </div>
      )}
    </div>
  );
}
