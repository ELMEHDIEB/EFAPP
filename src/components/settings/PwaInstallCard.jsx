export function PwaInstallCard({ isInstalled, installPrompt, triggerInstall }) {
  return (
    <div className="pro-card p-6 border-blue-500/20 border">
      <h2 className="pro-heading mb-6 flex items-center gap-2">
        <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
        Application Native
      </h2>
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 p-5 bg-ink rounded-xl border border-white/5">
        <div className="flex-1">
          <p className="text-sm font-bold text-white mb-1">Installer EFAPP</p>
          <p className="text-xs text-textdim">Installez l'application sur votre appareil pour y accéder hors ligne et comme une vraie application native (sans navigateur).</p>
        </div>
        <div>
          {isInstalled ? (
            <div className="px-4 py-2 bg-green-500/20 text-green-400 rounded font-bold text-sm">Déjà installée</div>
          ) : (
            <button onClick={triggerInstall} disabled={!installPrompt} className="btn-primary whitespace-nowrap disabled:opacity-50">
              Installer maintenant
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
