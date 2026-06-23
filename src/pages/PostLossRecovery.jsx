import { useNavigate } from "react-router-dom";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../db.js";
import { getRecoveryPlan } from "../utils/psychEngine.js";
import { getNextGoal } from "../utils/goalEngine.js";

export default function PostLossRecovery() {
  const navigate = useNavigate();
  const accounts = useLiveQuery(() => db.accounts.toArray(), []);
  const coinLogs = useLiveQuery(() => db.coinLogs.toArray(), []);

  // Find the most recently affected account (last coinLog with negative delta)
  const recoveryData = (() => {
    if (!accounts || !coinLogs || coinLogs.length === 0) return null;
    
    const sortedLogs = [...coinLogs].sort((a, b) => b.id - a.id);
    const lastLoss = sortedLogs.find(l => l.newBalance < l.previousBalance);
    if (!lastLoss) return null;
    
    const account = accounts.find(a => a.id === lastLoss.accountId);
    if (!account) return null;

    const plan = getRecoveryPlan(account, coinLogs);
    const lossAmount = lastLoss.previousBalance - lastLoss.newBalance;
    const { progressPct } = getNextGoal(account.currentCoins);
    
    return { account, plan, lossAmount, progressPct };
  })();

  return (
    <div className="max-w-2xl mx-auto py-12 px-4 text-center animate-in zoom-in-95 duration-500 space-y-6">
      <div className="pro-card border-danger/30 bg-danger/5 p-8 md:p-12 shadow-[0_0_50px_rgba(239,68,68,0.15)]">
        <div className="w-20 h-20 mx-auto bg-danger/20 rounded-full flex items-center justify-center mb-6">
          <svg className="w-10 h-10 text-danger" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
        </div>
        <h1 className="text-3xl font-black text-white tracking-tight mb-4">Alerte : Chute Compulsive</h1>
        <p className="text-textdim text-lg mb-8">
          Vous venez de dépenser une quantité critique de coins sans obtenir le résultat désiré.
        </p>
        
        <div className="bg-ink p-6 rounded-xl border border-white/5 text-left space-y-4 mb-6">
          <p className="text-textdim text-sm leading-relaxed">
            <strong className="text-white">Le piège de la compensation :</strong> Vouloir se refaire immédiatement est le déclencheur principal de la ruine des comptes. C'est le moment de couper.
          </p>
          <p className="text-textdim text-sm leading-relaxed">
            <strong className="text-white">Réalité statistique :</strong> Le prochain tirage possède strictement les mêmes probabilités que le premier. L'algorithme n'a pas de "mémoire".
          </p>
        </div>

        {/* ═══ Recovery Coach ═══ */}
        {recoveryData && (
          <div className="bg-ink rounded-xl border border-border p-5 text-left mb-8 space-y-3">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <svg className="w-4 h-4 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
              Recovery Coach — {recoveryData.account.name}
            </h3>
            
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-panel2 rounded-lg p-3 text-center">
                <p className="text-lg font-black text-white">{recoveryData.account.currentCoins}</p>
                <p className="text-[10px] text-textdim uppercase tracking-wider">Coins actuels</p>
              </div>
              <div className="bg-panel2 rounded-lg p-3 text-center">
                <p className={`text-lg font-black ${recoveryData.progressPct >= 100 ? 'text-accent' : 'text-warn'}`}>{recoveryData.progressPct}%</p>
                <p className="text-[10px] text-textdim uppercase tracking-wider">Progression</p>
              </div>
              <div className="bg-panel2 rounded-lg p-3 text-center">
                <p className="text-lg font-black text-danger">{recoveryData.plan.distanceTo900}</p>
                <p className="text-[10px] text-textdim uppercase tracking-wider">Distance 900</p>
              </div>
            </div>

            <div className="h-2 bg-panel2 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-700 ${recoveryData.progressPct >= 100 ? 'bg-accent' : 'bg-warn'}`}
                style={{ width: `${Math.min(recoveryData.progressPct, 100)}%` }}
              />
            </div>

            <p className="text-sm text-textdim leading-relaxed">
              {recoveryData.plan.recoveryMessage}
            </p>
            {recoveryData.plan.distanceTo900 > 0 && (
              <p className="text-xs text-accent font-medium">
                Continuer l'accumulation est actuellement la stratégie recommandée.
              </p>
            )}
          </div>
        )}

        <button 
          onClick={() => navigate("/")}
          className="btn-base bg-white hover:bg-white/90 text-ink font-bold py-4 px-8 w-full md:w-auto text-base shadow-[0_0_20px_rgba(255,255,255,0.2)]"
        >
          Je ferme le jeu pour aujourd'hui
        </button>
      </div>
    </div>
  );
}
