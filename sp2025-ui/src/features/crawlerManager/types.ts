export type CrawlerProfileDTO = {
  id: string;                // UUID
  name: string;
  allow_domains: string[];   // list ของ domain
  alert_to: string;
  bypass_ddos: boolean;      // T/F
  session_cookie: boolean;   // T/F
};

export type ScheduleJobDTO = {
  id: string;
  name: string;
  crawler_id: string;        // UUID (ref CrawlerProfile)
  total_run: number;
  last_run: string;          // ISO string
  schedule_type: string;     // e.g. "CRON" | "INTERVAL" | "MANUAL"
};

export type JobHistoryDTO = {
  job_id: string;
  crawler_name: string;
  crawler_id: string;
  start_at: string;          // ISO
  end_at: string | null;     // ISO or null
  status: "RUNNING" | "SUCCESS" | "FAILED" | "CANCELED";
};

export type WorkerStatusDTO = {
  worker: string;
  status: "Online" | "Offline";
  active: number;
  processed: number;
  failed: number;
  succeeded: number;
  retried: number;
  load_average: [number, number, number]; // 1m, 5m, 15m
};
