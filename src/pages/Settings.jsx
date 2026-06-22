import { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
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
];

export default function Settings() {
  const [status, setStatus] = useState("");

  async function exportBackup() {
    const dump = {};
    for (const t of TABLES) dump[t] = await db[t].toArray();

    const blob = new Blob([JSON.stringify(dump, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `efootball-coin-manager-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setStatus("Backup téléchargé.");
  }

  async function importBackup(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!confirm("Importer va REMPLACER toutes les données actuelles. Continuer ?")) {
      e.target.value = "";
      return;
    }
    try {
      const text = await file.text();
      const dump = JSON.parse(text);
      await db.transaction("rw", TABLES.map((t) => db[t]), async () => {
        for (const t of TABLES) {
          await db[t].clear();
          if (Array.isArray(dump[t])) await db[t].bulkAdd(dump[t]);
        }
      });
      setStatus("Backup importé avec succès.");
    } catch (err) {
      setStatus("Erreur à l'import : " + err.message);
    } finally {
      e.target.value = "";
    }
  }

  const settings = useLiveQuery(() => db.settings.toArray(), []);
  const pinSetting = settings?.find(s => s.key === "pinLock");
  const hasPin = !!pinSetting?.value;
  const [pinInput, setPinInput] = useState("");

  async function savePin(e) {
    e.preventDefault();
    if (pinInput.trim().length < 4) return setStatus("Le code PIN doit faire au moins 4 caractères.");
    await db.settings.put({ key: "pinLock", value: pinInput.trim() });
    setPinInput("");
    setStatus("Code PIN configuré. L'application est désormais verrouillée au démarrage.");
  }

  async function removePin() {
    if (confirm("Êtes-vous sûr de vouloir retirer le verrouillage par code PIN ?")) {
      await db.settings.delete("pinLock");
      setStatus("Code PIN retiré. L'application n'est plus verrouillée.");
    }
  }

  return (
    <div className="max-w-lg pb-12">
      <h1 className="text-xl font-medium text-white mb-2">Paramètres</h1>
      <p className="text-sm text-textdim mb-6">
        Tes données sont stockées localement dans ce navigateur (IndexedDB) et persistent
        automatiquement entre les sessions. Fais un backup régulièrement pour pouvoir
        restaurer tes données si tu changes de machine ou de navigateur.
      </p>

      <div className="bg-panel border border-border rounded-lg p-4 flex flex-col gap-3 mb-6">
        <h2 className="text-sm font-semibold text-white mb-2">Sécurité & Confidentialité</h2>
        
        {hasPin ? (
          <div className="flex flex-col gap-2 p-3 bg-panel2 rounded-md border border-border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-white font-medium flex items-center gap-2">
                  <span className="text-accent">●</span> Verrouillage actif
                </p>
                <p className="text-xs text-textdim mt-1">L'application demande un code PIN au démarrage.</p>
              </div>
              <button onClick={removePin} className="btn-secondary text-xs px-3 py-1.5">
                Désactiver le verrouillage
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={savePin} className="flex flex-col gap-2 p-3 bg-panel2 rounded-md border border-border">
            <p className="text-sm text-white font-medium">Activer le verrouillage par PIN</p>
            <p className="text-xs text-textdim mb-2">Empêche l'accès à l'application sans ce code local. (Aucun compte en ligne n'est créé).</p>
            <div className="flex gap-2">
              <input 
                type="password" 
                value={pinInput} 
                onChange={e => setPinInput(e.target.value)} 
                placeholder="Nouveau code PIN..." 
                className="input flex-1"
                maxLength={10}
              />
              <button type="submit" className="btn-primary text-xs px-4">
                Activer
              </button>
            </div>
          </form>
        )}
      </div>

      <div className="bg-panel border border-border rounded-lg p-4 flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-white mb-2">Sauvegarde des données</h2>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-white">Exporter un backup</p>
            <p className="text-xs text-textdim">Télécharge toutes tes données en JSON</p>
          </div>
          <button
            onClick={exportBackup}
            className="text-xs px-3 py-1.5 rounded-md border border-border text-white hover:bg-panel2"
          >
            Exporter
          </button>
        </div>

        <div className="flex items-center justify-between border-t border-border pt-3">
          <div>
            <p className="text-sm text-white">Importer un backup</p>
            <p className="text-xs text-textdim">Remplace les données actuelles</p>
          </div>
          <label className="text-xs px-3 py-1.5 rounded-md border border-border text-white hover:bg-panel2 cursor-pointer">
            Importer
            <input type="file" accept="application/json" onChange={importBackup} className="hidden" />
          </label>
        </div>
      </div>

      {status && <p className="text-xs text-textdim mt-3 font-medium bg-panel2 p-3 rounded border border-border">{status}</p>}
    </div>
  );
}
