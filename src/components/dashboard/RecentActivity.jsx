import React from "react";

export default function RecentActivity({ recentTransactions, accounts }) {
  if (!recentTransactions || recentTransactions.length === 0) return null;

  return (
    <div className="pro-card bg-surface p-6">
      <h2 className="text-lg font-bold text-white mb-6">Dernières Transactions</h2>
      <div className="space-y-3">
        {recentTransactions.map(log => {
          const acc = accounts.find(a => a.id === log.accountId);
          const diff = log.newBalance - log.previousBalance;
          const isPositive = diff > 0;
          return (
            <div key={log.id} className="flex items-center justify-between p-3 rounded-lg bg-background border border-border">
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center bg-opacity-10 ${isPositive ? 'bg-accent text-accent' : 'bg-danger text-danger'}`}>
                  {isPositive ? (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 12H4" /></svg>
                  )}
                </div>
                <div>
                  <p className="text-sm font-bold text-white">{acc ? acc.name : 'Compte Inconnu'}</p>
                  <p className="text-xs text-textdim">{log.reason || 'Mise à jour du solde'}</p>
                </div>
              </div>
              <div className="text-right">
                <p className={`text-sm font-black ${isPositive ? 'text-accent' : 'text-danger'}`}>
                  {isPositive ? '+' : ''}{diff}
                </p>
                <p className="text-[10px] text-textdim font-mono">{log.date}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
