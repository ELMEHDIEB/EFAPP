import { useNavigate } from "react-router-dom";

export default function PostLossRecovery() {
  const navigate = useNavigate();

  return (
    <div className="max-w-2xl mx-auto py-12 px-4 text-center">
      <div className="card p-8 md:p-12 border-warn/30 bg-warn/5">
        <h1 className="text-2xl font-bold text-warn mb-4">Alerte : Perte Majeure Détectée</h1>
        <p className="text-white text-lg mb-6">
          Vous venez de dépenser une quantité significative de coins sans obtenir de résultat satisfaisant.
        </p>
        
        <div className="bg-panel2 p-6 rounded-xl border border-border text-left space-y-4 mb-8">
          <p className="text-textdim">
            <strong className="text-white">Le piège classique :</strong> Vouloir se refaire immédiatement. 
            C'est à ce moment précis que les pires décisions financières et comportementales sont prises.
          </p>
          <p className="text-textdim">
            <strong className="text-white">Fait mathématique :</strong> Le prochain tirage a exactement les mêmes probabilités que le premier. La machine ne vous "doit" rien parce que vous avez perdu.
          </p>
        </div>

        <h3 className="text-xl font-semibold text-white mb-6">Action recommandée :</h3>
        <button 
          onClick={() => navigate("/")}
          className="btn-base bg-accent hover:bg-accent2 text-ink font-bold py-4 px-8 w-full md:w-auto text-lg shadow-[0_0_15px_rgba(34,176,125,0.3)]"
        >
          Fermer le jeu pour aujourd'hui
        </button>
      </div>
    </div>
  );
}
