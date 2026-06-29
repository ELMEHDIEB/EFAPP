import { useState, useMemo } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../db.js";
import { applyCoinChange } from "../accountActions.js";
import { useToast } from "./ui/ToastContext.jsx";

export default function CommandCenter({ onComplete }) {
  const accounts = useLiveQuery(() => db.accounts.toArray(), []);
  const showToast = useToast();

  const [step, setStep] = useState(1);
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState(new Set());
  
  // Action state
  const [actionType, setActionType] = useState(""); // "ADD", "SET"
  const [actionValue, setActionValue] = useState("");

  const [isProcessing, setIsProcessing] = useState(false);

  const filteredAccounts = useMemo(() => {
    if (!accounts) return [];
    return accounts.filter(a => a.name.toLowerCase().includes(search.toLowerCase()) || (a.groupTag && a.groupTag.toLowerCase().includes(search.toLowerCase())));
  }, [accounts, search]);

  const toggleSelect = (id) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedIds(newSet);
  };

  const toggleAll = () => {
    if (selectedIds.size === filteredAccounts.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(filteredAccounts.map(a => a.id)));
  };

  const selectedAccounts = accounts ? accounts.filter(a => selectedIds.has(a.id)) : [];

  const previewData = useMemo(() => {
    if (!selectedAccounts.length || !actionValue) return [];
    const val = Number(actionValue);
    
    return selectedAccounts.map(acc => {
      let newVal = acc.currentCoins;
      if (actionType === "ADD") newVal = acc.currentCoins + val;
      if (actionType === "SET") newVal = val;
      
      const diff = newVal - acc.currentCoins;
      return {
        id: acc.id,
        name: acc.name,
        oldVal: acc.currentCoins,
        newVal: newVal < 0 ? 0 : newVal,
        diff: newVal < 0 ? -acc.currentCoins : diff
      };
    }).filter(p => p.diff !== 0);
  }, [selectedAccounts, actionType, actionValue]);

  const handleExecute = async () => {
    if (previewData.length === 0) return;
    setIsProcessing(true);
    try {
      let totalDiff = 0;
      for (const p of previewData) {
        await applyCoinChange(p.id, {
          action: actionType === "ADD" && p.diff < 0 ? "REMOVE" : actionType === "ADD" ? "ADD" : "SET_BALANCE",
          reason: "Command Center",
          amount: actionType === "ADD" ? Math.abs(p.diff) : p.newVal
        });
        totalDiff += p.diff;
      }
      showToast(`${previewData.length} comptes modifiés. Différence totale: ${totalDiff > 0 ? '+' : ''}${totalDiff} coins.`, "success");
      setStep(1);
      setSelectedIds(new Set());
      setActionType("");
      setActionValue("");
      if (onComplete) onComplete();
    } catch (err) {
      showToast("Erreur lors de l'exécution: " + err.message, "error");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="pro-card bg-panel border border-white/10 overflow-hidden shadow-2xl">
      {/* Header Tabs (Steps) */}
      <div className="flex items-center border-b border-border bg-ink">
        {[
          { num: 1, label: "Sélection", active: step >= 1 },
          { num: 2, label: "Action", active: step >= 2 },
          { num: 3, label: "Preview", active: step >= 3 },
          { num: 4, label: "Confirm", active: step === 4 }
        ].map((s, i) => (
          <div key={s.num} className={`flex-1 text-center py-3 text-xs font-bold tracking-widest uppercase relative ${step === s.num ? 'text-white' : s.active ? 'text-textdim cursor-pointer hover:text-white' : 'text-textdim/30 pointer-events-none'}`} onClick={() => s.active && setStep(s.num)}>
            {s.label}
            {step === s.num && <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-accent"></div>}
          </div>
        ))}
      </div>

      <div className="p-6">
        {step === 1 && (
          <div className="space-y-4 animate-in slide-in-from-right-4">
            <div className="flex items-center justify-between gap-4">
              <input 
                type="text" 
                placeholder="Rechercher un compte..." 
                value={search} 
                onChange={e => setSearch(e.target.value)} 
                className="input flex-1 bg-ink border-white/5"
              />
              <button onClick={toggleAll} className="btn-secondary text-xs">
                {selectedIds.size === filteredAccounts.length ? "Désélectionner tout" : "Sélectionner tout"}
              </button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
              {filteredAccounts.map(acc => (
                <div 
                  key={acc.id} 
                  onClick={() => toggleSelect(acc.id)}
                  className={`p-3 rounded-xl border cursor-pointer transition-all ${selectedIds.has(acc.id) ? 'border-accent bg-accent/10' : 'border-white/5 bg-ink hover:border-white/20'}`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-bold text-white text-sm">{acc.name}</span>
                    <div className={`w-4 h-4 rounded-full flex items-center justify-center border ${selectedIds.has(acc.id) ? 'border-accent bg-accent' : 'border-textdim'}`}>
                      {selectedIds.has(acc.id) && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>}
                    </div>
                  </div>
                  <span className="text-xs text-textdim font-medium">{acc.currentCoins} coins</span>
                </div>
              ))}
            </div>
            <div className="flex justify-end pt-2">
              <button onClick={() => setStep(2)} disabled={selectedIds.size === 0} className="btn-primary py-2 px-8">
                Continuer ({selectedIds.size})
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6 animate-in slide-in-from-right-4">
            <div>
              <p className="text-sm font-bold text-white mb-3">Ajout Rapide</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[25, 50, 100, 250].map(val => (
                  <button 
                    key={val}
                    onClick={() => { setActionType("ADD"); setActionValue(val); setStep(3); }}
                    className="p-4 rounded-xl border border-white/5 bg-ink hover:border-accent hover:bg-accent/5 text-center transition-all group"
                  >
                    <p className="text-xl font-black text-white group-hover:text-accent transition-colors">+{val}</p>
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-sm font-bold text-white mb-3">Définir une valeur spécifique</p>
              <div className="flex gap-3">
                <input 
                  type="number" 
                  placeholder="Montant exact" 
                  value={actionValue} 
                  onChange={e => { setActionType("SET"); setActionValue(e.target.value); }} 
                  className="input flex-1 text-lg font-bold"
                />
                <button 
                  onClick={() => setStep(3)} 
                  disabled={!actionValue} 
                  className="btn-primary"
                >
                  Appliquer
                </button>
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4 animate-in slide-in-from-right-4">
            <h3 className="text-sm font-bold text-white">Aperçu des modifications ({previewData.length})</h3>
            {previewData.length > 0 ? (
              <div className="overflow-x-auto bg-ink rounded-xl border border-border max-h-64 overflow-y-auto custom-scrollbar">
                <table className="w-full text-left text-sm whitespace-nowrap">
                  <tbody className="divide-y divide-white/5">
                    {previewData.map(p => (
                      <tr key={p.id}>
                        <td className="py-3 px-4 font-bold text-white">{p.name}</td>
                        <td className="py-3 px-4 text-textdim line-through">{p.oldVal}</td>
                        <td className="py-3 px-4 text-white font-medium">➔</td>
                        <td className="py-3 px-4 font-bold text-accent">{p.newVal}</td>
                        <td className={`py-3 px-4 font-bold text-right ${p.diff > 0 ? 'text-accent' : 'text-danger'}`}>
                          {p.diff > 0 ? '+' : ''}{p.diff}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-sm text-textdim p-4 border border-dashed border-white/10 rounded-xl text-center">Aucune modification détectée (valeurs identiques).</p>
            )}
            
            <div className="flex justify-end gap-3 pt-2">
              <button onClick={() => setStep(4)} disabled={previewData.length === 0} className="btn-primary py-2 px-8">
                Vérifier
              </button>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-6 animate-in slide-in-from-right-4 text-center">
            <div className="w-20 h-20 bg-accent/10 border border-accent/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
            </div>
            <h2 className="text-2xl font-bold text-white">Confirmation Requise</h2>
            
            <div className="bg-ink p-4 rounded-xl border border-border max-w-sm mx-auto">
              <p className="text-sm text-textdim uppercase tracking-widest font-bold mb-1">Résumé</p>
              <p className="text-xl font-bold text-white mb-1">{previewData.length} comptes modifiés</p>
              <p className={`text-lg font-bold ${previewData.reduce((s,p) => s+p.diff, 0) > 0 ? 'text-accent' : 'text-danger'}`}>
                Impact Global : {previewData.reduce((s,p) => s+p.diff, 0) > 0 ? '+' : ''}{previewData.reduce((s,p) => s+p.diff, 0)} coins
              </p>
            </div>

            <div className="flex justify-center gap-4 pt-4">
              <button onClick={() => setStep(3)} className="btn-secondary py-3 px-6">Retour</button>
              <button onClick={handleExecute} disabled={isProcessing} className="btn-primary py-3 px-8 text-base shadow-glow">
                {isProcessing ? "Application en cours..." : "Appliquer les changements"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
