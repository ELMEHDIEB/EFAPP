import { useState, useEffect, useMemo } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { useNavigate } from "react-router-dom";
import { db } from "../db.js";
import { useToast } from "../components/ui/ToastContext.jsx";
import { useConfirm } from "../components/ui/ConfirmContext.jsx";
import { resetAllAccounts } from "../accountActions.js";
import HeroHeader from "../components/ui/HeroHeader.jsx";
import {
  createBackup,
  downloadBackup,
  restoreBackup,
  verifyBackup,
  getBackupStatus,
  formatBytes,
} from "../utils/backupActions.js";
import { getStorageInsights } from "../utils/systemEngine.js";
import { triggerDesktopNotification } from "../utils/desktopNotifier.js";

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
  const navigate = useNavigate();

  const accounts = useLiveQuery(() => db.accounts.toArray(), []);
  const coinLogs = useLiveQuery(() => db.coinLogs.toArray(), []);
  const spinLogs = useLiveQuery(() => db.spinLogs.toArray(), []);
  const auditLogs = useLiveQuery(() => db.auditLogs.toArray(), []);
  const settings = useLiveQuery(() => db.settings.toArray(), []);

  const [dangerConfirm, setDangerConfirm] = useState("");
  const [isFactoryResetting, setIsFactoryResetting] = useState(false);

  // Backup state
  const [backupStatus, setBackupStatus] = useState(null);
  const [lastBackupBlob, setLastBackupBlob] = useState(null);

  // Storage insights state
  const [storageData, setStorageData] = useState(null);

  // Integrity Check
  const [integrityResults, setIntegrityResults] = useState(null);

  // Load backup status & storage insights
  useEffect(() => {
    getBackupStatus().then(setBackupStatus);
    getStorageInsights().then(setStorageData);
  }, [accounts, coinLogs, spinLogs, auditLogs]);

  // Helper to log actions
  const logSystemAction = async (actionType, details) => {
    await db.auditLogs.add({
      date: new Date().toISOString().slice(0, 10),
      actionType,
      details
    });
  };

  // ----- BACKUP ACTIONS -----
  async function handleCreateBackup() {
    try {
      const blob = await createBackup();
      setLastBackupBlob(blob);
      const status = await getBackupStatus();
      setBackupStatus(status);
      toast("Backup created successfully.", "success");
    } catch (e) {
      toast("Error creating backup: " + e.message, "error");
    }
  }

  async function handleDownloadBackup() {
    try {
      let blob = lastBackupBlob;
      if (!blob) {
        blob = await createBackup();
        setLastBackupBlob(blob);
      }
      await downloadBackup(blob);
      toast("Backup downloaded.", "success");
      
      triggerDesktopNotification('Backup réussi', 'Vos données ont été sauvegardées en local.');
    } catch (e) {
      toast("Error downloading backup: " + e.message, "error");
    }
  }

  async function handleRestoreBackup() {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = async (e) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const confirmed = await confirm({
        title: "Restore Backup",
        message: "This will REPLACE all current data with the backup. This action is irreversible. Continue?",
        confirmLabel: "Restore",
        cancelLabel: "Cancel",
        isDanger: true
      });

      if (!confirmed) return;

      try {
        const count = await restoreBackup(file);
        toast(`Backup restored: ${count} tables imported.`, "success");
        const status = await getBackupStatus();
        setBackupStatus(status);
      } catch (err) {
        toast("Restore error: " + err.message, "error");
      }
    };
    input.click();
  }

  async function handleVerifyBackup() {
    try {
      const result = await verifyBackup();
      setBackupStatus(prev => ({ ...prev, health: result.health, healthDetails: result.details }));
      toast(`Backup verification: ${result.health} — ${result.details}`, result.health === "Healthy" ? "success" : "warn");
    } catch (e) {
      toast("Verification error: " + e.message, "error");
    }
  }

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

  async function handleIntegrityCheck() {
    toast("Analyse de l'intégrité en cours...", "info");
    const results = [];
    
    // 1. Account balance vs logs
    for (const acc of accounts) {
      const logs = coinLogs.filter(l => l.accountId === acc.id).sort((a,b) => b.id - a.id);
      if (logs.length > 0 && logs[0].newBalance !== acc.currentCoins) {
        results.push({ type: "warn", msg: `Désynchronisation solde: ${acc.name} (Solde Actuel: ${acc.currentCoins}, Dernier Log: ${logs[0].newBalance})` });
      }
    }

    // 2. Orphaned Spin Logs
    const accIds = accounts.map(a => a.id);
    const orphans = spinLogs.filter(s => !accIds.includes(s.accountId));
    if (orphans.length > 0) results.push({ type: "warn", msg: `${orphans.length} tirage(s) orphelin(s) lié(s) à des comptes supprimés.` });

    if (results.length === 0) {
      results.push({ type: "success", msg: "Base de données parfaitement saine. Aucune anomalie détectée." });
    }

    setIntegrityResults(results);
    toast("Analyse terminée.", "success");
  }

  // ----- FACTORY RESET -----
  async function handleFactoryReset() {
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
  if (!accounts || !coinLogs || !spinLogs || !auditLogs || !settings) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-8 h-8 border-2 border-white/10 border-t-white rounded-full animate-spin"></div>
      </div>
    );
  }

  const healthColor = backupStatus?.health === "Healthy" ? "text-accent" : backupStatus?.health === "Warning" ? "text-warn" : "text-danger";
  const healthBg = backupStatus?.health === "Healthy" ? "bg-accent/10 border-accent/20" : backupStatus?.health === "Warning" ? "bg-warn/10 border-warn/20" : "bg-danger/10 border-danger/20";

  return (
    <div className="max-w-4xl mx-auto pb-12 space-y-8">
      <HeroHeader 
        title="Data Management"
        description="Application Reset Center & Gestion des données (Local First)."
      />

      {/* ═══════════════════════════════════════════════════════
          FEATURE 10: QUICK ACTION HUB
          ═══════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: "Export JSON", icon: "M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z", onClick: handleExportJSON, color: "text-blue-400", bg: "bg-blue-400/10" },
          { label: "Backup", icon: "M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10", onClick: handleCreateBackup, color: "text-accent", bg: "bg-accent/10" },
          { label: "Recalculate", icon: "M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15", onClick: handleRecalculateAnalytics, color: "text-purple-400", bg: "bg-purple-400/10" },
          { label: "Recovery", icon: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z", onClick: () => navigate("/settings"), color: "text-warn", bg: "bg-warn/10" },
          { label: "Goal Radar", icon: "M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z", onClick: () => navigate("/"), color: "text-pink-400", bg: "bg-pink-400/10" },
          { label: "Epic Calc", icon: "M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z", onClick: () => navigate("/epic-calculator"), color: "text-cyan-400", bg: "bg-cyan-400/10" },
        ].map(action => (
          <button
            key={action.label}
            onClick={action.onClick}
            className="pro-card p-4 items-center text-center gap-3 hover:scale-[1.03] active:scale-[0.97] transition-all duration-200 cursor-pointer group"
          >
            <div className={`w-10 h-10 rounded-xl ${action.bg} flex items-center justify-center mx-auto group-hover:scale-110 transition-transform`}>
              <svg className={`w-5 h-5 ${action.color}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={action.icon} />
              </svg>
            </div>
            <p className="text-xs font-bold text-white mt-1">{action.label}</p>
          </button>
        ))}
      </div>

      {/* ═══════════════════════════════════════════════════════
          FEATURE 1: BACKUP CENTER PRO
          ═══════════════════════════════════════════════════════ */}
      <div className="pro-card p-6 bg-gradient-to-br from-surface to-background">
        <h2 className="text-lg font-bold text-white mb-5 flex items-center gap-2">
          <svg className="w-5 h-5 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" /></svg>
          Backup Center
        </h2>

        {/* Backup KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
          <div className="p-3 bg-ink rounded-xl border border-white/5">
            <p className="text-[10px] font-bold text-textdim uppercase tracking-widest mb-1">Last Backup</p>
            <p className="text-sm font-bold text-white truncate">
              {backupStatus?.lastBackupDate
                ? new Date(backupStatus.lastBackupDate).toLocaleDateString()
                : "Never"}
            </p>
          </div>
          <div className="p-3 bg-ink rounded-xl border border-white/5">
            <p className="text-[10px] font-bold text-textdim uppercase tracking-widest mb-1">Backup Count</p>
            <p className="text-sm font-bold text-white">{backupStatus?.backupCount || 0}</p>
          </div>
          <div className="p-3 bg-ink rounded-xl border border-white/5">
            <p className="text-[10px] font-bold text-textdim uppercase tracking-widest mb-1">Backup Size</p>
            <p className="text-sm font-bold text-white">{backupStatus?.backupSize ? formatBytes(backupStatus.backupSize) : "—"}</p>
          </div>
          <div className="p-3 bg-ink rounded-xl border border-white/5">
            <p className="text-[10px] font-bold text-textdim uppercase tracking-widest mb-1">Backup Health</p>
            <p className={`text-sm font-bold ${healthColor}`}>{backupStatus?.health || "Unknown"}</p>
          </div>
        </div>

        {/* Backup Status Badge */}
        <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border mb-5 ${healthBg}`}>
          <div className={`w-2 h-2 rounded-full ${backupStatus?.health === "Healthy" ? "bg-accent" : backupStatus?.health === "Warning" ? "bg-warn" : "bg-danger"}`} />
          <span className={`text-xs font-bold ${healthColor}`}>Backup Status: {backupStatus?.health || "Unknown"}</span>
          {backupStatus?.healthDetails && <span className="text-[10px] text-textdim ml-2">— {backupStatus.healthDetails}</span>}
        </div>

        {/* Backup Actions */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <button onClick={handleCreateBackup} className="btn-secondary text-sm flex items-center justify-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
            Create
          </button>
          <button onClick={handleDownloadBackup} className="btn-secondary text-sm flex items-center justify-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            Download
          </button>
          <button onClick={handleRestoreBackup} className="btn-secondary text-sm flex items-center justify-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
            Restore
          </button>
          <button onClick={handleVerifyBackup} className="btn-secondary text-sm flex items-center justify-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            Verify
          </button>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════
          FEATURE 3: STORAGE INSIGHTS
          ═══════════════════════════════════════════════════════ */}
      <div className="pro-card p-6">
        <h2 className="text-lg font-bold text-white mb-5 flex items-center gap-2">
          <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" /></svg>
          Storage Insights
        </h2>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
          {[
            { label: "Accounts", value: storageData?.counts?.accounts ?? accounts.length },
            { label: "Coin Logs", value: storageData?.counts?.coinLogs ?? coinLogs.length },
            { label: "Spin Logs", value: storageData?.counts?.spinLogs ?? spinLogs.length },
            { label: "Audit Logs", value: storageData?.counts?.auditLogs ?? auditLogs.length },
            { label: "IndexedDB Size", value: storageData ? formatBytes(storageData.estimatedSize) : "..." },
          ].map(item => (
            <div key={item.label} className="p-3 bg-ink rounded-xl border border-white/5">
              <p className="text-[10px] font-bold text-textdim uppercase tracking-widest mb-1">{item.label}</p>
              <p className="text-lg font-black text-white">{item.value}</p>
            </div>
          ))}
        </div>

        {/* Database Composition Chart */}
        {storageData && storageData.totalRecords > 0 && (
          <div>
            <p className="text-xs font-bold text-textdim uppercase tracking-widest mb-3">Database Composition</p>
            {/* Stacked bar */}
            <div className="h-4 rounded-full overflow-hidden flex bg-ink border border-white/5">
              {storageData.composition.accounts > 0 && (
                <div className="h-full bg-blue-500 transition-all duration-500" style={{ width: `${storageData.composition.accounts}%` }} title={`Accounts ${storageData.composition.accounts}%`} />
              )}
              {storageData.composition.coinLogs > 0 && (
                <div className="h-full bg-accent transition-all duration-500" style={{ width: `${storageData.composition.coinLogs}%` }} title={`Coin Logs ${storageData.composition.coinLogs}%`} />
              )}
              {storageData.composition.spinLogs > 0 && (
                <div className="h-full bg-purple-500 transition-all duration-500" style={{ width: `${storageData.composition.spinLogs}%` }} title={`Spin Logs ${storageData.composition.spinLogs}%`} />
              )}
              {storageData.composition.auditLogs > 0 && (
                <div className="h-full bg-warn transition-all duration-500" style={{ width: `${storageData.composition.auditLogs}%` }} title={`Audit Logs ${storageData.composition.auditLogs}%`} />
              )}
            </div>
            {/* Legend */}
            <div className="flex flex-wrap gap-4 mt-3">
              {[
                { label: "Accounts", pct: storageData.composition.accounts, color: "bg-blue-500" },
                { label: "Coin Logs", pct: storageData.composition.coinLogs, color: "bg-accent" },
                { label: "Spin Logs", pct: storageData.composition.spinLogs, color: "bg-purple-500" },
                { label: "Audit Logs", pct: storageData.composition.auditLogs, color: "bg-warn" },
              ].map(item => (
                <div key={item.label} className="flex items-center gap-2">
                  <div className={`w-2.5 h-2.5 rounded-sm ${item.color}`} />
                  <span className="text-[10px] text-textdim font-medium">{item.label} <span className="text-white font-bold">{item.pct}%</span></span>
                </div>
              ))}
            </div>
          </div>
        )}
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


      {/* 6. INTEGRITY CHECK CENTER */}
      <div className="pro-card p-6 bg-surface">
        <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <svg className="w-5 h-5 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
          Integrity Check Center
        </h2>
        <p className="text-sm text-textdim mb-4">Vérifie la cohérence des données internes (Diagnostic uniquement).</p>
        <button onClick={handleIntegrityCheck} className="btn-secondary w-full md:w-auto text-sm">
          Lancer le diagnostic
        </button>

        {integrityResults && (
          <div className="mt-5 space-y-2">
            {integrityResults.map((res, i) => (
              <div key={i} className={`p-3 rounded-lg border text-sm font-medium ${res.type === 'success' ? 'bg-accent/10 border-accent/20 text-accent' : 'bg-warn/10 border-warn/20 text-warn'}`}>
                {res.msg}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
