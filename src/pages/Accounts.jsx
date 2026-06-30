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
import { useToast } from "../components/ui/ToastContext.jsx";
import { useConfirm } from "../components/ui/ConfirmContext.jsx";
import { getMotivationMessage } from "../utils/motivationEngine.js";
import HeroHeader from "../components/ui/HeroHeader.jsx";
import EmptyState from "../components/ui/EmptyState.jsx";

export default function Accounts() {
  const accounts = useLiveQuery(() => db.accounts.orderBy("name").toArray(), []);

  const [showAdd, setShowAdd] = useState(false);
  const [adjustTarget, setAdjustTarget] = useState(null); // account being adjusted
  const [editTarget, setEditTarget] = useState(null); // account being edited
  const [error, setError] = useState("");
  const toast = useToast();
  const confirm = useConfirm();

  if (!accounts) {
    return (
      <div className="flex h-[70vh] items-center justify-center">
        <div className="w-8 h-8 border-2 border-white/10 border-t-white rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl">
      <HeroHeader 
        title="Comptes"
        description="Gérez votre portefeuille de comptes."
        stats={[ { label: "Comptes actifs", value: accounts.length } ]}
        actions={
          <button onClick={() => { setError(""); setShowAdd(true); }} className="btn-primary">
            + Ajouter
          </button>
        }
      />

      {accounts.length === 0 && (
        <EmptyState 
          variant="empty"
          title="Aucun compte configuré"
          description="Commencez par ajouter votre compte principal ou secondaire pour initier le suivi des coins et de la progression."
          action={
            <button onClick={() => { setError(""); setShowAdd(true); }} className="btn-primary">
              Créer un compte
            </button>
          }
        />
      )}

      <div className="grid gap-4">
        {accounts.map((acc) => {
          const pct = progressPercent(acc);
          return (
            <div
              key={acc.id}
              className="pro-card flex-row items-center gap-6 p-5"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-3 mb-3">
                  <p className="text-lg font-bold text-white tracking-tight truncate">{acc.name}</p>
                  {acc.groupTag && (
                    <span className="text-[10px] uppercase tracking-widest text-textdim font-semibold border border-white/10 rounded px-2 py-0.5 bg-ink">
                      {acc.groupTag}
                    </span>
                  )}
                </div>
                <div className="progress-track bg-ink">
                  <div className={`progress-fill ${pct >= 100 ? 'bg-accent' : 'bg-white'}`} style={{ width: `${Math.min(pct, 100)}%` }} />
                </div>
                <div className="flex items-center justify-between mt-2">
                  <p className="text-xs font-medium text-textdim">
                    <span className={acc.currentCoins >= 900 ? "text-accent font-bold" : "text-white font-semibold"}>
                      {acc.currentCoins.toLocaleString()}
                    </span> 
                    <span className="opacity-50"> / {acc.targetCoins.toLocaleString()}</span>
                  </p>
                  <p className="text-[10px] font-mono text-textdim font-bold">{pct}%</p>
                </div>
                {/* Motivation Message */}
                {(() => {
                  const motivation = getMotivationMessage(acc, accounts, null);
                  return (
                    <p className={`text-[11px] mt-2 font-medium ${motivation.type === 'success' ? 'text-accent' : motivation.type === 'warn' ? 'text-warn' : 'text-textdim'}`}>
                      {motivation.message}
                    </p>
                  );
                })()}
                {/* Quick Coin Actions */}
                <div className="flex gap-1.5 mt-3">
                  {[25, 50, 100, 250].map(amount => (
                    <button
                      key={amount}
                      onClick={async () => {
                        try {
                          await applyCoinChange(acc.id, { action: "ADD", amount, reason: "Ajout rapide" });
                          toast(`+${amount} coins ajoutés à ${acc.name}`, 'success');
                        } catch (err) {
                          toast(err.message, 'error');
                        }
                      }}
                      className="btn-secondary px-2 py-1 text-[10px] font-bold tracking-wide"
                    >
                      +{amount}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 shrink-0 md:ml-4">
                <button
                  onClick={async () => {
                    try {
                      await undoLastAction(acc.id);
                      toast(`Action annulée sur ${acc.name}`, 'success');
                    } catch (err) {
                      toast(err.message, 'error');
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
                    const isConfirmed = await confirm({
                      title: "Supprimer ce compte ?",
                      message: `Êtes-vous sûr de vouloir supprimer "${acc.name}" et tout son historique ? Cette action est irréversible.`,
                      confirmLabel: "Supprimer",
                      cancelLabel: "Annuler",
                      isDanger: true
                    });
                    if (isConfirmed) {
                      await deleteAccount(acc.id);
                      toast(`Compte "${acc.name}" supprimé`, 'success');
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

function ModalShell({ title, onClose, children, maxWidth = "max-w-md" }) {
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
    <div className="fixed inset-0 bg-ink/90 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div ref={modalRef} className={`bg-panel border border-white/10 p-6 rounded-2xl w-full ${maxWidth} shadow-[0_10px_40px_rgba(0,0,0,0.8)] relative overflow-hidden`} role="dialog" aria-modal="true" aria-labelledby="modal-title">
        <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-8">
            <h2 id="modal-title" className="text-xl font-bold text-white tracking-tight">{title}</h2>
            <button onClick={onClose} aria-label="Fermer" className="text-textdim hover:text-white transition-colors p-1.5 rounded-md hover:bg-white/5">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}

function ForgeInput({ valid, ...props }) {
  return (
    <div className="w-full rounded-xl border border-neutral-800 p-4 flex items-center justify-between gap-4 bg-gradient-to-r from-neutral-900 to-neutral-950 focus-within:ring-1 focus-within:ring-white/20 transition-all">
      <input
        {...props}
        className={`bg-transparent border-none outline-none w-full text-base font-semibold text-white placeholder-neutral-500 ${props.className || ''}`}
      />
      {valid && (
        <div className="shrink-0 flex items-center justify-center w-5 h-5 rounded-full bg-green-500">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
        </div>
      )}
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
    <ModalShell title="Nouveau compte" onClose={onClose} maxWidth="max-w-lg">
      <form onSubmit={submit} className="flex flex-col gap-4">
        <Field label="Nom du compte">
          <ForgeInput
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="ex: AC2"
            valid={name.length > 0}
          />
        </Field>
            <Field label="Solde actuel">
              <ForgeInput
                type="number"
                min="0"
                value={currentCoins}
                onChange={(e) => setCurrentCoins(e.target.value)}
                valid={currentCoins !== ""}
              />
            </Field>
            <Field label="Objectif (coins)">
              <ForgeInput
                type="number"
                min="1"
                value={targetCoins}
                onChange={(e) => setTargetCoins(e.target.value)}
                valid={targetCoins !== ""}
              />
            </Field>
            <Field label="Limite hebdomadaire (0 = aucune)">
              <ForgeInput
                type="number"
                min="0"
                value={weeklyLimit}
                onChange={(e) => setWeeklyLimit(e.target.value)}
                placeholder="ex: 300"
                className="text-warn"
                valid={weeklyLimit !== ""}
              />
            </Field>
            <Field label="Groupe (optionnel)">
              <ForgeInput
                value={groupTag}
                onChange={(e) => setGroupTag(e.target.value)}
                placeholder="ex: Principal, Farm, Test"
                valid={groupTag.length > 0}
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
