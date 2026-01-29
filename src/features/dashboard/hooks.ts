import { useEffect, useState } from "react";
import { fetchDashboardAlerts, fetchDashboardSummary } from "./service";
import type { DashboardAlertsResponseDTO, DashboardSummaryDTO, SeverityLevel } from "./types";
import type { MockFilters } from "./mock";

export function useDashboardSummary() {
  const [data, setData] = useState<DashboardSummaryDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError(null);

    fetchDashboardSummary()
      .then((d) => alive && setData(d))
      .catch((e: unknown) => alive && setError(e instanceof Error ? e.message : String(e)))
      .finally(() => alive && setLoading(false));

    return () => {
      alive = false;
    };
  }, []);

  return { data, loading, error };
}

export type DashboardColumnFilters = MockFilters & Partial<{ severity: SeverityLevel | "" }>;

export function useDashboardAlerts(q: string, page: number, pageSize: number, filters?: DashboardColumnFilters) {
  const [data, setData] = useState<DashboardAlertsResponseDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError(null);

    fetchDashboardAlerts({ q, page, pageSize, filters })
      .then((d) => alive && setData(d))
      .catch((e: unknown) => alive && setError(e instanceof Error ? e.message : String(e)))
      .finally(() => alive && setLoading(false));

    return () => {
      alive = false;
    };
  }, [q, page, pageSize, JSON.stringify(filters ?? {})]);

  return { data, loading, error };
}
