import { db } from "./db.js";
import { applyCoinChange } from "./accountActions.js";

const today = () => new Date().toISOString().slice(0, 10);

/**
 * createSpin: validate balance, deduct coins and write spin log atomically.
 */
export async function createSpin(accountId, { packName, coinsSpent, spins, satisfactionScore, wasPlanned, emotionBefore, emotionAfter, playerNames }) {
  const account = await db.accounts.get(accountId);
  if (!account) throw new Error("Compte introuvable.");

  const amt = Number(coinsSpent);
  if (!Number.isFinite(amt) || amt <= 0) throw new Error("Montant de coins invalide.");
  if (amt > account.currentCoins) throw new Error("Fonds insuffisants. Le solde ne peut pas devenir négatif.");

  return await db.transaction("rw", db.accounts, db.coinLogs, db.spinLogs, db.spinPlayers, async () => {
    // 1. Deduct coins using standard action
    await applyCoinChange(accountId, {
      action: "REMOVE",
      reason: `Spin — ${packName}`,
      amount: amt,
    });

    // 2. Add Spin Log
    const spinId = await db.spinLogs.add({
      accountId,
      date: today(),
      packName: packName.trim() || "Pack inconnu",
      coinsSpent: amt,
      spins: Number(spins) || 1,
      satisfactionScore: Number(satisfactionScore) || 0,
      wasPlanned: Boolean(wasPlanned),
      emotionBefore: emotionBefore || "",
      emotionAfter: emotionAfter || "",
      createdAt: new Date().toISOString()
    });

    // 3. Add players
    if (playerNames && Array.isArray(playerNames) && playerNames.length > 0) {
      const playersToInsert = playerNames
        .map(p => ({
          spinId,
          playerName: p.trim()
        }))
        .filter(p => p.playerName !== "");

      if (playersToInsert.length > 0) {
        await db.spinPlayers.bulkAdd(playersToInsert);
      }
    }

    return spinId;
  });
}

export function getProtection900Status(account) {
  if (!account) return { isBelowThreshold: false, coinsMissing: 0, message: "" };
  const isBelowThreshold = account.currentCoins < 900;
  const coinsMissing = isBelowThreshold ? 900 - account.currentCoins : 0;
  let message = "";
  if (isBelowThreshold) {
    message = `Attention : Vous êtes sous le seuil critique des 900 coins. Il vous manque ${coinsMissing} coins pour assurer le prochain Premium Match Pass.`;
  }
  return { isBelowThreshold, coinsMissing, message };
}

export function classifyImpulseRisk({ wasPlanned, emotionBefore }) {
  const isNegativeEmotion = ["Frustré", "Ennuyé", "Stressé"].includes(emotionBefore);
  const isExcited = emotionBefore === "Excité";
  
  if (!wasPlanned && isNegativeEmotion) {
    return "Emotional";
  }
  if (!wasPlanned && isExcited) {
    return "FOMO";
  }
  if (!wasPlanned) {
    return "Chase Behavior";
  }
  if (isNegativeEmotion) {
    return "Emotional";
  }
  return "Rational";
}

function getMonday(d) {
  const dt = new Date(d);
  const day = dt.getDay(), diff = dt.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(dt.setDate(diff)).toISOString().slice(0, 10);
}

export async function getSpentThisWeek(accountId) {
  const monday = getMonday(new Date());
  const logs = await db.spinLogs
    .where("accountId")
    .equals(accountId)
    .and(log => log.date >= monday)
    .toArray();
  return logs.reduce((sum, log) => sum + log.coinsSpent, 0);
}

export async function logRegret(spinId, hasRegret) {
  await db.regretLogs.add({
    spinId,
    regret: Boolean(hasRegret),
    createdAt: new Date().toISOString()
  });
}

export async function getPendingRegrets() {
  // Finds spins from the last 24 hours that haven't been evaluated for regret
  // Requires spins to be at least 2 minutes old to let emotions settle
  const now = Date.now();
  const twoMinsAgo = new Date(now - 2 * 60 * 1000).toISOString();
  const oneDayAgoDateStr = new Date(now - 86400000).toISOString().slice(0, 10);
  
  const recentSpins = await db.spinLogs
    .where("date")
    .aboveOrEqual(oneDayAgoDateStr)
    .toArray();
    
  const validSpins = recentSpins.filter(s => s.createdAt && s.createdAt <= twoMinsAgo);
  
  if (validSpins.length === 0) return [];
  
  const regrets = await db.regretLogs.toArray();
  const evaluatedSpinIds = new Set(regrets.map(r => r.spinId));
  
  return validSpins.filter(s => !evaluatedSpinIds.has(s.id));
}
