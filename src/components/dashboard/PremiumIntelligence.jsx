import React from "react";

export default function PremiumIntelligence({ totalAccounts, totalCoins, totalGrowth, totalDecline, closestTo900, above900 }) {
  return (
    <div>
      <h2 className="text-xl font-bold text-white tracking-tight mb-4 mt-4">Premium Intelligence</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Portfolio Health Score */}
        <div className="pro-card bg-gradient-to-br from-surface to-background p-6 border-accent/20">
          <h3 className="text-xs font-bold text-accent uppercase tracking-wider mb-4 flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" /></svg>
            Health Score
          </h3>
          <div className="flex items-end gap-2 mb-2">
            <span className="text-4xl font-black text-white">
              {totalAccounts === 0 ? 0 : Math.min(100, Math.round(((totalCoins / (totalAccounts * 900)) * 50) + (totalGrowth >= totalDecline ? 50 : 20)))}
            </span>
            <span className="text-textdim mb-1 font-medium">/ 100</span>
          </div>
          <p className="text-xs text-textdim mt-2">Basé sur la stabilité (Gains vs Pertes) et la progression globale vers 900.</p>
        </div>

        {/* Forecast Engine */}
        <div className="pro-card bg-surface p-6">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
            <svg className="w-4 h-4 text-textdim" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
            Forecast Engine
          </h3>
          {closestTo900 ? (
            <>
              <p className="text-sm font-bold text-white mb-1">{closestTo900.name} (Objectif 900)</p>
              <div className="text-2xl font-black text-accent mb-2">
                ~ {Math.ceil((900 - closestTo900.currentCoins) / (totalGrowth > 0 ? (totalGrowth / 14) : 10))} jours
              </div>
              <p className="text-xs text-textdim">Estimation basée sur la croissance historique moyenne (14j).</p>
            </>
          ) : (
            <p className="text-sm text-textdim mt-4">Aucun compte en attente d'objectif.</p>
          )}
        </div>

        {/* Smart Alerts */}
        <div className="pro-card bg-surface p-6">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
            <svg className="w-4 h-4 text-textdim" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
            Smart Alerts
          </h3>
          <div className="space-y-3">
            {above900 > 0 && (
              <div className="bg-success/10 border border-success/20 rounded p-2 text-xs text-success font-medium">
                • {above900} compte(s) ont franchi le seuil des 900 coins. Prêt(s) pour le pass.
              </div>
            )}
            {totalDecline > totalGrowth && (
              <div className="bg-danger/10 border border-danger/20 rounded p-2 text-xs text-danger font-medium">
                • Attention : Les dépenses globales dépassent la croissance. Risque de déclin du portefeuille.
              </div>
            )}
            {totalAccounts > 0 && totalDecline <= totalGrowth && above900 === 0 && (
              <div className="bg-surfaceElevated border border-border rounded p-2 text-xs text-textdim font-medium">
                • Croissance stable détectée. Maintenez vos efforts.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
