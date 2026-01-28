import { api } from "@/lib/api";
import { mockActiveKeywordRules, mockSensitivity } from "./mock";
import type { ActiveKeywordRuleDTO, SensitivityDTO } from "./types";

const USE_MOCK = true;

// ===== GET =====
export async function fetchActiveKeywordRules(): Promise<ActiveKeywordRuleDTO[]> {
  if (USE_MOCK) return mockActiveKeywordRules;
  return api<ActiveKeywordRuleDTO[]>("/rules/active-keywords");
}

export async function fetchSensitivity(): Promise<SensitivityDTO> {
  if (USE_MOCK) return mockSensitivity;
  return api<SensitivityDTO>("/rules/sensitivity");
}

// ===== POST/PUT (รองรับอนาคต) =====
export async function createRule(_: Omit<ActiveKeywordRuleDTO, "id" | "created_at">): Promise<ActiveKeywordRuleDTO> {
  return api<ActiveKeywordRuleDTO>("/rules/active-keywords", { method: "POST" });
}

export async function updateRule(_: ActiveKeywordRuleDTO): Promise<ActiveKeywordRuleDTO> {
  return api<ActiveKeywordRuleDTO>("/rules/active-keywords", { method: "PUT" });
}

export async function updateGamma(_: { gamma: number }): Promise<SensitivityDTO> {
  return api<SensitivityDTO>("/rules/sensitivity", { method: "PUT" });
}
