import { TextMorph } from '../forgeui/text-morph.jsx';

export default function StreakWidget({ streakDays }) {
  // Gamification levels based on streak
  let flameColor = "from-gray-600 to-gray-800";
  let textColor = "text-gray-400";
  let titleWords = ["Débutant", "Focus", "Discipline"];
  
  if (streakDays > 0) {
    flameColor = "from-orange-500 to-red-500";
    textColor = "text-orange-400";
    titleWords = ["En bonne voie", "Continue", "Garde le cap"];
  }
  if (streakDays >= 3) {
    flameColor = "from-red-500 to-rose-600";
    textColor = "text-red-400";
    titleWords = ["Série Chaude", "On Fire", "Reste Solide"];
  }
  if (streakDays >= 7) {
    flameColor = "from-purple-500 to-pink-600";
    textColor = "text-purple-400";
    titleWords = ["Intouchable", "Inébranlable", "Masterclass"];
  }
  if (streakDays >= 14) {
    flameColor = "from-indigo-500 to-cyan-500";
    textColor = "text-cyan-400";
    titleWords = ["Maître Zen", "Contrôle Total", "Invincible"];
  }
  if (streakDays >= 30) {
    flameColor = "from-amber-400 to-yellow-600";
    textColor = "text-amber-400";
    titleWords = ["Légende de Fer", "Mental d'Acier", "Intemporel"];
  }

  return (
    <div className="relative w-full rounded-2xl overflow-hidden group border border-white/5 bg-ink shadow-2xl p-6 transition-all duration-500 hover:border-white/10">
      <div className={`absolute inset-0 opacity-10 bg-gradient-to-r ${flameColor} blur-3xl group-hover:opacity-20 transition-opacity duration-1000`}></div>
      
      <div className="relative flex flex-col md:flex-row items-center justify-between gap-6 z-10">
        
        {/* Partie Gauche : Titre et Icône */}
        <div className="flex items-center gap-6 w-full md:w-auto">
          <div className={`p-4 rounded-xl bg-gradient-to-br ${flameColor} shadow-lg relative overflow-hidden`}>
            <div className="absolute inset-0 bg-white/20 rounded-xl animate-pulse opacity-20"></div>
            <svg className="w-8 h-8 text-white relative z-10 drop-shadow-md" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.5 12.5c0 2.5-1.5 4.5-3.5 5.5v-1.5c1.5-.5 2.5-2 2.5-4 0-1.5-1-3-2.5-3.5 0 2-1.5 3.5-3.5 3.5s-3.5-1.5-3.5-3.5c-1.5.5-2.5 2-2.5 3.5 0 2 1 3.5 2.5 4v1.5c-2-1-3.5-3-3.5-5.5 0-3 2.5-5.5 5.5-6.5v2.5c2 0 3.5 1.5 3.5 3.5 0-2 1.5-3.5 3.5-3.5v-2.5c3 1 5.5 3.5 5.5 6.5z" />
            </svg>
          </div>
          <div className="flex flex-col items-start w-48">
            <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-textdim mb-1">Mental Coach</span>
            <div className={`text-2xl sm:text-3xl font-black ${textColor} tracking-tight drop-shadow-sm`}>
              <TextMorph words={titleWords} />
            </div>
          </div>
        </div>

        {/* Partie Droite : Compteur de Streak */}
        <div className="flex flex-col items-start md:items-end border-t md:border-t-0 md:border-l border-white/5 pt-4 md:pt-0 pl-0 md:pl-8 w-full md:w-auto">
          <div className="flex items-baseline gap-2">
            <div className="text-5xl sm:text-6xl font-black text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]">
              {streakDays}
            </div>
            <span className="text-sm font-bold text-textdim uppercase tracking-wider mb-2">Jours</span>
          </div>
          <span className="text-[10px] uppercase tracking-widest text-textdim font-bold">Sans faire de Spin</span>
        </div>

      </div>
    </div>
  );
}
