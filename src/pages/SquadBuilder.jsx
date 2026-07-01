import { useState, useEffect, useRef } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../db";
import HeroHeader from "../components/ui/HeroHeader.jsx";

const DEFAULT_TACTICS = {
  "4-3-3": {
    name: "4-3-3 Classique",
    positions: {
      CF: { name: "", rating: "", role: "CF", x: 50, y: 15 },
      LWF: { name: "", rating: "", role: "LWF", x: 20, y: 25 },
      AMF: { name: "", rating: "", role: "AMF", x: 50, y: 35 },
      RWF: { name: "", rating: "", role: "RWF", x: 80, y: 25 },
      CMF: { name: "", rating: "", role: "CMF", x: 30, y: 55 },
      DMF: { name: "", rating: "", role: "DMF", x: 70, y: 55 },
      LB: { name: "", rating: "", role: "LB", x: 15, y: 75 },
      CB1: { name: "", rating: "", role: "CB", x: 35, y: 80 },
      CB2: { name: "", rating: "", role: "CB", x: 65, y: 80 },
      RB: { name: "", rating: "", role: "RB", x: 85, y: 75 },
      GK: { name: "", rating: "", role: "GK", x: 50, y: 92 }
    }
  },
  "4-4-2": {
    name: "4-4-2 Classique",
    positions: {
      CF1: { name: "", rating: "", role: "CF", x: 35, y: 15 },
      CF2: { name: "", rating: "", role: "CF", x: 65, y: 15 },
      LMF: { name: "", rating: "", role: "LMF", x: 15, y: 45 },
      CMF1: { name: "", rating: "", role: "CMF", x: 35, y: 50 },
      CMF2: { name: "", rating: "", role: "CMF", x: 65, y: 50 },
      RMF: { name: "", rating: "", role: "RMF", x: 85, y: 45 },
      LB: { name: "", rating: "", role: "LB", x: 15, y: 75 },
      CB1: { name: "", rating: "", role: "CB", x: 35, y: 80 },
      CB2: { name: "", rating: "", role: "CB", x: 65, y: 80 },
      RB: { name: "", rating: "", role: "RB", x: 85, y: 75 },
      GK: { name: "", rating: "", role: "GK", x: 50, y: 92 }
    }
  },
  "4-2-3-1": {
    name: "4-2-3-1",
    positions: {
      CF: { name: "", rating: "", role: "CF", x: 50, y: 15 },
      LMF: { name: "", rating: "", role: "LMF", x: 20, y: 35 },
      AMF: { name: "", rating: "", role: "AMF", x: 50, y: 35 },
      RMF: { name: "", rating: "", role: "RMF", x: 80, y: 35 },
      DMF1: { name: "", rating: "", role: "DMF", x: 35, y: 55 },
      DMF2: { name: "", rating: "", role: "DMF", x: 65, y: 55 },
      LB: { name: "", rating: "", role: "LB", x: 15, y: 75 },
      CB1: { name: "", rating: "", role: "CB", x: 35, y: 80 },
      CB2: { name: "", rating: "", role: "CB", x: 65, y: 80 },
      RB: { name: "", rating: "", role: "RB", x: 85, y: 75 },
      GK: { name: "", rating: "", role: "GK", x: 50, y: 92 }
    }
  },
  "3-4-3": {
    name: "3-4-3",
    positions: {
      CF: { name: "", rating: "", role: "CF", x: 50, y: 15 },
      LWF: { name: "", rating: "", role: "LWF", x: 20, y: 25 },
      RWF: { name: "", rating: "", role: "RWF", x: 80, y: 25 },
      LMF: { name: "", rating: "", role: "LMF", x: 15, y: 50 },
      CMF1: { name: "", rating: "", role: "CMF", x: 35, y: 50 },
      CMF2: { name: "", rating: "", role: "CMF", x: 65, y: 50 },
      RMF: { name: "", rating: "", role: "RMF", x: 85, y: 50 },
      CB1: { name: "", rating: "", role: "CB", x: 25, y: 80 },
      CB2: { name: "", rating: "", role: "CB", x: 50, y: 80 },
      CB3: { name: "", rating: "", role: "CB", x: 75, y: 80 },
      GK: { name: "", rating: "", role: "GK", x: 50, y: 92 }
    }
  }
};

export default function SquadBuilder() {
  const accounts = useLiveQuery(() => db.accounts.toArray(), []) || [];
  const settingsData = useLiveQuery(() => db.settings.get("custom_tactics"), []);
  const customTactics = settingsData?.value || {};

  const ALL_TACTICS = { ...DEFAULT_TACTICS, ...customTactics };

  const [accountId, setAccountId] = useState(null);
  const [squadId, setSquadId] = useState(null);
  const [tactic, setTactic] = useState("4-3-3");
  const [positions, setPositions] = useState(DEFAULT_TACTICS["4-3-3"].positions);
  const [editingSlot, setEditingSlot] = useState(null);
  const [editData, setEditData] = useState({ name: "", rating: "", role: "" });

  const pitchRef = useRef(null);
  const [dragState, setDragState] = useState(null);

  useEffect(() => {
    if (accounts.length > 0 && !accountId) {
      setAccountId(accounts[0].id);
    }
  }, [accounts, accountId]);

  useEffect(() => {
    async function loadSquad() {
      if (!accountId) return;
      const squad = await db.squads.where({ accountId: Number(accountId) }).first();
      if (squad) {
        setSquadId(squad.id);
        const savedTactic = squad.tactic || "4-3-3";
        setTactic(savedTactic);
        // Si la tactique est supprimée entre temps (Custom), on garde les positions sauvegardées sans erreur
        setPositions({ ...(ALL_TACTICS[savedTactic]?.positions || {}), ...squad.positions });
      } else {
        setSquadId(null);
        setTactic("4-3-3");
        setPositions(DEFAULT_TACTICS["4-3-3"].positions);
      }
    }
    loadSquad();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accountId]); // ALL_TACTICS omitted intentionally to prevent re-fetching constantly

  const saveSquad = async (newPositions, currentTactic = tactic) => {
    setPositions(newPositions);
    if (!accountId) return;
    
    if (squadId) {
      await db.squads.update(squadId, { positions: newPositions, tactic: currentTactic });
    } else {
      const newId = await db.squads.add({ accountId: Number(accountId), positions: newPositions, tactic: currentTactic });
      setSquadId(newId);
    }
  };

  const handleTacticChange = (newTactic) => {
    if (newTactic === "Custom") {
      setTactic("Custom");
      saveSquad(positions, "Custom");
      return;
    }
    
    // Use deep copy to avoid mutating constant
    const newPositions = JSON.parse(JSON.stringify(ALL_TACTICS[newTactic].positions));
    
    Object.keys(newPositions).forEach(key => {
      if (positions[key] && positions[key].name) {
         newPositions[key].name = positions[key].name;
         newPositions[key].rating = positions[key].rating;
      }
    });
    setTactic(newTactic);
    saveSquad(newPositions, newTactic);
  };

  const [saveTacticModalOpen, setSaveTacticModalOpen] = useState(false);
  const [newTacticName, setNewTacticName] = useState("");

  const handleSaveCustomTacticClick = () => {
    setNewTacticName("");
    setSaveTacticModalOpen(true);
  };

  const executeSaveCustomTactic = async () => {
    if (!newTacticName || newTacticName.trim() === "") return;
    
    const tacticKey = "custom_" + Date.now();
    
    const layout = {};
    Object.keys(positions).forEach(key => {
      layout[key] = {
        role: positions[key].role || key.replace(/[0-9]/g, ''),
        x: positions[key].x,
        y: positions[key].y,
        name: "", 
        rating: ""
      };
    });
    
    const newCustomTactics = {
      ...customTactics,
      [tacticKey]: {
        name: newTacticName.trim(),
        positions: layout
      }
    };
    
    await db.settings.put({ key: "custom_tactics", value: newCustomTactics });
    setTactic(tacticKey);
    saveSquad(positions, tacticKey);
    setSaveTacticModalOpen(false);
  };

  const handleDeleteCustomTactic = async (tacticKey) => {
    if (!window.confirm("Voulez-vous vraiment supprimer cette tactique ?")) return;
    const newCustomTactics = { ...customTactics };
    delete newCustomTactics[tacticKey];
    await db.settings.put({ key: "custom_tactics", value: newCustomTactics });
    setTactic("Custom");
    saveSquad(positions, "Custom");
  };

  const openEditor = (slotKey) => {
    setEditingSlot(slotKey);
    setEditData({
      name: positions[slotKey].name || "",
      rating: positions[slotKey].rating || "",
      role: positions[slotKey].role || slotKey.replace(/[0-9]/g, '')
    });
  };

  const handleSaveEditor = () => {
    const updated = {
      ...positions,
      [editingSlot]: { 
        ...positions[editingSlot], 
        ...editData 
      }
    };
    saveSquad(updated);
    setEditingSlot(null);
  };

  // Drag and Drop Logic
  const handlePointerDown = (e, slotKey) => {
    e.stopPropagation();
    if (!pitchRef.current) return;
    e.target.setPointerCapture(e.pointerId);
    
    setDragState({
      slotKey,
      startX: e.clientX,
      startY: e.clientY,
      initX: positions[slotKey].x ?? 50,
      initY: positions[slotKey].y ?? 50,
      hasMoved: false
    });
  };

  const handlePointerMove = (e) => {
    if (!dragState) return;
    const dx = e.clientX - dragState.startX;
    const dy = e.clientY - dragState.startY;
    
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
      if (!dragState.hasMoved) {
        setDragState(prev => ({ ...prev, hasMoved: true }));
      }
      
      const rect = pitchRef.current.getBoundingClientRect();
      const pctX = (dx / rect.width) * 100;
      const pctY = (dy / rect.height) * 100;
      
      let newX = dragState.initX + pctX;
      let newY = dragState.initY + pctY;
      
      newX = Math.max(0, Math.min(100, newX));
      newY = Math.max(0, Math.min(100, newY));
      
      setPositions(prev => ({
        ...prev,
        [dragState.slotKey]: {
          ...prev[dragState.slotKey],
          x: newX,
          y: newY
        }
      }));
    }
  };

  const handlePointerUp = (e) => {
    if (dragState) {
      e.target.releasePointerCapture(e.pointerId);
      
      if (!dragState.hasMoved) {
        // It was just a click
        openEditor(dragState.slotKey);
      } else {
        // Switch to Custom tactic if we moved a player and it's not already a saved custom tactic
        // Wait, if it's already a saved tactic, maybe we auto switch to "Custom" so we don't overwrite the saved one implicitly.
        if (tactic !== "Custom") {
          setTactic("Custom");
        }
        saveSquad(positions, "Custom");
      }
      setDragState(null);
    }
  };

  const renderSlot = (slotKey) => {
    const data = positions[slotKey];
    if (!data) return null;
    
    const isFilled = data && data.rating;
    const x = data.x ?? 50;
    const y = data.y ?? 50;
    const isDragging = dragState?.slotKey === slotKey;
    
    return (
      <div 
        key={slotKey}
        onPointerDown={(e) => handlePointerDown(e, slotKey)}
        className={`absolute flex flex-col items-center justify-center cursor-move transition-transform select-none touch-none ${isDragging ? 'scale-125' : 'hover:scale-110'}`}
        style={{ 
          left: `${x}%`, 
          top: `${y}%`, 
          transform: 'translate(-50%, -50%)',
          zIndex: isDragging ? 50 : 10
        }}
      >
        <div className={`w-12 h-12 md:w-14 md:h-14 lg:w-16 lg:h-16 rounded-full flex items-center justify-center border-2 transition-all duration-300 shadow-[0_0_15px_rgba(0,0,0,0.5)] ${isFilled ? 'bg-panel border-accent text-accent shadow-[0_0_15px_rgba(16,185,129,0.3)]' : 'bg-white/5 border-white/20 text-white hover:border-white/40'}`}>
          {isFilled ? (
             <span className="text-sm md:text-xl font-mono font-black pointer-events-none">{data.rating}</span>
          ) : (
             <span className="text-xs font-bold opacity-50 pointer-events-none">+</span>
          )}
        </div>
        <div className="mt-1 text-center bg-black/60 px-2 py-0.5 rounded backdrop-blur-sm border border-white/10 pointer-events-none shadow-sm">
          <p className="text-[9px] md:text-[10px] font-bold text-white tracking-widest">{data.role || slotKey.replace(/[0-9]/g, '')}</p>
          {isFilled && <p className="text-[9px] text-textdim truncate max-w-[60px] md:max-w-[80px]">{data.name}</p>}
        </div>
      </div>
    );
  };

  if (accounts.length === 0) return <div className="text-center pt-20 text-textdim">Aucun compte trouvé.</div>;

  return (
    <div className="max-w-4xl mx-auto pb-12 space-y-6">
      <HeroHeader 
        title="Directeur Sportif"
        description="Gère ton équipe type pour chaque compte. Ces données permettront au Spin Advisor de savoir de quel poste tu as VRAIMENT besoin."
      />

      <div className="flex flex-col md:flex-row gap-6">
        {/* Left Col: Accounts & Tactics */}
        <div className="md:w-1/3 space-y-4">
          <div className="pro-card p-6">
            <h3 className="pro-heading mb-4">Sélection du Compte</h3>
            <div className="space-y-2">
              {accounts.map(acc => (
                <button
                  key={acc.id}
                  onClick={() => setAccountId(acc.id)}
                  className={`w-full text-left p-4 rounded-xl border transition-all duration-300 flex justify-between items-center ${
                    accountId === acc.id 
                      ? 'bg-accent/10 border-accent/50 shadow-[0_0_15px_rgba(16,185,129,0.15)] hover:bg-accent/20' 
                      : 'bg-surfaceInteractive border-border hover:border-white/20 hover:bg-surfaceElevated'
                  }`}
                >
                  <span className={`font-bold ${accountId === acc.id ? 'text-accent' : 'text-white'}`}>{acc.name}</span>
                  <span className={`text-xs font-mono ${accountId === acc.id ? 'text-accent/80' : 'text-textdim'}`}>{acc.currentCoins} coins</span>
                </button>
              ))}
            </div>
          </div>

          <div className="pro-card p-6">
            <div className="flex justify-between items-center mb-4">
               <h3 className="pro-heading">Tactique</h3>
               {tactic === "Custom" && (
                 <button onClick={handleSaveCustomTacticClick} className="text-xs bg-accent text-panel px-3 py-1 rounded font-bold hover:bg-accent/80 transition-colors shadow-lg">
                   + Sauvegarder
                 </button>
               )}
               {tactic.startsWith("custom_") && (
                 <button onClick={() => handleDeleteCustomTactic(tactic)} className="text-xs bg-danger text-white px-3 py-1 rounded font-bold hover:bg-danger/80 transition-colors">
                   Supprimer
                 </button>
               )}
            </div>
            <select 
              value={tactic}
              onChange={(e) => handleTacticChange(e.target.value)}
              className="w-full bg-surfaceInteractive border border-border text-white rounded-xl p-3 focus:outline-none focus:border-accent transition-colors"
            >
              <optgroup label="Par Défaut">
                {Object.keys(DEFAULT_TACTICS).map(key => (
                  <option key={key} value={key} className="bg-panel text-white">{DEFAULT_TACTICS[key].name}</option>
                ))}
              </optgroup>
              
              {Object.keys(customTactics).length > 0 && (
                <optgroup label="Vos Tactiques">
                  {Object.keys(customTactics).map(key => (
                    <option key={key} value={key} className="bg-panel text-white">{customTactics[key].name}</option>
                  ))}
                </optgroup>
              )}
              
              <option value="Custom" className="bg-panel text-white">Personnalisé</option>
            </select>
            <p className="text-xs text-textdim mt-3 italic text-justify">
              <span className="text-accent font-bold">Astuce :</span> Maintenez et glissez un joueur n'importe où sur le terrain pour créer votre propre tactique personnalisée !
            </p>
          </div>
        </div>

        {/* Right Col: The Pitch */}
        <div className="md:w-2/3">
          <div 
            ref={pitchRef}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerUp}
            className="pro-card bg-[#021f15] overflow-hidden relative border-2 border-accent/30 aspect-[3/4] md:aspect-[4/5] w-full flex flex-col justify-between p-4 rounded-xl shadow-2xl touch-none group"
          >
            {/* CRT/Scanline Overlay */}
            <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(16,185,129,0.05)_1px,transparent_1px)] bg-[size:100%_4px] opacity-60 group-hover:opacity-100 transition-opacity duration-700"></div>
            
            {/* Hologram Pitch Lines (CSS Drawing) */}
            <div className="absolute inset-4 border-2 border-accent/50 pointer-events-none rounded-sm shadow-[0_0_15px_rgba(16,185,129,0.2)]"></div>
            <div className="absolute top-4 left-1/2 -translate-x-1/2 w-1/3 h-[15%] border-b-2 border-x-2 border-accent/50 pointer-events-none shadow-[0_0_15px_rgba(16,185,129,0.2)]"></div>
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-1/3 h-[15%] border-t-2 border-x-2 border-accent/50 pointer-events-none shadow-[0_0_15px_rgba(16,185,129,0.2)]"></div>
            <div className="absolute top-1/2 left-4 right-4 h-0 border-t-2 border-accent/50 pointer-events-none shadow-[0_0_15px_rgba(16,185,129,0.2)]"></div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 rounded-full border-2 border-accent/50 pointer-events-none shadow-[inset_0_0_15px_rgba(16,185,129,0.15),0_0_15px_rgba(16,185,129,0.2)]"></div>

            {Object.keys(positions).map(slotKey => renderSlot(slotKey))}
          </div>
        </div>
      </div>

      {/* Editor Modal */}
      {editingSlot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-panel border border-white/10 rounded-2xl p-6 w-full max-w-sm shadow-2xl animate-scaleIn">
            <h3 className="text-xl font-bold text-white mb-4">Modifier {editingSlot}</h3>
            
            <div className="space-y-4">
              <label className="flex flex-col gap-1.5">
                <span className="text-sm font-medium text-textdim">Poste (Rôle)</span>
                <select 
                  value={editData.role}
                  onChange={e => setEditData({...editData, role: e.target.value})}
                  className="input"
                >
                  <option value="GK">GK</option>
                  <option value="CB">CB</option>
                  <option value="LB">LB</option>
                  <option value="RB">RB</option>
                  <option value="DMF">DMF</option>
                  <option value="CMF">CMF</option>
                  <option value="AMF">AMF</option>
                  <option value="LMF">LMF</option>
                  <option value="RMF">RMF</option>
                  <option value="LWF">LWF</option>
                  <option value="RWF">RWF</option>
                  <option value="SS">SS</option>
                  <option value="CF">CF</option>
                </select>
              </label>

              <label className="flex flex-col gap-1.5">
                <span className="text-sm font-medium text-textdim">Note Globale Max (ex: 101)</span>
                <input 
                  type="number"
                  value={editData.rating}
                  onChange={e => setEditData({...editData, rating: e.target.value})}
                  className="input font-bold"
                  placeholder="ex: 98"
                />
              </label>

              <label className="flex flex-col gap-1.5">
                <span className="text-sm font-medium text-textdim">Nom du Joueur (Optionnel)</span>
                <input 
                  type="text"
                  value={editData.name}
                  onChange={e => setEditData({...editData, name: e.target.value})}
                  className="input"
                  placeholder="ex: L. Messi"
                />
              </label>
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={() => setEditingSlot(null)} className="btn-secondary flex-1 py-3">Annuler</button>
              <button onClick={handleSaveEditor} className="btn-primary flex-1 py-3">Sauvegarder</button>
            </div>
            
            <button 
              onClick={() => {
                setEditData({ name: "", rating: "", role: editingSlot.replace(/[0-9]/g, '') });
              }}
              className="mt-4 w-full text-center text-sm text-danger hover:text-danger/80"
            >
              Vider ce poste
            </button>
          </div>
        </div>
      )}

      {/* Save Tactic Modal */}
      {saveTacticModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-panel border border-white/10 rounded-2xl p-6 w-full max-w-sm shadow-2xl animate-scaleIn">
            <h3 className="text-xl font-bold text-white mb-4">Sauvegarder la tactique</h3>
            <p className="text-sm text-textdim mb-4">Donnez un nom à votre tactique personnalisée pour la retrouver facilement plus tard ou l'appliquer sur vos autres comptes.</p>
            
            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-textdim">Nom de la tactique</span>
              <input 
                type="text"
                value={newTacticName}
                onChange={e => setNewTacticName(e.target.value)}
                autoFocus
                className="input font-bold"
                placeholder="Ex: Mon 4-2-4 offensif"
                onKeyDown={e => { if(e.key === 'Enter') executeSaveCustomTactic(); }}
              />
            </label>

            <div className="flex gap-3 mt-6">
              <button onClick={() => setSaveTacticModalOpen(false)} className="btn-secondary flex-1 py-3">Annuler</button>
              <button onClick={executeSaveCustomTactic} className="btn-primary flex-1 py-3 bg-accent text-panel border-accent/20 hover:bg-accent/90" disabled={!newTacticName.trim()}>Enregistrer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
