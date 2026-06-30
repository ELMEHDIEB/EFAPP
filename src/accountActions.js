import { db } from "./db";

const today = () => new Date().toISOString().slice(0, 10);

/** Create a new account. Throws if name is empty or already used. */
export async function createAccount({ name, currentCoins = 0, targetCoins = 900, weeklyLimit = 0, groupTag = "" }) {
  const trimmed = name.trim();
  if (!trimmed) throw new Error("Le nom du compte est requis.");

  const existing = await db.accounts.where("name").equalsIgnoreCase(trimmed).first();
  if (existing) throw new Error(`Un compte nommé "${trimmed}" existe déjà.`);

  const id = await db.accounts.add({
    name: trimmed,
    currentCoins: Number(currentCoins) || 0,
    targetCoins: Number(targetCoins) || 900,
    weeklyLimit: Number(weeklyLimit) || 0,
    groupTag: groupTag.trim(),
    createdAt: today(),
    totalGrowth: Number(currentCoins) || 0,
    totalDecline: 0,
    lastTransactionDiff: Number(currentCoins) || 0
  });

  if (Number(currentCoins) > 0) {
    await db.coinLogs.add({
      accountId: id,
      date: today(),
      createdAt: new Date().toISOString(),
      action: "SET_BALANCE",
      reason: "Solde initial",
      amount: Number(currentCoins),
      previousBalance: 0,
      newBalance: Number(currentCoins),
    });
  }

  return id;
}

/** Rename / retarget an account without touching its balance. */
export async function updateAccountInfo(id, { name, targetCoins, weeklyLimit, groupTag }) {
  await db.accounts.update(id, {
    name: name.trim(),
    targetCoins: Number(targetCoins) || 900,
    weeklyLimit: Number(weeklyLimit) || 0,
    groupTag: (groupTag || "").trim(),
  });
}

/**
 * The ONLY function allowed to change an account's coin balance.
 * Always writes a matching coin_logs entry so balance and history
 * never drift apart. action: "ADD" | "REMOVE" | "SET_BALANCE"
 */
export async function applyCoinChange(accountId, { action, reason, amount, linkedSpinId }) {
  const account = await db.accounts.get(accountId);
  if (!account) throw new Error("Compte introuvable.");

  const amt = Number(amount);
  if (!Number.isFinite(amt) || amt < 0) throw new Error("Montant invalide.");
  if (amt > 1000000) throw new Error("Le montant ne peut pas dépasser 1 000 000.");

  let newBalance;
  if (action === "ADD") {
    newBalance = account.currentCoins + amt;
    if (newBalance > 1000000) throw new Error("Le solde total ne peut pas dépasser 1 000 000.");
  }
  else if (action === "REMOVE") {
    if (amt > account.currentCoins) throw new Error("Le solde ne peut pas devenir négatif.");
    newBalance = account.currentCoins - amt;
  } else if (action === "SET_BALANCE") {
    newBalance = amt;
  } else throw new Error("Action inconnue.");

  const diff = newBalance - account.currentCoins;
  let totalGrowth = account.totalGrowth || 0;
  let totalDecline = account.totalDecline || 0;
  
  if (diff > 0) totalGrowth += diff;
  if (diff < 0) totalDecline += Math.abs(diff);

  await db.transaction("rw", db.accounts, db.coinLogs, async () => {
    await db.accounts.update(accountId, { 
      currentCoins: newBalance,
      totalGrowth,
      totalDecline,
      lastTransactionDiff: diff
    });
    await db.coinLogs.add({
      accountId,
      date: today(),
      createdAt: new Date().toISOString(),
      action,
      reason: reason || "Ajustement manuel",
      amount: amt,
      previousBalance: account.currentCoins,
      newBalance,
      linkedSpinId: linkedSpinId || null
    });
  });

  return newBalance;
}

export async function deleteAccount(id) {
  await db.transaction("rw", db.accounts, db.coinLogs, async () => {
    await db.coinLogs.where("accountId").equals(id).delete();
    await db.accounts.delete(id);
  });
}

export function progressPercent(account) {
  if (!account.targetCoins) return 0;
  return Math.min(100, Math.round((account.currentCoins / account.targetCoins) * 100));
}

/**
 * Undo the last action (coinLog) for a given account.
 * Reverts the balance, deletes the log, and if it was a spin, deletes the spin log too.
 */
export async function undoLastAction(accountId) {
  return await db.transaction("rw", db.accounts, db.coinLogs, db.spinLogs, db.spinPlayers, db.regretLogs, async () => {
    const account = await db.accounts.get(accountId);
    if (!account) throw new Error("Compte introuvable.");

    const logs = await db.coinLogs.where("accountId").equals(accountId).toArray();
    if (logs.length === 0) throw new Error("Aucun historique à annuler.");
    
    // Dexie auto-increments id, so the last element in the array sorted by id (or insertion order) is the latest.
    // toArray() returns them in order of the primary key (id).
    const lastLog = logs[logs.length - 1];

    if (lastLog.action === "SET_BALANCE" && logs.length === 1) {
      throw new Error("Impossible d'annuler le solde initial.");
    }

    // Revert growth/decline
    const diff = lastLog.newBalance - lastLog.previousBalance;
    let totalGrowth = account.totalGrowth || 0;
    let totalDecline = account.totalDecline || 0;
    
    if (diff > 0) totalGrowth = Math.max(0, totalGrowth - diff);
    if (diff < 0) totalDecline = Math.max(0, totalDecline - Math.abs(diff));
    
    const previousLog = logs.length > 1 ? logs[logs.length - 2] : null;
    const lastTransactionDiff = previousLog ? (previousLog.newBalance - previousLog.previousBalance) : 0;

    await db.accounts.update(accountId, { 
      currentCoins: lastLog.previousBalance,
      totalGrowth,
      totalDecline,
      lastTransactionDiff
    });
    await db.coinLogs.delete(lastLog.id);

    // Revert Spin if applicable
    if (lastLog.action === "REMOVE" && lastLog.reason.startsWith("Spin —")) {
      let targetSpinId = lastLog.linkedSpinId;
      
      // Backward compatibility fallback for historical spins
      if (!targetSpinId) {
        const spins = await db.spinLogs.where("accountId").equals(accountId).toArray();
        if (spins.length > 0) {
          const lastSpin = spins[spins.length - 1];
          if (lastSpin.coinsSpent === lastLog.amount) {
            targetSpinId = lastSpin.id;
          }
        }
      }

      if (targetSpinId) {
        await db.spinPlayers.where({ spinId: targetSpinId }).delete();
        await db.regretLogs.where({ spinId: targetSpinId }).delete();
        await db.spinLogs.delete(targetSpinId);
      }
    }

    return lastLog.previousBalance;
  });
}

/**
 * Reset all accounts back to 0 coins using applyCoinChange
 * This preserves history and analytics coherence.
 */
export async function resetAllAccounts() {
  const allAccounts = await db.accounts.toArray();
  let count = 0;
  for (const acc of allAccounts) {
    if (acc.currentCoins > 0) {
      await applyCoinChange(acc.id, {
        action: "SET_BALANCE",
        reason: "Master Reset",
        amount: 0
      });
      count++;
    }
  }
  return count;
}
