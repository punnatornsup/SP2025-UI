// src/features/ruleManager/types.ts

export type RuleStatus = "ACTIVE" | "INACTIVE";
export type SeverityLevel = "LOW" | "MED" | "HIGH" | "CRITICAL";

/**
 * ✅ Client input = 5 fields only
 * title, description, dpc, ei, cb
 */
export type RuleInputDTO = {
  title: string;
  description: string;
  dpc: number; // 1..4 (integer)
  ei: number;  // 0..1 (recommended presets: 0.25/0.5/0.75/1.0)
  cb: number;  // 0..4 (integer)
};

/**
 * Stored/Displayed row (UI can keep extra metadata)
 */
export type ActiveKeywordRuleDTO = {
  id: string;
  created_at: string;
  status: RuleStatus;

  // ✅ 5 fields (client)
  title: string;
  description: string;
  dpc: number;
  ei: number;
  cb: number;

  // ✅ computed (system/UI)
  final_severity: number;       // (dpc*ei)+cb
  severity_level: SeverityLevel; // derived from final_severity
};

export type SensitivityDTO = {
  gamma: number; // [0,1]
  updated_at: string;
};
