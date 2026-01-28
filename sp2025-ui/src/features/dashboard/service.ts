import { api } from "@/lib/api";
import { mockAlerts, mockSummary } from "./mock";
import type { DashboardAlertsResponseDTO, DashboardSummaryDTO } from "./types";

// สวิตช์: ตอนนี้ยังไม่มี backend -> ใช้ mock
const USE_MOCK = true;

export async function fetchDashboardSummary(): Promise<DashboardSummaryDTO> {
  if (USE_MOCK) return mockSummary;
  return api<DashboardSummaryDTO>("/dashboard/summary");
}

export async function fetchDashboardAlerts(params: {
  q: string;
  page: number;
  pageSize: number;
}): Promise<DashboardAlertsResponseDTO> {
  if (USE_MOCK) return mockAlerts(params.q, params.page, params.pageSize);

  const usp = new URLSearchParams();
  if (params.q) usp.set("q", params.q);
  usp.set("page", String(params.page));
  usp.set("page_size", String(params.pageSize));

  return api<DashboardAlertsResponseDTO>(`/dashboard/alerts?${usp.toString()}`);
}
