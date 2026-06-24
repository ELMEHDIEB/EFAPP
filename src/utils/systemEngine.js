import { db } from "../db.js";

/**
 * Returns storage insights: record counts per table,
 * estimated IndexedDB size, and composition percentages.
 */
export async function getStorageInsights() {
  const counts = {
    accounts: await db.accounts.count(),
    coinLogs: await db.coinLogs.count(),
    spinLogs: await db.spinLogs.count(),
    spinPlayers: await db.spinPlayers.count(),
    regretLogs: await db.regretLogs.count(),
    emotionalLogs: await db.emotionalLogs.count(),
    notifications: await db.notifications.count(),
    settings: await db.settings.count(),
    auditLogs: await db.auditLogs.count(),
  };

  // Estimate IndexedDB size
  let estimatedSize = 0;
  let storageQuota = 0;
  if (navigator.storage && navigator.storage.estimate) {
    try {
      const estimate = await navigator.storage.estimate();
      estimatedSize = estimate.usage || 0;
      storageQuota = estimate.quota || 0;
    } catch { /* fallback: 0 */ }
  }

  // Compute composition for the 4 main categories
  const mainCounts = {
    accounts: counts.accounts,
    coinLogs: counts.coinLogs,
    spinLogs: counts.spinLogs,
    auditLogs: counts.auditLogs,
  };

  const totalMain = Object.values(mainCounts).reduce((s, v) => s + v, 0);
  const composition = {};
  for (const [key, val] of Object.entries(mainCounts)) {
    composition[key] = totalMain > 0 ? Math.round((val / totalMain) * 100) : 0;
  }

  const totalRecords = Object.values(counts).reduce((s, v) => s + v, 0);

  return {
    counts,
    totalRecords,
    estimatedSize,
    storageQuota,
    composition,
  };
}

/**
 * Computes recovery readiness based on real settings data.
 * Returns { checks, score, label, color }.
 */
export function getRecoveryReadiness(settingsArray) {
  const pinSetting = settingsArray?.find(s => s.key === "pinLock");
  const recoverySetting = settingsArray?.find(s => s.key === "recoveryHash");
  const backupMeta = settingsArray?.find(s => s.key === "backupMeta");

  const checks = [
    {
      label: "PIN Enabled",
      enabled: !!(pinSetting?.value),
      icon: "M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8V7a4 4 0 00-8 0v4h8z",
    },
    {
      label: "Recovery Phrase",
      enabled: !!(recoverySetting?.value),
      icon: "M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z",
    },
    {
      label: "Backup Available",
      enabled: !!(backupMeta?.value?.lastBackupDate),
      icon: "M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10",
    },
  ];

  const enabledCount = checks.filter(c => c.enabled).length;

  let label, color;
  if (enabledCount === 3) { label = "Excellent"; color = "text-accent"; }
  else if (enabledCount === 2) { label = "Good"; color = "text-blue-400"; }
  else if (enabledCount === 1) { label = "Average"; color = "text-warn"; }
  else { label = "Poor"; color = "text-danger"; }

  return { checks, score: enabledCount, total: 3, label, color };
}

/**
 * Computes the System Health score (0-100).
 * Based on: Build Status, Database Status, Storage Status, Recovery Status.
 */
export async function getSystemHealth(settingsArray) {
  const components = [];

  // 1. Build Status (25 pts) — client-side app, always operational
  components.push({
    label: "Build Status",
    status: "Operational",
    score: 25,
    maxScore: 25,
    color: "text-accent",
  });

  // 2. Database Status (25 pts) — check if tables are accessible
  let dbScore = 25;
  let dbStatus = "Operational";
  try {
    const accountCount = await db.accounts.count();
    const coinLogCount = await db.coinLogs.count();
    // Check coherence: if there are coin logs but no accounts, that's inconsistent
    if (coinLogCount > 0 && accountCount === 0) {
      dbScore = 15;
      dbStatus = "Degraded";
    }
  } catch {
    dbScore = 0;
    dbStatus = "Error";
  }
  components.push({
    label: "Database Status",
    status: dbStatus,
    score: dbScore,
    maxScore: 25,
    color: dbScore >= 25 ? "text-accent" : dbScore >= 15 ? "text-warn" : "text-danger",
  });

  // 3. Storage Status (25 pts)
  let storageScore = 25;
  let storageStatus = "Healthy";
  try {
    if (navigator.storage && navigator.storage.estimate) {
      const estimate = await navigator.storage.estimate();
      const usageRatio = (estimate.usage || 0) / (estimate.quota || 1);
      if (usageRatio > 0.9) {
        storageScore = 5;
        storageStatus = "Critical";
      } else if (usageRatio > 0.7) {
        storageScore = 15;
        storageStatus = "Warning";
      }
    }
  } catch {
    storageScore = 20;
    storageStatus = "Unknown";
  }
  components.push({
    label: "Storage Status",
    status: storageStatus,
    score: storageScore,
    maxScore: 25,
    color: storageScore >= 25 ? "text-accent" : storageScore >= 15 ? "text-warn" : "text-danger",
  });

  // 4. Recovery Status (25 pts)
  const recovery = getRecoveryReadiness(settingsArray);
  const recoveryScore = Math.round((recovery.score / recovery.total) * 25);
  const recoveryStatus = recovery.label;
  components.push({
    label: "Recovery Status",
    status: recoveryStatus,
    score: recoveryScore,
    maxScore: 25,
    color: recoveryScore >= 25 ? "text-accent" : recoveryScore >= 17 ? "text-blue-400" : recoveryScore >= 8 ? "text-warn" : "text-danger",
  });

  const totalScore = components.reduce((s, c) => s + c.score, 0);

  return { score: totalScore, components };
}

/**
 * Generates contextual recommendations based on real app state.
 * Only returns recommendations that are relevant (unmet conditions).
 */
export function getRecommendations(settingsArray, accounts, coinLogs, auditLogs) {
  const recommendations = [];

  const pinSetting = settingsArray?.find(s => s.key === "pinLock");
  const recoverySetting = settingsArray?.find(s => s.key === "recoveryHash");
  const backupMeta = settingsArray?.find(s => s.key === "backupMeta");

  // 1. PIN not enabled
  if (!pinSetting?.value) {
    recommendations.push({
      id: "enable_pin",
      icon: "M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8V7a4 4 0 00-8 0v4h8z",
      title: "Enable PIN protection",
      description: "Protect your data with a PIN lock at startup.",
      priority: "high",
      action: "/settings",
    });
  }

  // 2. No backup exists
  if (!backupMeta?.value?.lastBackupDate) {
    recommendations.push({
      id: "create_backup",
      icon: "M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10",
      title: "Create a backup",
      description: "No backup exists. Create one to protect your data.",
      priority: "high",
      action: "/settings/data-management",
    });
  } else {
    // Check backup age
    const backupAge = Date.now() - new Date(backupMeta.value.lastBackupDate).getTime();
    const daysSince = Math.floor(backupAge / 86400000);
    if (daysSince > 7) {
      recommendations.push({
        id: "update_backup",
        icon: "M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15",
        title: "Update your backup",
        description: `Your last backup is ${daysSince} days old. Consider creating a fresh one.`,
        priority: "medium",
        action: "/settings/data-management",
      });
    }
  }

  // 3. No recovery phrase
  if (!recoverySetting?.value) {
    recommendations.push({
      id: "recovery_phrase",
      icon: "M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z",
      title: "Configure recovery phrase",
      description: "Set up a recovery phrase in case you forget your PIN.",
      priority: "high",
      action: "/settings",
    });
  }

  // 4. Old logs (>100 entries older than 90 days)
  if (coinLogs && coinLogs.length > 0) {
    const ninetyDaysAgo = new Date(Date.now() - 90 * 86400000).toISOString().slice(0, 10);
    const oldLogs = coinLogs.filter(l => l.date < ninetyDaysAgo);
    if (oldLogs.length > 100) {
      recommendations.push({
        id: "clean_logs",
        icon: "M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16",
        title: "Clean old logs",
        description: `${oldLogs.length} coin log entries are older than 90 days. Consider archiving or cleaning.`,
        priority: "low",
        action: "/settings/data-management",
      });
    }
  }

  // 5. Accounts below 300 coins
  if (accounts && accounts.length > 0) {
    const lowAccounts = accounts.filter(a => a.currentCoins < 300);
    if (lowAccounts.length > 0) {
      recommendations.push({
        id: "low_accounts",
        icon: "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z",
        title: "Top up low accounts",
        description: `${lowAccounts.length} account(s) have less than 300 coins.`,
        priority: "medium",
        action: "/accounts",
      });
    }
  }

  // 6. No accounts created
  if (!accounts || accounts.length === 0) {
    recommendations.push({
      id: "create_accounts",
      icon: "M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z",
      title: "Create your first account",
      description: "Start by adding an eFootball account to track.",
      priority: "high",
      action: "/accounts",
    });
  }

  return recommendations;
}
