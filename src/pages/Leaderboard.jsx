import { useState, useEffect, useMemo } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../db.js";
import { getNextGoal } from "../utils/goalEngine.js";
import { getHealthScore } from "../utils/healthScore.js";
import DataTable from "../components/ui/DataTable.jsx";
import HeroHeader from "../components/ui/HeroHeader.jsx";
import EmptyState from "../components/ui/EmptyState.jsx";

export default function Leaderboard() {
  const accounts = useLiveQuery(() => db.accounts.toArray(), []);
  const [healthData, setHealthData] = useState({});
  const [filterStatus, setFilterStatus] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Load health scores asynchronously
  useEffect(() => {
    if (!accounts || accounts.length === 0) return;
    let cancelled = false;
    async function loadScores() {
      const data = {};
      for (const acc of accounts) {
        const result = await getHealthScore(acc.id);
        data[acc.id] = result;
      }
      if (!cancelled) setHealthData(data);
    }
    loadScores();
    return () => { cancelled = true; };
  }, [accounts]);

  const rows = useMemo(() => {
    if (!accounts) return [];

    return accounts.map(acc => {
      const { progressPct, nextGoal } = getNextGoal(acc.currentCoins);
      const distanceTo900 = acc.currentCoins < 900 ? 900 - acc.currentCoins : 0;
      const hs = healthData[acc.id] || { score: 0, label: "Evaluating", breakdown: {} };

      return {
        id: acc.id,
        name: acc.name,
        coins: acc.currentCoins,
        progressPct,
        distanceTo900,
        healthScore: hs.score,
        healthLabel: hs.label,
        groupTag: acc.groupTag
      };
    });
  }, [accounts, healthData]);

  // Filter
  const filtered = useMemo(() => {
    let result = rows;
    if (filterStatus !== "all") {
      result = result.filter(r => r.healthLabel === filterStatus);
    }
    return result;
  }, [rows, filterStatus]);

  if (!accounts) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-8 h-8 border-2 border-white/10 border-t-white rounded-full animate-spin"></div>
      </div>
    );
  }

  if (accounts.length === 0) {
    return (
      <EmptyState 
        variant="empty"
        title="Aucun compte configuré"
        description="Ajoutez des comptes pour voir le classement."
      />
    );
  }

  const statusColors = {
    Elite: { bg: "bg-accent/10", text: "text-accent", border: "border-accent/20" },
    Good: { bg: "bg-white/5", text: "text-white", border: "border-white/10" },
    Average: { bg: "bg-warn/10", text: "text-warn", border: "border-warn/20" },
    Risky: { bg: "bg-danger/10", text: "text-danger", border: "border-danger/20" },
    Evaluating: { bg: "bg-ink", text: "text-textdim", border: "border-white/5" }
  };

  const columns = [
    {
      key: 'rank',
      label: 'Rang',
      sortable: false,
      align: 'center',
      render: (row, i) => (
        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold mx-auto ${i < 3 ? 'bg-surfaceElevated text-white' : 'text-textdim'}`}>
          {i + 1}
        </div>
      )
    },
    {
      key: 'name',
      label: 'Compte',
      sortValue: (row) => row.name.toLowerCase(),
      render: (row) => (
        <div className="flex items-center gap-2">
          <span className="font-bold text-white">{row.name}</span>
          {row.groupTag && (
            <span className="text-[9px] uppercase tracking-widest text-textdim bg-surfaceElevated rounded px-1.5 py-0.5">{row.groupTag}</span>
          )}
        </div>
      )
    },
    {
      key: 'coins',
      label: 'Coins',
      align: 'right',
      render: (row) => (
        <span className={`font-bold ${row.coins >= 900 ? 'text-accent' : 'text-white'}`}>
          {row.coins.toLocaleString()}
        </span>
      )
    },
    {
      key: 'progressPct',
      label: 'Progression',
      align: 'right',
      render: (row) => (
        <div className="flex items-center justify-end gap-2">
          <div className="w-16 h-1.5 bg-background rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full ${row.progressPct >= 100 ? 'bg-accent' : row.progressPct >= 50 ? 'bg-warn' : 'bg-danger'}`}
              style={{ width: `${Math.min(row.progressPct, 100)}%` }}
            />
          </div>
          <span className="text-xs font-mono font-bold text-textdim w-8 text-right">{row.progressPct}%</span>
        </div>
      )
    },
    {
      key: 'healthScore',
      label: 'Health Score',
      align: 'right',
      render: (row) => (
        <span className={`font-bold font-mono ${row.healthScore >= 90 ? 'text-accent' : row.healthScore >= 75 ? 'text-white' : row.healthScore >= 50 ? 'text-warn' : 'text-danger'}`}>
          {row.healthScore}
        </span>
      )
    },
    {
      key: 'healthLabel',
      label: 'Statut',
      sortValue: (row) => row.healthScore, // Sort status by underlying score
      align: 'right',
      render: (row) => {
        const colors = statusColors[row.healthLabel] || statusColors.Evaluating;
        return (
          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${colors.bg} ${colors.text} border ${colors.border}`}>
            {row.healthLabel}
          </span>
        );
      }
    }
  ];

  return (
    <div className="max-w-6xl mx-auto pb-12 space-y-6">
      <HeroHeader 
        title="Leaderboard"
        description="Classement des comptes par performance, discipline et progression."
      />

      {/* Filters */}
      <div className="pro-card p-4 flex flex-col md:flex-row gap-3 items-stretch md:items-center">
        <div className="flex-1">
          {/* Search is handled by DataTable now */}
          <h2 className="text-sm font-bold text-white uppercase tracking-wider pl-2">Filtrer par Statut</h2>
        </div>
        <div className="flex gap-2 flex-wrap">
          {["all", "Elite", "Good", "Average", "Risky"].map(status => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider border transition-all ${
                filterStatus === status
                  ? "bg-white text-ink border-white"
                  : "bg-transparent text-textdim border-border hover:border-white/20 hover:text-white"
              }`}
            >
              {status === "all" ? "Tous" : status}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="pro-card p-6">
        <DataTable 
          columns={columns}
          data={filtered}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          globalSearchFn={(row, q) => row.name.toLowerCase().includes(q) || (row.groupTag && row.groupTag.toLowerCase().includes(q))}
          defaultSortKey="coins"
        />
        {Object.keys(disciplineData).length > 0 && (
          <p className="text-[10px] text-textdim mt-4">* Score en cours d'évaluation (nécessite au moins 3 spins sur 30 jours).</p>
        )}
      </div>
    </div>
  );
}
