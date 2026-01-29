import { api } from "@/lib/api";
import { mockAlerts, mockSummary } from "./mock";
import type { DashboardAlertsResponseDTO, DashboardSummaryDTO, SeverityLevel } from "./types";
import type { MockFilters } from "./mock";

const USE_MOCK = true;

export async function fetchDashboardSummary(): Promise<DashboardSummaryDTO> {
  if (USE_MOCK) return mockSummary;
  return api<DashboardSummaryDTO>("/dashboard/summary");
}

export async function fetchDashboardAlerts(params: {
  q: string;
  page: number;
  pageSize: number;
  filters?: MockFilters & Partial<{ severity: SeverityLevel | "" }>;
}): Promise<DashboardAlertsResponseDTO> {
  if (USE_MOCK) return mockAlerts(params.q, params.page, params.pageSize, params.filters);

  const usp = new URLSearchParams();
  if (params.q) usp.set("q", params.q);
  usp.set("page", String(params.page));
  usp.set("page_size", String(params.pageSize));

  // forward only the 4 filter columns (+ mode keys)
  if (params.filters) {
    for (const [k, v] of Object.entries(params.filters)) {
      if (v == null) continue;
      const s = String(v).trim();
      if (!s) continue;
      usp.set(k, s);
    }
  }

  return api<DashboardAlertsResponseDTO>(`/dashboard/alerts?${usp.toString()}`);
}
