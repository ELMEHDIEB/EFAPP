import { useNavigate } from "react-router-dom";

export default function PostLossRecovery() {
  const navigate = useNavigate();

  return (
    <div className="max-w-2xl mx-auto py-12 px-4 text-center animate-in zoom-in-95 duration-500">
      <div className="pro-card border-danger/30 bg-danger/5 p-8 md:p-12 shadow-[0_0_50px_rgba(239,68,68,0.15)]">
        <div className="w-20 h-20 mx-auto bg-danger/20 rounded-full flex items-center justify-center mb-6">
          <svg className="w-10 h-10 text-danger" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
        </div>
        <h1 className="text-3xl font-black text-white tracking-tight mb-4">Alerte : Chute Compulsive</h1>
        <p className="text-textdim text-lg mb-8">
          Vous venez de dépenser une quantité critique de coins sans obtenir le résultat désiré.
        </p>
        
        <div className="bg-ink p-6 rounded-xl border border-white/5 text-left space-y-4 mb-10">
          <p className="text-textdim text-sm leading-relaxed">
            <strong className="text-white">Le piège de la compensation :</strong> Vouloir se refaire immédiatement est le déclencheur principal de la ruine des comptes. C'est le moment de couper.
          </p>
          <p className="text-textdim text-sm leading-relaxed">
            <strong className="text-white">Réalité statistique :</strong> Le prochain tirage possède strictement les mêmes probabilités que le premier. L'algorithme n'a pas de "mémoire".
          </p>
        </div>

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
