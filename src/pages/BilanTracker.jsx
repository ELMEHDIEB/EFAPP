import { useState, useMemo, useEffect } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../db.js";
import { applyCoinChange } from "../accountActions.js";
import { useToast } from "../components/ui/ToastContext.jsx";
import { useConfirm } from "../components/ui/ConfirmContext.jsx";
import AccountHistory from "../components/AccountHistory.jsx";
import BulkBilanImport from "../components/BulkBilanImport.jsx";
import CommandCenter from "../components/CommandCenter.jsx";
import { getNextGoal } from "../utils/goalEngine.js";
import { getDisciplineScore, getDisciplineLabel } from "../scoreActions.js";
import DataTable from "../components/ui/DataTable.jsx";
import HeroHeader from "../components/ui/HeroHeader.jsx";
import EmptyState from "../components/ui/EmptyState.jsx";
import { AreaChart, Area, ResponsiveContainer, YAxis } from "recharts";

export default function BilanTracker() {
  const showToast = useToast();
  const confirm = useConfirm();
  
  const accounts = useLiveQuery(() => db.accounts.toArray(), []);
  const coinLogs = useLiveQuery(() => db.coinLogs.toArray(), []);
  const [snapshotData, setSnapshotData] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [quickAddAccount, setQuickAddAccount] = useState("");
  const [disciplineData, setDisciplineData] = useState({});
  const [searchQuery, setSearchQuery] = useState("");

  // Load discipline scores
  useMemo(() => {
    if (!accounts || accounts.length === 0) return;
    let cancelled = false;
    async function loadScores() {
      const data = {};
      for (const acc of accounts) {
        const result = await getDisciplineScore(acc.id);
        data[acc.id] = result;
      }
      if (!cancelled) setDisciplineData(data);
    }
    loadScores();
    return () => { cancelled = true; };
  }, [accounts]);

  // Initialize snapshot data when accounts load
  useMemo(() => {
    if (accounts && Object.keys(snapshotData).length === 0) {
      const initial = {};
      accounts.forEach(acc => {
        initial[acc.id] = acc.currentCoins;
      });
      setSnapshotData(initial);
    }
  }, [accounts, snapshotData]);

  // Set default quick add account
  useMemo(() => {
    if (accounts && accounts.length > 0 && !quickAddAccount) {
      setQuickAddAccount(accounts[0].id);
    }
  }, [accounts, quickAddAccount]);

  const handleValueChange = (id, value) => {
    setSnapshotData(prev => ({
      ...prev,
      [id]: value === "" ? "" : Number(value)
    }));
  };

  const calculateVariation = (accountId) => {
    const account = accounts?.find(a => a.id === accountId);
    if (!account) return { diff: 0, pct: 0 };
    
    const oldVal = account.currentCoins;
    const newVal = snapshotData[accountId] === "" ? oldVal : Number(snapshotData[accountId]);
    const diff = newVal - oldVal;
    const pct = oldVal === 0 ? (diff > 0 ? 100 : 0) : ((diff / oldVal) * 100).toFixed(1);
    
    return { diff, pct };
  };

  const handleSaveBilan = async () => {
    if (!accounts) return;
    
    const changes = accounts.filter(acc => {
      const newVal = snapshotData[acc.id];
      return newVal !== "" && Number(newVal) !== acc.currentCoins;
    });

    if (changes.length === 0) {
      showToast("Aucune modification détectée.", "warning");
      return;
    }

    const confirmed = await confirm({
      title: "Enregistrer le Bilan",
      message: `Vous êtes sur le point de mettre à jour le solde de ${changes.length} compte(s). Confirmez-vous ?`,
      confirmText: "Sauvegarder",
      cancelText: "Annuler"
    });

    if (!confirmed) return;

    setIsSaving(true);
    try {
      for (const acc of changes) {
        const newVal = Number(snapshotData[acc.id]);
        await applyCoinChange(acc.id, {
          action: "SET_BALANCE",
          reason: "Bilan Snapshot",
          amount: newVal
        });
      }
      showToast("Bilan enregistré avec succès !", "success");
    } catch (err) {
      showToast("Erreur lors de la sauvegarde: " + err.message, "error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleQuickAdd = async (amount) => {
    if (!quickAddAccount) return;
    const acc = accounts?.find(a => a.id === quickAddAccount);
    if (!acc) return;
    try {
      await applyCoinChange(acc.id, { action: "ADD", amount, reason: "Ajout rapide" });
      showToast(`+${amount} coins ajoutés à ${acc.name}`, "success");
    } catch (err) {
      showToast(err.message, "error");
    }
  };

  if (!accounts || !coinLogs) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-8 h-8 border-2 border-white/10 border-t-white rounded-full animate-spin"></div>
      </div>
    );
  }

  const sortedAccounts = [...accounts].sort((a, b) => b.currentCoins - a.currentCoins);
  const totalCoins = accounts.reduce((sum, a) => sum + a.currentCoins, 0);
  const above900 = accounts.filter(a => a.currentCoins >= 900).length;
  const avgProgress = accounts.length > 0
    ? Math.round(accounts.reduce((sum, a) => sum + getNextGoal(a.currentCoins).progressPct, 0) / accounts.length)
    : 0;

  // Smart Insights computation
  const closeToGoal = accounts.filter(a => a.currentCoins < 900 && (900 - a.currentCoins) <= 100);
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 86400000).toISOString().slice(0, 10);
  const weeklyLogs = coinLogs.filter(l => l.date >= sevenDaysAgo);
  const weeklyDelta = weeklyLogs.reduce((sum, l) => sum + (l.newBalance - l.previousBalance), 0);

  const statusColors = {
    Elite: { bg: "bg-accent/10", text: "text-accent", border: "border-accent/20" },
    Good: { bg: "bg-white/5", text: "text-white", border: "border-white/10" },
    Average: { bg: "bg-warn/10", text: "text-warn", border: "border-warn/20" },
    Risky: { bg: "bg-danger/10", text: "text-danger", border: "border-danger/20" }
  };

  const columns = [
    {
      key: 'rank',
      label: 'Rang',
      sortable: false,
      align: 'center',
      render: (row, i) => (
        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold mx-auto ${i < 3 ? 'bg-white/10 text-white' : 'text-textdim'}`}>
          {i + 1}
        </div>
      )
    },
    {
      key: 'name',
      label: 'Compte',
      sortValue: (row) => row.name.toLowerCase(),
      render: (row) => {
        const { progressPct } = getNextGoal(row.currentCoins);
        return (
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${progressPct >= 100 ? 'bg-accent' : 'bg-warn'}`}></div>
            <span className="font-semibold text-white">{row.name}</span>
            {row.groupTag && (
              <span className="text-[9px] uppercase tracking-widest text-textdim font-semibold bg-white/5 rounded px-1.5 py-0.5">{row.groupTag}</span>
            )}
          </div>
        );
      }
    },
    {
      key: 'currentCoins',
      label: 'Coins Actuels',
      align: 'right',
      render: (row) => <span className={`font-bold ${row.currentCoins >= 900 ? 'text-accent' : 'text-textdim'}`}>{row.currentCoins.toLocaleString()}</span>
    },
    {
      key: 'trend',
      label: 'Tendance (7j)',
      sortable: false,
      align: 'center',
      render: (row) => {
        // Find last 5 logs for this account
        const accLogs = coinLogs.filter(l => l.accountId === row.id).sort((a, b) => a.id - b.id).slice(-6);
        if (accLogs.length < 2) return <span className="text-[10px] text-textdim">Pas de data</span>;
        
        const data = accLogs.map(l => ({ val: l.newBalance }));
        const isUp = data[data.length - 1].val >= data[0].val;
        const color = isUp ? "#10b981" : "#ef4444"; // green or red
        
        // Calculate min/max for YAxis scaling to make the sparkline look dynamic
        const minVal = Math.min(...data.map(d => d.val));
        const maxVal = Math.max(...data.map(d => d.val));
        
        return (
          <div className="w-16 h-8 mx-auto opacity-70 hover:opacity-100 transition-opacity">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
                <YAxis domain={[minVal, maxVal]} hide />
                <Area 
                  type="monotone" 
                  dataKey="val" 
                  stroke={color} 
                  strokeWidth={2} 
                  fill={color} 
                  fillOpacity={0.2} 
                  isAnimationActive={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        );
      }
    },
    {
      key: 'newBalance',
      label: 'Nouveau Solde',
      sortable: false,
      align: 'right',
      render: (row) => {
        const { diff } = calculateVariation(row.id);
        const isPositive = diff > 0;
        return (
          <div className="flex items-center justify-end gap-2">
            <input 
              type="number"
              min="0"
              value={snapshotData[row.id] ?? row.currentCoins}
              onChange={(e) => handleValueChange(row.id, e.target.value)}
              className="input w-20 text-right font-medium text-white p-1 text-sm"
            />
            {diff !== 0 && (
              <span className={`text-xs font-medium w-8 text-left ${isPositive ? "text-accent" : "text-danger"}`}>
                {isPositive ? "+" : ""}{diff}
              </span>
            )}
          </div>
        )
      }
    },
    {
      key: 'progressPct',
      label: 'Progression %',
      sortValue: (row) => getNextGoal(row.currentCoins).progressPct,
      align: 'right',
      render: (row) => {
        const { progressPct } = getNextGoal(row.currentCoins);
        return (
          <div className="flex items-center justify-end gap-2">
            <div className="w-16 h-1.5 bg-background rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all duration-500 ${progressPct >= 100 ? 'bg-accent' : progressPct >= 50 ? 'bg-warn' : 'bg-danger'}`}
                style={{ width: `${Math.min(progressPct, 100)}%` }}
              />
            </div>
            <span className="text-[10px] w-6 text-textdim font-mono">{progressPct}%</span>
          </div>
        );
      }
    },
    {
      key: 'distanceTo900',
      label: 'Distance à 900',
      sortValue: (row) => row.currentCoins < 900 ? 900 - row.currentCoins : 0,
      align: 'right',
      render: (row) => {
        const d = row.currentCoins < 900 ? 900 - row.currentCoins : 0;
        if (d > 0) return <span className="text-warn font-medium">{d}</span>;
        return <span className="text-accent font-medium">✓</span>;
      }
    },
    {
      key: 'disciplineScore',
      label: 'Discipline',
      align: 'center',
      sortValue: (row) => (disciplineData[row.id] || { score: 100 }).score,
      render: (row) => {
        const ds = disciplineData[row.id] || { score: 100, isEvaluating: true };
        const label = getDisciplineLabel(ds.score);
        const colors = statusColors[label] || statusColors.Average;
        return (
          <div className="flex flex-col items-center gap-1">
            <div className="flex items-center gap-1">
              <span className="font-bold text-white">{ds.score}</span>
              {ds.isEvaluating && <span className="text-textdim text-[10px]">*</span>}
            </div>
            <span className={`px-1.5 py-[1px] rounded text-[9px] font-bold uppercase tracking-wider ${colors.bg} ${colors.text} border ${colors.border}`}>
              {label}
            </span>
          </div>
        )
      }
    },
    {
      key: 'quickAdd',
      label: 'Actions Rapides',
      sortable: false,
      align: 'center',
      render: (row) => (
        <div className="flex gap-1.5 justify-center">
          {[25, 50, 100, 250].map(amount => (
            <button
              key={amount}
              onClick={async () => {
                try {
                  await applyCoinChange(row.id, { action: "ADD", amount, reason: "Ajout rapide" });
                  showToast(`+${amount} coins ajoutés à ${row.name}`, 'success');
                } catch (err) {
                  showToast(err.message, 'error');
                }
              }}
              className="btn-secondary px-1.5 py-1 text-[10px] font-bold"
            >
              +{amount}
            </button>
          ))}
        </div>
      )
    },
    {
      key: 'actions',
      label: 'Actions',
      sortable: false,
      align: 'center',
      render: (row) => {
        const { diff } = calculateVariation(row.id);
        if (diff !== 0) {
          return (
            <button
              onClick={async () => {
                setIsSaving(true);
                try {
                  await applyCoinChange(row.id, {
                    action: "SET_BALANCE",
                    reason: "Bilan Snapshot",
                    amount: Number(snapshotData[row.id])
                  });
                  showToast("Compte mis à jour avec succès !", "success");
                } catch (err) {
                  showToast("Erreur: " + err.message, "error");
                } finally {
                  setIsSaving(false);
                }
              }}
              disabled={isSaving}
              className="btn-primary px-2 py-1 text-[10px]"
            >
              Sauver
            </button>
          );
        }
        return <span className="text-textdim text-[10px]">—</span>;
      }
    }
  ];

  const hasAccounts = accounts?.length > 0;

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-10">
      <HeroHeader 
        title="Bilan & Tracker"
        description="Centre de contrôle principal — suivi comptable et gestion du patrimoine."
      />

      {!hasAccounts ? (
        <EmptyState 
          variant="empty"
          title="Aucun compte disponible"
          description="Créez votre premier compte pour commencer à suivre votre progression et vos bilans."
          action={
            <button onClick={() => window.location.href = '/accounts'} className="btn-primary py-2 px-6">
              Créer un compte
            </button>
          }
        />
      ) : (
        <>
          {/* HERO KPI SECTION */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="pro-card p-5 justify-between gap-3 bg-gradient-to-br from-panel to-ink border-accent/20">
              <p className="text-[10px] font-bold text-accent uppercase tracking-widest">Total Coins</p>
              <div>
                <p className="text-3xl font-black tracking-tight text-white">{totalCoins.toLocaleString()}</p>
                <p className="text-xs text-textdim font-medium">{accounts.length} comptes actifs</p>
              </div>
            </div>
            <div className="pro-card p-5 justify-between gap-3">
              <p className="text-[10px] font-bold text-textdim uppercase tracking-widest">Comptes Actifs</p>
              <div>
                <p className="text-3xl font-black tracking-tight text-white">{accounts.length}</p>
                <p className="text-xs text-textdim font-medium">dans le portefeuille</p>
              </div>
            </div>
            <div className="pro-card p-5 justify-between gap-3">
              <p className="text-[10px] font-bold text-textdim uppercase tracking-widest">Comptes ≥ 900</p>
              <div>
                <p className={`text-3xl font-black tracking-tight ${above900 > 0 ? 'text-accent' : 'text-warn'}`}>{above900}</p>
                <p className="text-xs text-textdim font-medium">
                  {accounts.length > 0 ? `${Math.round((above900 / accounts.length) * 100)}% du portfolio` : "—"}
                </p>
              </div>
            </div>
            <div className="pro-card p-5 justify-between gap-3">
              <p className="text-[10px] font-bold text-textdim uppercase tracking-widest">Progression Moyenne</p>
              <div>
                <p className={`text-3xl font-black tracking-tight ${avgProgress >= 100 ? 'text-accent' : avgProgress >= 50 ? 'text-white' : 'text-warn'}`}>{avgProgress}%</p>
                <div className="w-full h-1.5 bg-ink rounded-full overflow-hidden mt-2">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${avgProgress >= 100 ? 'bg-accent' : avgProgress >= 50 ? 'bg-white' : 'bg-warn'}`}
                    style={{ width: `${Math.min(avgProgress, 100)}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* COMMAND CENTER */}
          <div className="mb-4">
            <CommandCenter onComplete={() => setSnapshotData({})} />
          </div>

          {/* BULK IMPORT (DEPRECATED) */}
          <div className="mb-8 opacity-70 grayscale-[50%] transition-opacity hover:opacity-100 hover:grayscale-0">
            <p className="text-xs font-bold text-warn mb-2 uppercase tracking-widest text-center border-b border-warn/20 pb-1">Deprecated - Sera supprimé dans la V6</p>
            <BulkBilanImport onComplete={() => setSnapshotData({})} />
          </div>

          {/* SNAPSHOT TABLE */}
          <div className="space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-white">Gestion du Portefeuille</h2>
                <p className="text-sm text-textdim">Suivez, mettez à jour et visualisez les performances de chaque compte.</p>
              </div>
              <button 
                onClick={handleSaveBilan}
                disabled={isSaving}
                className="btn-primary py-2 px-4 whitespace-nowrap shadow-glow"
              >
                {isSaving ? "Sauvegarde..." : "Enregistrer Tout Le Bilan"}
              </button>
            </div>

            <DataTable 
              columns={columns}
              data={accounts}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              globalSearchFn={(row, q) => row.name.toLowerCase().includes(q) || (row.groupTag && row.groupTag.toLowerCase().includes(q))}
              defaultSortKey="currentCoins"
            />
            {Object.keys(disciplineData).length > 0 && (
              <p className="text-[10px] text-textdim pl-2">* Score en cours d'évaluation (nécessite au moins 3 spins sur 30 jours).</p>
            )}
          </div>

          {/* ═══════════════════════════════════════════════════════════ */}
          {/* ACCOUNT HISTORY                                            */}
          {/* ═══════════════════════════════════════════════════════════ */}
          <div className="mt-2">
            <AccountHistory />
          </div>
        </>
      )}
    </div>
  );
}
