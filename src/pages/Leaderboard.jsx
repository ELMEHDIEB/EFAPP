import { useState, useEffect, useMemo } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../db.js";
import { getNextGoal } from "../utils/goalEngine.js";
import { progressPercent } from "../accountActions.js";
import { getDisciplineScore, getDisciplineLabel } from "../scoreActions.js";

export default function Leaderboard() {
  const accounts = useLiveQuery(() => db.accounts.toArray(), []);
  const [disciplineData, setDisciplineData] = useState({});
  const [sortKey, setSortKey] = useState("coins");
  const [sortDir, setSortDir] = useState("desc");
  const [filterStatus, setFilterStatus] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Load discipline scores asynchronously
  useEffect(() => {
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

  const rows = useMemo(() => {
    if (!accounts) return [];

    return accounts.map(acc => {
      const { progressPct, remainingCoins, nextGoal } = getNextGoal(acc.currentCoins);
      const distanceTo900 = acc.currentCoins < 900 ? 900 - acc.currentCoins : 0;
      const ds = disciplineData[acc.id] || { score: 100, isEvaluating: true };
      const label = getDisciplineLabel(ds.score);

      return {
        id: acc.id,
        name: acc.name,
        coins: acc.currentCoins,
        progressPct,
        distanceTo900,
        disciplineScore: ds.score,
        disciplineLabel: label,
        isEvaluating: ds.isEvaluating,
        groupTag: acc.groupTag
      };
    });
  }, [accounts, disciplineData]);

  // Filter
  const filtered = useMemo(() => {
    let result = rows;

    if (filterStatus !== "all") {
      result = result.filter(r => r.disciplineLabel === filterStatus);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      result = result.filter(r => r.name.toLowerCase().includes(q));
    }

    return result;
  }, [rows, filterStatus, searchQuery]);

  // Sort
  const sorted = useMemo(() => {
    const arr = [...filtered];
    arr.sort((a, b) => {
      let valA, valB;
      switch (sortKey) {
        case "name": valA = a.name.toLowerCase(); valB = b.name.toLowerCase(); break;
        case "coins": valA = a.coins; valB = b.coins; break;
        case "progress": valA = a.progressPct; valB = b.progressPct; break;
        case "distance": valA = a.distanceTo900; valB = b.distanceTo900; break;
        case "discipline": valA = a.disciplineScore; valB = b.disciplineScore; break;
        default: valA = a.coins; valB = b.coins;
      }
      if (sortDir === "asc") return valA > valB ? 1 : -1;
      return valA < valB ? 1 : -1;
    });
    return arr;
  }, [filtered, sortKey, sortDir]);

  const handleSort = (key) => {
    if (sortKey === key) {
      setSortDir(prev => prev === "desc" ? "asc" : "desc");
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  };

  if (!accounts) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-8 h-8 border-2 border-white/10 border-t-white rounded-full animate-spin"></div>
      </div>
    );
  }

  const statusColors = {
    Elite: { bg: "bg-accent/10", text: "text-accent", border: "border-accent/20" },
    Good: { bg: "bg-white/5", text: "text-white", border: "border-white/10" },
    Average: { bg: "bg-warn/10", text: "text-warn", border: "border-warn/20" },
    Risky: { bg: "bg-danger/10", text: "text-danger", border: "border-danger/20" }
  };

  const SortHeader = ({ label, sortKeyName, align = "left" }) => (
    <th
      className={`pb-3 font-medium cursor-pointer hover:text-white transition-colors select-none ${align === "right" ? "text-right" : align === "center" ? "text-center" : ""}`}
      onClick={() => handleSort(sortKeyName)}
    >
      <span className="inline-flex items-center gap-1">
        {label}
        {sortKey === sortKeyName && (
          <span className="text-accent text-[10px]">{sortDir === "desc" ? "▼" : "▲"}</span>
        )}
      </span>
    </th>
  );

  return (
    <div className="max-w-6xl mx-auto pb-12 animate-in fade-in duration-500 space-y-6">
      <header>
        <h1 className="text-3xl font-bold text-white tracking-tight">Leaderboard</h1>
        <p className="text-sm text-textdim mt-1">Classement des comptes par performance, discipline et progression.</p>
      </header>

      {/* Filters */}
      <div className="pro-card p-4 flex flex-col md:flex-row gap-3 items-stretch md:items-center">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Rechercher un compte..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="input w-full py-2"
          />
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
      <div className="pro-card p-6 overflow-x-auto">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead>
            <tr className="border-b border-border text-textdim">
              <th className="pb-3 font-medium w-12">#</th>
              <SortHeader label="Compte" sortKeyName="name" />
              <SortHeader label="Coins" sortKeyName="coins" align="right" />
              <SortHeader label="Progression" sortKeyName="progress" align="right" />
              <SortHeader label="Distance 900" sortKeyName="distance" align="right" />
              <SortHeader label="Discipline" sortKeyName="discipline" align="center" />
              <th className="pb-3 font-medium text-right">Statut</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {sorted.map((row, index) => {
              const colors = statusColors[row.disciplineLabel] || statusColors.Average;
              const isTop3 = index < 3;

              return (
                <tr key={row.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="py-3.5">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                      isTop3 ? 'bg-white/10 text-white' : 'text-textdim'
                    }`}>
                      {index + 1}
                    </div>
                  </td>
                  <td className="py-3.5">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white">{row.name}</span>
                      {row.groupTag && (
                        <span className="text-[9px] uppercase tracking-widest text-textdim bg-white/5 rounded px-1.5 py-0.5">{row.groupTag}</span>
                      )}
                    </div>
                  </td>
                  <td className="py-3.5 text-right">
                    <span className={`font-bold ${row.coins >= 900 ? 'text-accent' : 'text-white'}`}>
                      {row.coins.toLocaleString()}
                    </span>
                  </td>
                  <td className="py-3.5 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <div className="w-16 h-1.5 bg-ink rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${row.progressPct >= 100 ? 'bg-accent' : row.progressPct >= 50 ? 'bg-warn' : 'bg-danger'}`}
                          style={{ width: `${Math.min(row.progressPct, 100)}%` }}
                        />
                      </div>
                      <span className="text-xs font-mono font-bold text-textdim w-8 text-right">{row.progressPct}%</span>
                    </div>
                  </td>
                  <td className="py-3.5 text-right">
                    {row.distanceTo900 > 0 ? (
                      <span className="text-warn font-medium">{row.distanceTo900}</span>
                    ) : (
                      <span className="text-accent font-medium">✓</span>
                    )}
                  </td>
                  <td className="py-3.5 text-center">
                    <span className="font-bold text-white">{row.disciplineScore}</span>
                    {row.isEvaluating && (
                      <span className="text-textdim text-[10px] ml-1">*</span>
                    )}
                  </td>
                  <td className="py-3.5 text-right">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${colors.bg} ${colors.text} border ${colors.border}`}>
                      {row.disciplineLabel}
                    </span>
                  </td>
                </tr>
              );
            })}
            {sorted.length === 0 && (
              <tr>
                <td colSpan="7" className="py-12 text-center text-textdim">
                  {searchQuery || filterStatus !== "all"
                    ? "Aucun résultat pour ces filtres."
                    : "Aucun compte disponible."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
        {Object.keys(disciplineData).length > 0 && (
          <p className="text-[10px] text-textdim mt-4">* Score en cours d'évaluation (nécessite au moins 3 spins sur 30 jours).</p>
        )}
      </div>
    </div>
  );
}
