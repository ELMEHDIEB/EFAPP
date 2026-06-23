import { useState, useMemo } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../db.js";
import { applyCoinChange } from "../accountActions.js";
import { useToast } from "../components/ui/ToastContext.jsx";
import { useConfirm } from "../components/ui/ConfirmContext.jsx";
import AccountHistory from "../components/AccountHistory.jsx";
import BulkBilanImport from "../components/BulkBilanImport.jsx";
import { getNextGoal } from "../utils/goalEngine.js";
import { getMotivationMessage } from "../utils/motivationEngine.js";

export default function BilanTracker() {
  const showToast = useToast();
  const confirm = useConfirm();
  
  const accounts = useLiveQuery(() => db.accounts.toArray(), []);
  const coinLogs = useLiveQuery(() => db.coinLogs.toArray(), []);
  const [snapshotData, setSnapshotData] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [quickAddAccount, setQuickAddAccount] = useState("");

  // Initialize snapshot data when accounts load
  useMemo(() => {
    if (accounts && Object.keys(snapshotData).length === 0) {
      const initial = {};
      accounts.forEach(acc => {
        initial[acc.id] = acc.currentCoins;
      });
      setSnapshotData(initial);
    }
  }, [accounts, snapshotData]);

  // Set default quick add account
  useMemo(() => {
    if (accounts && accounts.length > 0 && !quickAddAccount) {
      setQuickAddAccount(accounts[0].id);
    }
  }, [accounts, quickAddAccount]);

  const handleValueChange = (id, value) => {
    setSnapshotData(prev => ({
      ...prev,
      [id]: value === "" ? "" : Number(value)
    }));
  };

  const calculateVariation = (accountId) => {
    const account = accounts?.find(a => a.id === accountId);
    if (!account) return { diff: 0, pct: 0 };
    
    const oldVal = account.currentCoins;
    const newVal = snapshotData[accountId] === "" ? oldVal : Number(snapshotData[accountId]);
    const diff = newVal - oldVal;
    const pct = oldVal === 0 ? (diff > 0 ? 100 : 0) : ((diff / oldVal) * 100).toFixed(1);
    
    return { diff, pct };
  };

  const handleSaveBilan = async () => {
    if (!accounts) return;
    
    const changes = accounts.filter(acc => {
      const newVal = snapshotData[acc.id];
      return newVal !== "" && Number(newVal) !== acc.currentCoins;
    });

    if (changes.length === 0) {
      showToast("Aucune modification détectée.", "warning");
      return;
    }

    const confirmed = await confirm({
      title: "Enregistrer le Bilan",
      message: `Vous êtes sur le point de mettre à jour le solde de ${changes.length} compte(s). Confirmez-vous ?`,
      confirmText: "Sauvegarder",
      cancelText: "Annuler"
    });

    if (!confirmed) return;

    setIsSaving(true);
    try {
      for (const acc of changes) {
        const newVal = Number(snapshotData[acc.id]);
        await applyCoinChange(acc.id, {
          action: "SET_BALANCE",
          reason: "Bilan Snapshot",
          amount: newVal
        });
      }
      showToast("Bilan enregistré avec succès !", "success");
    } catch (err) {
      showToast("Erreur lors de la sauvegarde: " + err.message, "error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleQuickAdd = async (amount) => {
    if (!quickAddAccount) return;
    const acc = accounts?.find(a => a.id === quickAddAccount);
    if (!acc) return;
    try {
      await applyCoinChange(acc.id, { action: "ADD", amount, reason: "Ajout rapide" });
      showToast(`+${amount} coins ajoutés à ${acc.name}`, "success");
    } catch (err) {
      showToast(err.message, "error");
    }
  };

  if (!accounts || !coinLogs) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-8 h-8 border-2 border-white/10 border-t-white rounded-full animate-spin"></div>
      </div>
    );
  }

  const sortedAccounts = [...accounts].sort((a, b) => b.currentCoins - a.currentCoins);
  const totalCoins = accounts.reduce((sum, a) => sum + a.currentCoins, 0);
  const above900 = accounts.filter(a => a.currentCoins >= 900).length;
  const avgProgress = accounts.length > 0
    ? Math.round(accounts.reduce((sum, a) => sum + getNextGoal(a.currentCoins).progressPct, 0) / accounts.length)
    : 0;

  // Smart Insights computation
  const closeToGoal = accounts.filter(a => a.currentCoins < 900 && (900 - a.currentCoins) <= 100);
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 86400000).toISOString().slice(0, 10);
  const weeklyLogs = coinLogs.filter(l => l.date >= sevenDaysAgo);
  const weeklyDelta = weeklyLogs.reduce((sum, l) => sum + (l.newBalance - l.previousBalance), 0);

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500 pb-10">
      <header>
        <h1 className="text-3xl font-bold tracking-tight text-white">Bilan & Tracker</h1>
        <p className="text-textdim mt-1">Centre de contrôle principal — suivi comptable et gestion du patrimoine.</p>
      </header>

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* HERO KPI SECTION                                           */}
      {/* ═══════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="pro-card p-5 justify-between gap-3 bg-gradient-to-br from-panel to-ink border-accent/20">
          <p className="text-[10px] font-bold text-accent uppercase tracking-widest">Total Coins</p>
          <div>
            <p className="text-3xl font-black tracking-tight text-white">{totalCoins.toLocaleString()}</p>
            <p className="text-xs text-textdim font-medium">{accounts.length} comptes actifs</p>
          </div>
        </div>
        <div className="pro-card p-5 justify-between gap-3">
          <p className="text-[10px] font-bold text-textdim uppercase tracking-widest">Comptes Actifs</p>
          <div>
            <p className="text-3xl font-black tracking-tight text-white">{accounts.length}</p>
            <p className="text-xs text-textdim font-medium">dans le portefeuille</p>
          </div>
        </div>
        <div className="pro-card p-5 justify-between gap-3">
          <p className="text-[10px] font-bold text-textdim uppercase tracking-widest">Comptes ≥ 900</p>
          <div>
            <p className={`text-3xl font-black tracking-tight ${above900 > 0 ? 'text-accent' : 'text-warn'}`}>{above900}</p>
            <p className="text-xs text-textdim font-medium">
              {accounts.length > 0 ? `${Math.round((above900 / accounts.length) * 100)}% du portfolio` : "—"}
            </p>
          </div>
        </div>
        <div className="pro-card p-5 justify-between gap-3">
          <p className="text-[10px] font-bold text-textdim uppercase tracking-widest">Progression Moyenne</p>
          <div>
            <p className={`text-3xl font-black tracking-tight ${avgProgress >= 100 ? 'text-accent' : avgProgress >= 50 ? 'text-white' : 'text-warn'}`}>{avgProgress}%</p>
            <div className="w-full h-1.5 bg-ink rounded-full overflow-hidden mt-2">
              <div
                className={`h-full rounded-full transition-all duration-700 ${avgProgress >= 100 ? 'bg-accent' : avgProgress >= 50 ? 'bg-white' : 'bg-warn'}`}
                style={{ width: `${Math.min(avgProgress, 100)}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* QUICK ADD CENTER                                           */}
      {/* ═══════════════════════════════════════════════════════════ */}
      <div className="pro-card p-5 bg-gradient-to-r from-panel to-panel2">
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          <div className="flex-1 min-w-0">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider mb-1">Quick Add Center</h2>
            <p className="text-xs text-textdim">Ajout rapide de coins sur n'importe quel compte.</p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <select
              value={quickAddAccount}
              onChange={e => setQuickAddAccount(Number(e.target.value))}
              className="input py-2 px-3 text-sm min-w-[140px]"
            >
              {accounts.map(acc => (
                <option key={acc.id} value={acc.id}>
                  {acc.name} ({acc.currentCoins})
                </option>
              ))}
            </select>
            <div className="flex gap-2">
              {[25, 50, 100, 250].map(amount => (
                <button
                  key={amount}
                  onClick={() => handleQuickAdd(amount)}
                  className="btn-secondary px-4 py-2.5 text-sm font-bold hover:bg-accent hover:text-white hover:border-accent transition-all"
                >
                  +{amount}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* SMART INSIGHTS                                             */}
      {/* ═══════════════════════════════════════════════════════════ */}
      {accounts.length > 0 && (
        <div className="pro-card p-5">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
            <svg className="w-4 h-4 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
            Smart Insights
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {above900 > 0 && (
              <div className="bg-accent/5 border border-accent/15 rounded-lg p-3 flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center shrink-0 mt-0.5">
                  <svg className="w-4 h-4 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </div>
                <div>
                  <p className="text-sm font-semibold text-accent">{above900} compte(s) ≥ 900</p>
                  <p className="text-xs text-textdim mt-0.5">Objectif atteint — prêt(s) pour le pass.</p>
                </div>
              </div>
            )}
            {closeToGoal.length > 0 && (
              <div className="bg-warn/5 border border-warn/15 rounded-lg p-3 flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-warn/10 flex items-center justify-center shrink-0 mt-0.5">
                  <svg className="w-4 h-4 text-warn" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
                </div>
                <div>
                  <p className="text-sm font-semibold text-warn">{closeToGoal.length} compte(s) à &lt;100 coins</p>
                  <p className="text-xs text-textdim mt-0.5">Très proche de l'objectif 900.</p>
                </div>
              </div>
            )}
            <div className={`border rounded-lg p-3 flex items-start gap-3 ${weeklyDelta > 0 ? 'bg-accent/5 border-accent/15' : weeklyDelta < 0 ? 'bg-danger/5 border-danger/15' : 'bg-white/5 border-white/10'}`}>
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${weeklyDelta > 0 ? 'bg-accent/10' : weeklyDelta < 0 ? 'bg-danger/10' : 'bg-white/5'}`}>
                <svg className={`w-4 h-4 ${weeklyDelta > 0 ? 'text-accent' : weeklyDelta < 0 ? 'text-danger' : 'text-textdim'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={weeklyDelta >= 0 ? "M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" : "M13 17h8m0 0V9m0 8l-8-8-4 4-6-6"} />
                </svg>
              </div>
              <div>
                <p className={`text-sm font-semibold ${weeklyDelta > 0 ? 'text-accent' : weeklyDelta < 0 ? 'text-danger' : 'text-textdim'}`}>
                  {weeklyDelta > 0 ? `+${weeklyDelta}` : weeklyDelta} coins cette semaine
                </p>
                <p className="text-xs text-textdim mt-0.5">
                  {weeklyDelta > 0 ? "Progression positive." : weeklyDelta < 0 ? "Tendance en baisse." : "Aucun mouvement cette semaine."}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* GOAL PROGRESS CENTER                                       */}
      {/* ═══════════════════════════════════════════════════════════ */}
      <div className="pro-card p-6">
        <h2 className="text-sm font-bold text-white uppercase tracking-wider mb-5">Goal Progress Center</h2>
        <div className="space-y-4">
          {sortedAccounts.map(acc => {
            const { progressPct, remainingCoins, nextGoal } = getNextGoal(acc.currentCoins);
            const motivation = getMotivationMessage(acc, accounts, coinLogs);
            let barColor = "bg-danger";
            let textColor = "text-danger";
            if (progressPct >= 100) { barColor = "bg-accent"; textColor = "text-accent"; }
            else if (progressPct >= 75) { barColor = "bg-accent"; textColor = "text-accent"; }
            else if (progressPct >= 50) { barColor = "bg-warn"; textColor = "text-warn"; }

            return (
              <div key={acc.id} className="bg-ink rounded-xl p-4 border border-border hover:border-white/10 transition-colors">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className={`w-2.5 h-2.5 rounded-full ${progressPct >= 100 ? 'bg-accent' : 'bg-warn'}`} />
                    <span className="text-sm font-bold text-white">{acc.name}</span>
                    {acc.groupTag && (
                      <span className="text-[9px] uppercase tracking-widest text-textdim font-semibold bg-white/5 rounded px-1.5 py-0.5">{acc.groupTag}</span>
                    )}
                  </div>
                  <span className={`text-sm font-black ${textColor}`}>{progressPct}%</span>
                </div>
                <div className="h-2.5 bg-panel2 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${barColor}`}
                    style={{ width: `${Math.min(progressPct, 100)}%` }}
                  />
                </div>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs text-textdim">
                    <span className="text-white font-semibold">{acc.currentCoins.toLocaleString()}</span> / {nextGoal.toLocaleString()} coins
                  </span>
                  <span className="text-[10px] text-textdim">
                    {remainingCoins > 0 ? `${remainingCoins} restants` : "Objectif atteint"}
                  </span>
                </div>
                {/* Motivation message */}
                <p className={`text-[11px] mt-2 font-medium ${motivation.type === 'success' ? 'text-accent' : motivation.type === 'warn' ? 'text-warn' : 'text-textdim'}`}>
                  {motivation.message}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* BULK IMPORT                                                */}
      {/* ═══════════════════════════════════════════════════════════ */}
      <div>
        <BulkBilanImport onComplete={() => setSnapshotData({})} />
      </div>

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* SNAPSHOT TABLE                                             */}
      {/* ═══════════════════════════════════════════════════════════ */}
      <div className="pro-card p-6 bg-panel">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
          <div>
            <h2 className="text-lg font-bold text-white">Snapshot Manuel</h2>
            <p className="text-sm text-textdim">Saisissez individuellement les nouveaux soldes.</p>
          </div>
          <button 
            onClick={handleSaveBilan}
            disabled={isSaving}
            className="btn-primary py-2 px-4 whitespace-nowrap"
          >
            {isSaving ? "Sauvegarde..." : "Enregistrer Snapshot Manuel"}
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead>
              <tr className="border-b border-border text-textdim">
                <th className="pb-3 font-medium">Compte</th>
                <th className="pb-3 font-medium text-right">Ancien Solde</th>
                <th className="pb-3 font-medium text-right">Nouveau Solde</th>
                <th className="pb-3 font-medium text-right">Variation</th>
                <th className="pb-3 font-medium text-right">Progression</th>
                <th className="pb-3 font-medium text-center">Ajout rapide</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {sortedAccounts.map(account => {
                const { diff, pct } = calculateVariation(account.id);
                const isPositive = diff > 0;
                const { currentTier, nextGoal, progressPct } = getNextGoal(account.currentCoins);

                return (
                  <tr key={account.id} className="group hover:bg-white/[0.02] transition-colors">
                    <td className="py-4">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${progressPct >= 100 ? 'bg-accent' : 'bg-warn'}`}></div>
                        <span className="font-semibold text-white">{account.name}</span>
                      </div>
                    </td>
                    <td className="py-4 text-right text-textdim">
                      {account.currentCoins.toLocaleString()}
                    </td>
                    <td className="py-4 text-right">
                      <input 
                        type="number"
                        min="0"
                        value={snapshotData[account.id] ?? account.currentCoins}
                        onChange={(e) => handleValueChange(account.id, e.target.value)}
                        className="input w-24 text-right font-medium text-white p-1.5"
                      />
                    </td>
                    <td className="py-4 text-right font-medium">
                      {diff === 0 ? (
                        <span className="text-textdim">-</span>
                      ) : (
                        <span className={isPositive ? "text-accent" : "text-danger"}>
                          {isPositive ? "+" : ""}{diff} ({isPositive ? "+" : ""}{pct}%)
                        </span>
                      )}
                    </td>
                    <td className="py-4">
                      <div className="flex flex-col items-end gap-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-textdim">Tier {currentTier}</span>
                          <span className="text-xs font-bold text-white">Goal {nextGoal}</span>
                        </div>
                        <div className="flex items-center justify-end gap-3 w-full">
                          <span className="text-textdim text-[10px] w-6 text-right">{progressPct}%</span>
                          <div className="w-24 h-1.5 bg-ink rounded-full overflow-hidden">
                            <div 
                              className={`h-full rounded-full transition-all duration-500 ${progressPct >= 100 ? 'bg-accent' : 'bg-white'}`}
                              style={{ width: `${progressPct}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-4">
                      <div className="flex gap-1.5 justify-center">
                        {[25, 50, 100, 250].map(amount => (
                          <button
                            key={amount}
                            onClick={async () => {
                              try {
                                await applyCoinChange(account.id, { action: "ADD", amount, reason: "Ajout rapide" });
                                showToast(`+${amount} coins ajoutés à ${account.name}`, 'success');
                              } catch (err) {
                                showToast(err.message, 'error');
                              }
                            }}
                            className="btn-secondary px-1.5 py-1 text-[10px] font-bold"
                          >
                            +{amount}
                          </button>
                        ))}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {sortedAccounts.length === 0 && (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-textdim">
                    Aucun compte disponible. Veuillez en créer un dans l'onglet Comptes.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* ACCOUNT HISTORY                                            */}
      {/* ═══════════════════════════════════════════════════════════ */}
      <div className="mt-2">
        <AccountHistory />
      </div>
    </div>
  );
}
