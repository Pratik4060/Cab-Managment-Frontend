import { apiRequest } from "./client";

export type DashboardFilter = "day" | "week" | "month" | "year";

export const dashboardApi = {
  getDashboard(filter: DashboardFilter = "month", recentLimit = 5) {
    return apiRequest<any>({
      url: "/dashboard",
      method: "GET",
      params: { filter, recentLimit }
    });
  }
};
