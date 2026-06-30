import React from "react";
import { ProCard } from "./ProCard.jsx";

export default function FinancialMetrics({
  totalCoins,
  totalAccounts,
  averageCoins,
  totalGrowth,
  totalDecline,
  above900,
  below900,
  bestGrowth,
  worstDecline,
}) {
  return (
    <>
      {/* Row 1: Core Financials */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <ProCard title="Total Coins" value={totalCoins.toLocaleString()} sub={`${totalAccounts} comptes actifs`} />
        <ProCard title="Moyenne par Compte" value={averageCoins.toLocaleString()} sub="Coins / compte" />
        <ProCard title="Croissance Globale" value={`+${totalGrowth.toLocaleString()}`} color="text-accent" sub="Total des gains historiques" />
        <ProCard title="Pertes Globales" value={`-${totalDecline.toLocaleString()}`} color="text-red-400" sub="Total des dépenses/pertes" />
      </div>

      {/* Row 2: Bilan Comparison Upgrade */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <ProCard title="Comptes Prêts (≥900)" value={above900} sub={`${Math.round((above900 / (totalAccounts || 1)) * 100)}% du portfolio`} color="text-accent" />
        <ProCard title="Comptes à Risque (<900)" value={below900} sub={`${Math.round((below900 / (totalAccounts || 1)) * 100)}% du portfolio`} color="text-warn" />
        <ProCard title="Meilleure Croissance" value={`+${bestGrowth.diff}`} sub={bestGrowth.name} color="text-accent" />
        <ProCard title="Pire Déclin" value={`${worstDecline.diff}`} sub={worstDecline.name} color="text-red-400" />
      </div>
    </>
  );
}
