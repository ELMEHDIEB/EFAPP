import { useState, useMemo } from "react";
import HeroHeader from "../components/ui/HeroHeader.jsx";

function choose(n, k) {
  if (k < 0 || k > n) return 0;
  if (k === 0 || k === n) return 1;
  let k_k = Math.min(k, n - k);
  let c = 1;
  for (let i = 0; i < k_k; i++) {
    c = c * (n - i) / (i + 1);
  }
  return c;
}

export default function EpicCalculator() {
  const [totalPlayers, setTotalPlayers] = useState(150);
  const [epicPlayers, setEpicPlayers] = useState(3);
  const [currentCoins, setCurrentCoins] = useState(900);
  const [costPerSpin, setCostPerSpin] = useState(100);

  const spinsAvailable = Math.floor(currentCoins / costPerSpin);

  const { prob0, probAtLeast1, chanceRating, antiFomo, targets } = useMemo(() => {
    // Hypergeometric Distribution
    // P(X = 0) = choose(Total - Epics, Spins) / choose(Total, Spins)
    let p0 = 1; // 100% chance of 0 epics initially
    
    if (spinsAvailable > 0 && totalPlayers > 0) {
      const nonEpics = totalPlayers - epicPlayers;
      if (spinsAvailable > nonEpics) {
        // We have more spins than non-epics, so we are guaranteed at least 1 epic
        p0 = 0;
      } else if (spinsAvailable <= totalPlayers) {
        const num = choose(nonEpics, spinsAvailable);
        const den = choose(totalPlayers, spinsAvailable);
        p0 = den === 0 ? 0 : num / den;
      }
    }

    const pAtLeast1 = 1 - p0;
    const probAtLeast1Pct = (pAtLeast1 * 100).toFixed(2);
    const prob0Pct = (p0 * 100).toFixed(2);

    let rating = "";
    let fomo = "";
    if (pAtLeast1 < 0.2) {
      rating = "Très faible";
      fomo = `${probAtLeast1Pct}% de chance signifie ${prob0Pct}% de chance de ne rien obtenir. Soyez prudent.`;
    } else if (pAtLeast1 < 0.4) {
      rating = "Faible";
      fomo = `Risque élevé. Vous avez de fortes chances de gaspiller vos coins sans résultat.`;
    } else if (pAtLeast1 < 0.6) {
      rating = "Moyenne";
      fomo = `Vous avez davantage de chances de ne rien obtenir que d'obtenir un Epic.`;
    } else if (pAtLeast1 < 0.8) {
      rating = "Bonne";
      fomo = `Les chances commencent à être en votre faveur, mais une déception reste possible (${prob0Pct}%).`;
    } else {
      rating = "Très élevée";
      fomo = `Les chances sont très favorables. Mais n'oubliez jamais le risque résiduel.`;
    }

    // Calculate targets: Coins needed for 25%, 50%, 75%, 90%, 95%
    const targetProbs = [0.25, 0.50, 0.75, 0.90, 0.95];
    const targetsInfo = [];
    
    for (const tgt of targetProbs) {
      let requiredSpins = 0;
      let tgtP0 = 1;
      while ((1 - tgtP0) < tgt && requiredSpins <= totalPlayers) {
        requiredSpins++;
        const nonE = totalPlayers - epicPlayers;
        if (requiredSpins > nonE) {
          tgtP0 = 0;
        } else {
          tgtP0 = choose(nonE, requiredSpins) / choose(totalPlayers, requiredSpins);
        }
      }
      targetsInfo.push({
        pct: tgt * 100,
        coins: requiredSpins * costPerSpin
      });
    }

    return { prob0: prob0Pct, probAtLeast1: probAtLeast1Pct, chanceRating: rating, antiFomo: fomo, targets: targetsInfo };
  }, [totalPlayers, epicPlayers, currentCoins, costPerSpin, spinsAvailable]);

  // Monte Carlo Validation
  const [mcResult, setMcResult] = useState(null);
  const [isSimulating, setIsSimulating] = useState(false);

  const runMonteCarlo = () => {
    setIsSimulating(true);
    // Use timeout to let UI update before blocking thread
    setTimeout(() => {
      const RUNS = 10000;
      let successes = 0;
      for (let i = 0; i < RUNS; i++) {
        // Pool representing players: 0 to totalPlayers-1.
        // Let's say epics are indices 0 to epicPlayers-1.
        let gotEpic = false;
        const availableIndices = Array.from({length: totalPlayers}, (_, i) => i);
        
        for (let s = 0; s < spinsAvailable; s++) {
          if (availableIndices.length === 0) break;
          const rIndex = Math.floor(Math.random() * availableIndices.length);
          const draw = availableIndices[rIndex];
          // Remove drawn player
          availableIndices.splice(rIndex, 1);
          
          if (draw < epicPlayers) {
            gotEpic = true;
            break;
          }
        }
        if (gotEpic) successes++;
      }
      setMcResult(((successes / RUNS) * 100).toFixed(2));
      setIsSimulating(false);
    }, 50);
  };

  return (
    <div className="max-w-3xl mx-auto pb-12 space-y-6">
      <HeroHeader 
        title="Epic Calculator"
        description="Évaluation stochastique stricte. Ne laissez plus la chance au hasard."
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="pro-card p-6 border-white/5 space-y-4">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider border-b border-white/5 pb-2">Paramètres de la Boîte</h2>
          
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-textdim uppercase">Total de Joueurs</label>
            <input type="number" min="1" value={totalPlayers} onChange={e => setTotalPlayers(Number(e.target.value))} className="input" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-textdim uppercase">Joueurs Epic</label>
            <input type="number" min="1" max={totalPlayers} value={epicPlayers} onChange={e => setEpicPlayers(Number(e.target.value))} className="input" />
          </div>
          <div className="flex flex-col gap-1 mt-4 border-t border-white/5 pt-4">
            <label className="text-xs font-bold text-textdim uppercase">Coins Actuels</label>
            <input type="number" min="0" value={currentCoins} onChange={e => setCurrentCoins(Number(e.target.value))} className="input" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-textdim uppercase">Coût par Spin</label>
            <input type="number" min="1" value={costPerSpin} onChange={e => setCostPerSpin(Number(e.target.value))} className="input" />
          </div>
        </div>

        <div className="pro-card p-6 bg-gradient-to-br from-panel to-ink border-accent/20 flex flex-col justify-center text-center">
          <p className="text-sm font-bold text-textdim uppercase tracking-widest mb-2">Capacité de Tirage</p>
          <p className="text-5xl font-black text-white">{spinsAvailable}</p>
          <p className="text-xs text-textdim font-medium mt-1">spins possibles</p>
          
          <div className="mt-8 pt-6 border-t border-white/5">
            <p className="text-sm font-bold text-textdim uppercase tracking-widest mb-2">Probabilité d'Obtenir ≥ 1 Epic</p>
            <p className={`text-4xl font-black tracking-tight ${parseFloat(probAtLeast1) >= 50 ? 'text-accent' : parseFloat(probAtLeast1) >= 25 ? 'text-warn' : 'text-danger'}`}>
              {probAtLeast1}%
            </p>
            <div className="mt-2 inline-block px-3 py-1 rounded bg-white/5 border border-white/10 text-[10px] font-bold text-white uppercase tracking-widest">
              Chance Rating : <span className={parseFloat(probAtLeast1) >= 50 ? 'text-accent' : 'text-warn'}>{chanceRating}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="pro-card p-6 border-warn/20 bg-warn/5">
        <h3 className="text-warn font-bold flex items-center gap-2 mb-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
          Anti-FOMO Warning
        </h3>
        <p className="text-sm text-white">{antiFomo}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="pro-card p-6">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4 border-b border-white/5 pb-2">Coins Nécessaires (Objectifs)</h3>
          <ul className="space-y-3">
            {targets.map(tgt => (
              <li key={tgt.pct} className="flex justify-between items-center text-sm">
                <span className="text-textdim font-medium">{tgt.pct}% de chance</span>
                <span className="font-bold text-white bg-white/5 px-2 py-1 rounded border border-white/10">{tgt.coins.toLocaleString()} coins</span>
              </li>
            ))}
          </ul>
        </div>
        
        <div className="pro-card p-6">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-2 border-b border-white/5 pb-2">Validation Monte Carlo</h3>
          <p className="text-xs text-textdim mb-4 leading-relaxed">
            La formule hypergéométrique est théoriquement parfaite. Si vous doutez, vous pouvez lancer une simulation empirique de 10 000 tirages virtuels pour valider le résultat mathématique.
          </p>
          {mcResult ? (
            <div className="bg-ink p-4 rounded-xl border border-accent/20 mb-4 text-center">
              <p className="text-[10px] text-accent uppercase tracking-widest font-bold mb-1">Résultat Empirique (10k runs)</p>
              <p className="text-2xl font-black text-white">{mcResult}%</p>
              <p className="text-xs text-textdim mt-2">Écart: {Math.abs(parseFloat(mcResult) - parseFloat(probAtLeast1)).toFixed(2)}%</p>
            </div>
          ) : null}
          <button 
            onClick={runMonteCarlo} 
            disabled={isSimulating || spinsAvailable === 0}
            className="btn-secondary w-full py-2 text-sm"
          >
            {isSimulating ? "Simulation en cours..." : "Lancer 10 000 runs"}
          </button>
        </div>
      </div>
    </div>
  );
}
