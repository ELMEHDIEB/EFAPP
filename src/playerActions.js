import { db } from "./db.js";

/** Create a new player in the database for a specific account. */
export async function createPlayer(accountId, playerData) {
  if (!accountId) throw new Error("L'ID du compte est requis.");
  const trimmedName = playerData.name.trim();
  if (!trimmedName) throw new Error("Le nom du joueur est requis.");

  const allAccountPlayers = await db.players.where("accountId").equals(accountId).toArray();
  const existing = allAccountPlayers.find(p => p.name.toLowerCase() === trimmedName.toLowerCase());
  
  if (existing) throw new Error(`Le joueur "${trimmedName}" existe déjà dans ce compte.`);

  const id = await db.players.add({
    accountId,
    name: trimmedName,
    cardType: playerData.cardType || "Standard",
    isBooster: Boolean(playerData.isBooster),
    overall: Number(playerData.overall) || 0,
    position: (playerData.position || "").trim(),
    club: (playerData.club || "").trim(),
    nation: (playerData.nation || "").trim(),
    efhubId: (playerData.efhubId || "").trim()
  });

  return id;
}

/** Update an existing player. */
export async function updatePlayer(id, playerData) {
  const trimmedName = playerData.name.trim();
  if (!trimmedName) throw new Error("Le nom du joueur est requis.");
  const player = await db.players.get(id);
  if (!player) throw new Error("Joueur introuvable.");

  const allAccountPlayers = await db.players.where("accountId").equals(player.accountId).toArray();
  const existing = allAccountPlayers.find(p => p.name.toLowerCase() === trimmedName.toLowerCase() && p.id !== id);

  if (existing) {
    throw new Error(`Un autre joueur nommé "${trimmedName}" existe déjà dans ce compte.`);
  }

  await db.players.update(id, {
    name: trimmedName,
    cardType: playerData.cardType || "Standard",
    isBooster: Boolean(playerData.isBooster),
    overall: Number(playerData.overall) || 0,
    position: (playerData.position || "").trim(),
    club: (playerData.club || "").trim(),
    nation: (playerData.nation || "").trim(),
    efhubId: (playerData.efhubId || "").trim()
  });
}

/** Delete a player. */
export async function deletePlayer(id) {
  await db.players.delete(id);
}

/** Search players by name within a specific account. */
export async function searchPlayers(accountId, query) {
  if (!accountId) return [];
  if (!query || query.trim().length === 0) return [];
  const lowerQuery = query.toLowerCase().trim();
  
  const allAccountPlayers = await db.players.where("accountId").equals(accountId).toArray();
  return allAccountPlayers.filter(p => p.name.toLowerCase().includes(lowerQuery)).slice(0, 10);
}
