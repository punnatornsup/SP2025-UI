import type { DashboardAlertsResponseDTO, DashboardSummaryDTO, SeverityLevel } from "./types";

export const mockSummary: DashboardSummaryDTO = {
  severity_counts: { CRITICAL: 30, HIGH: 12, MED: 501, LOW: 2912 },
  top_keywords: [
    { keyword: "Thailand", count: 178 },
    { keyword: "co.th", count: 45 },
    { keyword: "go.th", count: 12 },
    { keyword: "bangchak.co.th", count: 7 },
    { keyword: "oc.th", count: 4 },
  ],
};

function pickSeverity(i: number): SeverityLevel {
  if (i % 17 === 0) return "CRITICAL";
  if (i % 7 === 0) return "HIGH";
  if (i % 3 === 0) return "MED";
  return "LOW";
}

export function mockAlerts(q: string, page: number, pageSize: number): DashboardAlertsResponseDTO {
  const all = Array.from({ length: 141 }).map((_, i) => {
    const sev = pickSeverity(i + 1);

    return {
      id: `row-${i + 1}`,
      topic_name: `CreditCard free distribut ${i + 1}`,
      keyword: i % 3 === 0 ? "Thailand" : "co.th",
      ai_tags: i % 2 === 0 ? ["Credit Card Number"] : ["Abusive Language"],
      alert_type: i % 4 === 0 ? "Leak" : "Mention",
      post_at: "2025-07-07T06:00:00Z",
      date: "2025-07-07",
      status: i % 5 === 0 ? "reviewed" : "unreviewed",

      // ===== detail fields for modal =====
      severity: sev,
      final_score: Math.round((0.55 + (i % 40) / 100) * 100) / 100, // 0.55-0.94
      fetched_at: "2025-07-07T06:10:00Z",
      full_url: `https://example.onion/thread/${i + 1}`,
      crawler_id: `crawler-${(i % 6) + 1}`,
      content:
        "Lorem ipsum dolor sit amet, consectetur adipiscing elit. " +
        "Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. " +
        "Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.\n\n" +
        "Indicators:\n- Possible credit card pattern\n- Mentioned Thailand / .co.th domains\n- Actor language: abusive/marketplace",
    };
  });

  const query = q.trim().toLowerCase();
  const filtered = !query
    ? all
    : all.filter((r) =>
        [
          r.topic_name,
          r.keyword,
          r.alert_type,
          r.status,
          r.post_at,
          r.date,
          r.severity ?? "",
          String(r.final_score ?? ""),
          r.full_url ?? "",
          r.crawler_id ?? "",
          ...(r.ai_tags ?? []),
        ]
          .join(" ")
          .toLowerCase()
          .includes(query)
      );

  const total = filtered.length;
  const start = (page - 1) * pageSize;
  const items = filtered.slice(start, start + pageSize);

  return { total, page, page_size: pageSize, items };
}
