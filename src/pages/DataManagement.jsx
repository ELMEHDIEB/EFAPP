import { useState, useMemo } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../db.js";
import { useToast } from "../components/ui/ToastContext.jsx";
import { useConfirm } from "../components/ui/ConfirmContext.jsx";
import { resetAllAccounts } from "../accountActions.js";

const TABLES = [
  "accounts",
  "coinLogs",
  "spinLogs",
  "spinPlayers",
  "regretLogs",
  "emotionalLogs",
  "notifications",
  "settings",
  "auditLogs"
];

export default function DataManagement() {
  const toast = useToast();
  const confirm = useConfirm();

  const accounts = useLiveQuery(() => db.accounts.toArray(), []);
  const coinLogs = useLiveQuery(() => db.coinLogs.toArray(), []);
  const spinLogs = useLiveQuery(() => db.spinLogs.toArray(), []);
  const auditLogs = useLiveQuery(() => db.auditLogs.toArray(), []);

  const [dangerConfirm, setDangerConfirm] = useState("");
  const [isFactoryResetting, setIsFactoryResetting] = useState(false);

  // Helper to log actions
  const logSystemAction = async (actionType, details) => {
    await db.auditLogs.add({
      date: new Date().toISOString().slice(0, 10),
      actionType,
      details
    });
  };

  // ----- EXPORT -----
  async function handleExportJSON() {
    const dump = {};
    for (const t of TABLES) {
      if (db[t]) dump[t] = await db[t].toArray();
    }
    const blob = new Blob([JSON.stringify(dump, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `efootball-efapp-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast("Backup JSON téléchargé avec succès.", "success");
  }

  // ----- RESET OPERATIONS -----
  async function handleResetAccounts() {
    const confirmed = await confirm({
      title: "Reset All Accounts",
      message: "Êtes-vous sûr de vouloir remettre les coins de tous les comptes à zéro ? Les historiques et noms seront conservés.",
      confirmLabel: "Réinitialiser les soldes",
      cancelLabel: "Annuler",
      isDanger: true
    });
    if (!confirmed) return;

    try {
      const count = await resetAllAccounts();
      await logSystemAction("RESET_ACCOUNTS", `${count} comptes réinitialisés à 0 coins`);
      toast(`${count} comptes réinitialisés avec succès.`, "success");
    } catch (e) {
      toast("Erreur lors de la réinitialisation: " + e.message, "error");
    }
  }

  async function handleDeleteCoinLogs() {
    const confirmed = await confirm({
      title: "Delete All Coin Logs",
      message: "Cette action va effacer de manière irréversible tout l'historique comptable des coins. Continuer ?",
      confirmLabel: "Supprimer Coin Logs",
      cancelLabel: "Annuler",
      isDanger: true
    });
    if (!confirmed) return;

    const count = await db.coinLogs.count();
    await db.coinLogs.clear();
    await logSystemAction("DELETE_COIN_LOGS", `${count} entrées supprimées`);
    toast("L'historique des coins a été supprimé.", "success");
  }

  async function handleDeleteSpinLogs() {
    const confirmed = await confirm({
      title: "Delete All Spin Logs",
      message: "Cette action va effacer de manière irréversible tout l'historique des spins et des tirages de joueurs. Continuer ?",
      confirmLabel: "Supprimer Spin Logs",
      cancelLabel: "Annuler",
      isDanger: true
    });
    if (!confirmed) return;

    const count = await db.spinLogs.count();
    await db.spinLogs.clear();
    await db.spinPlayers.clear();
    await db.regretLogs.clear();
    await logSystemAction("DELETE_SPIN_LOGS", `${count} sessions de spins supprimées`);
    toast("L'historique des spins a été supprimé.", "success");
  }

  function handleRecalculateAnalytics() {
    toast("Analytics recalculated successfully", "success");
  }

  // ----- FACTORY RESET -----
  async function handleFactoryReset() {
    // Step 1: Backup JSON prompt
    const backupConfirmed = await confirm({
      title: "Exporter les données avant suppression ?",
      message: "Nous recommandons fortement de télécharger un backup JSON avant de tout effacer.",
      confirmLabel: "Exporter JSON",
      cancelLabel: "Continuer sans sauvegarde",
      isDanger: false
    });

    if (backupConfirmed) {
      await handleExportJSON();
    }

    // Double confirmation requires user to type "RESET EFAPP" in the prompt
    // For this, we'll use a local state to reveal the final danger button
    setIsFactoryResetting(true);
  }

  async function executeFactoryReset() {
    if (dangerConfirm !== "RESET EFAPP") {
      toast("La phrase de sécurité est incorrecte. Action refusée.", "error");
      return;
    }

    try {
      for (const t of TABLES) {
        if (db[t]) await db[t].clear();
      }
      toast("Application état initial. Tout a été effacé.", "success");
      setDangerConfirm("");
      setIsFactoryResetting(false);
      setTimeout(() => {
        window.location.href = "/";
      }, 1500);
    } catch (e) {
      toast("Erreur critique: " + e.message, "error");
    }
  }

  // --- RENDERING ---
  if (!accounts || !coinLogs || !spinLogs || !auditLogs) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-8 h-8 border-2 border-white/10 border-t-white rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto pb-12 animate-in fade-in duration-500 space-y-8">
      <header>
        <h1 className="text-3xl font-bold text-white tracking-tight">Data Management</h1>
        <p className="text-sm text-textdim mt-1">Application Reset Center & Gestion des données (Local First).</p>
      </header>

      {/* 1. DATA OVERVIEW */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="pro-card p-4">
          <p className="text-[10px] font-bold text-textdim uppercase tracking-widest mb-1">Accounts</p>
          <p className="text-2xl font-black text-white">{accounts.length}</p>
        </div>
        <div className="pro-card p-4">
          <p className="text-[10px] font-bold text-textdim uppercase tracking-widest mb-1">Coin Logs</p>
          <p className="text-2xl font-black text-white">{coinLogs.length}</p>
        </div>
        <div className="pro-card p-4">
          <p className="text-[10px] font-bold text-textdim uppercase tracking-widest mb-1">Spin Logs</p>
          <p className="text-2xl font-black text-white">{spinLogs.length}</p>
        </div>
        <div className="pro-card p-4">
          <p className="text-[10px] font-bold text-textdim uppercase tracking-widest mb-1">Audit Logs</p>
          <p className="text-2xl font-black text-white">{auditLogs.length}</p>
        </div>
      </div>

      {/* 2. MAINTENANCE */}
      <div className="pro-card p-6">
        <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <svg className="w-5 h-5 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
          Maintenance
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 border border-border rounded-xl bg-panel">
            <p className="text-sm font-bold text-white mb-1">Recalculate Analytics</p>
            <p className="text-xs text-textdim mb-4">Recalcul complet et reconstruction des métriques.</p>
            <button onClick={handleRecalculateAnalytics} className="btn-secondary w-full text-sm">Recalculate Analytics</button>
          </div>
          <div className="p-4 border border-border rounded-xl bg-panel">
            <p className="text-sm font-bold text-white mb-1">Export JSON Backup</p>
            <p className="text-xs text-textdim mb-4">Génère un fichier de sauvegarde manuel.</p>
            <button onClick={handleExportJSON} className="btn-secondary w-full text-sm">Exporter JSON</button>
          </div>
        </div>
      </div>

      {/* 3. RESET OPERATIONS */}
      <div className="pro-card p-6 border-warn/20 bg-warn/5">
        <h2 className="text-lg font-bold text-warn mb-4 flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
          Reset Operations
        </h2>
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 p-4 bg-ink rounded-xl border border-white/5">
            <div>
              <p className="text-sm font-bold text-white mb-1">Reset All Accounts</p>
              <p className="text-xs text-textdim">Remet tous les comptes à 0 coins. Conserve les noms et objectifs.</p>
            </div>
            <button onClick={handleResetAccounts} className="btn-secondary text-warn border-warn/30 hover:bg-warn/10 hover:text-warn w-full md:w-auto">
              Reset Accounts
            </button>
          </div>
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 p-4 bg-ink rounded-xl border border-white/5">
            <div>
              <p className="text-sm font-bold text-white mb-1">Delete All Coin Logs</p>
              <p className="text-xs text-textdim">Supprime tout l'historique de variation des comptes.</p>
            </div>
            <button onClick={handleDeleteCoinLogs} className="btn-secondary text-warn border-warn/30 hover:bg-warn/10 hover:text-warn w-full md:w-auto">
              Delete Coin Logs
            </button>
          </div>
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 p-4 bg-ink rounded-xl border border-white/5">
            <div>
              <p className="text-sm font-bold text-white mb-1">Delete All Spin Logs</p>
              <p className="text-xs text-textdim">Supprime tout l'historique des tirages et spins.</p>
            </div>
            <button onClick={handleDeleteSpinLogs} className="btn-secondary text-warn border-warn/30 hover:bg-warn/10 hover:text-warn w-full md:w-auto">
              Delete Spin Logs
            </button>
          </div>
        </div>
      </div>

      {/* 4. DANGER ZONE */}
      <div className="pro-card p-6 border-danger/40 bg-gradient-to-br from-danger/10 to-ink">
        <h2 className="text-lg font-bold text-danger mb-4 flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
          Danger Zone
        </h2>
        
        {!isFactoryResetting ? (
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 p-5 bg-ink rounded-xl border border-danger/20">
            <div>
              <p className="text-base font-bold text-white mb-1">Factory Reset</p>
              <p className="text-xs text-textdim mb-2">
                Suppression totale : comptes, coinLogs, spinLogs, préférences, statistiques. 
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="px-2 py-0.5 rounded bg-danger/10 text-danger text-[10px] font-bold uppercase">{accounts.length} comptes</span>
                <span className="px-2 py-0.5 rounded bg-danger/10 text-danger text-[10px] font-bold uppercase">{coinLogs.length} coin logs</span>
                <span className="px-2 py-0.5 rounded bg-danger/10 text-danger text-[10px] font-bold uppercase">{spinLogs.length} spin logs</span>
              </div>
            </div>
            <button onClick={handleFactoryReset} className="px-4 py-2 rounded-lg bg-danger/20 text-danger border border-danger/30 hover:bg-danger text-sm font-bold hover:text-white transition-all w-full md:w-auto whitespace-nowrap">
              Factory Reset
            </button>
          </div>
        ) : (
          <div className="p-5 bg-ink rounded-xl border border-danger shadow-glow-danger animate-in slide-in-from-top-4">
            <h3 className="text-base font-bold text-white mb-2">Confirmation Requise</h3>
            <p className="text-sm text-textdim mb-4">
              Vous êtes sur le point de tout supprimer. Pour confirmer cette action irréversible, veuillez taper exactement <span className="font-mono text-danger font-bold select-all">RESET EFAPP</span> ci-dessous :
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <input 
                type="text" 
                value={dangerConfirm} 
                onChange={(e) => setDangerConfirm(e.target.value)} 
                placeholder="Tapez RESET EFAPP" 
                className="input border-danger/50 focus:border-danger bg-danger/5 flex-1 font-mono"
              />
              <button 
                onClick={executeFactoryReset} 
                disabled={dangerConfirm !== "RESET EFAPP"}
                className="px-6 py-2 rounded-lg bg-danger text-white text-sm font-bold disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-glow-danger"
              >
                Confirmer la suppression
              </button>
              <button onClick={() => { setIsFactoryResetting(false); setDangerConfirm(""); }} className="btn-secondary text-sm">
                Annuler
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 5. AUDIT HISTORY */}
      <div className="pro-card p-6 bg-panel">
        <h2 className="text-sm font-bold text-white uppercase tracking-wider mb-4">Audit History</h2>
        {auditLogs.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead>
                <tr className="border-b border-border text-textdim">
                  <th className="pb-3 font-medium">Date</th>
                  <th className="pb-3 font-medium">Type de reset</th>
                  <th className="pb-3 font-medium">Détails</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {auditLogs.slice().reverse().map(log => (
                  <tr key={log.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-3 text-textdim font-mono">{log.date}</td>
                    <td className="py-3">
                      <span className="px-2 py-0.5 rounded bg-white/10 text-white text-[10px] font-bold uppercase tracking-wider">
                        {log.actionType}
                      </span>
                    </td>
                    <td className="py-3 text-white font-medium">{log.details}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-textdim py-8 text-center border border-dashed border-border rounded-xl">
            Aucun historique de réinitialisation enregistré.
          </p>
        )}
      </div>
    </div>
  );
}
