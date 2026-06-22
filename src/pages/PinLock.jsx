import { useState } from "react";

export default function PinLock({ expectedPin, onSuccess }) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (pin === expectedPin) {
      onSuccess();
    } else {
      setError("Code PIN incorrect.");
      setPin("");
    }
  };

  return (
    <div className="flex h-screen items-center justify-center bg-ink p-4">
      <div className="card bg-panel p-8 w-full max-w-sm text-center shadow-2xl border border-border">
        <div className="w-16 h-16 bg-panel2 rounded-full flex items-center justify-center mx-auto mb-4 border border-border">
          <svg className="w-8 h-8 text-textdim" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <h1 className="text-xl font-bold text-white mb-2">Application verrouillée</h1>
        <p className="text-sm text-textdim mb-6">Saisissez votre code PIN pour accéder à Coin Manager Pro.</p>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            type="password"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            className="input text-center tracking-[1em] text-lg font-mono py-3"
            autoFocus
            maxLength={10}
          />
          {error && <p className="text-sm text-danger font-medium">{error}</p>}
          <button type="submit" className="btn-primary py-3 w-full">Déverrouiller</button>
        </form>
      </div>
    </div>
  );
}
