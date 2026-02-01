import { useEffect, useMemo, useState } from "react";
import "./formTokens.css";
import "./ruleManager.css";

import { useActiveKeywordRules, useSensitivity } from "@/features/ruleManager/hooks";
import { createRule, updateGamma, updateRule } from "@/features/ruleManager/service";
import type { ActiveKeywordRuleDTO, RuleInputDTO, SeverityLevel } from "@/features/ruleManager/types";

type ModalMode = "NONE" | "ADD_RULE" | "EDIT_RULE" | "GUIDE";

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
 * Final Severity = (DPC × EI) + CB
 */
function calcFinalSeverity(dpc: number, ei: number, cb: number) {
  return Number(dpc * ei + cb);
}

/**
 * Deterministic mapping (tune later if needed)
 */
function mapSeverityLevel(score: number): SeverityLevel {
  if (score < 2.0) return "LOW";
  if (score < 4.0) return "MED";
  if (score < 6.0) return "HIGH";
  return "CRITICAL";
}

/* ---------- Definitions (ENISA-aligned, short + readable) ---------- */
const RUBRIC_DEFS = {
  dpc:
    "Data Processing Context (DPC) measures the intrinsic sensitivity and potential impact of inferred data (type of data + degree of inference/harm), independent of identifiability.",
  ei:
    "Ease of Identification (EI) indicates how easily an individual/entity can be identified directly or via reasonable linkage with publicly available information.",
  cb:
    "Circumstances of the Breach (CB) captures aggravating context beyond the data itself (e.g., financial sector, regulators, critical infrastructure, high-impact entities).",
} as const;

/* ---------- EI presets ---------- */
const EI_PRESETS: Array<{ value: number; label: string; title: string; desc: string }> = [
  { value: 0.25, label: "0.25", title: "Hard to identify", desc: "Weak linkage; high effort to identify." },
  { value: 0.5, label: "0.50", title: "Possible with linkage", desc: "Feasible via public sources with moderate effort." },
  { value: 0.75, label: "0.75", title: "Reasonably identifiable", desc: "Common linkage; limited effort to identify." },
  { value: 1.0, label: "1.00", title: "Directly identifiable", desc: "Explicit identifiers or direct unique reference." },
];

/* ---------- DPC levels (compact but full meaning) ---------- */
const DPC_LEVELS: Array<{ value: number; title: string; summary: string; examples: string[] }> = [
  {
    value: 1,
    title: "1 — Basic data (low inference)",
    summary: "Basic personal/org data; does not by itself enable profiling or sensitive inference.",
    examples: ["Organization/company name", "Bank/regulator name", "Contact details (generic)", "Education / family life (generic)"],
  },
  {
    value: 2,
    title: "2 — Enables basic profiling",
    summary: "Combination of clues supports assumptions about social/professional/economic status.",
    examples: ['("Job title" + "Specific company")', '("Education level" + "University")', '("Role" + "Industry sector")'],
  },
  {
    value: 3,
    title: "3 — Sensitive inference possible",
    summary: "Enables inference of sensitive attributes, even if not explicitly stated.",
    examples: ['("Membership status" + "Political party")', '("Attendance record" + "Religious org")', '("Patient status" + "Treatment center")'],
  },
  {
    value: 4,
    title: "4 — High harm / safety risk",
    summary: "Could directly threaten safety/security or expose vulnerable individuals/groups).",
    examples: ['("Full name" + "Exact home address")', '("Vulnerable person" + "School/location")', '("Sensitive role" + "Covert location")'],
  },
];

/* ---------- CB levels ---------- */
const CB_LEVELS: Array<{ value: number; title: string; summary: string }> = [
  { value: 0, title: "0 — No aggravating context", summary: "General mention; no critical-entity context." },
  { value: 1, title: "1 — Notable org / sector context", summary: "Impact increases, but limited operational/regulatory implications." },
  { value: 2, title: "2 — High-impact entity context", summary: "Large institutions, financial sector, widely targeted entities." },
  { value: 3, title: "3 — Critical operator / regulator context", summary: "Regulators, critical infrastructure operators, key service providers." },
  { value: 4, title: "4 — Systemic / national-level context", summary: "Could drive systemic disruption or national-level consequences." },
];


export default function RuleManagerPage() {
  const rules = useActiveKeywordRules();
  const sensitivity = useSensitivity();

  const rows = rules.data ?? [];
  const infoLoading = rules.loading || sensitivity.loading;
  const infoError = rules.error || sensitivity.error;
  // -----------------
  // Sensitivity (Gamma) — Option A
  // - Card max-width for readable UI
  // - Slider width <= 500px (responsive down)
  // - Real-time preview (gammaDraft)
  // - Persist ONLY when user clicks Save
  // -----------------
  const savedGamma = clamp01(sensitivity.data?.gamma ?? 0);
  const savedAt = sensitivity.data?.updated_at ?? "";

  const [gammaDraft, setGammaDraft] = useState<number>(savedGamma);
  const [gammaSaving, setGammaSaving] = useState(false);
  const [gammaSaveError, setGammaSaveError] = useState<string | null>(null);

  useEffect(() => {
    setGammaDraft(savedGamma);
  }, [savedGamma]);

  const gammaLabel = useMemo(() => gammaDraft.toFixed(2), [gammaDraft]);
  const gammaDirty = useMemo(() => Math.abs(gammaDraft - savedGamma) > 1e-9, [gammaDraft, savedGamma]);

  const [modal, setModal] = useState<ModalMode>("NONE");
  const [active, setActive] = useState<ActiveKeywordRuleDTO | null>(null);

  // Save behavior: button always clickable; show validation/errors after click
  const [ruleSaving, setRuleSaving] = useState(false);
  const [ruleSaveError, setRuleSaveError] = useState<string | null>(null);

  // ✅ 5 required fields (client)
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dpc, setDpc] = useState<number | null>(null);
  const [ei, setEi] = useState<number | null>(null);
  const [cb, setCb] = useState<number | null>(null);

  // tabbed scoring (no page scroll)
  const [scoreTab, setScoreTab] = useState<"DPC" | "EI" | "CB">("DPC");

  // -----------------
  // Form validation (Rule modal)
  // - Description is optional
  // - DPC/EI/CB must be explicitly selected (no defaults)
  // -----------------
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [touched, setTouched] = useState({ title: false, dpc: false, ei: false, cb: false });

  const titleOk = title.trim().length > 0;
  const dpcOk = dpc != null;
  const eiOk = ei != null;
  const cbOk = cb != null;
  const formOk = titleOk && dpcOk && eiOk && cbOk;

  const showTitleErr = (submitAttempted || touched.title) && !titleOk;
  const showDpcErr = (submitAttempted || touched.dpc) && !dpcOk;
  const showEiErr = (submitAttempted || touched.ei) && !eiOk;
  const showCbErr = (submitAttempted || touched.cb) && !cbOk;


  useEffect(() => {
    if (modal === "NONE") return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setModal("NONE");
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [modal]);

  const finalSeverity = useMemo(() => {
    if (dpc == null || ei == null || cb == null) return null;
    return calcFinalSeverity(dpc, ei, cb);
  }, [dpc, ei, cb]);
  const severityLevel = useMemo(() => {
    if (finalSeverity == null) return null;
    return mapSeverityLevel(finalSeverity);
  }, [finalSeverity]);



  function openAdd() {
    setActive(null);
    setTitle("");
    setDescription("");
    setDpc(null);
    setEi(null);
    setCb(null);
    setModal("ADD_RULE");
    setScoreTab("DPC");
    setSubmitAttempted(false);
    setTouched({ title: false, dpc: false, ei: false, cb: false });
  }

  function openGuide() {
    setModal("GUIDE");
  }

  function openEdit(r: ActiveKeywordRuleDTO) {
    setActive(r);
    setTitle(r.title);
    setDescription(r.description);
    setDpc(r.dpc);
    setEi(r.ei);
    setCb(r.cb);
    setModal("EDIT_RULE");
    setScoreTab("DPC");
    setSubmitAttempted(false);
    setTouched({ title: false, dpc: false, ei: false, cb: false });
  }

  function buildPayload(): RuleInputDTO {
    return {
      title: (title || "").trim(),
      description: (description || "").trim(),
      dpc: clampInt(dpc as number, 1, 4),
      ei: clamp01(Number(ei as number)),
      cb: clampInt(cb as number, 0, 4),
    };
  }

  function onSubmitRule() {
    setSubmitAttempted(true);
    if (!formOk) return;
    saveRule();
  }

  async function saveRule() {
    setRuleSaveError(null);
    setRuleSaving(true);
    try {
      const payload = buildPayload();
      if (modal === "ADD_RULE") {
        const row = await createRule(payload);
        rules.setData((prev) => ([...(prev ?? []), row]));
      }
      if (modal === "EDIT_RULE" && active) {
        const row = await updateRule({ id: active.id, payload });
        rules.setData((prev) => (prev ?? []).map((x) => (x.id === active.id ? row : x)));
      }
      setModal("NONE");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      setRuleSaveError(msg || "Failed to save rule");
    } finally {
      setRuleSaving(false);
    }
  }

  function onGammaChange(next: number) {
    setGammaDraft(clamp01(next));
  }

  async function saveGamma() {
    setGammaSaveError(null);
    setGammaSaving(true);
    try {
      const res = await updateGamma({ gamma: clamp01(gammaDraft) });
      sensitivity.setData(res);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      setGammaSaveError(msg || "Failed to save gamma");
    } finally {
      setGammaSaving(false);
    }
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
          <div className="rmHeaderActions">
            <button className="ghostBtn" onClick={openGuide}>
              Guide
            </button>
            <button className="primaryBtn" onClick={openAdd}>
              + Add rule
            </button>
          </div>
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
                    <button className="ghostBtn" onClick={() => openEdit(r)}>
                      Edit
                    </button>
                  </td>
                </tr>
              ))}

              {!rules.loading && rows.length === 0 && (
                <tr>
                  <td colSpan={9} className="emptyCell">
                    No data
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
      {/* Sensitivity */}
      <section className="card rmCard rmCardSensitivity">
        <div className="cardHeaderRow">
          <div className="cardTitle">Sensitivity</div>
          <div className="muted">
            Last saved: <span className="mono">{savedAt || "-"}</span>
          </div>
        </div>

        <div className="gammaBox">
          <div className="gammaGrid">
            <div className="gammaLabel">
              Gamma <span className="mono gammaInlineVal">{gammaLabel}</span>
            </div>

            <div className="gammaTrack">
              <input
                className="gammaSlider"
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={gammaDraft}
                onChange={(e) => onGammaChange(Number(e.target.value))}
              />

              <button
                className="primaryBtn gammaSaveBtn"
                onClick={saveGamma}
                disabled={!gammaDirty || gammaSaving}
                title={gammaDirty ? "Save gamma" : "No changes"}
              >
                {gammaSaving ? "Saving…" : "Save"}
              </button>

              <div className="gammaScale" aria-hidden="true">
                <div className="mono">0</div>
                <div className="mono">1</div>
              </div>
            </div>
          </div>

          {gammaSaveError && <div className="errorBox">{gammaSaveError}</div>}

          <div className="hint">(Gamma เป็น system sensitivity knob — สูตร severity ของ rule ใช้: (DPC×EI)+CB)</div>
        </div>
      </section>

      {/* Modal */}
      {modal !== "NONE" && (
        <div className="modalOverlay" onMouseDown={() => setModal("NONE")}>
          <div className="modalShell" onMouseDown={(e) => e.stopPropagation()}>
            {modal === "GUIDE" ? (
              <>
                <div className="modalHeader">
                  <div className="modalTitle">Rule Manager — Guide</div>
                  <button className="closeBtn" onClick={() => setModal("NONE")}>
                    ✕
                  </button>
                </div>

                <div className="modalBody guideBody">
                  <div className="guideWrap">
                    <div className="guideLead">
                      หน้านี้ใช้สำหรับสร้าง <span className="mono">keyword rule</span> เพื่อคำนวณความรุนแรงของเหตุข้อมูลรั่วไหลตาม rubric (ENISA-aligned)
                      โดยระบบจะคำนวณคะแนนรวมด้วยสูตร:
                      <div className="guideFormula mono">Final Severity = (DPC × EI) + CB</div>
                    </div>

                    <div className="guideSection">
                      <div className="guideH">Add Rule — ทำอะไรบ้าง</div>
                      <ol className="guideList">
                        <li>กด <span className="mono">+ Add rule</span></li>
                        <li>กรอก <span className="mono">Keyword title</span> (จำเป็น)</li>
                        <li>กรอก <span className="mono">Description</span> (ไม่จำเป็น แต่แนะนำ)</li>
                        <li>เลือกคะแนน <span className="mono">DPC</span>, <span className="mono">EI</span>, <span className="mono">CB</span> ให้ครบ (จำเป็น)</li>
                        <li>กด <span className="mono">Save</span> เพื่อบันทึก (ถ้าขาด field ระบบจะแสดง error หลังจากกด Save)</li>
                      </ol>
                    </div>

                    <div className="guideSection">
                      <div className="guideH">ความหมายของคะแนน</div>
                      <div className="guideGrid">
                        <div className="guideCard">
                          <div className="guideK">DPC</div>
                          <div className="guideT">{RUBRIC_DEFS.dpc}</div>
                        </div>
                        <div className="guideCard">
                          <div className="guideK">EI</div>
                          <div className="guideT">{RUBRIC_DEFS.ei}</div>
                        </div>
                        <div className="guideCard">
                          <div className="guideK">CB</div>
                          <div className="guideT">{RUBRIC_DEFS.cb}</div>
                        </div>
                      </div>
                    </div>

                    <div className="guideSection">
                      <div className="guideH">แนวทางเลือกคะแนนแบบเร็ว</div>
                      <ul className="guideList">
                        <li>ข้อมูลการเงินที่นำไปสู่ fraud ได้ (เช่น card + cvv) → <span className="mono">DPC 4</span>, <span className="mono">EI 1.0</span>, เพิ่ม <span className="mono">CB</span> ตามบริบท</li>
                        <li>ชื่อ/องค์กรทั่วไปที่ยังไม่พาไป profiling → เริ่มที่ <span className="mono">DPC 1–2</span></li>
                        <li>ถ้า “ระบุตัวบุคคลได้ชัดเจน” → ขยับ <span className="mono">EI</span> ไปที่ <span className="mono">0.75–1.0</span></li>
                        <li>ถ้าเกี่ยวข้องกับภาคการเงิน/Regulator/Critical infra → เพิ่ม <span className="mono">CB</span></li>
                      </ul>
                    </div>

                    <div className="guideSection">
                      <div className="guideH">สัญลักษณ์ ✓ ในหน้าคะแนน</div>
                      <div className="guideT">เมื่อคุณเลือก option ของ DPC/EI/CB ระบบจะแสดง ✓ บนตัวเลือกที่เลือก เพื่อให้ตรวจสอบได้เร็ว</div>
                    </div>
                  </div>
                </div>

                <div className="modalFooter">
                  <button className="primaryBtn" onClick={() => setModal("NONE")}>
                    Close
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="modalHeader">
                  <div className="modalTitle">{modal === "ADD_RULE" ? "Add rule" : "Edit rule"}</div>
                  <button className="closeBtn" onClick={() => setModal("NONE")}>
                    ✕
                  </button>
                </div>

                <div className="modalBody">
                  <div className="modalTopError">
                    {ruleSaveError && <div className="errorBox">{ruleSaveError}</div>}
                  </div>

                  <div className="rmModalGrid">
                    {/* LEFT */}
                    <div className="rmModalLeft">
                      <div className="formGrid">
                        <label className="field">
                          <div className="label">Keyword title</div>
                          <input
                            className={`input ${showTitleErr ? "inputInvalid" : ""}`}
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            onBlur={() => setTouched((t) => ({ ...t, title: true }))}
                            placeholder="e.g., leaked bank account list"
                          />
                          {showTitleErr && <div className="fieldError">Please enter a keyword title.</div>}
                          <div className="hint">ชื่อ keyword rule ที่ระบบจะใช้ match ใน content</div>
                        </label>

                        <label className="field">
                          <div className="label">Description</div>
                          <textarea
                            className="textarea textareaCompact"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Explain what this rule indicates when matched…"
                          />
                          <div className="hint">อธิบายสั้น ๆ ว่าการ match นี้บ่งชี้ข้อมูลประเภทไหน/ผลกระทบอะไร</div>
                        </label>

                        {/* Preview */}
                        <div className="previewCard previewCardLeft">
                          <div className="previewTitle">Severity Preview</div>
                          <div className="previewFormula mono">Final Severity = (DPC × EI) + CB</div>

                          <div className="previewScoreRow">
                            <div className="previewScore mono">{finalSeverity == null ? "--" : finalSeverity.toFixed(2)}</div>
                            <span className={`pill sev_${severityLevel ?? "--"}`}>{severityLevel ?? "--"}</span>
                          </div>

                          <div className="previewExplain">
                            <div className="exRow">
                              <div className="exKey">DPC</div>
                              <div className="exVal mono">{dpc ?? "--"}</div>
                            </div>
                            <div className="exRow">
                              <div className="exKey">EI</div>
                              <div className="exVal mono">{ei == null ? "--" : Number(ei).toFixed(2)}</div>
                            </div>
                            <div className="exRow">
                              <div className="exKey">CB</div>
                              <div className="exVal mono">{cb ?? "--"}</div>
                            </div>
                          </div>

                          <div className="howtoBox">
                            <div className="howtoTitle">How to fill DPC / EI / CB</div>
                            <ul className="previewBullets">
                              <li><span className="bold">DPC</span> = what the data is (intrinsic sensitivity/impact)</li>
                              <li><span className="bold">EI</span> = who it points to (identifiability)</li>
                              <li><span className="bold">CB</span> = how bad the context is (aggravating factors)</li>
                            </ul>
                            <div className="previewHint">
                              Guideline: ถ้า keyword ทำให้ inference sensitive attribute / fraud risk → เริ่มจาก DPC 3–4
                            </div>
                          </div>
                        </div>

                        {/* Level mapping */}
                        <div className="previewCard previewCardLeft">
                          <div className="previewTitle">Level mapping</div>
                          <ul className="previewBullets">
                            <li>&lt; 2.0 → LOW</li>
                            <li>2.0–3.99 → MED</li>
                            <li>4.0–5.99 → HIGH</li>
                            <li>≥ 6.0 → CRITICAL</li>
                          </ul>
                          <div className="previewHint">
                            Thresholds are UI-level and can be tuned later without changing client payload.
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* RIGHT */}
                    <div className="rmModalRight">
                      <div className="scoreCard scoreCardFixed">
                        <div className="scoreHeaderRow">
                          <div className="scoreTitle">Select DPC / EI / CB</div>
                          <div className="tabRow" role="tablist" aria-label="Score tabs">
                            <button
                              type="button"
                              className={`tabBtn ${scoreTab === "DPC" ? "active" : ""} ${(submitAttempted && !dpcOk) ? "tabError" : ""}`}
                              onClick={() => setScoreTab("DPC")}
                              role="tab"
                              aria-selected={scoreTab === "DPC"}
                            >
                              DPC
                            </button>
                            <button
                              type="button"
                              className={`tabBtn ${scoreTab === "EI" ? "active" : ""} ${(submitAttempted && !eiOk) ? "tabError" : ""}`}
                              onClick={() => setScoreTab("EI")}
                              role="tab"
                              aria-selected={scoreTab === "EI"}
                            >
                              EI
                            </button>
                            <button
                              type="button"
                              className={`tabBtn ${scoreTab === "CB" ? "active" : ""} ${(submitAttempted && !cbOk) ? "tabError" : ""}`}
                              onClick={() => setScoreTab("CB")}
                              role="tab"
                              aria-selected={scoreTab === "CB"}
                            >
                              CB
                            </button>
                          </div>
                        </div>

                        {/* meta */}
                        <div className="scoreMeta" role="tabpanel">
                          {scoreTab === "DPC" && (
                            <>
                              <div className="label">DPC — Data Processing Context</div>
                              <div className="defText">{RUBRIC_DEFS.dpc}</div>
                            </>
                          )}
                          {scoreTab === "EI" && (
                            <>
                              <div className="label">EI — Ease of Identification</div>
                              <div className="defText">{RUBRIC_DEFS.ei}</div>
                            </>
                          )}
                          {scoreTab === "CB" && (
                            <>
                              <div className="label">CB — Circumstances of the Breach</div>
                              <div className="defText">{RUBRIC_DEFS.cb}</div>
                            </>
                          )}
                        </div>

                        {/* options (scroll ONLY here) */}
                        <div className="scorePanel" aria-label="Scoring options">
                          {scoreTab === "DPC" && showDpcErr && <div className="fieldError fieldErrorTight">Please select a DPC level.</div>}
                          {scoreTab === "EI" && showEiErr && <div className="fieldError fieldErrorTight">Please select an EI value.</div>}
                          {scoreTab === "CB" && showCbErr && <div className="fieldError fieldErrorTight">Please select a CB level.</div>}

                          {scoreTab === "DPC" && (
                            <div className="rubricPanelGrid">
                              {DPC_LEVELS.map((opt) => (
                                <button
                                  key={opt.value}
                                  type="button"
                                  className={`rubricCard rubricCardDense ${dpc === opt.value ? "active" : ""}`}
                                  onClick={() => { setDpc(opt.value); setTouched((t) => ({ ...t, dpc: true })); }}
                                >
                                  <div className="rubricTitle">
                                    <span>{opt.title}</span>
                                    {dpc === opt.value && <span className="selTick" aria-hidden="true">✓</span>}
                                  </div>
                                  <div className="rubricSub">{opt.summary}</div>
                                  <div className="rubricDetails rubricDetailsOpen">
                                    <div className="rubricExamplesTitle">Examples</div>
                                    <ul className="rubricList">
                                      {opt.examples.map((ex, i) => <li key={i}>{ex}</li>)}
                                    </ul>
                                  </div>
                                </button>
                              ))}
                            </div>
                          )}

                          {scoreTab === "EI" && (
                            <>
                              <div className="rubricRow rubricRowDense">
                                {EI_PRESETS.map((opt) => (
                                  <button
                                    key={opt.value}
                                    type="button"
                                    className={`chipBtn chipBtnDense ${Number(ei) === opt.value ? "active" : ""}`}
                                    onClick={() => { setEi(opt.value); setTouched((t) => ({ ...t, ei: true })); }}
                                  >
                                    <div className="chipTop">
                                      <span className="mono">{opt.label}</span>
                                      <span className="chipTag">{opt.title}</span>
                                      {Number(ei) === opt.value && <span className="selTick" aria-hidden="true">✓</span>}
                                    </div>
                                    <div className="chipDesc">{opt.desc}</div>
                                  </button>
                                ))}
                              </div>
                              <div className="hint">แนะนำใช้ค่ามาตรฐาน (0.25/0.5/0.75/1.0) เพื่อความสม่ำเสมอ</div>
                            </>
                          )}

                          {scoreTab === "CB" && (
                            <>
                              <div className="rubricCards cbGridDense">
                                {CB_LEVELS.map((opt) => (
                                  <button
                                    key={opt.value}
                                    type="button"
                                    className={`rubricCard rubricCardDense ${cb === opt.value ? "active" : ""}`}
                                    onClick={() => { setCb(opt.value); setTouched((t) => ({ ...t, cb: true })); }}
                                  >
                                    <div className="rubricTitle">
                                      <span>{opt.title}</span>
                                      {cb === opt.value && <span className="selTick" aria-hidden="true">✓</span>}
                                    </div>
                                    <div className="rubricSub">{opt.summary}</div>
                                  </button>
                                ))}
                              </div>
                              <div className="hint">Tip: ถ้าเกี่ยวกับ financial sector / regulator / critical infra ให้เพิ่ม CB</div>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="modalFooter">
                  <button className="ghostBtn" onClick={() => setModal("NONE")}>
                    Close
                  </button>
                  <button
                    className={`primaryBtn ${!formOk ? "btnSoftWarn" : ""}`}
                    onClick={onSubmitRule}
                    disabled={ruleSaving}
                    title={!formOk ? "Click Save to see missing fields" : "Save"}
                  >
                    {ruleSaving ? "Saving…" : "Save"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
