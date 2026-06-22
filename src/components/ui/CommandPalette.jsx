import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../../db.js";

export function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);
  const listRef = useRef(null);
  const navigate = useNavigate();

  const accounts = useLiveQuery(() => db.accounts.toArray(), []) || [];
  const spinLogs = useLiveQuery(() => db.spinLogs.toArray(), []) || [];

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 10);
    }
  }, [isOpen]);

  const items = React.useMemo(() => {
    const q = query.toLowerCase();
    
    // 1. Navigation Actions
    const navs = [
      { id: "nav-dashboard", label: "Aller au Dashboard", sub: "Navigation", action: () => navigate("/") },
      { id: "nav-accounts", label: "Gérer les Comptes", sub: "Navigation", action: () => navigate("/accounts") },
      { id: "nav-spin", label: "Nouveau Spin Tracker", sub: "Navigation", action: () => navigate("/spin-tracker") },
      { id: "nav-journal", label: "Ouvrir le Journal Émotionnel", sub: "Navigation", action: () => navigate("/journal") },
      { id: "nav-analytics", label: "Consulter l'Analytics", sub: "Navigation", action: () => navigate("/analytics") },
      { id: "nav-settings", label: "Paramètres & Sécurité", sub: "Navigation", action: () => navigate("/settings") },
    ].filter(item => item.label.toLowerCase().includes(q) || item.sub.toLowerCase().includes(q));

    // 2. Accounts Search
    const accs = accounts
      .filter(a => a.name.toLowerCase().includes(q))
      .map(a => ({
        id: `acc-${a.id}`,
        label: `${a.name} (${a.currentCoins} coins)`,
        sub: "Compte",
        action: () => navigate("/accounts")
      }));

    // 3. Spins Search
    const spins = spinLogs
      .filter(s => s.packName.toLowerCase().includes(q) || s.emotionBefore?.toLowerCase().includes(q))
      .slice(0, 5)
      .map(s => ({
        id: `spin-${s.id}`,
        label: `${s.packName} (-${s.coinsSpent} coins)`,
        sub: `Spin • ${s.date} • ${s.emotionBefore || "Neutre"}`,
        action: () => navigate("/journal")
      }));

    return [...navs, ...accs, ...spins];
  }, [query, navigate, accounts, spinLogs]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  const handleKeyDown = (e) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % items.length);
      scrollToItem((selectedIndex + 1) % items.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + items.length) % items.length);
      scrollToItem((selectedIndex - 1 + items.length) % items.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (items[selectedIndex]) {
        items[selectedIndex].action();
        setIsOpen(false);
      }
    } else if (e.key === "Escape") {
      e.preventDefault();
      setIsOpen(false);
    }
  };

  const scrollToItem = (index) => {
    if (listRef.current) {
      const element = listRef.current.children[index];
      if (element) {
        element.scrollIntoView({ block: "nearest" });
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-start justify-center pt-[15vh] px-4 bg-ink/80 backdrop-blur-md animate-in fade-in duration-200" onClick={() => setIsOpen(false)}>
      <div 
        className="w-full max-w-2xl bg-panel border border-white/10 rounded-2xl shadow-[0_30px_100px_rgba(0,0,0,0.9)] overflow-hidden flex flex-col"
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-label="Palette de commandes"
      >
        <div className="flex items-center px-4 border-b border-white/5 bg-ink">
          <svg className="w-5 h-5 text-textdim mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Que cherchez-vous ? Navigation, comptes, spins..."
            className="w-full py-5 bg-transparent border-none outline-none text-white placeholder-textdim/50 text-lg"
          />
          <kbd className="hidden sm:inline-block px-2 py-1 text-[10px] font-mono text-textdim bg-white/5 rounded border border-white/10 uppercase tracking-widest">Esc</kbd>
        </div>
        
        <div className="max-h-[50vh] overflow-y-auto p-2" ref={listRef}>
          {items.length === 0 ? (
            <div className="py-12 text-center text-textdim text-sm">
              Aucun résultat pour "{query}"
            </div>
          ) : (
            items.map((item, index) => (
              <div
                key={item.id}
                onMouseEnter={() => setSelectedIndex(index)}
                onClick={() => {
                  item.action();
                  setIsOpen(false);
                }}
                className={`flex items-center justify-between px-4 py-3 rounded-xl cursor-pointer transition-colors ${index === selectedIndex ? 'bg-white/10 text-white' : 'text-textdim hover:text-white'}`}
                role="option"
                aria-selected={index === selectedIndex}
              >
                <div>
                  <p className={`text-sm font-medium ${index === selectedIndex ? 'text-white' : 'text-textdim'}`}>{item.label}</p>
                </div>
                <span className="text-[10px] uppercase tracking-widest opacity-50">{item.sub}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
