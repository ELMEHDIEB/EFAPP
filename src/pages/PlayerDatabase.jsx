import React, { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../db";
import { createPlayer, updatePlayer, deletePlayer } from "../playerActions.js";
import { useToast } from "../components/ui/ToastContext.jsx";
import { useConfirm } from "../components/ui/ConfirmContext.jsx";
import HeroHeader from "../components/ui/HeroHeader.jsx";
import EmptyState from "../components/ui/EmptyState.jsx";
import DataTable from "../components/ui/DataTable.jsx";

const CARD_TYPES = [
  "Standard", "Highlight", "Trending", "Epic", "Big Time", "Showtime"
];

export default function PlayerDatabase() {
  const accounts = useLiveQuery(() => db.accounts.orderBy("name").toArray(), []);
  const [selectedAccountId, setSelectedAccountId] = useState(null);

  // Set default selected account when accounts load
  React.useEffect(() => {
    if (accounts && accounts.length > 0 && !selectedAccountId) {
      setSelectedAccountId(accounts[0].id);
    }
  }, [accounts, selectedAccountId]);

  const players = useLiveQuery(
    () => selectedAccountId ? db.players.where("accountId").equals(selectedAccountId).toArray() : Promise.resolve([]),
    [selectedAccountId]
  );
  
  const [showModal, setShowModal] = useState(false);
  const [editPlayer, setEditPlayer] = useState(null);
  const toast = useToast();
  const confirm = useConfirm();

  if (!players) {
    return (
      <div className="flex h-[70vh] items-center justify-center">
        <div className="w-8 h-8 border-2 border-white/10 border-t-white rounded-full animate-spin"></div>
      </div>
    );
  }

  const handleDelete = async (player) => {
    const isConfirmed = await confirm({
      title: "Supprimer le joueur ?",
      message: `Êtes-vous sûr de vouloir supprimer ${player.name} de la base de données ?`,
      confirmLabel: "Supprimer",
      cancelLabel: "Annuler",
      isDanger: true
    });
    
    if (isConfirmed) {
      try {
        await deletePlayer(player.id);
        toast(`Joueur ${player.name} supprimé.`, "success");
      } catch (err) {
        toast(err.message, "error");
      }
    }
  };

  const columns = [
    {
      key: "name",
      label: "Nom",
      render: (row) => <span className="font-bold text-white">{row.name}</span>
    },
    {
      key: "overall",
      label: "Note Globale",
      align: "center",
      render: (row) => <span className="font-semibold text-textdim">{row.overall || "-"}</span>
    },
    {
      key: "cardType",
      label: "Type de Carte",
      align: "center",
      render: (row) => (
        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border
          ${row.cardType === 'Epic' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' : 
            row.cardType === 'Big Time' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' : 
            row.cardType === 'Showtime' ? 'bg-pink-500/10 text-pink-400 border-pink-500/20' :
            row.cardType === 'Highlight' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
            row.cardType === 'Trending' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
            'bg-white/5 text-textdim border-white/10'}`}>
          {row.cardType} {row.isBooster ? "✨" : ""}
        </span>
      )
    },
    {
      key: "position",
      label: "Position",
      align: "center",
      render: (row) => <span className="text-textdim text-xs font-mono">{row.position || "-"}</span>
    },
    {
      key: "actions",
      label: "Actions",
      align: "right",
      sortable: false,
      render: (row) => (
        <div className="flex justify-end gap-2">
          <button 
            onClick={() => { setEditPlayer(row); setShowModal(true); }}
            className="text-textdim hover:text-white transition-colors"
          >
            Modifier
          </button>
          <button 
            onClick={() => handleDelete(row)}
            className="text-danger hover:text-red-400 transition-colors"
          >
            Supprimer
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="max-w-6xl mx-auto pb-12 space-y-6">
      <HeroHeader 
        title="Database Joueurs"
        description="Gérez votre collection de joueurs et métadonnées."
        stats={[ { label: "Joueurs enregistrés", value: players.length } ]}
        actions={
          <button onClick={() => { setEditPlayer(null); setShowModal(true); }} className="btn-primary">
            + Nouveau Joueur
          </button>
        }
      />

      <div className="flex flex-col md:flex-row gap-4 mb-6">
        {accounts && accounts.length > 0 ? (
          <label className="flex items-center gap-3">
            <span className="text-sm font-medium text-textdim whitespace-nowrap">Compte :</span>
            <select
              value={selectedAccountId || ""}
              onChange={(e) => setSelectedAccountId(Number(e.target.value))}
              className="input py-2 min-w-[200px]"
            >
              {accounts.map(acc => (
                <option key={acc.id} value={acc.id}>{acc.name}</option>
              ))}
            </select>
          </label>
        ) : null}
      </div>

      {!selectedAccountId ? (
        <EmptyState 
          variant="empty"
          title="Aucun compte"
          description="Vous devez créer un compte avant de pouvoir gérer vos joueurs."
        />
      ) : players.length === 0 ? (
        <EmptyState 
          variant="empty"
          title="Base de données vide"
          description="Vous n'avez pas encore enregistré de joueurs. Les joueurs enregistrés lors de vos spins apparaîtront ici."
          action={
            <button onClick={() => { setEditPlayer(null); setShowModal(true); }} className="btn-primary">
              Ajouter un joueur
            </button>
          }
        />
      ) : (
        <div className="pro-card p-6">
          <DataTable 
            columns={columns}
            data={players}
            defaultSortKey="name"
          />
        </div>
      )}

      {showModal && selectedAccountId && (
        <PlayerFormModal 
          player={editPlayer}
          accountId={selectedAccountId}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
}

function PlayerFormModal({ player, accountId, onClose }) {
  const [name, setName] = useState(player?.name || "");
  const [cardType, setCardType] = useState(player?.cardType || "Standard");
  const [isBooster, setIsBooster] = useState(player?.isBooster || false);
  const [overall, setOverall] = useState(player?.overall || "");
  const [position, setPosition] = useState(player?.position || "");
  const [club, setClub] = useState(player?.club || "");
  const [nation, setNation] = useState(player?.nation || "");
  
  const [error, setError] = useState("");
  const toast = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (player) {
        await updatePlayer(player.id, { name, cardType, isBooster, overall, position, club, nation });
        toast("Joueur mis à jour avec succès.", "success");
      } else {
        await createPlayer(accountId, { name, cardType, isBooster, overall, position, club, nation });
        toast("Joueur ajouté à la base de données.", "success");
      }
      onClose();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="fixed inset-0 bg-ink/90 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-panel border border-white/10 p-6 rounded-2xl w-full max-w-md shadow-2xl relative overflow-hidden">
        <h2 className="text-xl font-bold text-white mb-6">
          {player ? "Modifier le joueur" : "Nouveau Joueur"}
        </h2>
        
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-textdim">Nom complet</span>
            <input 
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="ex: L. Messi"
              className="input"
            />
          </label>

          <div className="grid grid-cols-2 gap-4">
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-textdim">Type de carte</span>
              <select 
                value={cardType}
                onChange={(e) => setCardType(e.target.value)}
                className="input"
              >
                {CARD_TYPES.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-textdim">Note (Overall)</span>
              <input 
                type="number"
                min="0"
                max="150"
                value={overall}
                onChange={(e) => setOverall(e.target.value)}
                className="input"
                placeholder="ex: 100"
              />
            </label>
          </div>

          <label className="flex items-center gap-3 p-3 bg-white/5 border border-white/10 rounded-xl cursor-pointer hover:bg-white/10 transition-colors">
            <input 
              type="checkbox"
              checked={isBooster}
              onChange={(e) => setIsBooster(e.target.checked)}
              className="w-4 h-4 rounded border-white/20 bg-ink text-accent focus:ring-accent"
            />
            <span className="text-sm font-medium text-white">Ce joueur possède un Booster</span>
          </label>

          <div className="grid grid-cols-2 gap-4">
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-textdim">Position</span>
              <input 
                value={position}
                onChange={(e) => setPosition(e.target.value)}
                className="input"
                placeholder="ex: RWF, AMF, CF..."
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-textdim">Club / Nation</span>
              <input 
                value={club}
                onChange={(e) => setClub(e.target.value)}
                className="input"
                placeholder="ex: FC Barcelona"
              />
            </label>
          </div>

          {error && <p className="text-xs text-danger font-medium">{error}</p>}

          <div className="flex gap-3 mt-4">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Annuler</button>
            <button type="submit" className="btn-primary flex-1">Enregistrer</button>
          </div>
        </form>
      </div>
    </div>
  );
}
