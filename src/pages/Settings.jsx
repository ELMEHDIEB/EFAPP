import { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { useNavigate } from "react-router-dom";
import { db } from "../db.js";
import { useToast } from "../components/ui/ToastContext.jsx";
import { useConfirm } from "../components/ui/ConfirmContext.jsx";

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

export default function Settings() {
  const toast = useToast();
  const confirm = useConfirm();
  const navigate = useNavigate();

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
    toast("Backup téléchargé avec succès.", "success");
  }

  async function importBackup(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const isConfirmed = await confirm({
      title: "Importer un backup ?",
      message: "L'importation va REMPLACER toutes les données actuelles. Cette action est irréversible. Continuer ?",
      confirmLabel: "Écraser les données",
      cancelLabel: "Annuler",
      isDanger: true
    });

    if (!isConfirmed) {
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
      toast("Backup importé avec succès. Les données ont été mises à jour.", "success");
    } catch (err) {
      toast("Erreur à l'import : " + err.message, "error");
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
    if (pinInput.trim().length < 4) {
      return toast("Le code PIN doit faire au moins 4 caractères.", "error");
    }
    await db.settings.put({ key: "pinLock", value: pinInput.trim() });
    setPinInput("");
    toast("Code PIN configuré. L'application est désormais verrouillée.", "success");
  }

  async function removePin() {
    const isConfirmed = await confirm({
      title: "Retirer le code PIN ?",
      message: "Êtes-vous sûr de vouloir retirer le verrouillage par code PIN ? L'application sera accessible sans protection.",
      confirmLabel: "Retirer",
      cancelLabel: "Annuler",
      isDanger: true
    });

    if (isConfirmed) {
      await db.settings.delete("pinLock");
      toast("Code PIN retiré. L'application n'est plus verrouillée.", "success");
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

      <div className="pro-card mb-6">
        <h2 className="pro-heading mb-6">
          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8V7a4 4 0 00-8 0v4h8z" /></svg>
          Sécurité & Confidentialité
        </h2>
        
        {hasPin ? (
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 p-4 bg-ink rounded-xl border border-white/5">
            <div>
              <p className="text-sm text-white font-bold flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-accent"></span> Verrouillage actif
              </p>
              <p className="text-xs text-textdim mt-1">L'application exige le code PIN au démarrage.</p>
            </div>
            <button onClick={removePin} className="btn-secondary w-full md:w-auto">
              Désactiver
            </button>
          </div>
        ) : (
          <form onSubmit={savePin} className="flex flex-col gap-4 p-5 bg-ink rounded-xl border border-white/5">
            <div>
              <p className="text-sm font-bold text-white mb-1">Activer le verrouillage par PIN</p>
              <p className="text-xs text-textdim leading-relaxed">Protégez vos données comportementales avec un code PIN local.</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <input 
                type="password" 
                value={pinInput} 
                onChange={e => setPinInput(e.target.value)} 
                placeholder="Code PIN à 4+ chiffres" 
                className="input flex-1"
                maxLength={10}
              />
              <button type="submit" className="btn-primary">
                Activer la protection
              </button>
            </div>
          </form>
        )}
      </div>

      <div className="pro-card">
        <h2 className="pro-heading mb-6">
          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" /></svg>
          Données & Maintenance
        </h2>
        
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 p-4">
          <div>
            <p className="text-sm font-bold text-white mb-1">Application Reset Center</p>
            <p className="text-xs text-textdim">Gérez vos données locales, sauvegardes, et réinitialisations système.</p>
          </div>
          <button onClick={() => navigate('/settings/data-management')} className="btn-secondary w-full md:w-auto">
            Data Management
          </button>
        </div>
      </div>

      <div className="pro-card">
        <h2 className="pro-heading mb-6">
          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          À propos d'EFAPP
        </h2>
        
        <div className="p-4 bg-ink rounded-xl border border-white/5 space-y-4">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-xl font-bold text-white tracking-tight">EFAPP</h3>
              <p className="text-xs font-mono text-textdim mt-1">Version: v1.1 UI Pro Max</p>
            </div>
            <div className="px-2 py-1 bg-accent/10 border border-accent/20 rounded text-[10px] font-bold text-accent uppercase tracking-widest">
              Production Ready
            </div>
          </div>
          
          <div className="pt-4 border-t border-border">
            <p className="text-xs font-medium text-textdim uppercase tracking-wider mb-2">Architecture Locale</p>
            <div className="flex gap-2">
              <span className="px-2 py-1 bg-white/5 border border-white/10 rounded text-[10px] font-mono text-white">React</span>
              <span className="px-2 py-1 bg-white/5 border border-white/10 rounded text-[10px] font-mono text-white">Dexie</span>
              <span className="px-2 py-1 bg-white/5 border border-white/10 rounded text-[10px] font-mono text-white">IndexedDB</span>
            </div>
          </div>

          <div className="pt-4 border-t border-border">
            <p className="text-[10px] text-textdim uppercase tracking-widest mb-1">Created by</p>
            <p className="text-sm font-semibold text-white tracking-wide">EL MEHDI MTM</p>
          </div>
        </div>
      </div>
    </div>
  );
}
