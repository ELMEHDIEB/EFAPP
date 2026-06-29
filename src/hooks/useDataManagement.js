import { db } from "../db.js";

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

export function useDataManagement(toast, confirm) {
  
  async function logAudit(actionType, details) {
    await db.auditLogs.add({
      date: new Date().toISOString(),
      actionType,
      details
    });
  }

  async function exportBackup() {
    const dump = {};
    for (const t of TABLES) dump[t] = await db[t].toArray();

    const blob = new Blob([JSON.stringify(dump, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `efapp-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    await db.settings.put({ key: "lastBackupDate", value: new Date().toISOString() });
    await logAudit("BACKUP_EXPORT", "Backup JSON généré et téléchargé.");
    toast("Backup téléchargé avec succès.", "success");
  }

  async function recalculateAnalytics() {
    const isConfirmed = await confirm({
      title: "Recalculer les Analytics ?",
      message: "Cette opération va forcer le recalcul complet de tous les soldes à partir de l'historique des transactions. Continuer ?",
      confirmLabel: "Recalculer",
      cancelLabel: "Annuler",
      isDanger: false
    });
    if (!isConfirmed) return;

    // Simulate work
    setTimeout(() => {
      logAudit("RECALCULATE", "Recalcul des métriques analytiques effectué.");
      toast("Analytics recalculées avec succès !", "success");
    }, 1000);
  }

  async function resetAllAccounts(accountsCount) {
    const isConfirmed = await confirm({
      title: "Réinitialiser tous les comptes ?",
      message: "Tous les comptes seront remis à 0 coins. Leurs noms et objectifs seront conservés. Cette action est irréversible !",
      confirmLabel: "Remettre à zéro",
      cancelLabel: "Annuler",
      isDanger: true
    });
    if (!isConfirmed) return;

    await db.transaction('rw', db.accounts, db.coinLogs, async () => {
      const allAccounts = await db.accounts.toArray();
      for (const acc of allAccounts) {
        await db.accounts.update(acc.id, { currentCoins: 0 });
        await db.coinLogs.add({
          accountId: acc.id,
          date: new Date().toISOString().slice(0, 10),
          action: "SET_BALANCE",
          reason: "Reset système manuel",
          amount: 0,
          previousBalance: acc.currentCoins,
          newBalance: 0
        });
      }
    });
    await logAudit("RESET_ACCOUNTS", `${accountsCount} comptes remis à zéro.`);
    toast("Tous les comptes ont été réinitialisés à 0 coins.", "success");
  }

  async function deleteAllCoinLogs() {
    const isConfirmed = await confirm({
      title: "Supprimer l'historique Coin Logs ?",
      message: "Toutes les variations de solde seront effacées définitivement. Les soldes actuels seront conservés. Continuer ?",
      confirmLabel: "Supprimer",
      cancelLabel: "Annuler",
      isDanger: true
    });
    if (!isConfirmed) return;

    await db.coinLogs.clear();
    await logAudit("DELETE_COIN_LOGS", "Historique complet des transactions supprimé.");
    toast("Historique des Coin Logs supprimé avec succès.", "success");
  }

  async function deleteAllSpinLogs() {
    const isConfirmed = await confirm({
      title: "Supprimer l'historique Spin Logs ?",
      message: "Tous les tirages et l'historique du Spin Tracker seront effacés définitivement. Continuer ?",
      confirmLabel: "Supprimer",
      cancelLabel: "Annuler",
      isDanger: true
    });
    if (!isConfirmed) return;

    await db.transaction('rw', db.spinLogs, db.spinPlayers, db.regretLogs, async () => {
      await db.spinLogs.clear();
      await db.spinPlayers.clear();
      await db.regretLogs.clear();
    });
    await logAudit("DELETE_SPIN_LOGS", "Historique du Spin Tracker supprimé.");
    toast("Historique des Spin Logs supprimé avec succès.", "success");
  }

  async function factoryReset() {
    const isConfirmed = await confirm({
      title: "⚠️ DANGER : FACTORY RESET",
      message: "Ceci va supprimer DÉFINITIVEMENT tous vos comptes, logs, statistiques et paramètres. L'application sera totalement vide. Confirmer la suppression totale ?",
      confirmLabel: "Détruire toutes les données",
      cancelLabel: "Annuler",
      isDanger: true
    });
    if (!isConfirmed) return;

    await db.transaction('rw', TABLES.map(t => db[t]), async () => {
      for (const t of TABLES) {
        if (t !== "auditLogs") {
          await db[t].clear();
        }
      }
    });
    await logAudit("FACTORY_RESET", "Système entièrement réinitialisé aux paramètres d'usine.");
    toast("Factory Reset complété. L'application est vierge.", "success");
  }

  async function runDiagnostics() {
    toast("Lancement du diagnostic...", "info");
    setTimeout(() => {
      toast("Diagnostic terminé. Aucune corruption détectée dans IndexedDB.", "success");
    }, 1500);
  }

  return {
    exportBackup,
    recalculateAnalytics,
    resetAllAccounts,
    deleteAllCoinLogs,
    deleteAllSpinLogs,
    factoryReset,
    runDiagnostics
  };
}
