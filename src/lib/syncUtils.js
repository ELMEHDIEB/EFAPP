import { db } from '../db.js';

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

export async function exportDbToJson() {
  const dump = {};
  for (const t of TABLES) {
    if (db[t]) {
      dump[t] = await db[t].toArray();
    }
  }
  return JSON.stringify(dump);
}

export async function importJsonToDb(jsonString) {
  try {
    const dump = JSON.parse(jsonString);
    await db.transaction('rw', TABLES.map(t => db[t]), async () => {
      for (const t of TABLES) {
        if (dump[t] && db[t]) {
          await db[t].clear();
          await db[t].bulkAdd(dump[t]);
        }
      }
    });
    return true;
  } catch (e) {
    console.error("Erreur lors de l'importation de la base de données:", e);
    throw new Error("Fichier de sauvegarde invalide ou corrompu.");
  }
}
