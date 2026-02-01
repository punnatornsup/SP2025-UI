// src/features/ruleManager/service.ts
import { api } from "@/lib/api";
import { mockActiveKeywordRules, mockSensitivity } from "./mock";
import type { ActiveKeywordRuleDTO, RuleInputDTO, SensitivityDTO, SeverityLevel } from "./types";

// Toggle mock mode here (or wire to env in your project)
const USE_MOCK = true;

function clamp01(x: number) {
  const n = Number(x);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(1, n));
}

function clampInt(x: number, lo: number, hi: number) {
  const n = Math.floor(Number(x));
  if (!Number.isFinite(n)) return lo;
  return Math.max(lo, Math.min(hi, n));
}

/** Final Severity = (DPC × EI) + CB */
function calcFinalSeverity(dpc: number, ei: number, cb: number) {
  return Number(dpc * ei + cb);
}

/** Deterministic mapping (tune later if needed) */
function mapSeverityLevel(score: number): SeverityLevel {
  if (score < 2.0) return "LOW";
  if (score < 4.0) return "MED";
  if (score < 6.0) return "HIGH";
  return "CRITICAL";
}

function normalizePayload(payload: RuleInputDTO): RuleInputDTO {
  return {
    title: (payload.title ?? "").trim(),
    description: (payload.description ?? "").trim(),
    dpc: clampInt(payload.dpc, 1, 4),
    ei: clamp01(payload.ei),
    cb: clampInt(payload.cb, 0, 4),
  };
}

export async function fetchActiveKeywordRules(): Promise<ActiveKeywordRuleDTO[]> {
  if (USE_MOCK) return mockActiveKeywordRules;
  return api<ActiveKeywordRuleDTO[]>("/rules/active-keywords");
}

export async function fetchSensitivity(): Promise<SensitivityDTO> {
  if (USE_MOCK) return mockSensitivity;
  return api<SensitivityDTO>("/rules/sensitivity");
}

/**
 * ✅ Client sends ONLY 5 fields
 * title, description, dpc, ei, cb
 */
export async function createRule(payload: RuleInputDTO): Promise<ActiveKeywordRuleDTO> {
  const p = normalizePayload(payload);

  if (USE_MOCK) {
    const now = new Date().toISOString();
    const score = Number(calcFinalSeverity(p.dpc, p.ei, p.cb).toFixed(2));
    const level = mapSeverityLevel(score);
    const row: ActiveKeywordRuleDTO = {
      id: `rule-${Math.random().toString(16).slice(2, 6)}-${Date.now()}`,
      created_at: now,
      status: "ACTIVE",
      ...p,
      final_severity: score,
      severity_level: level,
    };
    mockActiveKeywordRules.push(row);
    return row;
  }

  return api<ActiveKeywordRuleDTO>("/rules/active-keywords", {
    method: "POST",
    body: JSON.stringify(p),
    headers: { "Content-Type": "application/json" },
  });
}

/**
 * ✅ Update: also 5 fields (id in path)
 */
export async function updateRule(args: { id: string; payload: RuleInputDTO }): Promise<ActiveKeywordRuleDTO> {
  const p = normalizePayload(args.payload);

  if (USE_MOCK) {
    const idx = mockActiveKeywordRules.findIndex((x) => x.id === args.id);
    const base = idx >= 0 ? mockActiveKeywordRules[idx] : null;
    const score = Number(calcFinalSeverity(p.dpc, p.ei, p.cb).toFixed(2));
    const level = mapSeverityLevel(score);
    const row: ActiveKeywordRuleDTO = {
      id: args.id,
      created_at: base?.created_at ?? new Date().toISOString(),
      status: base?.status ?? "ACTIVE",
      ...p,
      final_severity: score,
      severity_level: level,
    };
    if (idx >= 0) mockActiveKeywordRules[idx] = row;
    else mockActiveKeywordRules.push(row);
    return row;
  }

  return api<ActiveKeywordRuleDTO>(`/rules/active-keywords/${encodeURIComponent(args.id)}`, {
    method: "PUT",
    body: JSON.stringify(p),
    headers: { "Content-Type": "application/json" },
  });
}

export async function updateGamma(args: { gamma: number }): Promise<SensitivityDTO> {
  const g = clamp01(args.gamma);
  if (USE_MOCK) {
    const now = new Date().toISOString();
    // update in-memory mock so UI reflects "Last saved"
    mockSensitivity.gamma = g;
    mockSensitivity.updated_at = now;
    return { gamma: g, updated_at: now };
  }

  return api<SensitivityDTO>("/rules/sensitivity", {
    method: "PUT",
    body: JSON.stringify({ gamma: g }),
    headers: { "Content-Type": "application/json" },
  });
}
