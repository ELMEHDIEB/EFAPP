import { useToast } from "./ui/ToastContext.jsx";

export default function ExportCenter({ reportTable }) {
  const { showToast } = useToast();

  const handleExportCSV = () => {
    try {
      if (!reportTable || reportTable.length === 0) {
        showToast("Aucune donnée à exporter.", "warning");
        return;
      }

      const headers = [
        "Rank", "Account", "Current Coins", "Previous Coins", 
        "Variation", "Variation %", "Goal Progress %", "Next Goal", "Remaining Coins", "Status"
      ];

      const csvContent = [
        headers.join(","),
        ...reportTable.map(row => [
          row.rank,
          `"${row.name}"`,
          row.currentCoins,
          row.previousCoins,
          row.variation,
          row.variationPct,
          row.goalPct,
          row.nextGoal,
          row.remainingCoins,
          `"${row.status}"`
        ].join(","))
      ].join("\n");

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `EFAPP_Bilan_Export_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      showToast("Export CSV réussi.", "success");
    } catch (err) {
      showToast("Erreur lors de l'export CSV.", "error");
    }
  };

  const handlePrintPDF = () => {
    window.print();
  };

  return (
    <div className="flex gap-3">
      <button 
        onClick={handleExportCSV}
        className="btn-base px-4 py-2 bg-white/5 hover:bg-white/10 text-sm flex items-center gap-2 border border-white/10 rounded-lg transition-colors"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
        Export CSV
      </button>
      <button 
        onClick={handlePrintPDF}
        className="btn-base px-4 py-2 bg-accent/10 hover:bg-accent/20 text-accent text-sm flex items-center gap-2 border border-accent/20 rounded-lg transition-colors"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
        Print PDF
      </button>
    </div>
  );
}
