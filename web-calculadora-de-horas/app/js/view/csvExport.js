export class CsvExportService {
  static exportHistoryToCSV(conversions, languageCtrl) {
    if (!conversions || conversions.length === 0) {
      return "";
    }

    // Cabeçalho CSV traduzido
    const headers = [
      "Data",
      languageCtrl.getTranslation("main.horas"),
      languageCtrl.getTranslation("main.minutos"),
      languageCtrl.getTranslation("main.segundos"),
      languageCtrl.getTranslation("main.semanas"),
      languageCtrl.getTranslation("main.meses"),
      languageCtrl.getTranslation("main.anos"),
    ];

    let csv = headers.join(",") + "\n";

    conversions.forEach((conv) => {
      const data = new Date(conv.createdAt).toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });

      csv += `"${data}",${conv.horas},${conv.minutos},${conv.segundos},${conv.semanas},${conv.meses},${conv.anos}\n`;
    });

    return csv;
  }

  static downloadCSV(csvContent, fileName = "conversor-historico") {
    const dataNow = new Date().toISOString().split("T")[0];
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);

    link.setAttribute("href", url);
    link.setAttribute("download", `${fileName}-${dataNow}.csv`);
    link.style.visibility = "hidden";

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}

export default CsvExportService;
