// src/features/crawlerManager/mock.ts
import type { CrawlerProfileDTO, ScheduleJobDTO, JobHistoryDTO, WorkerStatusDTO } from "./types";

export const mockCrawlerProfiles: CrawlerProfileDTO[] = [
  {
    id: "d9a2c0c1-52d7-4b7a-9c2b-1bd0b6bfe111",
    name: "LeakBase Crawler",
    description: "Crawl thread pages and extract posts",
    allow_domains: ["leakbase.to", "leakbase.cc"],
    start_url: "https://leakbase.to/forums",
    alert_to: "cert@org.com",
    bypass_ddos: true,
    cookies: [{ name: "session", value: "abc123" }],
  },
  {
    id: "b2e3c1a7-3c7b-4b51-a6c2-11a5b7f0a222",
    name: "BreachForums Crawler",
    description: "Monitor selected sections",
    allow_domains: ["breachforums.is"],
    start_url: "https://breachforums.is",
    alert_to: "cert@org.com",
    bypass_ddos: false,
    cookies: [],
  },
];

export const mockScheduleJobs: ScheduleJobDTO[] = [
  // INTERVAL
  {
    id: "sch-001",
    name: "crawl_every_2_mins",
    enabled: true,
    crawler_id: mockCrawlerProfiles[0].id,
    schedule_mode: "INTERVAL",
    interval: { every: 2, period: "minutes" },
    total_run: 128,
    last_run: "2026-01-28T09:20:00Z",
  },
  // CRONTAB
  {
    id: "sch-002",
    name: "daily_09_30_bkk",
    enabled: true,
    crawler_id: mockCrawlerProfiles[1].id,
    schedule_mode: "CRONTAB",
    crontab: {
      minute: "30",
      hour: "9",
      day_of_week: "*",
      day_of_month: "*",
      month_of_year: "*",
    },
    total_run: 56,
    last_run: "2026-01-28T02:30:00Z",
  },
  // CLOCKED
  {
    id: "sch-003",
    name: "run_once_release_day",
    enabled: true,
    crawler_id: mockCrawlerProfiles[0].id,
    schedule_mode: "CLOCKED",
    clocked: { clocked_time: "2025-12-15T09:30:00+07:00" },
    total_run: 0,
    last_run: "-",
  },
];

export const mockJobHistory: JobHistoryDTO[] = Array.from({ length: 24 }).map((_, i) => {
  const isLeak = i % 2 === 0;
  const start = new Date(Date.now() - (i + 1) * 3600_000).toISOString();
  const end = i % 5 === 0 ? null : new Date(Date.now() - (i + 1) * 3600_000 + 12 * 60_000).toISOString();

  const statusPool: JobHistoryDTO["status"][] = ["SUCCESS", "FAILED", "RUNNING", "CANCELED"];
  const status = statusPool[i % statusPool.length];

  return {
    job_id: `job-${String(i + 1).padStart(4, "0")}`,
    crawler_name: isLeak ? "LeakBase Crawler" : "BreachForums Crawler",
    crawler_id: isLeak ? mockCrawlerProfiles[0].id : mockCrawlerProfiles[1].id,
    start_at: start,
    end_at: end,
    status,
  };
});

export const mockWorkersStatus: WorkerStatusDTO[] = [
  {
    worker: "worker_scheduler@backend_node",
    status: "Online",
    active: 0,
    processed: 16,
    failed: 0,
    succeeded: 16,
    retried: 0,
    load_average: [0.86, 0.66, 0.4],
  },
];
