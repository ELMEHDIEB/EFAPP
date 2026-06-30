import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../db";
import HeroHeader from "../components/ui/HeroHeader.jsx";

export default function PackAnalysis() {
  const location = useLocation();
  const navigate = useNavigate();
  const [selectedPlayer, setSelectedPlayer] = useState(location.state?.autoSelectPlayer || null);
  const [isFetchingPlayer, setIsFetchingPlayer] = useState(false);
  const [playerMaxData, setPlayerMaxData] = useState(null);
  const [playerFetchError, setPlayerFetchError] = useState(null);
  
  const handlePlayerClick = (player) => {
    setSelectedPlayer(player);
    // Since eFHUB migrated to Next.js App Router, client-side scraping for __NEXT_DATA__ fails.
    // The user has requested to manually instruct clicking the 'Smart' button on the site.
    setPlayerMaxData(null);
    setPlayerFetchError(null);
  };

  const [packData, setPackData] = useState(location.state?.pack || null);
  const allPacks = location.state?.allPacks || [];

  const handleFixPackType = (type) => {
    if (!packData) return;
    const updatedPack = { ...packData, playersCount: type === 'Epic' ? 150 : packData.allPlayers?.length || packData.topPlayers?.length || 11 };
    
    const updatePlayerCats = (arr) => {
      if (!arr) return arr;
      return arr.map((p, idx) => {
        let newCat = 'Standard';
        if (type === 'Epic') {
          if (idx < 3) newCat = 'Epic';
          else if (idx < 11) newCat = 'Highlight';
        } else if (type === 'Highlight') {
          newCat = 'Highlight';
        }
        return { ...p, cardCategory: newCat };
      });
    };

    if (updatedPack.allPlayers) {
      updatedPack.allPlayers = updatePlayerCats(updatedPack.allPlayers);
      updatedPack.topPlayers = updatedPack.allPlayers.slice(0, 5);
    } else if (updatedPack.topPlayers) {
      updatedPack.topPlayers = updatePlayerCats(updatedPack.topPlayers);
    }
    
    setPackData(updatedPack);
    // If a player is currently selected, update their category in the modal too
    if (selectedPlayer) {
      const updatedPlayer = (updatedPack.allPlayers || updatedPack.topPlayers)?.find(p => p.id === selectedPlayer.id);
      if (updatedPlayer) setSelectedPlayer(updatedPlayer);
    }
  };

  const accounts = useLiveQuery(() => db.accounts.toArray(), []) || [];

  if (!packData) {
    return (
      <div className="max-w-3xl mx-auto pb-12 space-y-6 text-center pt-20">
        <p className="text-danger font-bold">Aucun pack sélectionné.</p>
        <button onClick={() => navigate('/live-packs')} className="btn-secondary mt-4">Retour aux Live Packs</button>
      </div>
    );
  }

  // Identify Best Account
  const maxCoins = accounts.length > 0 ? Math.max(...accounts.map(a => a.currentCoins)) : 0;
  const bestAccount = accounts.find(a => a.currentCoins === maxCoins);
  
  // Market Comparison Logic
  const getPackMaxRating = (p) => {
    if (!p.topPlayers) return 0;
    const ratings = p.topPlayers.map(pl => parseInt(pl.rating, 10)).filter(r => !isNaN(r));
    return ratings.length > 0 ? Math.max(...ratings) : 0;
  };

  const currentPackMaxRating = getPackMaxRating(packData);
  
  let betterAlternative = null;
  if (allPacks.length > 0) {
    const sortedPacks = [...allPacks].sort((a, b) => getPackMaxRating(b) - getPackMaxRating(a));
    const bestPackInMarket = sortedPacks[0];
    
    // If the best pack in the market has a significantly higher rating than the current pack
    if (bestPackInMarket.id !== packData.id && getPackMaxRating(bestPackInMarket) > currentPackMaxRating) {
      betterAlternative = bestPackInMarket;
    }
  }

  // Logical Evaluation for "Le Verdict"
  const isBigBox = packData.playersCount > 50; 
  const validRatings = packData.topPlayers.map(p => parseInt(p.rating, 10)).filter(r => !isNaN(r) && r > 0);
  const avgRating = validRatings.length > 0 ? validRatings.reduce((a, b) => a + b, 0) / validRatings.length : 0;
  const hasMegaPlayer = validRatings.some(r => r >= 96);

  let verdict = {
    title: "Analyse en cours...",
    message: "",
    color: "text-textdim",
    bg: "bg-ink",
    border: "border-border",
    canSpin: false
  };

  if (betterAlternative && getPackMaxRating(betterAlternative) >= 96 && !hasMegaPlayer) {
    verdict = {
      title: "ALERTE MARCHÉ : NE PAS SPINNER",
      message: `Tu t'apprêtes à spinner sur un pack moyen. Le pack "${betterAlternative.name}" propose des joueurs bien plus forts (Note Max: ${getPackMaxRating(betterAlternative)}). Garde tes coins pour ce pack-là !`,
      color: "text-danger",
      bg: "bg-danger/5",
      border: "border-danger/30",
      canSpin: false
    };
  } else if (isBigBox) {
    if (maxCoins < 1500) {
      verdict = {
        title: "DANGER : NE PAS SPINNER",
        message: "C'est une boîte de 150 joueurs. Tu n'as pas assez de coins (min 1500 recommandés) pour amortir le risque mathématique. Garde tes pièces.",
        color: "text-danger",
        bg: "bg-danger/5",
        border: "border-danger/30",
        canSpin: false
      };
    } else if (hasMegaPlayer) {
      verdict = {
        title: "FEU VERT SOUS CONDITION",
        message: "Il y a des joueurs exceptionnels (Note ≥ 96). Tu as un compte solide, mais fixe-toi une limite STRICTE de perte.",
        color: "text-accent",
        bg: "bg-accent/5",
        border: "border-accent/30",
        canSpin: true
      };
    } else {
      verdict = {
        title: "RISQUE INUTILE",
        message: "Boîte de 150 joueurs, mais les notes affichées ne justifient pas de vider tes économies.",
        color: "text-warn",
        bg: "bg-warn/5",
        border: "border-warn/30",
        canSpin: false
      };
    }
  } else {
    // Small box (POTW / CS)
    if (maxCoins < 300) {
      verdict = {
        title: "TROP PAUVRE",
        message: "Tu n'as même pas 300 coins pour vider la sélection. Ne gâche pas le peu qu'il te reste.",
        color: "text-danger",
        bg: "bg-danger/5",
        border: "border-danger/30",
        canSpin: false
      };
    } else if (avgRating >= 93) {
      verdict = {
        title: "FEU VERT : TRÈS RENTABLE",
        message: "Les sélections à 11 joueurs avec d'aussi bonnes notes sont les meilleurs investissements du jeu.",
        color: "text-accent",
        bg: "bg-accent/5",
        border: "border-accent/30",
        canSpin: true
      };
    } else {
      verdict = {
        title: "PASSABLE",
        message: "C'est peu coûteux (100 coins/spin) mais les joueurs ne sont pas incroyables. Tire uniquement si besoin.",
        color: "text-warn",
        bg: "bg-warn/5",
        border: "border-warn/30",
        canSpin: true
      };
    }
  }

  return (
    <div className="max-w-5xl mx-auto pb-12 space-y-6">
      <HeroHeader 
        title="Analyse du Pack"
        description="Le Mental Coach évalue le risque pour toi avant que tu ne craques."
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Colonne de Gauche : Le Pack */}
        <div className="lg:col-span-2 space-y-6">
          <div className="pro-card overflow-hidden">
            <div className="p-6 border-b border-white/5 flex justify-between items-center bg-ink/50">
              <div className="flex items-center gap-3">
                <h2 className="text-lg font-bold text-white">{packData.name}</h2>
                <div className="flex bg-black/30 rounded p-0.5">
                  <button 
                    onClick={() => handleFixPackType('Epic')} 
                    className={`text-[9px] font-bold px-2 py-1 rounded transition-colors ${isBigBox ? 'bg-amber-500/20 text-amber-500' : 'text-textdim hover:text-white'}`}
                  >
                    150 (Epic)
                  </button>
                  <button 
                    onClick={() => handleFixPackType('Highlight')} 
                    className={`text-[9px] font-bold px-2 py-1 rounded transition-colors ${!isBigBox ? 'bg-blue-500/20 text-blue-400' : 'text-textdim hover:text-white'}`}
                  >
                    11 (Highlight)
                  </button>
                </div>
              </div>
              <span className="text-[10px] uppercase tracking-widest text-textdim font-bold bg-white/5 px-2 py-1 rounded">
                {packData.playersCount} Joueurs
              </span>
            </div>
            <div className="p-6 bg-gradient-to-br from-panel to-ink">
              <p className="text-[10px] uppercase tracking-widest text-textdim font-bold mb-4">Top Joueurs Détectés</p>
              <div className="flex flex-wrap gap-4">
                {packData.topPlayers?.map((p, idx) => (
                  <div key={idx} onClick={() => handlePlayerClick(p)} className="relative group w-24 cursor-pointer">
                    <img src={p.imageUrl} alt={p.name} title={p.name} className="w-full object-contain drop-shadow-2xl transition-transform hover:scale-110" />
                    {p.rating && (
                      <div className="absolute -bottom-2 -right-2 bg-black/90 border border-white/10 text-white text-[10px] font-black px-2 py-1 rounded shadow-lg flex flex-col items-center leading-none">
                        <span>{p.rating}</span>
                        {p.cardCategory && <span className={`text-[8px] mt-0.5 ${p.cardCategory === 'Epic' ? 'text-amber-500' : p.cardCategory === 'Highlight' ? 'text-blue-400' : 'text-accent/80'}`}>{p.cardCategory}</span>}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Le Verdict */}
          <div className={`pro-card p-6 border ${verdict.border} ${verdict.bg}`}>
            <h3 className={`text-xl font-black mb-2 ${verdict.color} flex items-center gap-2`}>
              {verdict.color === "text-danger" && (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
              )}
              {verdict.title}
            </h3>
            <p className="text-sm text-white/90 leading-relaxed">
              {verdict.message}
            </p>
          </div>

          {/* Boutons d'Action */}
          <div className="flex flex-col sm:flex-row gap-4">
            <button 
              onClick={() => navigate('/simulator', { state: { pack: packData } })} 
              className="btn-primary flex-1 py-3 text-sm flex justify-center items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 10l-2 1m0 0l-2-1m2 1v2.5M20 7l-2 1m2-1l-2-1m2 1v2.5M14 4l-2-1-2 1M4 7l2-1M4 7l2 1M4 7v2.5M12 21l-2-1m2 1l2-1m-2 1v-2.5M6 18l-2-1v-2.5M18 18l2-1v-2.5" /></svg>
              Lancer le Simulateur de Box
            </button>
            <button 
              onClick={() => navigate('/epic-calculator', { state: { prefillName: packData.name } })} 
              className="btn-secondary flex-1 py-3 text-sm flex justify-center items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
              Calculer Pity (Epic Calc)
            </button>
            <button 
              onClick={() => navigate('/spin-tracker')} 
              className={`flex-1 py-3 text-sm flex justify-center items-center gap-2 ${verdict.canSpin ? 'bg-surfaceElevated border border-white/20 text-white hover:bg-white/10' : 'bg-surfaceInteractive text-textdim border border-border rounded-lg hover:text-white hover:border-white/20 transition-colors'}`}
            >
              Aller au Spin Tracker
            </button>
          </div>
        </div>

        {/* Colonne de Droite : Stats du Joueur */}
        <div className="space-y-6">
          <div className="pro-card p-6">
            <h3 className="pro-heading mb-6">Diagnostic de tes Comptes</h3>
            
            {accounts.length === 0 ? (
              <p className="text-xs text-textdim">Aucun compte trouvé. Va dans "Comptes" pour en ajouter un.</p>
            ) : (
              <div className="space-y-4">
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-textdim font-bold mb-1">Capacité Maximale</p>
                  <p className="text-2xl font-black text-white">{maxCoins} <span className="text-sm font-medium text-textdim">coins dispo</span></p>
                  <p className="text-[10px] text-textdim mt-1 truncate">Via: {bestAccount?.name}</p>
                </div>
                
                <div className="pt-4 border-t border-white/5">
                  <p className="text-[10px] uppercase tracking-widest text-textdim font-bold mb-3">État des comptes</p>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-textdim">Comptes "Prêts" (≥ 1500)</span>
                      <span className="font-bold text-white">{accounts.filter(a => a.currentCoins >= 1500).length}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-textdim">Comptes "Faibles" (&lt; 300)</span>
                      <span className="font-bold text-white">{accounts.filter(a => a.currentCoins < 300).length}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Player Details Modal */}
      {selectedPlayer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setSelectedPlayer(null)}></div>
          
          <div className="relative w-full max-w-4xl bg-panel/90 border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row animate-scaleIn">
            <button 
              onClick={() => setSelectedPlayer(null)}
              className="absolute top-4 right-4 z-20 bg-black/50 text-white p-2 rounded-full hover:bg-white/20 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
            
            {/* Image Section */}
            <div className={`md:w-1/2 p-10 flex justify-center items-center relative overflow-hidden bg-gradient-to-br ${
              selectedPlayer.cardCategory === 'Epic' ? 'from-amber-500/20 to-black' :
              selectedPlayer.cardCategory === 'Show Time' ? 'from-pink-600/20 to-black' :
              selectedPlayer.cardCategory === 'POTW' ? 'from-emerald-500/20 to-black' :
              'from-accent/20 to-black'
            }`}>
              <div className={`absolute inset-0 opacity-30 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] ${
                selectedPlayer.cardCategory === 'Epic' ? 'from-amber-400 via-transparent to-transparent' :
                selectedPlayer.cardCategory === 'Show Time' ? 'from-pink-500 via-transparent to-transparent' :
                'from-accent via-transparent to-transparent'
              }`}></div>
              <img src={selectedPlayer.imageUrl} alt={selectedPlayer.name} className="relative z-10 max-h-80 object-contain drop-shadow-[0_20px_50px_rgba(0,0,0,0.5)]" />
            </div>
            
            {/* Info Section */}
            <div className="md:w-1/2 p-8 flex flex-col">
              <div className="mb-2">
                <span className={`text-[10px] uppercase tracking-widest font-black px-2 py-1 rounded ${
                  selectedPlayer.cardCategory === 'Epic' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                  selectedPlayer.cardCategory === 'Show Time' ? 'bg-pink-500/20 text-pink-400 border border-pink-500/30' :
                  'bg-white/10 text-white border border-white/20'
                }`}>
                  {selectedPlayer.cardCategory || 'Standard'}
                </span>
                <span className="ml-2 text-[10px] uppercase tracking-widest text-textdim font-bold bg-white/5 px-2 py-1 rounded">
                  {selectedPlayer.position}
                </span>
              </div>
              
              <h2 className="text-3xl font-black text-white mb-6">{selectedPlayer.name}</h2>
              
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-ink/50 p-4 rounded-xl border border-white/5 text-center">
                  <p className="text-[10px] uppercase tracking-widest text-textdim font-bold mb-1">Note de Base</p>
                  <p className="text-3xl font-black text-white">{selectedPlayer.rating}</p>
                </div>
                <div className="bg-accent/10 p-4 rounded-xl border border-accent/20 text-center relative overflow-hidden group">
                  <div className="absolute inset-0 bg-accent/5"></div>
                  <p className="text-[10px] uppercase tracking-widest text-accent font-bold mb-1 relative z-10">Smart Max (Boosté)</p>
                  <div className="relative z-10 h-9 flex flex-col items-center justify-center">
                     <span className="text-xl font-black text-accent group-hover:hidden">?</span>
                     <span className="text-[10px] font-bold text-accent hidden group-hover:block uppercase tracking-widest">Voir sur eFHUB</span>
                  </div>
                </div>
              </div>
              
              <div className="mt-auto space-y-4">
                <p className="text-sm text-textdim italic border-l-2 border-accent pl-4 py-1">
                  "Pour avoir toutes les informations, il faut que tu ailles sur la carte sur le site eFHUB, que tu cliques sur la carte et que tu sélectionnes 'Smart' pour avoir la Max Rate de la carte."
                </p>
                <a 
                  href={`https://efhub.com/players/${selectedPlayer.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-primary w-full py-3 text-sm flex justify-center items-center gap-2 group"
                >
                  Ouvrir l'Analyse Complète sur eFHUB
                  <svg className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
