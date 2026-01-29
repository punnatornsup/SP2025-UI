import { useMemo, useState } from "react";
import "./ruleManager.css";

import { useActiveKeywordRules, useSensitivity } from "@/features/ruleManager/hooks";
import type { ActiveKeywordRuleDTO, RuleInputDTO, SeverityLevel } from "@/features/ruleManager/types";

type ModalMode = "NONE" | "ADD_RULE" | "EDIT_RULE";

function genId() {
  return `rule-${Math.random().toString(16).slice(2, 6)}-${Date.now()}`;
}

function clamp01(x: number) {
  return Math.max(0, Math.min(1, x));
}

function clampInt(x: number, lo: number, hi: number) {
  const n = Math.floor(Number.isFinite(x) ? x : lo);
  return Math.max(lo, Math.min(hi, n));
}

/**
 * ✅ Formula from Req:
 * Final Severity = (DPC × EI) + CB
 */
function calcFinalSeverity(dpc: number, ei: number, cb: number) {
  return Number(((dpc * ei) + cb).toFixed(2));
}

/**
 * ✅ Map score -> label (you can tune thresholds later)
 * Keep deterministic & explainable.
 */
function mapSeverityLevel(score: number): SeverityLevel {
  if (score < 2.0) return "LOW";
  if (score < 4.0) return "MED";
  if (score < 6.0) return "HIGH";
  return "CRITICAL";
}

// ----- UX presets (makes rubric easy) -----
const EI_PRESETS: Array<{ value: number; label: string; desc: string }> = [
  { value: 0.25, label: "0.25", desc: "Hard to identify; weak linkage." },
  { value: 0.5, label: "0.50", desc: "Possible via public linkage; moderate effort." },
  { value: 0.75, label: "0.75", desc: "Reasonably identifiable with common linkage." },
  { value: 1.0, label: "1.00", desc: "Directly identifiable (explicit identifier)." },
];

const DPC_LEVELS: Array<{ value: number; title: string; examples: string[] }> = [
  {
    value: 1,
    title: "1 — Basic data (low inference)",
    examples: ["org/company name", "bank/regulator name", "full name (standalone)", "education / work history"],
  },
  {
    value: 2,
    title: "2 — Enables basic profiling",
    examples: ['("Job title" + "Company")', '("Education level" + "University")', '("Role" + "Industry")'],
  },
  {
    value: 3,
    title: "3 — Sensitive inference possible",
    examples: ['("Membership" + "Political party")', '("Attendance record" + "Religious org")', '("Patient status" + "Treatment center")'],
  },
  {
    value: 4,
    title: "4 — High harm / safety risk",
    examples: ['("Full name" + "Exact address")', '("Vulnerable person" + "Location/School")', '("Sensitive role" + "Covert location")'],
  },
];

const CB_LEVELS: Array<{ value: number; title: string; desc: string }> = [
  { value: 0, title: "0 — No aggravating context", desc: "General mention; no critical-entity context." },
  { value: 1, title: "1 — Notable org / sector context", desc: "May increase impact but limited operational risk." },
  { value: 2, title: "2 — High-impact entity context", desc: "Financial sector / large institutions / widely targeted entities." },
  { value: 3, title: "3 — Critical operator / regulator context", desc: "Regulators, critical infrastructure operators, key service providers." },
  { value: 4, title: "4 — National-level / systemic impact context", desc: "Could drive systemic disruption, national-level consequences." },
];

export default function RuleManagerPage() {
  const rules = useActiveKeywordRules();
  const sensitivity = useSensitivity();

  const rows = rules.data ?? [];
  const infoLoading = rules.loading || sensitivity.loading;
  const infoError = rules.error || sensitivity.error;

  // gamma (controlled) — not used in the ENISA formula directly (kept as system sensitivity knob)
  const gamma = sensitivity.data?.gamma ?? 0;
  const gammaLabel = useMemo(() => gamma.toFixed(2), [gamma]);

  // modal + form states
  const [modal, setModal] = useState<ModalMode>("NONE");
  const [active, setActive] = useState<ActiveKeywordRuleDTO | null>(null);

  // ✅ 5 required fields (client)
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const [dpc, setDpc] = useState<number>(1);
  const [ei, setEi] = useState<number>(0.75);
  const [cb, setCb] = useState<number>(0);

  const finalSeverity = useMemo(() => calcFinalSeverity(dpc, ei, cb), [dpc, ei, cb]);
  const severityLevel = useMemo(() => mapSeverityLevel(finalSeverity), [finalSeverity]);

  function openAdd() {
    setActive(null);
    setTitle("");
    setDescription("");
    setDpc(1);
    setEi(0.75);
    setCb(0);
    setModal("ADD_RULE");
  }

  function openEdit(r: ActiveKeywordRuleDTO) {
    setActive(r);
    setTitle(r.title);
    setDescription(r.description);
    setDpc(r.dpc);
    setEi(r.ei);
    setCb(r.cb);
    setModal("EDIT_RULE");
  }

  function buildPayload(): RuleInputDTO {
    return {
      title: (title || "").trim() || "Untitled rule",
      description: (description || "").trim() || "-",
      dpc: clampInt(dpc, 1, 4),
      ei: clamp01(Number(ei)),
      cb: clampInt(cb, 0, 4),
    };
  }

  function saveRule() {
    const payload = buildPayload();
    const score = calcFinalSeverity(payload.dpc, payload.ei, payload.cb);
    const level = mapSeverityLevel(score);

    if (modal === "ADD_RULE") {
      const newRow: ActiveKeywordRuleDTO = {
        id: genId(),
        created_at: new Date().toISOString(),
        status: "ACTIVE",

        ...payload,
        final_severity: score,
        severity_level: level,
      };
      rules.setData((prev) => ([...(prev ?? []), newRow]));
    }

    if (modal === "EDIT_RULE" && active) {
      rules.setData((prev) =>
        (prev ?? []).map((x) =>
          x.id === active.id
            ? {
                ...x,
                ...payload,
                final_severity: score,
                severity_level: level,
              }
            : x
        )
      );
    }

    setModal("NONE");
  }

  // UI-only gamma update
  function onGammaChange(next: number) {
    sensitivity.setData((prev) => ({
      gamma: clamp01(next),
      updated_at: prev?.updated_at ?? new Date().toISOString(),
    }));
  }

  return (
    <div className="rmRoot">
      <div className="rmHeader">
        <h2 className="rmTitle">Rule Manager</h2>
      </div>

      {infoLoading && <div className="infoBox">Loading…</div>}
      {infoError && <div className="errorBox">{infoError}</div>}

      {/* Active Keyword */}
      <section className="card rmCard">
        <div className="cardHeaderRow">
          <div className="cardTitle">Active Keyword</div>
          <button className="primaryBtn" onClick={openAdd}>+ Add rule</button>
        </div>

        <div className="tableWrap">
          <table className="table rmTableWide">
            <thead>
              <tr>
                <th>Title</th>
                <th>Description</th>
                <th>DPC</th>
                <th>EI</th>
                <th>CB</th>
                <th>Final Severity</th>
                <th>Severity level</th>
                <th>Create at</th>
                <th></th>
              </tr>
            </thead>

            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td className="bold">{r.title}</td>
                  <td className="muted">{r.description}</td>
                  <td className="mono">{r.dpc}</td>
                  <td className="mono">{r.ei.toFixed(2)}</td>
                  <td className="mono">{r.cb}</td>
                  <td className="mono">{r.final_severity.toFixed(2)}</td>
                  <td>
                    <span className={`pill sev_${r.severity_level}`}>{r.severity_level}</span>
                  </td>
                  <td className="mono">{r.created_at}</td>
                  <td className="tdAction">
                    <button className="ghostBtn" onClick={() => openEdit(r)}>Edit</button>
                  </td>
                </tr>
              ))}

              {!rules.loading && rows.length === 0 && (
                <tr>
                  <td colSpan={9} className="emptyCell">No data</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Sensitivity */}
      <section className="card rmCard">
        <div className="cardHeaderRow">
          <div className="cardTitle">Sensitivity</div>
          <div className="muted">Gamma: <span className="mono">{gammaLabel}</span></div>
        </div>

        <div className="gammaBox">
          <div className="gammaRow">
            <div className="gammaLabel">Gamma</div>
            <input
              className="gammaSlider"
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={gamma}
              onChange={(e) => onGammaChange(Number(e.target.value))}
            />
          </div>

          <div className="gammaScale">
            <div className="mono">0</div>
            <div className="mono">1</div>
          </div>

          <div className="hint">
            (Gamma เป็น system sensitivity knob — สูตร severity ของ rule ใช้: (DPC×EI)+CB)
          </div>
        </div>
      </section>

      {/* Modal */}
      {modal !== "NONE" && (
        <div className="modalOverlay" onMouseDown={() => setModal("NONE")}>
          <div className="modalShell modalWide" onMouseDown={(e) => e.stopPropagation()}>
            <div className="modalHeader">
              <div className="modalTitle">{modal === "ADD_RULE" ? "Add rule" : "Edit rule"}</div>
              <button className="closeBtn" onClick={() => setModal("NONE")}>✕</button>
            </div>

            <div className="modalBody">
              <div className="rmModalGrid">
                {/* LEFT: form */}
                <div className="rmModalLeft">
                  <div className="formGrid">
                    {/* 5 fields */}
                    <label className="field">
                      <div className="label">Keyword title</div>
                      <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g., paetongtarn shinawatra" />
                      <div className="hint">ชื่อ keyword rule ที่ระบบจะใช้ match ใน content</div>
                    </label>

                    <label className="field">
                      <div className="label">Description</div>
                      <textarea
                        className="textarea"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Explain what this rule indicates when matched…"
                      />
                      <div className="hint">อธิบายสั้น ๆ ว่าการ match นี้บ่งชี้ข้อมูลประเภทไหน/ผลกระทบอะไร</div>
                    </label>

                    {/* DPC picker */}
                    <div className="field">
                      <div className="label">DPC — Data Processing Context</div>
                      <div className="rubricCards">
                        {DPC_LEVELS.map((opt) => (
                          <button
                            key={opt.value}
                            type="button"
                            className={`rubricCard ${dpc === opt.value ? "active" : ""}`}
                            onClick={() => setDpc(opt.value)}
                          >
                            <div className="rubricTitle">{opt.title}</div>
                            <ul className="rubricList">
                              {opt.examples.slice(0, 3).map((ex, i) => <li key={i}>{ex}</li>)}
                            </ul>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* EI */}
                    <div className="field">
                      <div className="label">EI — Ease of Identification</div>
                      <div className="rubricRow">
                        {EI_PRESETS.map((opt) => (
                          <button
                            key={opt.value}
                            type="button"
                            className={`chipBtn ${Number(ei) === opt.value ? "active" : ""}`}
                            onClick={() => setEi(opt.value)}
                          >
                            <div className="chipTop">
                              <span className="mono">{opt.label}</span>
                            </div>
                            <div className="chipDesc">{opt.desc}</div>
                          </button>
                        ))}
                      </div>
                      <div className="hint">แนะนำใช้ค่ามาตรฐาน (0.25/0.5/0.75/1.0) เพื่อความสม่ำเสมอ</div>
                    </div>

                    {/* CB */}
                    <div className="field">
                      <div className="label">CB — Circumstances of the Breach</div>
                      <div className="rubricCards cbGrid">
                        {CB_LEVELS.map((opt) => (
                          <button
                            key={opt.value}
                            type="button"
                            className={`rubricCard ${cb === opt.value ? "active" : ""}`}
                            onClick={() => setCb(opt.value)}
                          >
                            <div className="rubricTitle">{opt.title}</div>
                            <div className="rubricSub">{opt.desc}</div>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="hint">
                      ✅ Client payload = <span className="mono">title, description, dpc, ei, cb</span> เท่านั้น (คะแนน severity คำนวณให้อัตโนมัติ)
                    </div>
                  </div>
                </div>

                {/* RIGHT: preview */}
                <div className="rmModalRight">
                  <div className="previewCard">
                    <div className="previewTitle">Severity Preview</div>

                    <div className="previewFormula mono">
                      Final Severity = (DPC × EI) + CB
                    </div>

                    <div className="previewScoreRow">
                      <div className="previewScore mono">{finalSeverity.toFixed(2)}</div>
                      <span className={`pill sev_${severityLevel}`}>{severityLevel}</span>
                    </div>

                    <div className="previewExplain">
                      <div className="exRow">
                        <div className="exKey">DPC</div>
                        <div className="exVal mono">{dpc}</div>
                      </div>
                      <div className="exRow">
                        <div className="exKey">EI</div>
                        <div className="exVal mono">{Number(ei).toFixed(2)}</div>
                      </div>
                      <div className="exRow">
                        <div className="exKey">CB</div>
                        <div className="exVal mono">{cb}</div>
                      </div>
                    </div>

                    <div className="previewHint">
                      ระบบจะเก็บค่า computed เพื่อ audit ได้ (final severity + level) แต่ user กรอกแค่ 5 ช่อง
                    </div>
                  </div>

                  <div className="previewCard">
                    <div className="previewTitle">Quick sanity checks</div>
                    <ul className="previewBullets">
                      <li>ถ้าเป็น “ชื่อ/ข้อมูลทั่วไป” → DPC มักอยู่ 1–2</li>
                      <li>ถ้ามี “ข้อมูลใช้ทำ fraud ได้” → DPC มักสูง (3–4)</li>
                      <li>ถ้าเกี่ยวกับ regulator/critical infra → CB ควรสูงขึ้น</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            <div className="modalFooter">
              <button className="ghostBtn" onClick={() => setModal("NONE")}>Close</button>
              <button className="primaryBtn" onClick={saveRule}>Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
