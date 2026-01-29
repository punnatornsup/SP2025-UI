// src/features/ruleManager/mock.ts
import type { ActiveKeywordRuleDTO, SensitivityDTO } from "./types";

export const mockActiveKeywordRules: ActiveKeywordRuleDTO[] = [
  {
    id: "rule-9a12-1700000000000",
    title: "paetongtarn shinawatra",
    description: "Matches the Prime Minister's name in leaked documents",
    created_at: "2026-01-20T10:00:00.000Z",
    status: "ACTIVE",
    dpc: 1,
    ei: 0.75,
    cb: 3,
    final_severity: (1 * 0.75) + 3,
    severity_level: "HIGH",
  },
  {
    id: "rule-bb10-1700000000001",
    title: "credit card cvv",
    description: "Actionable payment credential details (fraud enabling).",
    created_at: "2026-01-22T03:12:00.000Z",
    status: "ACTIVE",
    dpc: 4,
    ei: 1.0,
    cb: 1,
    final_severity: (4 * 1.0) + 1,
    severity_level: "CRITICAL",
  },
];

export const mockSensitivity: SensitivityDTO = {
  gamma: 0.5,
  updated_at: "2026-01-28T02:30:00.000Z",
};
