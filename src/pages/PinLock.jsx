import { useState, useEffect } from "react";
import { db } from "../db";
import { sha256 } from "../utils/crypto.js";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "../components/ui/input-otp.jsx";
import { VaultLockGraphic } from "../components/forgeui/vault-lock.jsx";

export default function PinLock({ expectedPin, onSuccess }) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [mode, setMode] = useState("pin"); // "pin" or "recovery"
  const [recoveryInput, setRecoveryInput] = useState("");
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const [lockTimeLeft, setLockTimeLeft] = useState(0);

  const [isOpen, setIsOpen] = useState(false);

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

  const handlePinSubmit = async (e) => {
    e.preventDefault();
    if (isLocked) return;

    // sha256 hash is 64 characters long. If it's not 64, it's a legacy plaintext PIN.
    const isLegacyPlaintext = expectedPin.length !== 64;
    const isMatch = isLegacyPlaintext ? pin === expectedPin : await sha256(pin) === expectedPin;

    if (isMatch) {
      setIsOpen(true);
      setTimeout(() => {
        onSuccess();
      }, 1000); // 1s delay for open animation
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
      <div className="card bg-panel p-8 w-full max-w-sm text-center shadow-2xl border border-border relative overflow-hidden">
        <div className="absolute top-4 left-0 w-full flex justify-center">
          <VaultLockGraphic isOpen={isOpen} />
        </div>
        
        <div className="mt-44 relative z-10">
          <h1 className="text-xl font-bold text-white mb-2">Vault Access</h1>
          <p className="text-sm text-textdim mb-8">Saisissez votre code PIN pour accéder à EFAPP.</p>
        <form onSubmit={handlePinSubmit} className="flex flex-col gap-6 items-center w-full">
          <div className="w-full flex justify-center">
            <InputOTP
              maxLength={expectedPin?.length || 4}
              value={pin}
              onChange={(val) => setPin(val)}
              disabled={isLocked}
              autoFocus
            >
              <InputOTPGroup>
                {Array.from({ length: expectedPin?.length || 4 }).map((_, i) => (
                  <InputOTPSlot key={i} index={i} className="w-12 h-14 text-2xl font-black bg-ink/50 border-white/10 text-white" />
                ))}
              </InputOTPGroup>
            </InputOTP>
          </div>
          <div className="w-full space-y-4 mt-2">
            {error && <p className="text-sm text-danger font-medium text-center">{error}</p>}
            <button type="submit" disabled={isLocked} className="btn-primary py-3 w-full disabled:opacity-50 disabled:cursor-not-allowed">
              {isLocked ? `Verrouillé (${lockTimeLeft}s)` : "Déverrouiller"}
            </button>
            <button type="button" onClick={() => { setMode("recovery"); setError(""); }} className="text-xs text-textdim underline mt-2 w-full text-center">
              Code PIN oublié ?
            </button>
          </div>
        </form>
        </div>
      </div>
    </div>
  );
}
