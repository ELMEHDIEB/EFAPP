import { useState, useRef, useEffect } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { useNavigate } from "react-router-dom";
import { db } from "../db.js";
import { createSpin, getProtection900Status, classifyImpulseRisk, getSpentThisWeek } from "../spinActions.js";
import { getLossSupport } from "../utils/psychEngine.js";

const EMOTIONS = ["Excité", "Curieux", "Frustré", "Ennuyé", "Stressé", "Confiant"];

export default function SpinTracker() {
  const accounts = useLiveQuery(() => db.accounts.orderBy("name").toArray(), []);
  const spinLogs = useLiveQuery(() => db.spinLogs.reverse().toArray(), []);

  const [view, setView] = useState("history"); // 'history' | 'wizard'

  if (!accounts || !spinLogs) return <p className="text-textdim">Chargement…</p>;

  if (view === "history") {
    return (
      <SpinHistory 
        logs={spinLogs} 
        accounts={accounts} 
        onNewSpin={() => setView("wizard")} 
      />
    );
  }

  return (
    <SpinWizard 
      accounts={accounts} 
      onComplete={() => setView("history")} 
      onCancel={() => setView("history")} 
    />
  );
}

function SpinHistory({ logs, accounts, onNewSpin }) {
  return (
    <div className="max-w-4xl mx-auto pb-12">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Spin Tracker</h1>
          <p className="text-sm text-textdim mt-1">Historique de vos tirages et analyse comportementale.</p>
        </div>
        <button onClick={onNewSpin} className="btn-primary">
          + Nouveau Spin
        </button>
      </div>

      {logs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center animate-in fade-in">
          <div className="w-16 h-16 mb-6 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
            <svg className="w-8 h-8 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M14 10l-2 1m0 0l-2-1m2 1v2.5M20 7l-2 1m2-1l-2-1m2 1v2.5M14 4l-2-1-2 1M4 7l2-1M4 7l2 1M4 7v2.5M12 21l-2-1m2 1l2-1m-2 1v-2.5M6 18l-2-1v-2.5M18 18l2-1v-2.5" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight mb-2">Aucun historique de spin</h2>
          <p className="text-sm text-textdim max-w-sm mb-6">
            L'analyse comportementale débutera dès votre premier tirage enregistré.
          </p>
          <button onClick={onNewSpin} className="btn-primary">Enregistrer un spin</button>
        </div>
      ) : (
        <div className="grid gap-4">
          {logs.map(log => {
            const acc = accounts.find(a => a.id === log.accountId);
            return (
              <div key={log.id} className="pro-card p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 group">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1.5">
                    <span className="text-[10px] font-mono font-semibold text-textdim uppercase tracking-wider">{log.date}</span>
                    <span className="text-[10px] font-semibold tracking-widest uppercase bg-ink border border-white/10 rounded px-2 py-0.5 text-textdim">{acc?.name || "Supprimé"}</span>
                  </div>
                  <p className="text-lg font-bold text-white tracking-tight truncate">{log.packName}</p>
                  <p className="text-xs font-medium text-textdim truncate mt-1 flex items-center gap-2">
                    <span>Joueurs: {log.players || "—"}</span>
                    <span className="w-1 h-1 rounded-full bg-border"></span>
                    <span>Satisfaction: <strong className={log.satisfactionScore >= 7 ? "text-accent" : log.satisfactionScore <= 4 ? "text-danger" : "text-warn"}>{log.satisfactionScore}</strong>/10</span>
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xl font-mono font-bold text-danger">-{log.coinsSpent}</p>
                  <p className="text-[10px] uppercase tracking-widest font-semibold text-textdim mt-1">{log.spins} tirage(s)</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function SpinWizard({ accounts, onComplete, onCancel }) {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [error, setError] = useState("");

  const [accountId, setAccountId] = useState(accounts.length > 0 ? accounts[0].id : "");
  const [wasPlanned, setWasPlanned] = useState(null);
  const [emotionBefore, setEmotionBefore] = useState("");
  
  const [packName, setPackName] = useState("");
  const [coinsSpent, setCoinsSpent] = useState("100");
  const [spinsCount, setSpinsCount] = useState("1");
  const [satisfactionScore, setSatisfactionScore] = useState("5");
  const [playersInput, setPlayersInput] = useState("");
  const [spentThisWeek, setSpentThisWeek] = useState(0);

  // Emergency Mode states
  const [isEmergencyCooldown, setIsEmergencyCooldown] = useState(false);
  const [cooldownRemaining, setCooldownRemaining] = useState(0);

  const selectedAccount = accounts.find(a => a.id === accountId);
  const protectionStatus = getProtection900Status(selectedAccount);
  const riskLabel = classifyImpulseRisk({ wasPlanned, emotionBefore });

  useEffect(() => {
    if (accountId) {
      getSpentThisWeek(accountId).then(setSpentThisWeek);
    }
  }, [accountId]);

  useEffect(() => {
    let timer;
    if (isEmergencyCooldown && cooldownRemaining > 0) {
      timer = setInterval(() => {
        setCooldownRemaining(prev => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isEmergencyCooldown, cooldownRemaining]);

  if (accounts.length === 0) {
    return (
      <div className="max-w-2xl mx-auto py-12 text-center">
        <h2 className="text-xl font-bold text-white mb-4">Aucun compte disponible</h2>
        <p className="text-textdim mb-6">Vous devez créer un compte avant de pouvoir enregistrer un spin.</p>
        <button onClick={onCancel} className="btn-secondary">Retour</button>
      </div>
    );
  }

  const handleNextStep1 = () => {
    if (!accountId) return setError("Veuillez sélectionner un compte.");
    setError("");
    setStep(2);
  };

  const handleNextStep2 = () => {
    if (wasPlanned === null) return setError("Veuillez indiquer si le tirage était planifié.");
    if (!emotionBefore) return setError("Veuillez sélectionner une émotion.");
    setError("");
    setStep(3);
  };

  const handleNextStep3 = () => {
    if (!packName.trim()) return setError("Le nom du pack est requis.");
    if (Number(coinsSpent) <= 0) return setError("Le coût doit être supérieur à 0.");
    if (Number(spinsCount) <= 0) return setError("Le nombre de tirages doit être supérieur à 0.");
    if (selectedAccount && selectedAccount.currentCoins < Number(coinsSpent)) {
      return setError("Fonds insuffisants.");
    }
    setError("");
    setStep(4);
  };

  const triggerEmergencyMode = () => {
    setIsEmergencyCooldown(true);
    setCooldownRemaining(300); // 5 minutes cooldown (300 seconds)
  };

  const handleConfirm = async () => {
    try {
      const playersList = playersInput.split(",").map(s => s.trim()).filter(s => s);
      const spent = Number(coinsSpent);
      const satScore = Number(satisfactionScore);

      await createSpin(accountId, {
        packName,
        coinsSpent: spent,
        spins: Number(spinsCount),
        satisfactionScore: satScore,
        wasPlanned,
        emotionBefore,
        emotionAfter: "",
        playerNames: playersList
      });

      // Post-Loss Recovery Trigger
      if (spent >= 900 && satScore <= 4) {
        navigate("/post-loss-recovery");
      } else {
        onComplete();
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const projectedBalance = selectedAccount ? selectedAccount.currentCoins - Number(coinsSpent) : 0;
  const isDangerPostSpin = projectedBalance < 900;
  const missingTo900 = isDangerPostSpin ? 900 - projectedBalance : 0;
  
  const weeklyLimit = selectedAccount?.weeklyLimit || 0;
  const newSpentThisWeek = spentThisWeek + Number(coinsSpent);
  const exceedsWeeklyLimit = weeklyLimit > 0 && newSpentThisWeek > weeklyLimit;

  // Determine if this spin requires emergency mode (Impulsive, Under 900, or Exceeds Weekly Limit)
  const isHighRisk = isDangerPostSpin || riskLabel !== "Rational" || exceedsWeeklyLimit;

  return (
    <div className="max-w-2xl mx-auto py-4">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Nouveau Spin</h1>
          <p className="text-sm text-textdim mt-1">Étape {step} sur 4</p>
        </div>
        <button onClick={onCancel} className="text-textdim hover:text-white transition-colors">
          ✕ Annuler
        </button>
      </div>

      <div className="pro-card p-6 md:p-8">
        
        {step === 1 && (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold text-white">1. Sélection du compte</h2>
            
            <label className="flex flex-col gap-2">
              <span className="text-sm font-medium text-textdim">Choisissez le compte concerné</span>
              <select 
                value={accountId} 
                onChange={e => setAccountId(e.target.value)}
                className="input py-3"
              >
                {accounts.map(acc => (
                  <option key={acc.id} value={acc.id}>
                    {acc.name} ({acc.currentCoins.toLocaleString()} coins)
                  </option>
                ))}
              </select>
            </label>

            {protectionStatus.isBelowThreshold && (
              <div className="bg-warn/10 border border-warn/30 p-4 rounded-xl flex gap-3 mt-4">
                <svg className="w-6 h-6 text-warn shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                <div>
                  <p className="text-warn font-semibold mb-1">Mode Protection 900</p>
                  <p className="text-sm text-warn/90 leading-relaxed">{protectionStatus.message}</p>
                </div>
              </div>
            )}

            {error && <p className="text-sm text-danger font-medium">{error}</p>}
            <button onClick={handleNextStep1} className="btn-primary w-full py-3">Continuer</button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold text-white">2. Détection d'impulsivité</h2>
            
            <div className="space-y-3">
              <p className="text-sm font-medium text-textdim">Ce tirage était-il planifié à l'avance ?</p>
              <div className="grid grid-cols-2 gap-3">
                <button 
                  onClick={() => setWasPlanned(true)}
                  className={`py-3 rounded-lg border text-sm font-medium transition-all ${wasPlanned === true ? 'border-white bg-white text-ink' : 'border-border text-textdim hover:text-white hover:border-white/30'}`}
                >
                  Oui, planifié
                </button>
                <button 
                  onClick={() => setWasPlanned(false)}
                  className={`py-3 rounded-lg border text-sm font-medium transition-all ${wasPlanned === false ? 'border-danger bg-danger/10 text-danger' : 'border-border text-textdim hover:text-white hover:border-white/30'}`}
                >
                  Non, impulsif
                </button>
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-sm font-medium text-textdim">Quelle est votre émotion actuelle ?</p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {EMOTIONS.map(emo => (
                  <button
                    key={emo}
                    onClick={() => setEmotionBefore(emo)}
                    className={`py-2 text-sm font-medium rounded-lg border transition-all ${emotionBefore === emo ? 'border-white bg-white text-ink shadow-sm' : 'border-border text-textdim hover:text-white hover:border-white/30'}`}
                  >
                    {emo}
                  </button>
                ))}
              </div>
            </div>

            {error && <p className="text-sm text-danger font-medium">{error}</p>}
            
            <div className="flex gap-3 pt-4">
              <button onClick={() => setStep(1)} className="btn-secondary">Retour</button>
              <button onClick={handleNextStep2} className="btn-primary flex-1">Continuer</button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold text-white">3. Détails du Spin</h2>
            
            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-textdim">Nom du pack / tirage</span>
              <input 
                autoFocus
                value={packName}
                onChange={e => setPackName(e.target.value)}
                placeholder="ex: Epic Barcelona..."
                className="input py-3"
              />
            </label>

            <div className="grid grid-cols-2 gap-4">
              <label className="flex flex-col gap-1.5">
                <span className="text-sm font-medium text-textdim">Coût (coins)</span>
                <input 
                  type="number"
                  min="100"
                  step="100"
                  value={coinsSpent}
                  onChange={e => setCoinsSpent(e.target.value)}
                  className="input py-3 font-semibold text-danger"
                />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-sm font-medium text-textdim">Nombre de tirages</span>
                <input 
                  type="number"
                  min="1"
                  value={spinsCount}
                  onChange={e => setSpinsCount(e.target.value)}
                  className="input py-3"
                />
              </label>
            </div>

            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-textdim">Joueurs obtenus (optionnel)</span>
              <input 
                value={playersInput}
                onChange={e => setPlayersInput(e.target.value)}
                placeholder="Séparés par des virgules"
                className="input py-3"
              />
            </label>

            <label className="flex flex-col gap-2 pt-2">
              <div className="flex justify-between items-end">
                <span className="text-sm font-medium text-textdim">Score de satisfaction</span>
                <span className="text-accent font-bold">{satisfactionScore}/10</span>
              </div>
              <input 
                type="range"
                min="1"
                max="10"
                value={satisfactionScore}
                onChange={e => setSatisfactionScore(e.target.value)}
                className="accent-accent w-full"
              />
            </label>

            {error && <p className="text-sm text-danger font-medium">{error}</p>}
            
            <div className="flex gap-3 pt-4">
              <button onClick={() => setStep(2)} className="btn-secondary">Retour</button>
              <button onClick={handleNextStep3} className="btn-primary flex-1">Voir l'impact</button>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold text-white">4. Confirmation (Coût d'opportunité)</h2>
            
            <div className="bg-panel2 p-5 rounded-xl border border-border shadow-inner">
              <p className="text-xs font-medium text-textdim mb-2 uppercase tracking-wider">Impact sur le compte {selectedAccount?.name}</p>
              <div className="flex items-center justify-between text-2xl mb-2">
                <span className="text-white font-semibold">{selectedAccount?.currentCoins}</span>
                <span className="text-textdim">→</span>
                <span className={`font-bold ${isDangerPostSpin ? 'text-warn' : 'text-accent'}`}>
                  {projectedBalance} <span className="text-base font-normal opacity-80">restants</span>
                </span>
              </div>
              {isDangerPostSpin && (
                <p className="text-sm font-medium text-warn mt-2">
                  Il vous manquera {missingTo900} coins pour atteindre les 900.
                </p>
              )}
              {/* Graduated Psychological Support */}
              {(() => {
                const support = getLossSupport(Number(coinsSpent), selectedAccount?.currentCoins || 0, 900);
                const severityColors = {
                  low: { bg: 'bg-accent/5', border: 'border-accent/15', text: 'text-accent', icon: 'text-accent' },
                  medium: { bg: 'bg-warn/5', border: 'border-warn/15', text: 'text-warn', icon: 'text-warn' },
                  high: { bg: 'bg-danger/5', border: 'border-danger/15', text: 'text-danger', icon: 'text-danger' }
                };
                const c = severityColors[support.severity];
                return (
                  <div className={`${c.bg} border ${c.border} rounded-lg p-3 mt-3 flex items-start gap-2.5`}>
                    <svg className={`w-4 h-4 ${c.icon} shrink-0 mt-0.5`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={support.severity === 'low' ? "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" : "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"} />
                    </svg>
                    <div>
                      <p className={`text-xs font-semibold ${c.text}`}>{support.message}</p>
                      <p className="text-[11px] text-textdim mt-0.5">{support.advice}</p>
                    </div>
                  </div>
                );
              })()}
              {weeklyLimit > 0 && (
                <div className="mt-4 pt-4 border-t border-border">
                  <p className="text-xs font-medium text-textdim mb-1 uppercase tracking-wider">Limite hebdomadaire ({weeklyLimit})</p>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-white">Dépenses de la semaine :</span>
                    <span className={`font-semibold ${exceedsWeeklyLimit ? 'text-danger' : 'text-white'}`}>
                      {newSpentThisWeek}
                    </span>
                  </div>
                  {exceedsWeeklyLimit && (
                    <p className="text-xs text-danger mt-1">Vous avez dépassé votre limite hebdomadaire définie !</p>
                  )}
                </div>
              )}
            </div>

            <div className={`p-4 rounded-xl border flex gap-4 items-center ${riskLabel === 'Rational' ? 'bg-accent/5 border-accent/20' : 'bg-warn/10 border-warn/30'}`}>
              <div className="flex-1">
                <p className="text-xs font-semibold text-textdim uppercase tracking-wider mb-1">Diagnostic Mental Coach</p>
                <p className={`text-sm font-medium ${riskLabel === 'Rational' ? 'text-accent' : 'text-warn'}`}>
                  Type de décision : {riskLabel}
                </p>
              </div>
            </div>

            {error && <p className="text-sm text-danger font-medium">{error}</p>}

            {/* EMERGENCY MODE UI */}
            {isHighRisk && !isEmergencyCooldown && (
              <div className="bg-danger/10 border border-danger/30 p-5 rounded-xl">
                <h3 className="text-danger font-bold mb-2">Action à Haut Risque</h3>
                <p className="text-sm text-danger/80 mb-4">
                  Cette dépense est considérée comme dangereuse pour vos objectifs. Le bouton de validation a été bloqué préventivement.
                </p>
                <button onClick={triggerEmergencyMode} className="btn-base bg-danger hover:bg-danger/80 text-white w-full py-3">
                  Débloquer le bouton (Mode Urgence)
                </button>
              </div>
            )}

            {isHighRisk && isEmergencyCooldown && cooldownRemaining > 0 && (
              <div className="bg-panel2 border border-border p-5 rounded-xl text-center">
                <h3 className="text-white font-bold mb-2">Mode Urgence Actif</h3>
                <p className="text-3xl font-mono text-warn my-4">
                  {Math.floor(cooldownRemaining / 60).toString().padStart(2, '0')}:{(cooldownRemaining % 60).toString().padStart(2, '0')}
                </p>
                <p className="text-sm text-textdim italic mb-2">
                  Assistant Anti-FOMO : "Rappel : Les joueurs reviennent toujours. La méta évolue constamment. Rien n'est obligatoire aujourd'hui."
                </p>
              </div>
            )}
            
            <div className="flex flex-col gap-3 pt-4">
              {(!isHighRisk || (isEmergencyCooldown && cooldownRemaining === 0)) && (
                <button 
                  onClick={handleConfirm} 
                  className={`btn-base w-full py-4 text-base font-semibold ${isHighRisk ? 'bg-danger hover:bg-danger/90 text-white' : 'bg-accent hover:bg-accent2 text-white'}`}
                >
                  Confirmer la dépense (-{coinsSpent} coins)
                </button>
              )}
              <button onClick={() => setStep(3)} className="btn-secondary w-full py-3" disabled={isEmergencyCooldown && cooldownRemaining > 0}>
                ← Revenir en arrière
              </button>
              <button onClick={onCancel} className="text-textdim hover:text-white text-sm font-medium text-center mt-2 transition-colors">
                Ne pas dépenser (Économiser)
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
