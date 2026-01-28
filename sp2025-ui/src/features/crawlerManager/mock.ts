import type { CrawlerProfileDTO, ScheduleJobDTO, JobHistoryDTO, WorkerStatusDTO } from "./types";

export const mockCrawlerProfiles: CrawlerProfileDTO[] = [
  {
    id: "d9a2c0c1-52d7-4b7a-9c2b-1bd0b6bfe111",
    name: "LeakBase Crawler",
    allow_domains: ["leakbase.to", "leakbase.cc"],
    alert_to: "TB-CERT Slack #alerts",
    bypass_ddos: true,
    session_cookie: true,
  },
  {
    id: "b2e3c1a7-3c7b-4b51-a6c2-11a5b7f0a222",
    name: "BreachForums Crawler",
    allow_domains: ["breachforums.is"],
    alert_to: "email: cert@org.com",
    bypass_ddos: false,
    session_cookie: true,
  },
];

export const mockScheduleJobs: ScheduleJobDTO[] = [
  {
    id: "sch-001",
    name: "Daily crawl leakbase",
    crawler_id: mockCrawlerProfiles[0].id,
    total_run: 128,
    last_run: "2026-01-28T09:20:00Z",
    schedule_type: "CRON",
  },
  {
    id: "sch-002",
    name: "Every 6 hours breachforums",
    crawler_id: mockCrawlerProfiles[1].id,
    total_run: 56,
    last_run: "2026-01-28T08:00:00Z",
    schedule_type: "INTERVAL",
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
    worker: "worker_crawl_detail_of_post_page@MUICTxTBCERT_0faf2d847053",
    status: "Online",
    active: 0,
    processed: 442,
    failed: 0,
    succeeded: 442,
    retried: 0,
    load_average: [0.92, 0.67, 0.4],
  },
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
  {
    worker: "model_valid_url_identifier@MUICTxTBCERT_ce97b06353e2",
    status: "Online",
    active: 0,
    processed: 0,
    failed: 0,
    succeeded: 0,
    retried: 0,
    load_average: [0.86, 0.66, 0.4],
  },
  {
    worker: "model_final_score_calculator@MUICTxTBCERT_ce97b06353e2",
    status: "Online",
    active: 0,
    processed: 276,
    failed: 4,
    succeeded: 272,
    retried: 0,
    load_average: [0.84, 0.66, 0.4],
  },
  {
    worker: "worker_start_crawl_list_of_categories@MUICTxTBCERT_0faf2d847053",
    status: "Online",
    active: 0,
    processed: 0,
    failed: 0,
    succeeded: 0,
    retried: 0,
    load_average: [0.86, 0.66, 0.4],
  },
  {
    worker: "worker_crawl_detail_of_post_page_ddos_bypass@MUICTxTBCERT_0faf2d847053",
    status: "Online",
    active: 0,
    processed: 0,
    failed: 0,
    succeeded: 0,
    retried: 0,
    load_average: [0.86, 0.66, 0.4],
  },
];
