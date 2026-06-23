import { useMemo } from "react";

export default function MilestoneTimeline({ accounts, coinLogs }) {
  const milestones = useMemo(() => {
    if (!accounts || !coinLogs || coinLogs.length === 0) return [];
    
    const events = [];
    const thresholds = [500, 700, 900];
    
    accounts.forEach(acc => {
      const logs = coinLogs
        .filter(l => l.accountId === acc.id)
        .sort((a, b) => new Date(a.date) - new Date(b.date));
      
      const achieved = new Set();
      
      for (const log of logs) {
        for (const t of thresholds) {
          if (log.newBalance >= t && !achieved.has(t)) {
            achieved.add(t);
            events.push({
              id: `${acc.id}-${t}`,
              date: log.date,
              accountName: acc.name,
              threshold: t,
              timestamp: new Date(log.date).getTime()
            });
          }
        }
      }
    });

    return events.sort((a, b) => b.timestamp - a.timestamp).slice(0, 10); // Show last 10
  }, [accounts, coinLogs]);

  if (milestones.length === 0) {
    return null;
  }

  return (
    <div className="pro-card p-6 border-white/5">
      <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
        <svg className="w-5 h-5 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
        Milestone Timeline
      </h2>
      <div className="space-y-4 relative before:absolute before:inset-0 before:ml-2.5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-white/10 before:to-transparent">
        {milestones.map((m, i) => (
          <div key={m.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
            <div className="flex items-center justify-center w-6 h-6 rounded-full border border-white/20 bg-ink group-hover:border-accent group-hover:bg-accent/20 text-white shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow transition-colors duration-300">
              <div className="w-1.5 h-1.5 bg-accent rounded-full"></div>
            </div>
            <div className="w-[calc(100%-2rem)] md:w-[calc(50%-1.5rem)] p-3 rounded-xl border border-white/5 bg-panel shadow">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-1">
                <time className="text-[10px] font-mono text-textdim uppercase tracking-widest">{m.date}</time>
                <span className={`text-xs font-bold ${m.threshold === 900 ? 'text-accent' : 'text-white'}`}>
                  {m.threshold} coins
                </span>
              </div>
              <p className="text-sm font-medium text-white">{m.accountName} a atteint un nouveau jalon.</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
