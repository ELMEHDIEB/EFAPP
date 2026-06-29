export function DangerZone({ 
  accountsCount, 
  coinLogsCount, 
  spinLogsCount, 
  factoryReset 
}) {
  return (
    <div className="pro-card p-6 border-danger/40 border bg-danger/5">
      <h2 className="pro-heading mb-6 text-danger flex items-center gap-2">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
        Danger Zone
      </h2>
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 p-5 bg-ink rounded-xl border border-danger/20">
        <div className="flex-1">
          <p className="text-sm font-bold text-white mb-1">Factory Reset</p>
          <p className="text-xs text-textdim mb-3">Suppression totale : comptes, coinLogs, spinLogs, préférences, statistiques.</p>
          <div className="flex gap-4">
            <span className="text-[10px] font-mono text-danger bg-danger/10 px-2 py-0.5 rounded">{accountsCount} comptes</span>
            <span className="text-[10px] font-mono text-danger bg-danger/10 px-2 py-0.5 rounded">{coinLogsCount} coin logs</span>
            <span className="text-[10px] font-mono text-danger bg-danger/10 px-2 py-0.5 rounded">{spinLogsCount} spin logs</span>
          </div>
        </div>
        <button onClick={factoryReset} className="bg-danger hover:bg-red-600 text-white font-bold py-2 px-6 rounded-md transition-colors text-sm whitespace-nowrap">Factory Reset</button>
      </div>
    </div>
  );
}
