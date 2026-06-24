import { useState, useEffect, useMemo } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { useNavigate } from "react-router-dom";
import { db } from "../db.js";
import { useToast } from "../components/ui/ToastContext.jsx";
import { useConfirm } from "../components/ui/ConfirmContext.jsx";
import { sha256 } from "../utils/crypto.js";
import { getDisciplineScore } from "../scoreActions.js";
import { computeAchievements } from "../utils/achievementEngine.js";
import { getRecoveryReadiness, getSystemHealth, getRecommendations } from "../utils/systemEngine.js";
import { createBackup, downloadBackup, restoreBackup } from "../utils/backupActions.js";
import { triggerDesktopNotification } from "../utils/desktopNotifier.js";
import HeroHeader from "../components/ui/HeroHeader.jsx";

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

  const settings = useLiveQuery(() => db.settings.toArray(), []);
  const accounts = useLiveQuery(() => db.accounts.toArray(), []);
  const coinLogs = useLiveQuery(() => db.coinLogs.toArray(), []);
  const auditLogs = useLiveQuery(() => db.auditLogs.toArray(), []);

  const pinSetting = settings?.find(s => s.key === "pinLock");
  const hasPin = !!pinSetting?.value;
  const autoLockSetting = settings?.find(s => s.key === "autoLockMinutes");
  const currentAutoLock = autoLockSetting?.value || "0";
  
  const [pinInput, setPinInput] = useState("");
  const [recoveryPhrase, setRecoveryPhrase] = useState("");

  // System Health state
  const [systemHealth, setSystemHealth] = useState(null);

  // Discipline scores for achievements
  const [disciplineScores, setDisciplineScores] = useState([]);

  useEffect(() => {
    if (!settings) return;
    getSystemHealth(settings).then(setSystemHealth);
  }, [settings]);

  useEffect(() => {
    if (!accounts || accounts.length === 0) return;
    let cancelled = false;
    async function loadScores() {
      const scores = [];
      for (const acc of accounts) {
        const result = await getDisciplineScore(acc.id);
        scores.push(result);
      }
      if (!cancelled) setDisciplineScores(scores);
    }
    loadScores();
    return () => { cancelled = true; };
  }, [accounts]);

  // Achievement data
  const achievements = useMemo(() => {
    if (!accounts || !coinLogs) return [];
    return computeAchievements(accounts, coinLogs, disciplineScores);
  }, [accounts, coinLogs, disciplineScores]);

  const achievementUnlocked = achievements.filter(a => a.unlocked).length;
  const achievementTotal = achievements.length;
  const achievementPct = achievementTotal > 0 ? Math.round((achievementUnlocked / achievementTotal) * 100) : 0;

  // Recovery Readiness
  const recoveryReadiness = useMemo(() => {
    if (!settings) return null;
    return getRecoveryReadiness(settings);
  }, [settings]);

  // Smart Recommendations
  const recommendations = useMemo(() => {
    if (!settings || !accounts || !coinLogs || !auditLogs) return [];
    return getRecommendations(settings, accounts, coinLogs, auditLogs);
  }, [settings, accounts, coinLogs, auditLogs]);

  // Portfolio Overview
  const portfolio = useMemo(() => {
    if (!accounts || accounts.length === 0) return null;
    const totalAccounts = accounts.length;
    const totalCoins = accounts.reduce((sum, a) => sum + a.currentCoins, 0);
    const averageCoins = Math.round(totalCoins / totalAccounts);
    const sorted = [...accounts].sort((a, b) => b.currentCoins - a.currentCoins);
    const bestAccount = sorted[0];
    const above900 = accounts.filter(a => a.currentCoins >= 900).length;
    const below300 = accounts.filter(a => a.currentCoins < 300).length;

    return { totalAccounts, totalCoins, averageCoins, bestAccount, above900, below300 };
  }, [accounts]);

  async function exportBackup() {
    try {
      const blob = await createBackup();
      await downloadBackup(blob);
      toast("Backup sauvegardé avec succès.", "success");
      
      triggerDesktopNotification('Backup réussi', 'Vos données ont été sauvegardées en local de manière sécurisée.');
    } catch (err) {
      toast("Erreur d'export : " + err.message, "error");
    }
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
      const count = await restoreBackup(file);
      toast(`Backup importé avec succès. ${count} tables mises à jour.`, "success");
      setTimeout(() => window.location.reload(), 1500);
    } catch (err) {
      toast("Erreur à l'import : " + err.message, "error");
    } finally {
      e.target.value = "";
    }
  }

  async function handleAutoLockChange(e) {
    const val = e.target.value;
    await db.settings.put({ key: "autoLockMinutes", value: val });
    toast("Paramètre Auto Lock mis à jour.", "success");
  }

  async function savePin(e) {
    e.preventDefault();
    if (pinInput.trim().length < 4) {
      return toast("Le code PIN doit faire au moins 4 caractères.", "error");
    }
    if (recoveryPhrase.trim().length < 8) {
      return toast("La phrase de récupération doit faire au moins 8 caractères.", "error");
    }
    
    const phraseHash = await sha256(recoveryPhrase.trim().toLowerCase());

    await db.settings.put({ key: "pinLock", value: pinInput.trim() });
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

  if (!settings || !accounts || !coinLogs) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-8 h-8 border-2 border-white/10 border-t-white rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto pb-12 space-y-6">
      <HeroHeader 
        title="Paramètres"
        description="Tes données sont stockées localement dans ce navigateur (IndexedDB) et persistent automatiquement entre les sessions."
      />

      {/* ═══════════════════════════════════════════════════════
          FEATURE 8: ACCOUNT PORTFOLIO OVERVIEW
          ═══════════════════════════════════════════════════════ */}
      {portfolio && (
        <div className="pro-card p-6 bg-gradient-to-br from-surface to-background border-accent/10">
          <h2 className="pro-heading mb-5">
            <svg className="w-4 h-4 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
            Account Portfolio
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            <PortfolioKPI label="Total Accounts" value={portfolio.totalAccounts} color="text-white" />
            <PortfolioKPI label="Average Coins" value={portfolio.averageCoins.toLocaleString()} color="text-blue-400" />
            <PortfolioKPI
              label="Best Account"
              value={portfolio.bestAccount.currentCoins.toLocaleString()}
              sub={portfolio.bestAccount.name}
              color="text-accent"
            />
            <PortfolioKPI label="Accounts ≥ 900" value={portfolio.above900} color="text-accent" />
            <PortfolioKPI label="Accounts < 300" value={portfolio.below300} color={portfolio.below300 > 0 ? "text-danger" : "text-textdim"} />
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════
          FEATURE 7: ACHIEVEMENT PROGRESS TRACKER
          ═══════════════════════════════════════════════════════ */}
      {achievementTotal > 0 && (
        <div className="pro-card p-6 bg-gradient-to-br from-panel to-ink border-purple-500/10">
          <h2 className="pro-heading mb-5">
            <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg>
            Achievements
          </h2>
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="text-center">
              <p className="text-2xl font-black text-accent">{achievementUnlocked}</p>
              <p className="text-[10px] text-textdim font-bold uppercase tracking-widest">Unlocked</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-black text-textdim">{achievementTotal - achievementUnlocked}</p>
              <p className="text-[10px] text-textdim font-bold uppercase tracking-widest">Remaining</p>
            </div>
            <div className="text-center">
              <p className={`text-2xl font-black ${achievementPct >= 100 ? 'text-accent' : 'text-white'}`}>{achievementPct}%</p>
              <p className="text-[10px] text-textdim font-bold uppercase tracking-widest">Completion</p>
            </div>
          </div>
          <div className="h-3 bg-ink rounded-full overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-purple-500 to-accent transition-all duration-700"
              style={{ width: `${achievementPct}%` }}
            />
          </div>
        </div>
      )}

      {/* Security & Privacy */}
      <div className="pro-card mb-6">
        <h2 className="pro-heading mb-6">
          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8V7a4 4 0 00-8 0v4h8z" /></svg>
          Sécurité & Confidentialité
        </h2>
        
        {hasPin ? (
          <div className="flex flex-col gap-4 p-5 bg-ink rounded-xl border border-white/5">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div>
                <p className="text-sm text-white font-bold flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-accent"></span> Verrouillage actif
                </p>
                <p className="text-xs text-textdim mt-1">L'application exige le code PIN au démarrage.</p>
              </div>
              <button onClick={removePin} className="btn-secondary w-full md:w-auto">
                Désactiver le PIN
              </button>
            </div>
            <div className="pt-4 border-t border-white/5">
              <label className="text-xs font-bold text-textdim uppercase tracking-wider mb-2 block">Verrouillage Automatique</label>
              <select value={currentAutoLock} onChange={handleAutoLockChange} className="input w-full md:w-1/2">
                <option value="0">Jamais (Manuel uniquement)</option>
                <option value="5">Après 5 minutes d'inactivité</option>
                <option value="10">Après 10 minutes d'inactivité</option>
                <option value="30">Après 30 minutes d'inactivité</option>
              </select>
            </div>
          </div>
        ) : (
          <form onSubmit={savePin} className="flex flex-col gap-4 p-5 bg-ink rounded-xl border border-white/5">
            <div>
              <p className="text-sm font-bold text-white mb-1">Activer le verrouillage par PIN</p>
              <p className="text-xs text-textdim leading-relaxed">Protégez vos données avec un code PIN et une phrase de récupération en cas d'oubli.</p>
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
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-textdim uppercase tracking-wider">Recovery Phrase</label>
              <input 
                type="text" 
                value={recoveryPhrase} 
                onChange={e => setRecoveryPhrase(e.target.value)} 
                placeholder="Ex: river orange planet eagle 42" 
                className="input"
              />
            </div>
            <button type="submit" className="btn-primary mt-2">
              Activer la protection
            </button>
          </form>
        )}
      </div>

      {/* ═══════════════════════════════════════════════════════
          FEATURE 4: RECOVERY CENTER
          ═══════════════════════════════════════════════════════ */}
      {recoveryReadiness && (
        <div className="pro-card p-6">
          <h2 className="pro-heading mb-5">
            <svg className="w-4 h-4 text-warn" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
            Recovery Readiness
          </h2>

          <div className="flex items-center gap-3 mb-5">
            <div className={`px-3 py-1.5 rounded-lg border text-sm font-bold ${
              recoveryReadiness.label === "Excellent" ? "bg-accent/10 border-accent/20 text-accent" :
              recoveryReadiness.label === "Good" ? "bg-blue-400/10 border-blue-400/20 text-blue-400" :
              recoveryReadiness.label === "Average" ? "bg-warn/10 border-warn/20 text-warn" :
              "bg-danger/10 border-danger/20 text-danger"
            }`}>
              {recoveryReadiness.label}
            </div>
            <span className="text-xs text-textdim">{recoveryReadiness.score}/{recoveryReadiness.total} security measures active</span>
          </div>

          <div className="space-y-3">
            {recoveryReadiness.checks.map(check => (
              <div key={check.label} className="flex items-center gap-3 p-3 rounded-xl bg-ink border border-white/5">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${check.enabled ? 'bg-accent/10' : 'bg-white/5'}`}>
                  <svg className={`w-4 h-4 ${check.enabled ? 'text-accent' : 'text-textdim'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={check.icon} />
                  </svg>
                </div>
                <span className={`text-sm font-medium ${check.enabled ? 'text-white' : 'text-textdim'}`}>{check.label}</span>
                <div className="ml-auto">
                  {check.enabled ? (
                    <span className="text-[10px] font-bold text-accent uppercase tracking-widest bg-accent/10 px-2 py-1 rounded border border-accent/20">Active</span>
                  ) : (
                    <span className="text-[10px] font-bold text-textdim uppercase tracking-widest bg-white/5 px-2 py-1 rounded border border-white/10">Missing</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════
          FEATURE 5: SYSTEM HEALTH
          ═══════════════════════════════════════════════════════ */}
      {systemHealth && (
        <div className="pro-card p-6 bg-gradient-to-br from-surface to-background">
          <h2 className="pro-heading mb-5">
            <svg className="w-4 h-4 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" /></svg>
            System Health
          </h2>

          <div className="flex flex-col md:flex-row items-center gap-6 mb-6">
            {/* Score circle */}
            <div className="relative w-28 h-28 shrink-0">
              <svg className="w-28 h-28 -rotate-90" viewBox="0 0 120 120">
                <circle cx="60" cy="60" r="52" fill="none" stroke="currentColor" strokeWidth="8" className="text-white/5" />
                <circle
                  cx="60" cy="60" r="52" fill="none"
                  stroke="currentColor" strokeWidth="8"
                  strokeLinecap="round"
                  className={systemHealth.score >= 80 ? "text-accent" : systemHealth.score >= 50 ? "text-warn" : "text-danger"}
                  strokeDasharray={`${(systemHealth.score / 100) * 327} 327`}
                  style={{ transition: "stroke-dasharray 0.8s ease" }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-black text-white">{systemHealth.score}</span>
                <span className="text-[10px] text-textdim font-bold">/100</span>
              </div>
            </div>

            {/* Components */}
            <div className="flex-1 grid grid-cols-2 gap-3 w-full">
              {systemHealth.components.map(comp => (
                <div key={comp.label} className="flex items-center gap-3 p-3 rounded-xl bg-ink border border-white/5">
                  <div className={`w-2 h-2 rounded-full ${
                    comp.status === "Operational" || comp.status === "Healthy" || comp.status === "Excellent" ? "bg-accent" :
                    comp.status === "Good" ? "bg-blue-400" :
                    comp.status === "Warning" || comp.status === "Degraded" || comp.status === "Average" ? "bg-warn" :
                    "bg-danger"
                  }`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-white truncate">{comp.label}</p>
                    <p className={`text-[10px] font-medium ${comp.color}`}>{comp.status}</p>
                  </div>
                  <span className="text-xs font-mono text-textdim">{comp.score}/{comp.maxScore}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════
          FEATURE 6: SMART RECOMMENDATIONS
          ═══════════════════════════════════════════════════════ */}
      {recommendations.length > 0 && (
        <div className="pro-card p-6">
          <h2 className="pro-heading mb-5">
            <svg className="w-4 h-4 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>
            Recommendations
          </h2>

          <div className="space-y-3">
            {recommendations.map(rec => (
              <div key={rec.id} className="flex items-center gap-3 p-4 rounded-xl bg-ink border border-white/5 hover:border-white/10 transition-colors">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                  rec.priority === "high" ? "bg-danger/10" : rec.priority === "medium" ? "bg-warn/10" : "bg-white/5"
                }`}>
                  <svg className={`w-5 h-5 ${
                    rec.priority === "high" ? "text-danger" : rec.priority === "medium" ? "text-warn" : "text-textdim"
                  }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={rec.icon} />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-white">{rec.title}</p>
                  <p className="text-xs text-textdim">{rec.description}</p>
                </div>
                <button
                  onClick={() => navigate(rec.action)}
                  className="btn-secondary text-xs shrink-0"
                >
                  Fix
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Data & Maintenance */}
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

      {/* About */}
      <div className="pro-card">
        <h2 className="pro-heading mb-6">
          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          À propos d'EFAPP
        </h2>
        
        <div className="p-4 bg-ink rounded-xl border border-white/5 space-y-4">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-xl font-bold text-white tracking-tight">EFAPP</h3>
              <p className="text-xs font-mono text-textdim mt-1">Version: v5.3 UI Pro Max</p>
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

function PortfolioKPI({ label, value, sub, color = "text-white" }) {
  return (
    <div className="p-3 bg-ink rounded-xl border border-white/5 text-center">
      <p className="text-[10px] font-bold text-textdim uppercase tracking-widest mb-1">{label}</p>
      <p className={`text-xl font-black ${color}`}>{value}</p>
      {sub && <p className="text-[10px] text-textdim mt-0.5">{sub}</p>}
    </div>
  );
}
