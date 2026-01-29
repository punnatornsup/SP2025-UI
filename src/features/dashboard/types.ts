export type SeverityLevel = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" | "INFO";

export type DashboardSummaryDTO = {
  severity_counts: Record<SeverityLevel, number>;
  top_keywords: Array<{ keyword: string; count: number }>;
};

export type DashboardAlertRowDTO = {
  id: string;
  topic_name: string;

  // Keyword can be N/A => allow empty string
  keyword: string;

  ai_tags: string[];
  alert_type: string;
  post_at: string;
  date: string;
  status: string;

  severity?: SeverityLevel;

  // optional detail
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
