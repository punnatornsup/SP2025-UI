// ... imports เดิม
import type { DashboardAlertsResponseDTO, DashboardSummaryDTO, SeverityLevel } from "./types";

export const mockSummary: DashboardSummaryDTO = {
  severity_counts: { CRITICAL: 30, HIGH: 12, MEDIUM: 501, LOW: 2912, INFO: 27 },
  top_keywords: [
    { keyword: "Thailand", count: 178 },
    { keyword: "co.th", count: 45 },
    { keyword: "go.th", count: 12 },
    { keyword: "bangchak.co.th", count: 7 },
    { keyword: "N/A", count: 27 },
  ],
};

function pickSeverity(i: number): SeverityLevel {
  if (i % 11 === 0) return "INFO";
  if (i % 17 === 0) return "CRITICAL";
  if (i % 7 === 0) return "HIGH";
  if (i % 3 === 0) return "MEDIUM";
  return "LOW";
}

export type MockFilters = Partial<{
  keyword_mode: "" | "NA" | "HAS";
  keyword: string;
  ai_tags_mode: "" | "NA" | "HAS";
  ai_tags: string;
  status: "" | "reviewed" | "unreviewed";
  severity: SeverityLevel | "";
}>;

export function mockAlerts(q: string, page: number, pageSize: number, filters?: MockFilters): DashboardAlertsResponseDTO {
  const all = Array.from({ length: 141 }).map((_, i) => {
    const idx = i + 1;
    const sev = pickSeverity(idx);

    // ✅ Multi-tag more frequently:
    // - every 4th row: 2 tags
    // - every 10th row: 3 tags
    // - every 11th row: N/A (empty)
    let aiTags: string[] = [];

    if (idx % 11 === 0) {
      aiTags = []; // N/A
    } else if (idx % 10 === 0) {
      aiTags = ["Credit Card Number", "THAI-DATA", "FINANCIAL-SECTOR"];
    } else if (idx % 4 === 0) {
      aiTags = ["Credit Card Number", "THAI-DATA"];
    } else if (idx % 2 === 0) {
      aiTags = ["Credit Card Number"];
    } else {
      aiTags = ["Abusive Language"];
    }

    // Keyword: empty some rows => N/A
    const keyword = idx % 9 === 0 ? "" : idx % 3 === 0 ? "Thailand" : "co.th";

    return {
      id: `row-${idx}`,
      topic_name: `CreditCard free distribut ${idx}`,
      keyword,
      ai_tags: aiTags,
      alert_type: i % 4 === 0 ? "Leak" : "Mention",
      post_at: "2025-07-07T06:00:00Z",
      date: "2025-07-07",
      status: i % 5 === 0 ? "reviewed" : "unreviewed",
      severity: sev,
    };
  });

  const norm = (s: unknown) => String(s ?? "").trim().toLowerCase();
  const query = norm(q);

  let filtered = !query
    ? all
    : all.filter((r) =>
        [
          r.topic_name,
          r.keyword || "N/A",
          r.alert_type,
          r.status,
          r.post_at,
          r.date,
          r.severity ?? "",
          ...(r.ai_tags?.length ? r.ai_tags : ["N/A"]),
        ]
          .join(" ")
          .toLowerCase()
          .includes(query)
      );

  // Apply filters: Keyword (NA/HAS), AI Tags (NA/HAS), Status, Severity
  if (filters) {
    const km = filters.keyword_mode ?? "";
    const am = filters.ai_tags_mode ?? "";
    const ktxt = norm(filters.keyword);
    const atxt = norm(filters.ai_tags);
    const st = norm(filters.status);
    const sv = norm(filters.severity);

    filtered = filtered.filter((r) => {
      const keywordNA = norm(r.keyword) === "";
      const tagsNA = (r.ai_tags?.length ?? 0) === 0;

      if (km === "NA" && !keywordNA) return false;
      if (km === "HAS") {
        if (keywordNA) return false;
        if (ktxt && !norm(r.keyword).includes(ktxt)) return false;
      }

      if (am === "NA" && !tagsNA) return false;
      if (am === "HAS") {
        if (tagsNA) return false;
        const joined = (r.ai_tags ?? []).map((t) => norm(t)).join(",");
        if (atxt && !joined.includes(atxt)) return false;
      }

      if (st && norm(r.status) !== st) return false;
      if (sv && norm(r.severity) !== sv) return false;

      return true;
    });
  }

  const total = filtered.length;
  const start = (page - 1) * pageSize;
  const items = filtered.slice(start, start + pageSize);
  return { total, page, page_size: pageSize, items };
}
