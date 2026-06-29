export function SpinHistory({ logs, accounts, onNewSpin }) {
  return (
    <div className="max-w-4xl mx-auto pb-12">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Spin Tracker</h1>
          <p className="text-sm text-textdim mt-1">Historique de vos tirages et analyse comportementale.</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => onNewSpin(true)} className="btn-secondary hidden sm:block">
            Ajouter ancien spin
          </button>
          <button onClick={() => onNewSpin(false)} className="btn-primary">
            + Nouveau Spin
          </button>
        </div>
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
          <div className="flex gap-3">
            <button onClick={() => onNewSpin(true)} className="btn-secondary">Ajouter ancien spin</button>
            <button onClick={() => onNewSpin(false)} className="btn-primary">Enregistrer un spin</button>
          </div>
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
