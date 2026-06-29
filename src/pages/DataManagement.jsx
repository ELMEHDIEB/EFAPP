import { useState, useEffect } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../db.js";
import { useToast } from "../components/ui/ToastContext.jsx";
import { useConfirm } from "../components/ui/ConfirmContext.jsx";
import HeroHeader from "../components/ui/HeroHeader.jsx";
import { useDataManagement } from "../hooks/useDataManagement.js";
import { DangerZone } from "../components/data/DangerZone.jsx";

const TABLES = [
  "accounts",
  "coinLogs",
  "spinLogs",
  "spinPlayers",
  "regretLogs",
  "emotionalLogs",
  "notifications",
  "settings",
  "auditLogs"
];

export default function DataManagement() {
  const toast = useToast();
  const confirm = useConfirm();
  
  const accountsCount = useLiveQuery(() => db.accounts.count(), []) || 0;
  const coinLogsCount = useLiveQuery(() => db.coinLogs.count(), []) || 0;
  const spinLogsCount = useLiveQuery(() => db.spinLogs.count(), []) || 0;
  const auditLogsCount = useLiveQuery(() => db.auditLogs.count(), []) || 0;
  const auditLogs = useLiveQuery(() => db.auditLogs.orderBy('id').reverse().limit(5).toArray(), []) || [];
  const settings = useLiveQuery(() => db.settings.toArray(), []) || [];

  const lastBackup = settings.find(s => s.key === "lastBackupDate")?.value;

  const totalRecords = accountsCount + coinLogsCount + spinLogsCount + auditLogsCount;
  const accPct = totalRecords > 0 ? Math.round((accountsCount / totalRecords) * 100) : 0;
  const coinPct = totalRecords > 0 ? Math.round((coinLogsCount / totalRecords) * 100) : 0;
  const spinPct = totalRecords > 0 ? Math.round((spinLogsCount / totalRecords) * 100) : 0;
  const auditPct = totalRecords > 0 ? Math.round((auditLogsCount / totalRecords) * 100) : 0;

  const {
    exportBackup,
    recalculateAnalytics,
    resetAllAccounts,
    deleteAllCoinLogs,
    deleteAllSpinLogs,
    factoryReset,
    runDiagnostics
  } = useDataManagement(toast, confirm);

  return (
    <div className="max-w-7xl mx-auto pb-12 space-y-6">
      <HeroHeader 
        title="Data Management"
        description="Application Reset Center & Gestion des données (Local First)."
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Colonne Principale */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Backup Center */}
          <div className="pro-card p-6">
            <h2 className="pro-heading mb-6">Backup Center</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
              <div>
                <p className="text-[10px] uppercase tracking-widest text-textdim font-bold mb-1">Last Backup</p>
                <p className="text-xl font-black text-white truncate">{lastBackup ? new Date(lastBackup).toLocaleDateString() : "Never"}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-widest text-textdim font-bold mb-1">Backup Count</p>
                <p className="text-xl font-black text-white">{lastBackup ? 1 : 0}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-widest text-textdim font-bold mb-1">Backup Size</p>
                <p className="text-xl font-black text-white">{totalRecords > 0 ? `${(totalRecords * 0.15).toFixed(1)} KB` : "—"}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-widest text-textdim font-bold mb-1">Backup Health</p>
                <p className={`text-xl font-black ${lastBackup ? 'text-accent' : 'text-danger'}`}>{lastBackup ? 'Good' : 'Missing'}</p>
              </div>
            </div>
            <div className="p-4 bg-ink rounded-xl border border-white/5 mb-6">
              <p className="text-sm font-bold text-white mb-1">Backup Status: {lastBackup ? 'Active' : 'Missing'}</p>
              <p className="text-xs text-textdim">{lastBackup ? 'A backup has been successfully recorded.' : '— No backup has been created yet.'}</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button onClick={exportBackup} className="btn-primary flex-1">Create</button>
              <button onClick={exportBackup} className="btn-secondary flex-1">Download</button>
              <button disabled className="btn-secondary flex-1 opacity-50 cursor-not-allowed">Restore</button>
              <button disabled className="btn-secondary flex-1 opacity-50 cursor-not-allowed">Verify</button>
            </div>
          </div>

          {/* Maintenance */}
          <div className="pro-card p-6">
            <h2 className="pro-heading mb-6">Maintenance</h2>
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-center gap-4 p-4 bg-ink rounded-xl border border-white/5">
                <div className="flex-1">
                  <p className="text-sm font-bold text-white mb-1">Recalculate Analytics</p>
                  <p className="text-xs text-textdim">Recalcul complet et reconstruction des métriques.</p>
                </div>
                <button onClick={recalculateAnalytics} className="btn-secondary whitespace-nowrap">Recalculate Analytics</button>
              </div>
              
              <div className="flex flex-col sm:flex-row justify-between items-center gap-4 p-4 bg-ink rounded-xl border border-white/5">
                <div className="flex-1">
                  <p className="text-sm font-bold text-white mb-1">Export JSON Backup</p>
                  <p className="text-xs text-textdim">Génère un fichier de sauvegarde manuel.</p>
                </div>
                <button onClick={exportBackup} className="btn-secondary whitespace-nowrap">Exporter JSON</button>
              </div>
            </div>
          </div>

          {/* Reset Operations */}
          <div className="pro-card p-6 border-warn/30 border">
            <h2 className="pro-heading mb-6 text-warn flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
              Reset Operations
            </h2>
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-center gap-4 p-4 bg-ink rounded-xl border border-warn/10">
                <div className="flex-1">
                  <p className="text-sm font-bold text-white mb-1">Reset All Accounts</p>
                  <p className="text-xs text-textdim">Remet tous les comptes à 0 coins. Conserve les noms et objectifs.</p>
                </div>
                <button onClick={() => resetAllAccounts(accountsCount)} className="btn-secondary text-warn whitespace-nowrap">Reset Accounts</button>
              </div>
              
              <div className="flex flex-col sm:flex-row justify-between items-center gap-4 p-4 bg-ink rounded-xl border border-warn/10">
                <div className="flex-1">
                  <p className="text-sm font-bold text-white mb-1">Delete All Coin Logs</p>
                  <p className="text-xs text-textdim">Supprime tout l'historique de variation des comptes.</p>
                </div>
                <button onClick={deleteAllCoinLogs} className="btn-secondary text-warn whitespace-nowrap">Delete Coin Logs</button>
              </div>

              <div className="flex flex-col sm:flex-row justify-between items-center gap-4 p-4 bg-ink rounded-xl border border-warn/10">
                <div className="flex-1">
                  <p className="text-sm font-bold text-white mb-1">Delete All Spin Logs</p>
                  <p className="text-xs text-textdim">Supprime tout l'historique des tirages et spins.</p>
                </div>
                <button onClick={deleteAllSpinLogs} className="btn-secondary text-warn whitespace-nowrap">Delete Spin Logs</button>
              </div>
            </div>
          </div>

          {/* Danger Zone */}
          <DangerZone 
            accountsCount={accountsCount} 
            coinLogsCount={coinLogsCount} 
            spinLogsCount={spinLogsCount} 
            factoryReset={factoryReset} 
          />
        </div>

        {/* Colonne Latérale */}
        <div className="space-y-6">
          
          {/* Storage Insights */}
          <div className="pro-card p-6">
            <h2 className="pro-heading mb-6">Storage Insights</h2>
            
            <div className="space-y-4 mb-6">
              <div className="flex justify-between items-center">
                <span className="text-sm text-textdim">Accounts</span>
                <span className="text-lg font-black text-white">{accountsCount}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-textdim">Coin Logs</span>
                <span className="text-lg font-black text-white">{coinLogsCount}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-textdim">Spin Logs</span>
                <span className="text-lg font-black text-white">{spinLogsCount}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-textdim">Audit Logs</span>
                <span className="text-lg font-black text-white">{auditLogsCount}</span>
              </div>
            </div>

            <div className="pt-4 border-t border-border mb-6">
              <p className="text-[10px] uppercase tracking-widest text-textdim font-bold mb-1">IndexedDB Size (Approx)</p>
              <p className="text-2xl font-black text-white">{totalRecords > 0 ? `${(totalRecords * 0.15).toFixed(1)} KB` : "0 KB"}</p>
            </div>

            <div className="pt-4 border-t border-border">
              <p className="text-[10px] uppercase tracking-widest text-textdim font-bold mb-3">Database Composition</p>
              <div className="w-full h-2 bg-ink rounded-full overflow-hidden flex mb-3">
                <div className="h-full bg-accent" style={{ width: `${accPct}%` }}></div>
                <div className="h-full bg-blue-400" style={{ width: `${coinPct}%` }}></div>
                <div className="h-full bg-purple-400" style={{ width: `${spinPct}%` }}></div>
                <div className="h-full bg-warn" style={{ width: `${auditPct}%` }}></div>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between items-center text-[10px]">
                  <span className="text-textdim flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-accent"></span> Accounts</span>
                  <span className="text-white font-bold">{accPct}%</span>
                </div>
                <div className="flex justify-between items-center text-[10px]">
                  <span className="text-textdim flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-blue-400"></span> Coin Logs</span>
                  <span className="text-white font-bold">{coinPct}%</span>
                </div>
                <div className="flex justify-between items-center text-[10px]">
                  <span className="text-textdim flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-purple-400"></span> Spin Logs</span>
                  <span className="text-white font-bold">{spinPct}%</span>
                </div>
                <div className="flex justify-between items-center text-[10px]">
                  <span className="text-textdim flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-warn"></span> Audit Logs</span>
                  <span className="text-white font-bold">{auditPct}%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Audit History */}
          <div className="pro-card p-6">
            <h2 className="pro-heading mb-6">Audit History</h2>
            <div className="space-y-3">
              {auditLogs.length === 0 ? (
                <p className="text-xs text-textdim italic bg-ink p-4 rounded-xl border border-white/5">Aucun historique de réinitialisation enregistré.</p>
              ) : (
                auditLogs.map(log => (
                  <div key={log.id} className="p-3 bg-ink rounded-xl border border-white/5">
                    <div className="flex justify-between items-start mb-1">
                      <span className="text-[10px] font-bold text-accent uppercase tracking-widest">{log.actionType}</span>
                      <span className="text-[10px] text-textdim">{new Date(log.date).toLocaleDateString()}</span>
                    </div>
                    <p className="text-xs text-white">{log.details}</p>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Integrity Check Center */}
          <div className="pro-card p-6">
            <h2 className="pro-heading mb-6">Integrity Check Center</h2>
            <p className="text-xs text-textdim mb-4">Vérifie la cohérence des données internes (Diagnostic uniquement).</p>
            <button onClick={runDiagnostics} className="btn-secondary w-full text-xs">
              Lancer le diagnostic
            </button>
          </div>
          
        </div>
      </div>
    </div>
  );
}
