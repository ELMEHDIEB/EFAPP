import { useState, useEffect } from "react";
import { db } from "../db.js";
import { sha256 } from "../utils/crypto.js";

export default function PinLock({ expectedPin, onSuccess }) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [mode, setMode] = useState("pin"); // "pin" or "recovery"
  const [recoveryInput, setRecoveryInput] = useState("");
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const [lockTimeLeft, setLockTimeLeft] = useState(0);

  useEffect(() => {
    let timer;
    if (isLocked && lockTimeLeft > 0) {
      timer = setInterval(() => {
        setLockTimeLeft(prev => {
          if (prev <= 1) {
            setIsLocked(false);
            setFailedAttempts(0);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isLocked, lockTimeLeft]);

  const handlePinSubmit = (e) => {
    e.preventDefault();
    if (isLocked) return;

    if (pin === expectedPin) {
      onSuccess();
    } else {
      const newAttempts = failedAttempts + 1;
      setFailedAttempts(newAttempts);
      setPin("");
      
      if (newAttempts >= 5) {
        setIsLocked(true);
        setLockTimeLeft(60); // 60 seconds lockout
        setError("Trop de tentatives. Réessayez dans 60s ou utilisez la phrase de récupération.");
      } else {
        setError(`Code PIN incorrect. ${5 - newAttempts} tentatives restantes.`);
      }
    }
  };

  const handleRecoverySubmit = async (e) => {
    e.preventDefault();
    const settings = await db.settings.toArray();
    const recoverySetting = settings.find(s => s.key === "recoveryHash");
    
    if (!recoverySetting || !recoverySetting.value) {
      setError("Aucune phrase de récupération n'a été configurée. Vous devez faire un Factory Reset depuis la gestion des données si vous êtes bloqué.");
      return;
    }

    const inputHash = await sha256(recoveryInput.trim().toLowerCase());
    
    if (inputHash === recoverySetting.value) {
      await db.settings.delete("pinLock");
      await db.settings.delete("recoveryHash");
      onSuccess(); // Unlocked, PIN removed
    } else {
      setError("Phrase de récupération incorrecte.");
      setRecoveryInput("");
    }
  };

  if (mode === "recovery") {
    return (
      <div className="flex h-screen items-center justify-center bg-ink p-4">
        <div className="card bg-panel p-8 w-full max-w-sm text-center shadow-2xl border border-border">
          <h1 className="text-xl font-bold text-white mb-2">Récupération</h1>
          <p className="text-sm text-textdim mb-6">Entrez votre phrase de récupération secrète pour supprimer le code PIN.</p>
          <form onSubmit={handleRecoverySubmit} className="flex flex-col gap-4">
            <input
              type="text"
              value={recoveryInput}
              onChange={(e) => setRecoveryInput(e.target.value)}
              className="input text-center py-3"
              placeholder="Ex: river orange planet eagle 42"
              autoFocus
            />
            {error && <p className="text-sm text-danger font-medium">{error}</p>}
            <button type="submit" className="btn-primary py-3 w-full">Désactiver le verrouillage</button>
            <button type="button" onClick={() => { setMode("pin"); setError(""); }} className="text-xs text-textdim underline mt-2">
              Retour au code PIN
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen items-center justify-center bg-ink p-4">
      <div className="card bg-panel p-8 w-full max-w-sm text-center shadow-2xl border border-border">
        <div className="w-16 h-16 bg-panel2 rounded-full flex items-center justify-center mx-auto mb-4 border border-border">
          <svg className="w-8 h-8 text-textdim" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <h1 className="text-xl font-bold text-white mb-2">Application verrouillée</h1>
        <p className="text-sm text-textdim mb-6">Saisissez votre code PIN pour accéder à EFAPP.</p>
        <form onSubmit={handlePinSubmit} className="flex flex-col gap-4">
          <input
            type="password"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            className="input text-center tracking-[1em] text-lg font-mono py-3 disabled:opacity-50"
            autoFocus
            maxLength={10}
            disabled={isLocked}
          />
          {error && <p className="text-sm text-danger font-medium">{error}</p>}
          <button type="submit" disabled={isLocked} className="btn-primary py-3 w-full disabled:opacity-50 disabled:cursor-not-allowed">
            {isLocked ? `Verrouillé (${lockTimeLeft}s)` : "Déverrouiller"}
          </button>
          <button type="button" onClick={() => { setMode("recovery"); setError(""); }} className="text-xs text-textdim underline mt-2">
            Code PIN oublié ?
          </button>
        </form>
      </div>
    </div>
  );
}
