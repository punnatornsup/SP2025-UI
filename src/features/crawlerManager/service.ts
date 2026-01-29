// src/features/crawlerManager/service.ts
import { api } from "@/lib/api";
import { mockCrawlerProfiles, mockScheduleJobs, mockJobHistory, mockWorkersStatus } from "./mock";
import type { CrawlerProfileDTO, ScheduleJobDTO, JobHistoryDTO, WorkerStatusDTO } from "./types";

const USE_MOCK = true;

export async function fetchCrawlerProfiles(): Promise<CrawlerProfileDTO[]> {
  if (USE_MOCK) return mockCrawlerProfiles;
  return api<CrawlerProfileDTO[]>("/crawler/profiles");
}

export async function fetchScheduleJobs(): Promise<ScheduleJobDTO[]> {
  if (USE_MOCK) return mockScheduleJobs;
  return api<ScheduleJobDTO[]>("/crawler/schedules");
}

export async function fetchJobHistory(): Promise<JobHistoryDTO[]> {
  if (USE_MOCK) return mockJobHistory;
  return api<JobHistoryDTO[]>("/crawler/jobs/history");
}

export async function fetchWorkersStatus(): Promise<WorkerStatusDTO[]> {
  if (USE_MOCK) return mockWorkersStatus;
  return api<WorkerStatusDTO[]>("/crawler/workers/status");
}

// (อนาคต) create/update payload จะต้องส่ง schedule_mode + interval/crontab/clocked ให้ตรง backend
export async function createCrawlerProfile(_: Omit<CrawlerProfileDTO, "id">): Promise<CrawlerProfileDTO> {
  return api<CrawlerProfileDTO>("/crawler/profiles", { method: "POST" });
}

export async function updateCrawlerProfile(_: CrawlerProfileDTO): Promise<CrawlerProfileDTO> {
  return api<CrawlerProfileDTO>("/crawler/profiles", { method: "PUT" });
}

export async function createScheduleJob(_: Omit<ScheduleJobDTO, "id" | "total_run" | "last_run">): Promise<ScheduleJobDTO> {
  return api<ScheduleJobDTO>("/crawler/schedules", { method: "POST" });
}

export async function updateScheduleJob(_: ScheduleJobDTO): Promise<ScheduleJobDTO> {
  return api<ScheduleJobDTO>("/crawler/schedules", { method: "PUT" });
}

export async function cancelJob(_: { job_id: string }): Promise<void> {
  await api<void>("/crawler/jobs/cancel", { method: "POST" });
}
