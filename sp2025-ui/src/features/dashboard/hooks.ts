import { useEffect, useState } from "react";
import { fetchDashboardAlerts, fetchDashboardSummary } from "./service";
import type { DashboardAlertsResponseDTO, DashboardSummaryDTO } from "./types";

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
      .catch((e: unknown) =>
        alive && setError(e instanceof Error ? e.message : String(e))
      )
      .finally(() => alive && setLoading(false));

    return () => {
      alive = false;
    };
  }, []);

  return { data, loading, error };
}

export function useDashboardAlerts(q: string, page: number, pageSize: number) {
  const [data, setData] = useState<DashboardAlertsResponseDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError(null);

    fetchDashboardAlerts({ q, page, pageSize })
      .then((d) => alive && setData(d))
      .catch((e: unknown) =>
        alive && setError(e instanceof Error ? e.message : String(e))
      )
      .finally(() => alive && setLoading(false));

    return () => {
      alive = false;
    };
  }, [q, page, pageSize]);

  return { data, loading, error };
}
