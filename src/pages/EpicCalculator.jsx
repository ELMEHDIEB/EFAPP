import { useState, useMemo, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../db.js";
import HeroHeader from "../components/ui/HeroHeader.jsx";
import ExpandableCard from "../components/forgeui/expandable-card.jsx";


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
  const location = useLocation();
  const accounts = useLiveQuery(() => db.accounts.toArray(), []) || [];
  
  const [totalPlayers, setTotalPlayers] = useState(150);
  const [epicPlayers, setEpicPlayers] = useState(3);
  const [currentCoins, setCurrentCoins] = useState(900);
  const [costPerSpin, setCostPerSpin] = useState(100);
  const [packName, setPackName] = useState("");
  const [selectedAccountId, setSelectedAccountId] = useState("");

  useEffect(() => {
    if (selectedAccountId) {
      const acc = accounts.find(a => a.id === Number(selectedAccountId));
      if (acc) {
        setCurrentCoins(acc.currentCoins);
      }
    } else if (accounts.length > 0) {
      // Auto-select the best account by default
      const best = accounts.reduce((prev, current) => (prev.currentCoins > current.currentCoins) ? prev : current);
      setSelectedAccountId(best.id.toString());
      setCurrentCoins(best.currentCoins);
    }
  }, [selectedAccountId, accounts]);

  useEffect(() => {
    if (location.state?.prefillName) {
      setPackName(location.state.prefillName);
      if (location.state.prefillName.toLowerCase().includes('potd') || location.state.prefillName.toLowerCase().includes('potw')) {
        setTotalPlayers(11);
        setEpicPlayers(1);
      } else {
        setTotalPlayers(150);
        setEpicPlayers(3);
      }
    }
  }, [location.state]);

  const spinsAvailable = useMemo(() => {
    // Dans eFootball, pour les grosses boîtes (Epic 150), un multi-tirage de 900 coins = 10 spins (1 gratuit).
    if (costPerSpin === 100 && totalPlayers > 50) {
      const bundle10 = Math.floor(currentCoins / 900);
      const remainder = currentCoins % 900;
      const singles = Math.floor(remainder / 100);
      return (bundle10 * 10) + singles;
    }
    return Math.floor(currentCoins / costPerSpin);
  }, [currentCoins, costPerSpin, totalPlayers]);

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
        title={packName ? `Epic Calculator : ${packName}` : "Epic Calculator"}
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
            <label className="text-xs font-bold text-textdim uppercase">Sélectionner un Compte</label>
            <select 
              value={selectedAccountId} 
              onChange={e => setSelectedAccountId(e.target.value)} 
              className="input bg-surfaceInteractive"
            >
              <option value="">Sélection manuelle</option>
              {accounts.map(a => (
                <option key={a.id} value={a.id}>{a.name} ({a.currentCoins} coins)</option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1 mt-4">
            <label className="text-xs font-bold text-textdim uppercase">Coins Actuels</label>
            <input 
              type="number" 
              min="0" 
              value={currentCoins} 
              onChange={e => {
                setCurrentCoins(Number(e.target.value));
                if (selectedAccountId) setSelectedAccountId("");
              }} 
              className="input" 
            />
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

      <div className="mt-8">
        <ExpandableCard 
          className="flex-col !p-0 gap-4"
          items={[
            {
              id: "targets",
              title: "Objectifs de Coins",
              subtitle: "Paliers de certitude",
              description: "Combien pour x% ?",
              icon: <svg className="w-6 h-6 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>,
              details: (
                <div className="flex flex-col gap-4 mt-2">
                  <p className="text-sm">Voici les montants exacts nécessaires pour atteindre certains paliers de certitude mathématique :</p>
                  <ul className="space-y-3 w-full">
                    {targets.map(tgt => (
                      <li key={tgt.pct} className="flex justify-between items-center text-sm w-full border-b border-border pb-2">
                        <span className="font-medium text-textdim">{tgt.pct}% de chance</span>
                        <span className="font-bold text-accent bg-accent/10 px-2 py-1 rounded">{tgt.coins.toLocaleString()} coins</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )
            },
            {
              id: "fomo",
              title: "Anti-FOMO Warning",
              subtitle: "Analyse du risque",
              description: chanceRating,
              icon: <svg className="w-6 h-6 text-warn" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>,
              details: (
                <div className="flex flex-col gap-3 p-4 bg-warn/10 rounded-xl border border-warn/20 mt-2">
                  <p className="text-white font-medium">{antiFomo}</p>
                  <p className="text-xs text-textdim leading-relaxed">Les probabilités ne sont pas des garanties absolues. Mettre de l'argent réel sur des micro-transactions ne doit jamais être impulsif. Respectez toujours votre budget.</p>
                </div>
              )
            },
            {
              id: "montecarlo",
              title: "Validation Monte Carlo",
              subtitle: "Simulation empirique",
              description: "10 000 tirages virtuels",
              icon: <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>,
              details: (
                <div className="flex flex-col gap-4 mt-2">
                  <p className="text-sm leading-relaxed">
                    La formule hypergéométrique est théoriquement parfaite. Si vous doutez, vous pouvez lancer une simulation empirique de 10 000 tirages virtuels pour valider le résultat mathématique.
                  </p>
                  {mcResult && (
                    <div className="bg-ink p-4 rounded-xl border border-accent/20 text-center w-full">
                      <p className="text-[10px] text-accent uppercase tracking-widest font-bold mb-1">Résultat Empirique</p>
                      <p className="text-2xl font-black text-white">{mcResult}%</p>
                      <p className="text-xs text-textdim mt-1">Écart théorique: {Math.abs(parseFloat(mcResult) - parseFloat(probAtLeast1)).toFixed(2)}%</p>
                    </div>
                  )}
                  <button 
                    onClick={runMonteCarlo} 
                    disabled={isSimulating || spinsAvailable === 0}
                    className="btn-secondary w-full py-2 text-sm mt-2"
                  >
                    {isSimulating ? "Simulation en cours..." : "Lancer 10 000 runs"}
                  </button>
                </div>
              )
            }
          ]}
        />
      </div>
    </div>
  );
}
