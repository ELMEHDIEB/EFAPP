import { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../db";
import { applyCoinChange } from "../accountActions.js";
import { useToast } from "./ui/ToastContext.jsx";
import { useConfirm } from "./ui/ConfirmContext.jsx";

export default function BulkBilanImport({ onComplete }) {
  const accounts = useLiveQuery(() => db.accounts.toArray(), []);
  const showToast = useToast();
  const confirm = useConfirm();

  const [rawText, setRawText] = useState("");
  const [step, setStep] = useState(1); // 1 = Input, 2 = Validation/Preview
  const [parsedData, setParsedData] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const parseInput = () => {
    if (!accounts) return;

    const lines = rawText.split('\n');
    const results = [];

    // Regex to match: [AccountName] [Separator] [Value]
    // Separators supported: space, =, :, -, ->
    const regex = /^(.+?)\s*(?:=|:|->|-|\s)\s*(\d+)$/;

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue; // Ignore empty and comments

      const match = trimmed.match(regex);
      if (match) {
        const nameRaw = match[1].trim();
        const value = Number(match[2]);
        
        // Find matching account (case insensitive)
        const account = accounts.find(a => a.name.toLowerCase() === nameRaw.toLowerCase());
        
        if (account) {
          const oldVal = account.currentCoins;
          const diff = value - oldVal;
          const pct = oldVal === 0 ? (diff > 0 ? 100 : 0) : ((diff / oldVal) * 100).toFixed(1);
          
          results.push({
            status: "valid",
            account,
            name: account.name,
            oldValue: oldVal,
            newValue: value,
            diff,
            pct
          });
        } else {
          results.push({
            status: "warning",
            name: nameRaw,
            newValue: value,
            message: "Compte introuvable"
          });
        }
      } else {
        results.push({
          status: "error",
          rawLine: trimmed,
          message: "Format invalide"
        });
      }
    }

    setParsedData(results);
    setStep(2);
  };

  const handleExecute = async () => {
    const validEntries = parsedData.filter(d => d.status === "valid" && d.diff !== 0);
    
    if (validEntries.length === 0) {
      showToast("Aucune modification valide à appliquer.", "warning");
      return;
    }

    const confirmed = await confirm({
      title: "Confirmer le Snapshot",
      message: `Vous allez mettre à jour ${validEntries.length} compte(s). Confirmez-vous le Bilan Snapshot ?`,
      confirmText: "Exécuter Snapshot",
      cancelText: "Annuler"
    });

    if (!confirmed) return;

    setIsProcessing(true);
    try {
      for (const entry of validEntries) {
        await applyCoinChange(entry.account.id, {
          action: "SET_BALANCE",
          reason: "Bulk Bilan Import",
          amount: entry.newValue
        });
      }
      showToast("Bilan importé avec succès.", "success");
      setRawText("");
      setStep(1);
      if (onComplete) onComplete();
    } catch (err) {
      showToast("Erreur lors de l'import: " + err.message, "error");
    } finally {
      setIsProcessing(false);
    }
  };

  const validCount = parsedData.filter(d => d.status === "valid").length;
  const warningCount = parsedData.filter(d => d.status === "warning").length;
  const errorCount = parsedData.filter(d => d.status === "error").length;

  const totalGain = parsedData.filter(d => d.status === "valid" && d.diff > 0).reduce((s, d) => s + d.diff, 0);
  const totalLoss = parsedData.filter(d => d.status === "valid" && d.diff < 0).reduce((s, d) => s + Math.abs(d.diff), 0);

  return (
    <div className="pro-card bg-panel p-6 border-dashed border-white/20">
      <h2 className="text-lg font-bold text-white mb-2">Import Bilan (Bulk Wizard)</h2>
      
      {step === 1 && (
        <div className="space-y-4 animate-in fade-in">
          <p className="text-sm text-textdim">Collez votre bilan (un compte par ligne). Formats acceptés: espaces, =, :, -, -{'>'}</p>
          <textarea 
            className="w-full h-48 pro-input font-mono text-sm p-4 whitespace-pre"
            placeholder={`# Exemple de format:\nEB5 1500\nGAME4 = 777\n2004 : 1030\nCNX -> 715`}
            value={rawText}
            onChange={e => setRawText(e.target.value)}
          />
          <div className="flex justify-end">
            <button 
              onClick={parseInput} 
              disabled={!rawText.trim()}
              className="btn-primary py-2 px-6"
            >
              Analyser l'Import
            </button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-bold text-white">Import Preview Diff</h3>
            <button onClick={() => setStep(1)} className="text-xs text-textdim hover:text-white underline">Retour</button>
          </div>

          {/* Validation Report Summary */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-ink rounded-lg p-3 border border-border">
              <p className="text-[10px] text-textdim uppercase tracking-wider font-bold">Valides</p>
              <p className="text-xl font-bold text-accent">{validCount}</p>
            </div>
            <div className="bg-ink rounded-lg p-3 border border-border">
              <p className="text-[10px] text-textdim uppercase tracking-wider font-bold">Inconnus</p>
              <p className="text-xl font-bold text-warn">{warningCount}</p>
            </div>
            <div className="bg-ink rounded-lg p-3 border border-border">
              <p className="text-[10px] text-textdim uppercase tracking-wider font-bold">Erreurs</p>
              <p className="text-xl font-bold text-danger">{errorCount}</p>
            </div>
          </div>

          {validCount > 0 && (
            <div className="flex gap-6 text-sm">
              <div className="flex gap-2 items-center">
                <span className="text-textdim">Total Gain:</span>
                <span className="text-accent font-bold">+{totalGain}</span>
              </div>
              <div className="flex gap-2 items-center">
                <span className="text-textdim">Total Perte:</span>
                <span className="text-danger font-bold">-{totalLoss}</span>
              </div>
            </div>
          )}

          <div className="overflow-x-auto bg-ink rounded-xl border border-border">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead>
                <tr className="border-b border-white/5 text-textdim bg-white/[0.02]">
                  <th className="py-2 px-4 font-medium">Compte</th>
                  <th className="py-2 px-4 font-medium text-right">Ancien</th>
                  <th className="py-2 px-4 font-medium text-right">Nouveau</th>
                  <th className="py-2 px-4 font-medium text-right">Variation</th>
                  <th className="py-2 px-4 font-medium">Statut</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {parsedData.map((row, i) => (
                  <tr key={i} className={row.status === "error" ? "bg-red-500/5" : row.status === "warning" ? "bg-orange-500/5" : ""}>
                    <td className="py-2 px-4 font-medium text-white">{row.name || row.rawLine}</td>
                    <td className="py-2 px-4 text-right text-textdim">{row.oldValue ?? "-"}</td>
                    <td className="py-2 px-4 text-right font-medium text-white">{row.newValue ?? "-"}</td>
                    <td className="py-2 px-4 text-right font-bold">
                      {row.diff !== undefined ? (
                        row.diff === 0 ? (
                          <span className="text-textdim">-</span>
                        ) : (
                          <span className={row.diff > 0 ? "text-accent" : "text-danger"}>
                            {row.diff > 0 ? "+" : ""}{row.diff} ({row.diff > 0 ? "+" : ""}{row.pct}%)
                          </span>
                        )
                      ) : "-"}
                    </td>
                    <td className="py-2 px-4">
                      {row.status === "valid" && <span className="text-accent text-xs font-medium">Valide</span>}
                      {row.status === "warning" && <span className="text-warn text-xs font-medium">{row.message}</span>}
                      {row.status === "error" && <span className="text-danger text-xs font-medium">{row.message}</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex justify-end pt-2">
            <button 
              onClick={handleExecute}
              disabled={isProcessing || errorCount > 0 || validCount === 0}
              className="btn-primary py-3 px-8 flex items-center gap-2"
            >
              {isProcessing ? "Exécution..." : "Confirmer Snapshot"}
            </button>
          </div>
          {errorCount > 0 && <p className="text-danger text-xs text-right mt-2">Corrigez les erreurs avant d'exécuter.</p>}
        </div>
      )}
    </div>
  );
}
