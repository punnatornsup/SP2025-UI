// src/features/ruleManager/service.ts
import { api } from "@/lib/api";
import { mockActiveKeywordRules, mockSensitivity } from "./mock";
import type { ActiveKeywordRuleDTO, RuleInputDTO, SensitivityDTO } from "./types";

const USE_MOCK = true;

export async function fetchActiveKeywordRules(): Promise<ActiveKeywordRuleDTO[]> {
  if (USE_MOCK) return mockActiveKeywordRules;
  return api<ActiveKeywordRuleDTO[]>("/rules/active-keywords");
}

export async function fetchSensitivity(): Promise<SensitivityDTO> {
  if (USE_MOCK) return mockSensitivity;
  return api<SensitivityDTO>("/rules/sensitivity");
}

// ✅ Client sends ONLY 5 fields
export async function createRule(_: RuleInputDTO) {
  return api<ActiveKeywordRuleDTO>("/rules/active-keywords", { method: "POST" });
}

// ✅ Update: also 5 fields (id from path in backend design; for now keep simple)
export async function updateRule(_: { id: string; payload: RuleInputDTO }) {
  return api<ActiveKeywordRuleDTO>("/rules/active-keywords", { method: "PUT" });
}

export async function updateGamma(_: { gamma: number }) {
  return api<SensitivityDTO>("/rules/sensitivity", { method: "PUT" });
}
