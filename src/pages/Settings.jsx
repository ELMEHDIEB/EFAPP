import { useState, useMemo } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { useNavigate } from "react-router-dom";
import { db } from "../db.js";
import { useToast } from "../components/ui/ToastContext.jsx";
import { useConfirm } from "../components/ui/ConfirmContext.jsx";
import { usePWAInstall } from "../hooks/usePWAInstall.js";
import { sha256 } from "../utils/crypto.js";
import HeroHeader from "../components/ui/HeroHeader.jsx";
import { PortfolioStatsCard } from "../components/settings/PortfolioStatsCard.jsx";
import { SecurityCard } from "../components/settings/SecurityCard.jsx";
import { SystemHealthCard } from "../components/settings/SystemHealthCard.jsx";
import { PwaInstallCard } from "../components/settings/PwaInstallCard.jsx";

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
  const { installPrompt, isInstalled, triggerInstall } = usePWAInstall();

  const accounts = useLiveQuery(() => db.accounts.toArray(), []) || [];
  const settings = useLiveQuery(() => db.settings.toArray(), []) || [];

  const pinSetting = settings.find(s => s.key === "pinLock");
  const recoverySetting = settings.find(s => s.key === "recoveryHash");
  const backupSetting = settings.find(s => s.key === "lastBackupDate");
  
  const hasPin = !!pinSetting?.value;
  const hasRecovery = !!recoverySetting?.value;
  const hasBackup = !!backupSetting?.value;

  const [pinInput, setPinInput] = useState("");
  const [recoveryPhrase, setRecoveryPhrase] = useState("");

  // Stats Portfolio
  const totalAccounts = accounts.length;
  const averageCoins = totalAccounts > 0 ? Math.round(accounts.reduce((s, a) => s + a.currentCoins, 0) / totalAccounts) : 0;
  const bestAccount = [...accounts].sort((a, b) => b.currentCoins - a.currentCoins)[0];
  const accountsOver900 = accounts.filter(a => a.currentCoins >= 900).length;
  const accountsUnder300 = accounts.filter(a => a.currentCoins < 300).length;

  // Achievements (Mocked to 6 total like in the screenshot)
  const achievementsUnlocked = accountsOver900 > 0 ? 1 : 0; // Simplified for now
  const achievementsTotal = 6;
  const achievementsRemaining = achievementsTotal - achievementsUnlocked;
  const achievementsCompletion = Math.round((achievementsUnlocked / achievementsTotal) * 100);

  // Security & Health
  const securityScore = (hasPin ? 1 : 0) + (hasRecovery ? 1 : 0) + (hasBackup ? 1 : 0);
  const recoveryStatusScore = hasRecovery ? 25 : 0;
  const systemHealth = 25 + 25 + 25 + recoveryStatusScore; // Build + DB + Storage + Recovery

  const recommendations = [];
  if (!hasPin) recommendations.push({ title: "Enable PIN protection", desc: "Protect your data with a PIN lock at startup.", action: () => document.getElementById("pin-setup")?.scrollIntoView({behavior: "smooth"}) });
  if (!hasBackup) recommendations.push({ title: "Create a backup", desc: "No backup exists. Create one to protect your data.", action: exportBackup });
  if (hasPin && !hasRecovery) recommendations.push({ title: "Configure recovery phrase", desc: "Set up a recovery phrase in case you forget your PIN.", action: () => document.getElementById("pin-setup")?.scrollIntoView({behavior: "smooth"}) });
  if (accountsUnder300 > 0) recommendations.push({ title: "Top up low accounts", desc: `${accountsUnder300} account(s) have less than 300 coins.`, action: () => navigate("/accounts") });

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
    
    await db.settings.put({ key: "lastBackupDate", value: new Date().toISOString() });
    toast("Backup téléchargé avec succès.", "success");
  }

  async function savePin(e) {
    e.preventDefault();
    if (pinInput.trim().length < 4) {
      return toast("Le code PIN doit faire au moins 4 caractères.", "error");
    }
    if (recoveryPhrase.trim().length < 8) {
      return toast("La phrase de récupération doit faire au moins 8 caractères.", "error");
    }
    
    const pinHash = await sha256(pinInput.trim());
    const phraseHash = await sha256(recoveryPhrase.trim().toLowerCase());

    await db.settings.put({ key: "pinLock", value: pinHash });
    await db.settings.put({ key: "recoveryHash", value: phraseHash });
    
    setPinInput("");
    setRecoveryPhrase("");
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
      await db.settings.delete("recoveryHash");
      toast("Code PIN retiré. L'application n'est plus verrouillée.", "success");
    }
  }

  return (
    <div className="max-w-7xl mx-auto pb-12 space-y-6">
      <HeroHeader 
        title="Paramètres"
        description="Tes données sont stockées localement dans ce navigateur (IndexedDB) et persistent automatiquement entre les sessions."
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Stats & Security */}
        <div className="lg:col-span-2 space-y-6">
          
          <PortfolioStatsCard 
            totalAccounts={totalAccounts}
            averageCoins={averageCoins}
            bestAccount={bestAccount}
            accountsOver900={accountsOver900}
            accountsUnder300={accountsUnder300}
            achievementsUnlocked={achievementsUnlocked}
            achievementsRemaining={achievementsRemaining}
            achievementsCompletion={achievementsCompletion}
          />

          <SecurityCard 
            hasPin={hasPin}
            hasRecovery={hasRecovery}
            hasBackup={hasBackup}
            securityScore={securityScore}
            pinInput={pinInput}
            setPinInput={setPinInput}
            recoveryPhrase={recoveryPhrase}
            setRecoveryPhrase={setRecoveryPhrase}
            savePin={savePin}
            removePin={removePin}
          />

          <PwaInstallCard 
            isInstalled={isInstalled}
            installPrompt={installPrompt}
            triggerInstall={triggerInstall}
          />

          {/* Settings Grid (Proxy + Data) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Connexion & API */}
            <div className="pro-card p-6 flex flex-col">
              <h2 className="pro-heading mb-6">Connexion & API (Proxy)</h2>
              <div className="p-4 bg-ink rounded-xl border border-white/5 space-y-4 flex-1 flex flex-col">
                <div>
                  <p className="text-sm font-bold text-white mb-1">Serveur Proxy (CORS)</p>
                  <p className="text-xs text-textdim leading-relaxed">
                    Utilisé pour contourner les restrictions CORS. Par défaut : <code className="bg-panel px-1 py-0.5 rounded text-[10px]">allorigins.win</code>
                  </p>
                </div>
                <form onSubmit={async (e) => {
                  e.preventDefault();
                  const form = e.target;
                  const val = form.elements.proxy.value.trim();
                  if (val) {
                    await db.settings.put({ key: "customProxy", value: val });
                    toast("Proxy personnalisé enregistré.", "success");
                  } else {
                    await db.settings.delete("customProxy");
                    toast("Proxy réinitialisé à celui par défaut.", "success");
                  }
                }} className="flex flex-col gap-3 mt-auto">
                  <input 
                    name="proxy"
                    type="text" 
                    defaultValue={settings.find(s => s.key === "customProxy")?.value || ""}
                    placeholder="ex: https://my-proxy.com/?url=" 
                    className="input w-full text-xs"
                  />
                  <div className="flex gap-2">
                    <button type="submit" className="btn-primary py-2 text-xs flex-1">
                      Sauvegarder
                    </button>
                    <button 
                      type="button" 
                      onClick={async (e) => {
                        e.currentTarget.form.elements.proxy.value = "";
                        await db.settings.delete("customProxy");
                        toast("Proxy réinitialisé.", "success");
                      }} 
                      className="btn-secondary py-2 text-xs"
                    >
                      Reset
                    </button>
                  </div>
                </form>
              </div>
            </div>

            {/* Données & Maintenance */}
            <div className="pro-card p-6 flex flex-col">
              <h2 className="pro-heading mb-6">Données & Maintenance</h2>
              <div className="p-4 bg-ink rounded-xl border border-white/5 flex-1 flex flex-col">
                <p className="text-sm font-bold text-white mb-1">Application Reset Center</p>
                <p className="text-xs text-textdim mb-4">Gérez vos données locales, sauvegardes, et réinitialisations système.</p>
                <div className="mt-auto">
                  <button onClick={() => navigate('/settings/data-management')} className="btn-secondary w-full text-xs py-2">
                    Data Management
                  </button>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Right Column: Health & Maintenance */}
        <div className="space-y-6">
          
          <SystemHealthCard 
            systemHealth={systemHealth}
            hasRecovery={hasRecovery}
          />

          {/* Recommendations */}
          <div className="pro-card p-6">
            <h2 className="pro-heading mb-6">Recommendations</h2>
            <div className="space-y-3">
              {recommendations.length === 0 ? (
                <div className="p-4 bg-ink rounded-xl border border-white/5 flex items-center justify-center text-xs font-medium text-accent">
                  All systems are optimized!
                </div>
              ) : (
                recommendations.map((rec, i) => (
                  <div key={i} className="p-4 bg-ink rounded-xl border border-warn/20 flex flex-col gap-3">
                    <div>
                      <p className="text-xs font-bold text-white mb-0.5">{rec.title}</p>
                      <p className="text-[10px] text-textdim">{rec.desc}</p>
                    </div>
                    <button onClick={rec.action} className="text-[10px] uppercase tracking-widest font-bold text-warn self-start hover:text-white transition-colors">
                      Fix →
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* À propos */}
          <div className="pro-card p-6">
            <h2 className="pro-heading mb-6">À propos d'EFAPP</h2>
            <div className="p-4 bg-ink rounded-xl border border-white/5 space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-xl font-bold text-white tracking-tight">EFAPP</h3>
                  <p className="text-[10px] font-mono text-textdim mt-1">Version: v5.3 UI Pro Max</p>
                </div>
                <div className="px-2 py-1 bg-accent/10 border border-accent/20 rounded text-[9px] font-bold text-accent uppercase tracking-widest">
                  Production Ready
                </div>
              </div>
              
              <div className="pt-4 border-t border-border">
                <p className="text-[10px] font-bold text-textdim uppercase tracking-widest mb-2">Architecture Locale</p>
                <div className="flex gap-2">
                  <span className="px-1.5 py-0.5 bg-white/5 border border-white/10 rounded text-[9px] font-mono text-white">React</span>
                  <span className="px-1.5 py-0.5 bg-white/5 border border-white/10 rounded text-[9px] font-mono text-white">Dexie</span>
                  <span className="px-1.5 py-0.5 bg-white/5 border border-white/10 rounded text-[9px] font-mono text-white">IndexedDB</span>
                </div>
              </div>

              <div className="pt-4 border-t border-border flex justify-between items-center">
                <p className="text-[9px] text-textdim uppercase tracking-widest">Created by</p>
                <p className="text-xs font-bold text-white tracking-wide">EL MEHDI MTM</p>
              </div>
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
}
