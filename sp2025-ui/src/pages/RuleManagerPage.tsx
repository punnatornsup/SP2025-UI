import { useMemo, useState } from "react";
import "./ruleManager.css";

import { useActiveKeywordRules, useSensitivity } from "@/features/ruleManager/hooks";
import type { ActiveKeywordRuleDTO, RuleStatus, SeverityLevel } from "@/features/ruleManager/types";

type ModalMode = "NONE" | "ADD_RULE" | "EDIT_RULE";

function genId() {
  return `rule-${Math.random().toString(16).slice(2, 6)}-${Date.now()}`;
}

function clamp01(x: number) {
  return Math.max(0, Math.min(1, x));
}

export default function RuleManagerPage() {
  const rules = useActiveKeywordRules();
  const sensitivity = useSensitivity();

  const rows = rules.data ?? [];
  const infoLoading = rules.loading || sensitivity.loading;
  const infoError = rules.error || sensitivity.error;

  // gamma (controlled)
  const gamma = sensitivity.data?.gamma ?? 0;

  // modal + form states
  const [modal, setModal] = useState<ModalMode>("NONE");
  const [active, setActive] = useState<ActiveKeywordRuleDTO | null>(null);

  const [title, setTitle] = useState("");
  const [status, setStatus] = useState<RuleStatus>("ACTIVE");
  const [docScore, setDocScore] = useState("0.50");
  const [ciScore, setCiScore] = useState("0.50");
  const [cbScore, setCbScore] = useState("0.50");
  const [severity, setSeverity] = useState<SeverityLevel>("MED");

  const gammaLabel = useMemo(() => gamma.toFixed(2), [gamma]);

  function openAdd() {
    setActive(null);
    setTitle("");
    setStatus("ACTIVE");
    setDocScore("0.50");
    setCiScore("0.50");
    setCbScore("0.50");
    setSeverity("MED");
    setModal("ADD_RULE");
  }

  function openEdit(r: ActiveKeywordRuleDTO) {
    setActive(r);
    setTitle(r.title);
    setStatus(r.status);
    setDocScore(String(r.doc_score));
    setCiScore(String(r.ci_score));
    setCbScore(String(r.cb_score));
    setSeverity(r.severity_level);
    setModal("EDIT_RULE");
  }

  function saveRule() {
    const ds = clamp01(Number(docScore));
    const cis = clamp01(Number(ciScore));
    const cbs = clamp01(Number(cbScore));

    if (modal === "ADD_RULE") {
      const newRow: ActiveKeywordRuleDTO = {
        id: genId(),
        title: title || "Untitled rule",
        created_at: new Date().toISOString(),
        status,
        doc_score: ds,
        ci_score: cis,
        cb_score: cbs,
        severity_level: severity,
      };
      rules.setData((prev) => ([...(prev ?? []), newRow]));
    }

    if (modal === "EDIT_RULE" && active) {
      rules.setData((prev) =>
        (prev ?? []).map((x) =>
          x.id === active.id
            ? {
                ...x,
                title: title || x.title,
                status,
                doc_score: ds,
                ci_score: cis,
                cb_score: cbs,
                severity_level: severity,
              }
            : x
        )
      );
    }

    setModal("NONE");
  }

  // UI-only gamma update (รองรับ backend ทีหลัง: เปลี่ยนให้ยิง updateGamma ได้)
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
          <button className="primaryBtn" onClick={openAdd}>
            + Add rule
          </button>
        </div>

        <div className="tableWrap">
          <table className="table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Create at</th>
                <th>Status</th>
                <th>Doc score</th>
                <th>CI score</th>
                <th>CB score</th>
                <th>Severity level</th>
                <th></th>
              </tr>
            </thead>

            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td className="bold">{r.title}</td>
                  <td className="mono">{r.created_at}</td>
                  <td>
                    <span className={`pill ${r.status === "ACTIVE" ? "ok" : "muted"}`}>
                      {r.status}
                    </span>
                  </td>
                  <td className="mono">{r.doc_score.toFixed(2)}</td>
                  <td className="mono">{r.ci_score.toFixed(2)}</td>
                  <td className="mono">{r.cb_score.toFixed(2)}</td>
                  <td>
                    <span className={`pill sev_${r.severity_level}`}>{r.severity_level}</span>
                  </td>
                  <td className="tdAction">
                    <button className="ghostBtn" onClick={() => openEdit(r)}>Edit</button>
                  </td>
                </tr>
              ))}

              {!rules.loading && rows.length === 0 && (
                <tr>
                  <td colSpan={8} className="emptyCell">No data</td>
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
            (ตอนต่อ backend จริง: save gamma ด้วย PUT /rules/sensitivity)
          </div>
        </div>
      </section>

      {/* Modal */}
      {modal !== "NONE" && (
        <div className="modalOverlay" onMouseDown={() => setModal("NONE")}>
          <div className="modalShell" onMouseDown={(e) => e.stopPropagation()}>
            <div className="modalHeader">
              <div className="modalTitle">{modal === "ADD_RULE" ? "Add rule" : "Edit rule"}</div>
              <button className="closeBtn" onClick={() => setModal("NONE")}>✕</button>
            </div>

            <div className="modalBody">
              <div className="formGrid">
                <label className="field">
                  <div className="label">Title</div>
                  <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} />
                </label>

                <div className="grid2">
                  <label className="field">
                    <div className="label">Status</div>
                    <select className="input" value={status} onChange={(e) => setStatus(e.target.value as RuleStatus)}>
                      <option value="ACTIVE">ACTIVE</option>
                      <option value="INACTIVE">INACTIVE</option>
                    </select>
                  </label>

                  <label className="field">
                    <div className="label">Severity level</div>
                    <select className="input" value={severity} onChange={(e) => setSeverity(e.target.value as SeverityLevel)}>
                      <option value="LOW">LOW</option>
                      <option value="MED">MED</option>
                      <option value="HIGH">HIGH</option>
                      <option value="CRITICAL">CRITICAL</option>
                    </select>
                  </label>
                </div>

                <div className="grid3">
                  <label className="field">
                    <div className="label">Doc score (0..1)</div>
                    <input className="input" value={docScore} onChange={(e) => setDocScore(e.target.value)} />
                  </label>
                  <label className="field">
                    <div className="label">CI score (0..1)</div>
                    <input className="input" value={ciScore} onChange={(e) => setCiScore(e.target.value)} />
                  </label>
                  <label className="field">
                    <div className="label">CB score (0..1)</div>
                    <input className="input" value={cbScore} onChange={(e) => setCbScore(e.target.value)} />
                  </label>
                </div>

                <div className="hint">
                  (ตอนต่อ backend: create/edit rule ด้วย POST/PUT /rules/active-keywords)
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
