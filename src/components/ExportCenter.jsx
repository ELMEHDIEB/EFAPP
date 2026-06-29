import { useToast } from "./ui/ToastContext.jsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import html2canvas from "html2canvas";

export default function ExportCenter({ reportTable }) {
  const showToast = useToast();

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

  const handlePrintPDF = async () => {
    try {
      if (!reportTable || reportTable.length === 0) {
        showToast("Aucune donnée à exporter.", "warning");
        return;
      }

      showToast("Génération du PDF en cours...", "info");

      const doc = new jsPDF();

      // En-tête officiel
      doc.setFontSize(22);
      doc.setTextColor(20, 20, 20);
      doc.text("eFootball Coin Manager Pro", 14, 20);

      doc.setFontSize(14);
      doc.setTextColor(100, 100, 100);
      doc.text("Bilan Comptable Officiel", 14, 28);

      doc.setFontSize(10);
      doc.text(`Date d'édition : ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}`, 14, 34);

      // Tampon Officiel "EL MEHDI MTM" Top Right
      doc.setTextColor(200, 50, 50);
      doc.setFont("helvetica", "bold");
      doc.text("Approuvé par: EL MEHDI MTM", 130, 25);

      // Séparateur
      doc.setDrawColor(200, 200, 200);
      doc.line(14, 38, 196, 38);

      let currentY = 45;

      // Capture des graphiques
      try {
        const chartsEl = document.getElementById('analytics-charts-export');
        if (chartsEl) {
          const canvas = await html2canvas(chartsEl, {
            scale: 2,
            backgroundColor: '#0a0a0a'
          });

          if (canvas.width > 0 && canvas.height > 0) {
            const imgData = canvas.toDataURL('image/png');
            const imgWidth = 182;
            const imgHeight = (canvas.height * imgWidth) / canvas.width;

            doc.addImage(imgData, 'PNG', 14, currentY, imgWidth, imgHeight);
            currentY += imgHeight + 10;
          }
        }
      } catch (captureError) {
        console.warn("Impossible de capturer les graphiques:", captureError);
        // On continue la génération sans les graphiques
      }

      if (currentY > 250) {
        doc.addPage();
        currentY = 20;
      }

      const tableColumn = ["#", "Compte", "Ancien Solde", "Actuel", "Variation", "Progression", "Statut"];
      const tableRows = [];

      reportTable.forEach(row => {
        const variationStr = row.variation === 0 ? "-" : `${row.variation > 0 ? "+" : ""}${row.variation} (${row.variation > 0 ? "+" : ""}${row.variationPct}%)`;
        const rowData = [
          row.rank,
          row.name,
          row.previousCoins.toString(),
          row.currentCoins.toString(),
          variationStr,
          `${row.goalPct}%`,
          row.status
        ];
        tableRows.push(rowData);
      });

      autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: currentY,
        theme: 'grid',
        styles: { fontSize: 10, cellPadding: 3 },
        headStyles: { fillColor: [59, 130, 246], textColor: 255, fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [245, 245, 245] },
        columnStyles: {
          0: { cellWidth: 15 },
          3: { fontStyle: 'bold' },
        },
        didDrawPage: function (data) {
          // Footer
          const str = 'Page ' + doc.internal.getNumberOfPages();
          doc.setFontSize(8);
          doc.setTextColor(150);
          doc.setFont("helvetica", "normal");
          doc.text(
            str,
            data.settings.margin.left,
            doc.internal.pageSize.height - 10
          );

          doc.setFont("helvetica", "bold");
          doc.setTextColor(200, 50, 50);
          doc.text(
            "TAMPON OFFICIEL: EL MEHDI MTM",
            doc.internal.pageSize.width / 2,
            doc.internal.pageSize.height - 10,
            { align: 'center' }
          );
        }
      });

      doc.save(`EFAPP_Bilan_Officiel_${new Date().toISOString().split('T')[0]}.pdf`);
      showToast("Bilan PDF généré avec succès.", "success");
    } catch (error) {
      console.error("PDF Generation Error:", error);
      showToast(`Erreur PDF: ${error.message || 'Erreur inconnue'}`, "error");
    }
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
