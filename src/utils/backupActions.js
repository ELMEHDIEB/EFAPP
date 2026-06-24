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

/**
 * Creates a full backup of all IndexedDB tables.
 * Stores backup metadata in settings for tracking.
 * Returns the backup Blob.
 */
export async function createBackup() {
  const dump = {};
  for (const t of TABLES) {
    if (db[t]) dump[t] = await db[t].toArray();
  }

  const jsonStr = JSON.stringify(dump, null, 2);
  const blob = new Blob([jsonStr], { type: "application/json" });

  // Count total records
  let totalRecords = 0;
  for (const t of TABLES) {
    if (dump[t]) totalRecords += dump[t].length;
  }

  // Store backup metadata
  const meta = await getBackupMeta();
  const newMeta = {
    lastBackupDate: new Date().toISOString(),
    backupCount: (meta.backupCount || 0) + 1,
    backupSize: blob.size,
    totalRecords,
    tableSnapshot: {}
  };

  for (const t of TABLES) {
    newMeta.tableSnapshot[t] = dump[t] ? dump[t].length : 0;
  }

  await db.settings.put({ key: "backupMeta", value: newMeta });

  // Log the backup action
  await db.auditLogs.add({
    date: new Date().toISOString().slice(0, 10),
    actionType: "BACKUP_CREATED",
    details: `Backup created: ${totalRecords} records, ${formatBytes(blob.size)}`
  });

  return blob;
}

/**
 * Triggers a backup save.
 * Uses native Electron IPC if available, otherwise falls back to browser download.
 */
export async function downloadBackup(blob) {
  if (window.electronAPI?.saveBackup) {
    try {
      const jsonStr = await blob.text();
      const result = await window.electronAPI.saveBackup(jsonStr);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.path; // Return path if successful
    } catch (err) {
      console.error("Desktop backup failed, falling back to browser download", err);
      triggerBrowserDownload(blob);
    }
  } else {
    triggerBrowserDownload(blob);
  }
}

function triggerBrowserDownload(blob) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `efapp-backup-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Restores data from a JSON backup file.
 * Replaces ALL current data.
 */
export async function restoreBackup(file) {
  const text = await file.text();
  const dump = JSON.parse(text);

  // Validate structure
  const validTables = TABLES.filter(t => Array.isArray(dump[t]));
  if (validTables.length === 0) {
    throw new Error("Invalid backup file: no valid tables found.");
  }

  await db.transaction("rw", TABLES.map(t => db[t]), async () => {
    for (const t of TABLES) {
      await db[t].clear();
      if (Array.isArray(dump[t]) && dump[t].length > 0) {
        await db[t].bulkAdd(dump[t]);
      }
    }
  });

  // Log restore action
  await db.auditLogs.add({
    date: new Date().toISOString().slice(0, 10),
    actionType: "BACKUP_RESTORED",
    details: `Backup restored: ${validTables.length} tables imported`
  });

  return validTables.length;
}

/**
 * Verifies backup health by comparing stored snapshot
 * against current table counts.
 */
export async function verifyBackup() {
  const meta = await getBackupMeta();

  if (!meta.lastBackupDate) {
    return { health: "Missing", details: "No backup has been created yet." };
  }

  if (!meta.tableSnapshot) {
    return { health: "Warning", details: "Backup metadata incomplete." };
  }

  // Check if data has changed significantly since last backup
  let driftCount = 0;
  const driftDetails = [];

  for (const t of TABLES) {
    if (db[t]) {
      const currentCount = await db[t].count();
      const snapshotCount = meta.tableSnapshot[t] || 0;
      const diff = Math.abs(currentCount - snapshotCount);
      if (diff > 0) {
        driftCount += diff;
        driftDetails.push(`${t}: ${snapshotCount} → ${currentCount}`);
      }
    }
  }

  // Check backup age
  const backupAge = Date.now() - new Date(meta.lastBackupDate).getTime();
  const daysSinceBackup = Math.floor(backupAge / 86400000);

  if (driftCount === 0 && daysSinceBackup < 7) {
    return { health: "Healthy", details: "Backup is up-to-date and matches current data." };
  }

  if (daysSinceBackup > 30 || driftCount > 50) {
    return {
      health: "Warning",
      details: `Backup is ${daysSinceBackup} days old. ${driftCount} records have changed.`,
      driftDetails
    };
  }

  return {
    health: "Healthy",
    details: `Backup is ${daysSinceBackup} day(s) old. ${driftCount} record(s) changed since last backup.`,
    driftDetails
  };
}

/**
 * Returns the current backup status metadata.
 */
export async function getBackupStatus() {
  const meta = await getBackupMeta();
  const verification = await verifyBackup();

  return {
    lastBackupDate: meta.lastBackupDate || null,
    backupCount: meta.backupCount || 0,
    backupSize: meta.backupSize || 0,
    health: verification.health,
    healthDetails: verification.details
  };
}

/**
 * Internal helper to read backup metadata from settings.
 */
async function getBackupMeta() {
  const entry = await db.settings.get("backupMeta");
  return entry?.value || {};
}

/**
 * Format bytes to human-readable string.
 */
export function formatBytes(bytes) {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}
