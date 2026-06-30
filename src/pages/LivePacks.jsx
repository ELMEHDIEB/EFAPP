import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import HeroHeader from "../components/ui/HeroHeader.jsx";
import { useToast } from "../components/ui/ToastContext.jsx";
import { db } from "../db.js";

export default function LivePacks() {
  const [packs, setPacks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const toast = useToast();

  useEffect(() => {
    async function fetchEFHubPacks() {
      try {
        setIsLoading(true);
        setError(null);

        // Retrieve custom proxy if any
        const settings = await db.settings.toArray();
        const customProxySetting = settings.find(s => s.key === "customProxy");
        
        const defaultProxies = [
          "https://api.allorigins.win/get?url=",
          "https://corsproxy.io/?",
          "https://api.codetabs.com/v1/proxy?quest="
        ];

        const proxiesToTry = customProxySetting?.value 
          ? [customProxySetting.value, ...defaultProxies]
          : defaultProxies;

        const targetUrl = 'https://efhub.com/';
        let html = null;
        let lastError = null;

        for (const proxyBase of proxiesToTry) {
          try {
            const proxyUrl = proxyBase.includes('?') 
              ? `${proxyBase}${encodeURIComponent(targetUrl)}`
              : `${proxyBase}?url=${encodeURIComponent(targetUrl)}`;

            const res = await fetch(proxyUrl);
            if (!res.ok) throw new Error(`Proxy ${proxyBase} returned ${res.status}`);

            // allorigins.win returns { contents: "..." }, others return the raw HTML
            if (proxyBase.includes('allorigins.win')) {
              const data = await res.json();
              html = data.contents;
            } else {
              html = await res.text();
            }

            if (html) break; // Success, exit loop
          } catch (err) {
            console.warn(`Failed with proxy ${proxyBase}:`, err);
            lastError = err;
          }
        }

        if (!html) {
          throw new Error("Impossible de se connecter à eFHUB. Tous les proxys ont échoué.");
        }

        // Parse HTML
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');

        const sections = doc.querySelectorAll('section');
        const extractedPacks = [];

        sections.forEach((sec, index) => {
          const titleEl = sec.querySelector('h2');
          if (!titleEl) return;

          const title = titleEl.textContent.trim();

          const playerLinks = sec.querySelectorAll('a[href^="/players/"]');
          if (playerLinks.length === 0) return;

          const cardCategory = (() => {
            const n = title.toLowerCase();
            if (n.includes('epic') || n.includes('national')) return 'Epic';
            if (n.includes('show time') || n.includes('showtime')) return 'Show Time';
            if (n.includes('big time')) return 'Big Time';
            if (n.includes('potw') || n.includes('players of the week') || n.includes('potd')) return 'POTW';
            if (n.includes('highlight') || n.includes('club selection') || n.includes('fans choice')) return 'Highlight';
            return 'Standard';
          })();

          const topPlayers = [];
          playerLinks.forEach((link, i) => {
            if (i < 5) {
              const imgEl = link.querySelector('img');
              const nameEl = link.querySelector('p');
              const spans = link.querySelectorAll('span');
              const rating = spans.length >= 2 ? spans[0].textContent.trim() : '';
              const position = spans.length >= 2 ? spans[1].textContent.trim() : '';

              let playerId = null;
              const href = link.getAttribute('href');
              if (href && href.includes('/players/')) {
                playerId = href.split('/players/')[1].split('/')[0].split('?')[0];
              }

              if (imgEl) {
                const src = imgEl.getAttribute('src');
                if (src) {
                  topPlayers.push({
                    id: playerId,
                    name: nameEl ? nameEl.textContent.trim() : 'Player',
                    imageUrl: src,
                    rating: rating,
                    position: position,
                    cardCategory: cardCategory
                  });
                }
              }
            }
          });

          // Use the first player's image as the main cover if needed, though we will show the faces now
          const coverUrl = topPlayers.length > 0 ? topPlayers[0].imageUrl : null;

          extractedPacks.push({
            id: `pack_${index}`,
            name: title,
            playersCount: playerLinks.length,
            coverUrl,
            topPlayers
          });
        });

        if (extractedPacks.length === 0) {
          throw new Error("Aucun pack détecté. Le design du site a peut-être changé.");
        }

        setPacks(extractedPacks);
      } catch (err) {
        console.error("Scraping error:", err);
        setError(err.message);
        toast("Erreur lors de la synchronisation eFHUB", "error");
      } finally {
        setIsLoading(false);
      }
    }

    fetchEFHubPacks();
  }, [toast]);

  const handleAnalyzePack = (pack) => {
    navigate('/live-packs/analyze', { state: { pack, allPacks: packs } });
  };

  return (
    <div className="max-w-7xl mx-auto pb-12 space-y-6">
      <HeroHeader
        title="Live Packs Database"
        description="Synchronisation en temps réel avec eFHUB (via CORS Proxy). 100% Local."
      />

      {error && (
        <div className="pro-card p-6 border-danger/30 bg-danger/5 text-center space-y-4">
          <p className="text-danger font-bold">Erreur de Connexion</p>
          <p className="text-sm text-textdim">{error}</p>
          <button onClick={() => window.location.reload()} className="btn-secondary">Réessayer</button>
        </div>
      )}

      {isLoading && !error && (
        <div className="flex flex-col items-center justify-center py-20 space-y-6">
          <div className="relative w-16 h-16 flex items-center justify-center">
            <div className="absolute inset-0 border-2 border-accent/20 rounded-full"></div>
            <div className="absolute inset-0 border-2 border-accent border-t-transparent rounded-full animate-spin"></div>
            <svg className="w-6 h-6 text-accent animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
          </div>
          <p className="text-sm font-bold text-accent uppercase tracking-widest animate-pulse">Extraction eFHUB en cours...</p>
          <p className="text-xs text-textdim max-w-sm text-center">Interrogation via Proxy AllOrigins. Analyse du code source de la page d'accueil...</p>
        </div>
      )}

      {!isLoading && !error && packs.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {packs.map(pack => (
            <div key={pack.id} className="pro-card flex flex-col overflow-hidden group hover:border-accent/30 transition-colors">
              <div className="h-40 bg-gradient-to-br from-panel to-ink border-b border-border relative overflow-hidden flex items-end justify-center p-4">
                {pack.topPlayers && pack.topPlayers.length > 0 ? (
                  <div className="flex justify-center items-end gap-1 w-full h-full pb-2">
                    {pack.topPlayers.map((p, idx) => (
                      <div 
                        key={idx} 
                        onClick={() => navigate('/live-packs/analyze', { state: { pack, allPacks: packs, autoSelectPlayer: p } })}
                        className={`relative group/player ${idx === 2 ? 'w-24 z-10' : idx === 1 || idx === 3 ? 'w-20 opacity-90 z-0' : 'w-16 opacity-70 -z-10'} transition-transform hover:scale-110 hover:z-20 hover:opacity-100 cursor-pointer`}
                      >
                        <img src={p.imageUrl} alt={p.name} title={p.name} className="w-full object-contain drop-shadow-2xl" />
                        {p.rating && (
                          <div className="absolute -bottom-1 -right-1 bg-black/80 backdrop-blur border border-accent/50 text-accent text-[10px] font-black px-1.5 py-0.5 rounded shadow-lg flex flex-col items-center leading-none">
                            <span>{p.rating}</span>
                            {p.position && <span className="text-[7px] text-white/70 mt-0.5">{p.position}</span>}
                          </div>
                        )}
                        {/* Display Card Category as requested by user */}
                        {p.cardCategory && p.cardCategory !== 'Standard' && (
                          <div className="absolute -top-1 -left-1 bg-black/80 border border-white/20 text-white text-[8px] font-bold px-1 rounded shadow-lg uppercase tracking-wider">
                            {p.cardCategory}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <svg className="w-12 h-12 text-white/10 m-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                )}
              </div>
              <div className="p-5 flex flex-col flex-1">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-sm font-bold text-white leading-tight">{pack.name}</h3>
                </div>
                <div className="flex gap-4 mb-6 mt-auto">
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-textdim font-bold mb-1">Aperçu</p>
                    <p className="text-lg font-black text-white">{pack.playersCount} joueurs détectés</p>
                  </div>
                </div>
                <button onClick={() => handleAnalyzePack(pack)} className="btn-secondary w-full text-xs py-2 flex justify-center items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                  Analyser la Box
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
