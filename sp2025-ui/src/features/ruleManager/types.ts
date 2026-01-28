export type RuleStatus = "ACTIVE" | "INACTIVE";

export type SeverityLevel = "LOW" | "MED" | "HIGH" | "CRITICAL";

export type ActiveKeywordRuleDTO = {
  id: string;
  title: string;
  created_at: string;        // ISO string
  status: RuleStatus;
  doc_score: number;         // 0..1
  ci_score: number;          // 0..1
  cb_score: number;          // 0..1
  severity_level: SeverityLevel;
};

export type SensitivityDTO = {
  gamma: number;             // 0..1
  updated_at: string;        // ISO
};
