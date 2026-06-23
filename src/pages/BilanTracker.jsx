import { useState, useMemo } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../db.js";
import { applyCoinChange } from "../accountActions.js";
import { useToast } from "../components/ui/ToastContext.jsx";
import { useConfirm } from "../components/ui/ConfirmContext.jsx";
import AccountHistory from "../components/AccountHistory.jsx";
import BulkBilanImport from "../components/BulkBilanImport.jsx";
import { getNextGoal } from "../utils/goalEngine.js";

export default function BilanTracker() {
  const { showToast } = useToast();
  const confirm = useConfirm();
  
  const accounts = useLiveQuery(() => db.accounts.toArray(), []);
  const [snapshotData, setSnapshotData] = useState({});
  const [isSaving, setIsSaving] = useState(false);

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

  if (!accounts) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-8 h-8 border-2 border-white/10 border-t-white rounded-full animate-spin"></div>
      </div>
    );
  }

  const sortedAccounts = [...accounts].sort((a, b) => b.currentCoins - a.currentCoins);
  const totalCoins = sortedAccounts.reduce((sum, a) => sum + a.currentCoins, 0);

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      <header className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white">Bilan & Tracker</h1>
        <p className="text-textdim mt-1">Mise à jour globale et suivi comptable de votre patrimoine.</p>
      </header>

      <div className="mb-8">
        <BulkBilanImport onComplete={() => setSnapshotData({})} />
      </div>

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
                <th className="pb-3 font-medium text-right">Progression (900)</th>
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
                        <div className={`w-2 h-2 rounded-full ${progressPct >= 100 ? 'bg-accent' : 'bg-orange-400'}`}></div>
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
                        className="pro-input w-24 text-right font-medium text-white p-1.5"
                      />
                    </td>
                    <td className="py-4 text-right font-medium">
                      {diff === 0 ? (
                        <span className="text-textdim">-</span>
                      ) : (
                        <span className={isPositive ? "text-accent" : "text-red-400"}>
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
                  </tr>
                );
              })}
              {sortedAccounts.length === 0 && (
                <tr>
                  <td colSpan="5" className="py-8 text-center text-textdim">
                    Aucun compte disponible. Veuillez en créer un dans l'onglet Comptes.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-8">
        <AccountHistory />
      </div>
    </div>
  );
}
