import { showToast } from "./toast";

export async function downloadFile(url: string, filename: string, contentOverride?: string) {
  const extension = filename.split(".").pop()?.toLowerCase();
  const content = contentOverride || (extension === "pdf"
    ? "Unique Carz\n\nLocal demo export. PDF generation is represented by this downloadable file in frontend-only mode."
    : `Unique Carz Local Export\nSource,${url}\nGenerated,${new Date().toISOString()}\n`);
  const type = extension === "pdf" ? "application/pdf" : "text/csv";
  const blobUrl = window.URL.createObjectURL(new Blob([content], { type }));
  const link = document.createElement("a");
  link.href = blobUrl;
  link.download = filename;
  link.target = "_self";
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(blobUrl);
  showToast({
    type: "success",
    title: "Download ready",
    message: `${downloadLabel(extension)} exported successfully.`
  });
}

function downloadLabel(extension?: string) {
  if (extension === "pdf") return "PDF";
  if (extension === "xlsx" || extension === "xls" || extension === "csv") return "Excel";
  return "File";
}
