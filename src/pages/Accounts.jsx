import { useState, useRef, useEffect } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../db.js";
import {
  createAccount,
  updateAccountInfo,
  deleteAccount,
  applyCoinChange,
  progressPercent,
  undoLastAction
} from "../accountActions.js";

export default function Accounts() {
  const accounts = useLiveQuery(() => db.accounts.orderBy("name").toArray(), []);

  const [showAdd, setShowAdd] = useState(false);
  const [adjustTarget, setAdjustTarget] = useState(null); // account being adjusted
  const [editTarget, setEditTarget] = useState(null); // account being edited
  const [error, setError] = useState("");

  if (!accounts) {
    return <p className="text-textdim">Chargement…</p>;
  }

  return (
    <div className="max-w-4xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-white tracking-tight">Comptes</h1>
          <p className="text-sm text-textdim mt-1">{accounts.length} compte(s) suivi(s)</p>
        </div>
        <button
          onClick={() => {
            setError("");
            setShowAdd(true);
          }}
          className="btn-primary"
        >
          + Ajouter un compte
        </button>
      </div>

      {accounts.length === 0 && (
        <div className="border border-dashed border-border rounded-xl py-16 text-center text-textdim bg-panel/50">
          Aucun compte pour l'instant. Ajoute ton premier compte pour commencer le suivi.
        </div>
      )}

      <div className="grid gap-4">
        {accounts.map((acc) => {
          const pct = progressPercent(acc);
          return (
            <div
              key={acc.id}
              className="card p-5 flex flex-col md:flex-row md:items-center gap-4 transition-all hover:border-textdim/50"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2">
                  <p className="text-lg font-semibold text-white truncate">{acc.name}</p>
                  {acc.groupTag && (
                    <span className="text-xs text-textdim font-medium border border-border rounded px-2 py-0.5 bg-panel2">
                      {acc.groupTag}
                    </span>
                  )}
                </div>
                <div className="mt-3 progress-track">
                  <div
                    className="progress-fill"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <p className="text-xs font-medium text-textdim mt-2">
                  <span className={acc.currentCoins >= 900 ? "text-accent" : "text-white"}>{acc.currentCoins.toLocaleString()}</span> / {acc.targetCoins.toLocaleString()} coins ({pct}%)
                </p>
              </div>

              <div className="flex gap-2 shrink-0 md:ml-4">
                <button
                  onClick={async () => {
                    try {
                      await undoLastAction(acc.id);
                    } catch (err) {
                      alert(err.message);
                    }
                  }}
                  className="btn-secondary px-3 py-1.5 text-xs"
                  title="Annuler la dernière action"
                >
                  ↩ Annuler
                </button>
                <button
                  onClick={() => setAdjustTarget(acc)}
                  className="btn-secondary px-3 py-1.5 text-xs"
                >
                  Ajuster solde
                </button>
                <button
                  onClick={() => setEditTarget(acc)}
                  className="btn-secondary px-3 py-1.5 text-xs"
                >
                  Modifier
                </button>
                <button
                  onClick={async () => {
                    if (confirm(`Supprimer "${acc.name}" et tout son historique ?`)) {
                      await deleteAccount(acc.id);
                    }
                  }}
                  className="btn-danger px-3 py-1.5 text-xs"
                >
                  Supprimer
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {showAdd && (
        <AddAccountModal
          onClose={() => setShowAdd(false)}
          onError={setError}
          error={error}
        />
      )}

      {adjustTarget && (
        <AdjustBalanceModal
          account={adjustTarget}
          onClose={() => setAdjustTarget(null)}
        />
      )}

      {editTarget && (
        <EditAccountModal
          account={editTarget}
          onClose={() => setEditTarget(null)}
        />
      )}
    </div>
  );
}

function ModalShell({ title, onClose, children }) {
  const modalRef = useRef(null);
  const previousFocusRef = useRef(null);

  useEffect(() => {
    previousFocusRef.current = document.activeElement;
    if (modalRef.current) {
      const focusable = modalRef.current.querySelector('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
      if (focusable) focusable.focus();
    }

    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "Tab") {
        if (!modalRef.current) return;
        const focusables = modalRef.current.querySelectorAll('button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [href], [tabindex]:not([tabindex="-1"])');
        if (focusables.length === 0) return;
        const firstElement = focusables[0];
        const lastElement = focusables[focusables.length - 1];

        if (e.shiftKey && document.activeElement === firstElement) {
          lastElement.focus();
          e.preventDefault();
        } else if (!e.shiftKey && document.activeElement === lastElement) {
          firstElement.focus();
          e.preventDefault();
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      if (previousFocusRef.current) previousFocusRef.current.focus();
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 bg-ink/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div ref={modalRef} className="card bg-panel p-6 w-full max-w-sm shadow-2xl relative overflow-hidden" role="dialog" aria-modal="true" aria-labelledby="modal-title">
        <div className="absolute top-0 right-0 w-32 h-32 bg-accent/5 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none"></div>
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-6">
            <h2 id="modal-title" className="text-lg font-semibold text-white tracking-tight">{title}</h2>
            <button onClick={onClose} aria-label="Fermer" className="text-textdim hover:text-white transition-colors p-1 rounded-md hover:bg-panel2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}

function AddAccountModal({ onClose, onError, error }) {
  const [name, setName] = useState("");
  const [currentCoins, setCurrentCoins] = useState("0");
  const [targetCoins, setTargetCoins] = useState("900");
  const [weeklyLimit, setWeeklyLimit] = useState("0");
  const [groupTag, setGroupTag] = useState("");

  async function submit(e) {
    e.preventDefault();
    try {
      await createAccount({ name, currentCoins, targetCoins, weeklyLimit, groupTag });
      onClose();
    } catch (err) {
      onError(err.message);
    }
  }

  return (
    <ModalShell title="Nouveau compte" onClose={onClose}>
      <form onSubmit={submit} className="flex flex-col gap-4">
        <Field label="Nom du compte">
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="ex: AC2"
            className="input"
          />
        </Field>
        <Field label="Solde actuel">
          <input
            type="number"
            min="0"
            value={currentCoins}
            onChange={(e) => setCurrentCoins(e.target.value)}
            className="input"
          />
        </Field>
        <Field label="Objectif (coins)">
          <input
            type="number"
            min="1"
            value={targetCoins}
            onChange={(e) => setTargetCoins(e.target.value)}
            className="input"
          />
        </Field>
        <Field label="Limite hebdomadaire (0 = aucune)">
          <input
            type="number"
            min="0"
            value={weeklyLimit}
            onChange={(e) => setWeeklyLimit(e.target.value)}
            className="input text-warn focus:border-warn"
            placeholder="ex: 300"
          />
        </Field>
        <Field label="Groupe (optionnel)">
          <input
            value={groupTag}
            onChange={(e) => setGroupTag(e.target.value)}
            placeholder="ex: Principal, Farm, Test"
            className="input"
          />
        </Field>

        {error && <p className="text-xs text-danger font-medium">{error}</p>}

        <button type="submit" className="btn-primary mt-2">
          Créer le compte
        </button>
      </form>
    </ModalShell>
  );
}

function AdjustBalanceModal({ account, onClose }) {
  const [action, setAction] = useState("ADD");
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");

  async function submit(e) {
    e.preventDefault();
    try {
      await applyCoinChange(account.id, { action, amount, reason });
      onClose();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <ModalShell title={`Ajuster le solde — ${account.name}`} onClose={onClose}>
      <p className="text-sm font-medium text-textdim mb-4 bg-panel2 p-3 rounded-lg border border-border">
        Solde actuel : <span className="text-white">{account.currentCoins.toLocaleString()} coins</span>
      </p>
      <form onSubmit={submit} className="flex flex-col gap-4">
        <Field label="Action">
          <select value={action} onChange={(e) => setAction(e.target.value)} className="input">
            <option value="ADD">Ajouter des coins</option>
            <option value="REMOVE">Retirer des coins</option>
            <option value="SET_BALANCE">Définir le solde exact</option>
          </select>
        </Field>
        <Field label={action === "SET_BALANCE" ? "Nouveau solde" : "Montant"}>
          <input
            type="number"
            min="0"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="input"
            autoFocus
          />
        </Field>
        <Field label="Raison">
          <input
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="ex: Login Bonus, Objective Reward..."
            className="input"
          />
        </Field>

        {error && <p className="text-xs text-danger font-medium">{error}</p>}

        <button type="submit" className="btn-primary mt-2">
          Valider
        </button>
      </form>
    </ModalShell>
  );
}

function EditAccountModal({ account, onClose }) {
  const [name, setName] = useState(account.name);
  const [targetCoins, setTargetCoins] = useState(String(account.targetCoins));
  const [weeklyLimit, setWeeklyLimit] = useState(String(account.weeklyLimit || 0));
  const [groupTag, setGroupTag] = useState(account.groupTag || "");
  const [error, setError] = useState("");

  async function submit(e) {
    e.preventDefault();
    try {
      await updateAccountInfo(account.id, { name, targetCoins, weeklyLimit, groupTag });
      onClose();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <ModalShell title={`Modifier — ${account.name}`} onClose={onClose}>
      <form onSubmit={submit} className="flex flex-col gap-4">
        <Field label="Nom du compte">
          <input value={name} onChange={(e) => setName(e.target.value)} className="input" autoFocus />
        </Field>
        <Field label="Objectif (coins)">
          <input
            type="number"
            min="1"
            value={targetCoins}
            onChange={(e) => setTargetCoins(e.target.value)}
            className="input"
          />
        </Field>
        <Field label="Groupe (optionnel)">
          <input value={groupTag} onChange={(e) => setGroupTag(e.target.value)} className="input" />
        </Field>

        {error && <p className="text-xs text-danger font-medium">{error}</p>}

        <button type="submit" className="btn-primary mt-2">
          Enregistrer
        </button>
      </form>
    </ModalShell>
  );
}

function Field({ label, children }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-medium text-textdim">{label}</span>
      {children}
    </label>
  );
}
