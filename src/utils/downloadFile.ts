import { showToast } from "./toast";

export async function downloadFile(url: string, filename: string, contentOverride?: string) {
  const requestedExt = filename.split(".").pop()?.toLowerCase();

  // If caller asked for xlsx/xls but provided CSV/text content (or no real XLSX binary support),
  // fall back to exporting a CSV file to avoid Excel "file format or extension is not valid" errors.
  const isSpreadsheetRequest = requestedExt === "xlsx" || requestedExt === "xls";

  const csvFallback = `Unique Carz Local Export\nSource,${url}\nGenerated,${new Date().toISOString()}\n`;
  const content = contentOverride ?? (isSpreadsheetRequest ? csvFallback : (requestedExt === "pdf"
    ? "Unique Carz\n\nLocal demo export. PDF generation is represented by this downloadable file in frontend-only mode."
    : csvFallback));

  // Determine final extension and MIME type. If original request was XLS/XLSX but content is plain text,
  // switch to CSV extension and MIME type so Excel can open it without errors.
  const looksLikeText = typeof content === "string";
  let finalExt = requestedExt;
  if (isSpreadsheetRequest && looksLikeText) {
    finalExt = "csv";
  }

  const type = finalExt === "pdf" ? "application/pdf" : "text/csv";
  const finalFilename = filename.replace(/\.(xlsx|xls)$/i, `.${finalExt}`);

  // If user requested XLSX and we have textual CSV content, try to produce a real XLSX file
  if ((requestedExt === "xlsx" || requestedExt === "xls") && looksLikeText) {
    try {
      const XLSX = (await import('xlsx')) as any;
      // Convert CSV text into an array-of-arrays (AOA) then to a sheet to avoid missing TS defs like csv_to_sheet
      const csv = String(content);
      const rows = csv
        .split(/\r?\n/)
        .filter((line: string) => line.length > 0)
        .map((line: string) => line.split(',').map(cell => cell.trim()));
      const sheet = XLSX.utils.aoa_to_sheet(rows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, sheet, 'Sheet1');
      const data = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = finalFilename;
      link.target = '_self';
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(blobUrl);
      showToast({ type: 'success', title: 'Download ready', message: `${downloadLabel('xlsx')} exported successfully.` });
      return;
    } catch (err) {
      showToast({
        type: 'error',
        title: 'XLSX export unavailable',
        message: 'Install the `xlsx` package to enable .xlsx exports; falling back to CSV.'
      });
      // fall through to CSV fallback
    }
  }

  const blobUrl = window.URL.createObjectURL(new Blob([content], { type }));
  const link = document.createElement("a");
  link.href = blobUrl;
  link.download = finalFilename;
  link.target = "_self";
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(blobUrl);
  showToast({
    type: "success",
    title: "Download ready",
    message: `${downloadLabel(finalExt)} exported successfully.`
  });
}

function downloadLabel(extension?: string) {
  if (extension === "pdf") return "PDF";
  if (extension === "xlsx" || extension === "xls" || extension === "csv") return "Excel";
  return "File";
}
