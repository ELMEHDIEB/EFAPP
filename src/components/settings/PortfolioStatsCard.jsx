export function PortfolioStatsCard({ 
  totalAccounts, 
  averageCoins, 
  bestAccount, 
  accountsOver900, 
  accountsUnder300,
  achievementsUnlocked,
  achievementsRemaining,
  achievementsCompletion 
}) {
  return (
    <div className="space-y-6">
      {/* Account Portfolio */}
      <div className="pro-card p-6">
        <h2 className="pro-heading mb-6">Account Portfolio</h2>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
          <div>
            <p className="text-[10px] uppercase tracking-widest text-textdim font-bold mb-1">Total Accounts</p>
            <p className="text-2xl font-black text-white">{totalAccounts}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-widest text-textdim font-bold mb-1">Average Coins</p>
            <p className="text-2xl font-black text-white">{averageCoins}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-widest text-textdim font-bold mb-1">Best Account</p>
            <p className="text-2xl font-black text-accent truncate">{bestAccount ? bestAccount.currentCoins : 0}</p>
            <p className="text-[10px] font-medium text-textdim truncate">{bestAccount ? bestAccount.name : "-"}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-widest text-textdim font-bold mb-1">Accounts ≥ 900</p>
            <p className="text-2xl font-black text-accent">{accountsOver900}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-widest text-textdim font-bold mb-1">Accounts &lt; 300</p>
            <p className="text-2xl font-black text-danger">{accountsUnder300}</p>
          </div>
        </div>
      </div>

      {/* Achievements */}
      <div className="pro-card p-6">
        <h2 className="pro-heading mb-6">Achievements</h2>
        <div className="flex flex-col sm:flex-row items-center gap-8">
          <div className="flex gap-8">
            <div>
              <p className="text-[10px] uppercase tracking-widest text-textdim font-bold mb-1">Unlocked</p>
              <p className="text-3xl font-black text-accent">{achievementsUnlocked}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-widest text-textdim font-bold mb-1">Remaining</p>
              <p className="text-3xl font-black text-white">{achievementsRemaining}</p>
            </div>
          </div>
          <div className="flex-1 w-full">
            <div className="flex justify-between items-end mb-2">
              <p className="text-[10px] uppercase tracking-widest text-textdim font-bold">Completion</p>
              <p className="text-lg font-black text-white">{achievementsCompletion}%</p>
            </div>
            <div className="w-full h-2 bg-ink rounded-full overflow-hidden">
              <div className="h-full bg-accent rounded-full transition-all" style={{ width: `${achievementsCompletion}%` }}></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
