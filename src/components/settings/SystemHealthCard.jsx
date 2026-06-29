export function SystemHealthCard({ systemHealth, hasRecovery }) {
  return (
    <div className="pro-card p-6">
      <h2 className="pro-heading mb-6">System Health</h2>
      <div className="flex items-end gap-1 mb-6">
        <span className={`text-4xl font-black tracking-tighter ${systemHealth === 100 ? 'text-accent' : 'text-warn'}`}>{systemHealth}</span>
        <span className="text-sm font-bold text-textdim mb-1">/100</span>
      </div>
      
      <div className="space-y-4">
        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-textdim font-medium uppercase tracking-wider">Build Status</span>
            <span className="text-accent font-bold">Operational</span>
          </div>
          <div className="flex justify-between text-[10px] text-textdim">
            <div className="w-full h-1 bg-ink rounded-full overflow-hidden mr-4 mt-1"><div className="h-full bg-accent w-full"></div></div>
            <span>25/25</span>
          </div>
        </div>
        
        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-textdim font-medium uppercase tracking-wider">Database Status</span>
            <span className="text-accent font-bold">Operational</span>
          </div>
          <div className="flex justify-between text-[10px] text-textdim">
            <div className="w-full h-1 bg-ink rounded-full overflow-hidden mr-4 mt-1"><div className="h-full bg-accent w-full"></div></div>
            <span>25/25</span>
          </div>
        </div>

        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-textdim font-medium uppercase tracking-wider">Storage Status</span>
            <span className="text-accent font-bold">Healthy</span>
          </div>
          <div className="flex justify-between text-[10px] text-textdim">
            <div className="w-full h-1 bg-ink rounded-full overflow-hidden mr-4 mt-1"><div className="h-full bg-accent w-full"></div></div>
            <span>25/25</span>
          </div>
        </div>

        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-textdim font-medium uppercase tracking-wider">Recovery Status</span>
            <span className={hasRecovery ? "text-accent font-bold" : "text-danger font-bold"}>{hasRecovery ? "Operational" : "Poor"}</span>
          </div>
          <div className="flex justify-between text-[10px] text-textdim">
            <div className="w-full h-1 bg-ink rounded-full overflow-hidden mr-4 mt-1"><div className={`h-full ${hasRecovery ? 'bg-accent' : 'bg-danger'}`} style={{ width: hasRecovery ? '100%' : '0%' }}></div></div>
            <span>{hasRecovery ? '25' : '0'}/25</span>
          </div>
        </div>
      </div>
    </div>
  );
}
