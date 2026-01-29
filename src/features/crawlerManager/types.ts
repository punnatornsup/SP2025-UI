// src/features/crawlerManager/types.ts

export type CookieKV = { name: string; value: string };

export type CrawlerProfileDTO = {
  id: string;
  name: string;
  description: string;
  allow_domains: string[];
  start_url: string;
  alert_to: string;
  cookies?: CookieKV[];
  bypass_ddos: boolean;
};

// ---- Scheduler ----
export type ScheduleMode = "INTERVAL" | "CRONTAB" | "CLOCKED";

export type IntervalSpec = {
  every: number; // integer > 0
  period: "seconds" | "minutes" | "hours" | "days";
};

export type CrontabSpec = {
  minute: string; // 0-59 or "*"
  hour: string; // 0-23 or "*"
  day_of_week: string; // 0-6 or "*"
  day_of_month: string; // 1-31 or "*"
  month_of_year: string; // 1-12 or "*"
};

export type ClockedSpec = {
  // e.g. "2025-12-15T09:30:00+07:00"
  clocked_time: string;
};

export type ScheduleJobDTO = {
  id: string;
  name: string;
  enabled: boolean;
  crawler_id: string;

  schedule_mode: ScheduleMode;

  interval?: IntervalSpec;
  crontab?: CrontabSpec;
  clocked?: ClockedSpec;

  total_run: number;
  last_run: string;
};

// ---- Job history / workers ----
export type JobHistoryDTO = {
  job_id: string;
  crawler_name: string;
  crawler_id: string;
  start_at: string;
  end_at: string | null;
  status: "SUCCESS" | "FAILED" | "RUNNING" | "CANCELED";
};

export type WorkerStatusDTO = {
  worker: string;
  status: "Online" | "Offline";
  active: number;
  processed: number;
  failed: number;
  succeeded: number;
  retried: number;
  load_average: [number, number, number];
};
