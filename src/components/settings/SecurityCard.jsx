export function SecurityCard({ 
  hasPin, 
  hasRecovery, 
  hasBackup, 
  securityScore, 
  pinInput, 
  setPinInput, 
  recoveryPhrase, 
  setRecoveryPhrase, 
  savePin, 
  removePin 
}) {
  return (
    <div id="pin-setup" className="pro-card p-6">
      <h2 className="pro-heading mb-6">Sécurité & Confidentialité</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          {hasPin ? (
            <div className="flex flex-col gap-4 p-4 bg-ink rounded-xl border border-white/5 h-full justify-center">
              <div>
                <p className="text-sm text-white font-bold flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-accent"></span> Verrouillage actif
                </p>
                <p className="text-xs text-textdim mt-1">L'application exige le code PIN au démarrage.</p>
              </div>
              <button onClick={removePin} className="btn-secondary w-full">
                Désactiver la protection
              </button>
            </div>
          ) : (
            <form onSubmit={savePin} className="flex flex-col gap-4 p-5 bg-ink rounded-xl border border-white/5">
              <div>
                <p className="text-sm font-bold text-white mb-1">Activer le verrouillage par PIN</p>
                <p className="text-xs text-textdim leading-relaxed">Protégez vos données avec un code PIN et une phrase de récupération en cas d'oubli.</p>
              </div>
              <div>
                <input 
                  type="password" 
                  value={pinInput} 
                  onChange={e => setPinInput(e.target.value)} 
                  placeholder="Code PIN à 4+ chiffres" 
                  className="input w-full"
                  maxLength={10}
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-textdim uppercase tracking-wider block mb-1">Recovery Phrase</label>
                <input 
                  type="text" 
                  value={recoveryPhrase} 
                  onChange={e => setRecoveryPhrase(e.target.value)} 
                  placeholder="Ex: river orange planet eagle 42" 
                  className="input w-full"
                />
              </div>
              <button type="submit" className="btn-primary mt-2">
                Activer la protection
              </button>
            </form>
          )}
        </div>

        <div className="bg-ink rounded-xl border border-white/5 p-5">
          <p className="text-sm font-bold text-white mb-4">Recovery Readiness</p>
          <p className={`text-2xl font-black mb-1 ${securityScore === 3 ? 'text-accent' : securityScore === 0 ? 'text-danger' : 'text-warn'}`}>
            {securityScore === 3 ? 'Excellent' : securityScore === 0 ? 'Poor' : 'Fair'}
          </p>
          <p className="text-xs font-medium text-textdim mb-6">{securityScore}/3 security measures active</p>

          <div className="space-y-3">
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-white">PIN Enabled</span>
              <span className={hasPin ? "text-accent font-bold" : "text-danger font-bold"}>{hasPin ? "Active" : "Missing"}</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-white">Recovery Phrase</span>
              <span className={hasRecovery ? "text-accent font-bold" : "text-danger font-bold"}>{hasRecovery ? "Active" : "Missing"}</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-white">Backup Available</span>
              <span className={hasBackup ? "text-accent font-bold" : "text-danger font-bold"}>{hasBackup ? "Active" : "Missing"}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
