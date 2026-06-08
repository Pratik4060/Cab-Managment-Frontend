import { apiRequest, unwrapData } from "./client";

export type ReportFilter = {
  period?: "day" | "week" | "month" | "year";
  search?: string;
  status?: string;
};

export const reportApi = {
  async getSummary() {
    return unwrapData<any>(await apiRequest({ url: "/reports/summary", method: "GET" }));
  },

  async getReportByType(type: string, params: ReportFilter = {}) {
    return unwrapData<any>(await apiRequest({ url: `/reports/${type}`, method: "GET", params }));
  },

  async exportReport(type: string, format: "xlsx" | "pdf", params: ReportFilter = {}) {
    const response = await apiRequest<Blob>({
      url: `/reports/${type}/export.${format}`,
      method: "GET",
      params,
      responseType: "blob"
    });
    return response;
  }
};
