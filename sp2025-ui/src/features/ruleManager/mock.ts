import type { ActiveKeywordRuleDTO, SensitivityDTO } from "./types";

export const mockActiveKeywordRules: ActiveKeywordRuleDTO[] = [
  {
    id: "rule-001",
    title: "Thailand PII keyword pack",
    created_at: "2026-01-20T10:10:00Z",
    status: "ACTIVE",
    doc_score: 0.78,
    ci_score: 0.62,
    cb_score: 0.55,
    severity_level: "HIGH",
  },
  {
    id: "rule-002",
    title: "Banking credential patterns",
    created_at: "2026-01-18T06:40:00Z",
    status: "ACTIVE",
    doc_score: 0.86,
    ci_score: 0.80,
    cb_score: 0.72,
    severity_level: "CRITICAL",
  },
  {
    id: "rule-003",
    title: "Low-risk chatter",
    created_at: "2026-01-12T12:00:00Z",
    status: "INACTIVE",
    doc_score: 0.30,
    ci_score: 0.25,
    cb_score: 0.18,
    severity_level: "LOW",
  },
];

export const mockSensitivity: SensitivityDTO = {
  gamma: 0.35,
  updated_at: "2026-01-28T09:00:00Z",
};
