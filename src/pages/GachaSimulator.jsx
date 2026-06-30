import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import HeroHeader from "../components/ui/HeroHeader.jsx";
import { tokens } from "../styles/designTokens";

const DEFAULT_BOX = {
  total: 150,
  epics: 3,
  highlights: 8,
  standards: 139
};

// Fisher-Yates Shuffle
function shuffle(array) {
  let currentIndex = array.length, randomIndex;
  while (currentIndex !== 0) {
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;
    [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
  }
  return array;
}

export default function GachaSimulator() {
  const location = useLocation();
  const navigate = useNavigate();
  const importedPack = location.state?.pack;

  const [box, setBox] = useState([]);
  const [coinsSpent, setCoinsSpent] = useState(0);
  const [history, setHistory] = useState([]);
  const [isSpinning, setIsSpinning] = useState(false);
  const [epicPulled, setEpicPulled] = useState(null);
  const [boxConfig, setBoxConfig] = useState(DEFAULT_BOX);
  const [boxMode, setBoxMode] = useState('auto'); // 'auto', '150', '11'

  // Initialize Box
  const resetBox = () => {
    let newBox = [];
    let config = { ...DEFAULT_BOX };

    if (importedPack && importedPack.allPlayers) {
      let epics = 0;
      let highlights = 0;
      let standards = 0;

      // Determine if we should treat this as a 150 box
      let is150 = false;
      if (boxMode === 'auto') {
        let hasEpics = false;
        importedPack.allPlayers.forEach(p => {
          const type = (p.cardCategory && p.cardCategory !== 'Standard') ? p.cardCategory : 'Standard';
          if (['Epic', 'Show Time', 'Big Time'].includes(type)) {
            hasEpics = true;
          }
        });
        is150 = hasEpics;
      } else {
        is150 = boxMode === '150';
      }

      const boxSize = is150 ? Math.max(150, importedPack.playersCount || 150) : importedPack.allPlayers.length;

      importedPack.allPlayers.forEach((p, index) => {
        let type = 'Standard';
        
        if (boxMode === 'auto') {
          const rawType = (p.cardCategory && p.cardCategory !== 'Standard') ? p.cardCategory : 'Standard';
          type = rawType === 'Show Time' || rawType === 'Big Time' ? 'Epic' : (rawType === 'POTW' ? 'Highlight' : rawType);
        } else if (boxMode === '150') {
          if (index < 3) type = 'Epic';
          else if (index < 11) type = 'Highlight';
          else type = 'Standard';
        } else if (boxMode === '11') {
          type = 'Highlight';
        }

        if (type === 'Epic') epics++;
        else if (type === 'Highlight') highlights++;
        else standards++;

        newBox.push({
          type: type,
          player: p
        });
      });

      // Fill the rest with generic standard players if it's a 150 box
      const remainingStandards = boxSize - newBox.length;
      if (remainingStandards > 0) {
        standards += remainingStandards;
        for (let i = 0; i < remainingStandards; i++) {
          newBox.push({ type: "Standard", player: null });
        }
      }

      config = {
        total: boxSize,
        epics,
        highlights,
        standards
      };
    } else {
      for (let i = 0; i < DEFAULT_BOX.epics; i++) newBox.push({ type: "Epic", player: null });
      for (let i = 0; i < DEFAULT_BOX.highlights; i++) newBox.push({ type: "Highlight", player: null });
      for (let i = 0; i < DEFAULT_BOX.standards; i++) newBox.push({ type: "Standard", player: null });
    }

    setBoxConfig(config);
    setBox(shuffle(newBox));
    setCoinsSpent(0);
    setHistory([]);
  };

  useEffect(() => {
    resetBox();
  }, [importedPack, boxMode]);

  const remainingStats = {
    total: box.length,
    epics: box.filter(t => t.type === "Epic").length,
    highlights: box.filter(t => t.type === "Highlight").length,
    standards: box.filter(t => t.type === "Standard").length,
  };

  const handleSpin = async (amount) => {
    if (box.length < amount) return;
    
    setIsSpinning(true);
    // Simulate network/spin delay
    await new Promise(r => setTimeout(r, 600));

    const pulls = [];
    const newBox = [...box];
    const foundEpics = [];

    for (let i = 0; i < amount; i++) {
      const randomIndex = Math.floor(Math.random() * newBox.length);
      const pulledItem = newBox.splice(randomIndex, 1)[0];
      
      const pullObj = {
        id: Date.now() + i,
        ...pulledItem,
        pullNumber: (boxConfig.total - newBox.length)
      };
      pulls.push(pullObj);

      if (pulledItem.type === "Epic") {
        foundEpics.push(pulledItem);
      }
    }

    setBox(newBox);
    setCoinsSpent(prev => prev + (amount === 10 ? 900 : 100));
    setHistory(prev => [...pulls, ...prev]);
    setIsSpinning(false);

    if (foundEpics.length > 0) {
      setEpicPulled(foundEpics);
      setTimeout(() => setEpicPulled(null), foundEpics.length > 1 ? 6000 : 4000);
    }
  };

  const renderCard = (item) => {
    const { type, player } = item;
    let bg = "bg-surface border-border";
    let text = "text-textdim";
    if (type === "Epic") {
      bg = "bg-amber-500/20 border-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.5)]";
      text = "text-amber-500 font-bold";
    } else if (type === "Highlight") {
      bg = "bg-blue-500/20 border-blue-500";
      text = "text-blue-400 font-bold";
    }

    return (
      <div className={`flex flex-col items-center justify-center p-2 rounded-xl border ${bg} ${tokens.animations.fast} min-h-[100px] overflow-hidden relative group`}>
        {player?.imageUrl ? (
          <>
            <img src={player.imageUrl} alt={player.name} className="w-full object-contain h-16 drop-shadow-md z-10" />
            <div className="absolute bottom-1 w-full text-center z-20">
              <span className={`text-[9px] truncate px-1 block w-full bg-black/60 ${text}`}>{player.name}</span>
            </div>
            {player.rating && (
              <div className="absolute top-1 right-1 bg-black/80 text-white text-[8px] font-bold px-1 rounded shadow-lg">
                {player.rating}
              </div>
            )}
          </>
        ) : (
          <span className={`text-sm ${text}`}>{type}</span>
        )}
      </div>
    );
  };

  return (
    <div className="max-w-5xl mx-auto pb-12 space-y-6">
      <HeroHeader 
        title={importedPack ? `Simulateur : ${importedPack.name}` : "Simulateur de Tirage"}
        description={importedPack ? `Simulation basée sur les données du live pack eFHUB.` : "Testez votre chance virtuellement sur une box classique de 150 joueurs."}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Stats & Controls */}
        <div className="md:col-span-1 space-y-6">
          <div className="pro-card p-6 relative overflow-hidden">
            {importedPack && (
              <div className="absolute top-0 right-0 bg-accent/20 text-accent text-[10px] font-bold px-3 py-1 rounded-bl-xl border-l border-b border-accent/30 z-10">
                DATA IMPORTÉE
              </div>
            )}
            
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-bold text-white">Statut de la Box</h3>
              {importedPack && (
                <select 
                  value={boxMode} 
                  onChange={(e) => setBoxMode(e.target.value)}
                  className="bg-surfaceElevated border border-border rounded text-xs text-textdim px-2 py-1 outline-none"
                >
                  <option value="auto">Taille: Auto</option>
                  <option value="150">Forcer Box 150 (Epic)</option>
                  <option value="11">Forcer Box 11 (Highlight)</option>
                </select>
              )}
            </div>
            
            <div className="flex justify-between items-end mb-2">
              <span className="text-3xl font-black text-white">{remainingStats.total} <span className="text-sm font-medium text-textdim">/ {boxConfig.total}</span></span>
            </div>

            <div className="w-full h-3 bg-surfaceElevated rounded-full overflow-hidden flex mb-6">
              <div style={{ width: `${(remainingStats.epics / boxConfig.total) * 100}%` }} className="bg-amber-500 h-full transition-all duration-300" />
              <div style={{ width: `${(remainingStats.highlights / boxConfig.total) * 100}%` }} className="bg-blue-500 h-full transition-all duration-300" />
              <div style={{ width: `${(remainingStats.standards / boxConfig.total) * 100}%` }} className="bg-textdim h-full transition-all duration-300" />
            </div>

            <div className="space-y-3 mb-8">
              <div className="flex justify-between items-center text-sm">
                <span className="text-amber-500 font-bold flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-amber-500" />Epics</span>
                <span className="text-white font-bold">{remainingStats.epics}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-blue-400 font-bold flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-blue-500" />Highlights</span>
                <span className="text-white font-bold">{remainingStats.highlights}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-textdim font-medium flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-textdim" />Standards</span>
                <span className="text-white font-bold">{remainingStats.standards}</span>
              </div>
            </div>

            <h3 className="text-sm font-bold text-textdim uppercase tracking-wider mb-3">Coût Virtuel</h3>
            <div className="bg-surfaceElevated rounded-xl p-4 flex items-center justify-between border border-border">
              <span className="text-textmuted">Coins dépensés</span>
              <span className="text-2xl font-black text-accent">{coinsSpent}</span>
            </div>
            
            <button 
              onClick={resetBox}
              className="mt-6 w-full py-2 bg-surfaceElevated hover:bg-white/5 border border-white/10 rounded-lg text-sm text-white font-medium transition-colors"
            >
              Réinitialiser la Box
            </button>
            
            {importedPack && (
              <button 
                onClick={() => navigate('/live-packs')}
                className="mt-3 w-full py-2 bg-transparent hover:bg-white/5 border border-transparent hover:border-white/10 rounded-lg text-xs text-textdim transition-colors"
              >
                Changer de Pack
              </button>
            )}
          </div>
        </div>

        {/* Right Column: Actions & History */}
        <div className="md:col-span-2 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <button 
              disabled={isSpinning || remainingStats.total < 1}
              onClick={() => handleSpin(1)}
              className="relative overflow-hidden group bg-surface border border-white/10 p-6 rounded-2xl hover:border-white/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="flex flex-col items-center gap-2 relative z-10">
                <span className="text-3xl font-black text-white">1x</span>
                <span className="text-sm font-semibold text-textdim">100 Coins</span>
              </div>
            </button>

            <button 
              disabled={isSpinning || remainingStats.total < 10}
              onClick={() => handleSpin(10)}
              className="relative overflow-hidden group bg-surface border border-accent/30 p-6 rounded-2xl hover:border-accent transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-accent/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="flex flex-col items-center gap-2 relative z-10">
                <span className="text-3xl font-black text-accent">10x</span>
                <span className="text-sm font-semibold text-accent/80">900 Coins</span>
              </div>
            </button>
          </div>

          <div className="pro-card p-6 min-h-[400px]">
            <h3 className="text-lg font-bold text-white mb-4">Historique des Tirages</h3>
            {history.length === 0 ? (
              <div className="h-48 flex items-center justify-center border-2 border-dashed border-border rounded-xl">
                <p className="text-textdim font-medium">Lancez un tirage pour voir le résultat ici.</p>
              </div>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                <AnimatePresence>
                  {history.map((pull) => (
                    <motion.div
                      key={pull.id}
                      initial={{ opacity: 0, scale: 0.8, y: 20 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      className="relative"
                    >
                      <div className="absolute -top-2 -left-2 w-5 h-5 bg-surfaceElevated rounded-full border border-border flex items-center justify-center z-30 text-[9px] font-bold text-white shadow-lg">
                        {pull.pullNumber}
                      </div>
                      {renderCard(pull)}
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Epic Animation Modal */}
      <AnimatePresence>
        {epicPulled && epicPulled.length > 0 && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={`fixed inset-0 z-[100] flex items-center justify-center backdrop-blur-md pointer-events-none transition-colors duration-1000 ${
              epicPulled.length > 1 ? 'bg-black' : 'bg-ink/95'
            }`}
          >
            {/* Multi-Epic Black Animation Effects */}
            {epicPulled.length > 1 && (
              <>
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-white/10 via-black to-black opacity-80" />
                <motion.div 
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: [0, 1, 0], scale: [1, 1.5, 2] }}
                  transition={{ duration: 1, repeat: Infinity, repeatDelay: 1 }}
                  className="absolute inset-0 border-[20px] border-white/5 rounded-full blur-3xl pointer-events-none"
                />
              </>
            )}

            <div className={`text-center flex flex-col items-center gap-10 z-10 w-full max-w-6xl px-4 ${epicPulled.length > 1 ? 'justify-center' : ''}`}>
              
              {/* Header Text */}
              <motion.div
                initial={{ y: -50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="space-y-2 relative z-20"
              >
                <h2 className={`text-6xl md:text-8xl font-black tracking-tight ${
                  epicPulled.length > 1 
                    ? 'text-white drop-shadow-[0_0_20px_rgba(255,255,255,0.8)]' 
                    : 'text-amber-500 drop-shadow-[0_0_15px_rgba(245,158,11,1)]'
                }`}>
                  {epicPulled.length > 1 ? 'MULTI EPIC !!!' : (epicPulled[0].player?.name ? epicPulled[0].player.name.toUpperCase() : "EPIC PULLED!")}
                </h2>
                {epicPulled.length === 1 && epicPulled[0].player?.rating && (
                  <p className="text-3xl text-white font-bold bg-amber-500/20 inline-block px-4 py-1 rounded-full border border-amber-500/50 mt-4">
                    OVR: {epicPulled[0].player.rating}
                  </p>
                )}
              </motion.div>

              {/* Cards Container */}
              <div className={`flex flex-wrap justify-center items-center gap-8 md:gap-16 relative z-10 ${epicPulled.length > 1 ? 'mt-8' : ''}`}>
                {epicPulled.length === 1 && (
                  <div className="absolute inset-0 bg-amber-500 blur-[100px] opacity-30 rounded-full z-0" />
                )}
                
                {epicPulled.map((epic, idx) => (
                  <motion.div 
                    key={idx}
                    initial={{ scale: 0.5, y: 100, opacity: 0 }}
                    animate={{ scale: 1, y: 0, opacity: 1 }}
                    transition={{ 
                      type: "spring", 
                      stiffness: 200, 
                      damping: 20, 
                      delay: epicPulled.length > 1 ? 0.5 + (idx * 0.3) : 0 
                    }}
                    className="relative group"
                  >
                    {/* Spotlights for Multi-Epic */}
                    {epicPulled.length > 1 && (
                      <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: [0.5, 1, 0.5] }}
                        transition={{ duration: 2, repeat: Infinity, delay: idx * 0.5 }}
                        className="absolute inset-0 bg-white blur-[80px] opacity-20 rounded-full z-0" 
                      />
                    )}

                    {epic.player?.imageUrl ? (
                      <div className="relative flex flex-col items-center">
                        <img 
                          src={epic.player.imageUrl} 
                          alt={epic.player.name} 
                          className={`${epicPulled.length > 1 ? 'w-48 h-48 md:w-64 md:h-64' : 'w-64 h-64 md:w-80 md:h-80'} object-contain drop-shadow-[0_0_30px_rgba(245,158,11,0.6)] relative z-10`} 
                        />
                        {epicPulled.length > 1 && epic.player?.name && (
                          <div className="mt-4 bg-black/80 border border-white/20 px-4 py-2 rounded-lg text-white font-black tracking-widest text-lg md:text-xl relative z-20">
                            {epic.player.name.toUpperCase()}
                            {epic.player.rating && <span className="ml-3 text-amber-500">{epic.player.rating}</span>}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-9xl animate-bounce relative z-10">✨</div>
                    )}
                  </motion.div>
                ))}
              </div>

            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
