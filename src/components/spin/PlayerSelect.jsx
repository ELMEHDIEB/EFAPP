import React, { useState, useEffect, useRef } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../../db.js";

export function PlayerSelect({ accountId, selectedPlayers, onChange }) {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef(null);

  const players = useLiveQuery(
    () => accountId ? db.players.where("accountId").equals(accountId).toArray() : Promise.resolve([]),
    [accountId]
  );

  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredPlayers = players ? players.filter(p => 
    p.name.toLowerCase().includes(query.toLowerCase()) &&
    !selectedPlayers.find(sp => sp.id === p.id)
  ).slice(0, 5) : [];

  const handleAddKnown = (player) => {
    onChange([...selectedPlayers, { id: player.id, name: player.name, cardType: player.cardType }]);
    setQuery("");
    setIsOpen(false);
  };

  const handleAddUnknown = () => {
    if (!query.trim()) return;
    onChange([...selectedPlayers, { id: null, name: query.trim(), cardType: "Unknown" }]);
    setQuery("");
    setIsOpen(false);
  };

  const handleRemove = (index) => {
    const newArr = [...selectedPlayers];
    newArr.splice(index, 1);
    onChange(newArr);
  };

  return (
    <div className="flex flex-col gap-2" ref={wrapperRef}>
      <span className="text-sm font-medium text-textdim">Joueurs obtenus (optionnel)</span>
      
      {/* Selected Players Tags */}
      {selectedPlayers.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-1">
          {selectedPlayers.map((sp, idx) => (
            <div key={idx} className="flex items-center gap-1.5 bg-white/10 border border-white/20 px-2.5 py-1 rounded-md text-xs text-white">
              <span className={sp.cardType === 'Epic' ? 'text-amber-400 font-bold' : ''}>{sp.name}</span>
              <button 
                type="button" 
                onClick={() => handleRemove(idx)}
                className="text-white/50 hover:text-danger hover:bg-white/10 rounded-full p-0.5 transition-colors"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Input Field */}
      <div className="relative">
        <input 
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder="Rechercher ou ajouter un joueur..."
          className="input py-3 w-full"
        />
        
        {isOpen && query.trim() && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-panel border border-white/10 rounded-lg shadow-xl overflow-hidden z-10">
            {filteredPlayers.length > 0 ? (
              <ul className="max-h-48 overflow-y-auto">
                {filteredPlayers.map(p => (
                  <li 
                    key={p.id}
                    onClick={() => handleAddKnown(p)}
                    className="px-4 py-2 hover:bg-white/5 cursor-pointer flex justify-between items-center border-b border-white/5 last:border-0"
                  >
                    <span className="text-white font-medium">{p.name}</span>
                    <span className="text-[10px] bg-white/10 px-1.5 py-0.5 rounded text-textdim">{p.cardType}</span>
                  </li>
                ))}
                <li 
                  onClick={handleAddUnknown}
                  className="px-4 py-2 hover:bg-white/5 cursor-pointer flex items-center gap-2 text-accent text-sm border-t border-white/10 bg-accent/5"
                >
                  + Ajouter "{query}" manuellement
                </li>
              </ul>
            ) : (
              <div 
                onClick={handleAddUnknown}
                className="px-4 py-3 hover:bg-white/5 cursor-pointer flex flex-col gap-1"
              >
                <span className="text-sm text-textdim">Aucun joueur trouvé.</span>
                <span className="text-accent text-sm font-medium">+ Ajouter "{query}" en tant que texte simple</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
