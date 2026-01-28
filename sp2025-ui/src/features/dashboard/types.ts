export type SeverityLevel = "CRITICAL" | "HIGH" | "MED" | "LOW";

export type DashboardSummaryDTO = {
  severity_counts: Record<SeverityLevel, number>;
  top_keywords: Array<{ keyword: string; count: number }>;
};

export type DashboardAlertRowDTO = {
  id: string;
  topic_name: string;
  keyword: string;
  ai_tags: string[];
  alert_type: string;
  post_at: string;
  date: string;
  status: string;

  // ===== Optional detail fields (รองรับ backend ในอนาคต) =====
  severity?: SeverityLevel;
  final_score?: number;
  fetched_at?: string;
  full_url?: string;
  content?: string;
  crawler_id?: string;
};

export type DashboardAlertsResponseDTO = {
  total: number;
  page: number;
  page_size: number;
  items: DashboardAlertRowDTO[];
};
