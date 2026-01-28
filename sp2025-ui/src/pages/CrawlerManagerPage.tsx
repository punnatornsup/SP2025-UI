import { useMemo, useState } from "react";
import "./crawlerManager.css";

import { useCrawlerProfiles, useJobHistory, useScheduleJobs, useWorkersStatus } from "@/features/crawlerManager/hooks";
import type { CrawlerProfileDTO, ScheduleJobDTO, JobHistoryDTO } from "@/features/crawlerManager/types";

type ModalMode = "NONE" | "ADD_CRAWLER" | "EDIT_CRAWLER" | "ADD_SCHEDULE" | "EDIT_SCHEDULE" | "CANCEL_JOB";

function genUUIDLike() {
  return crypto.randomUUID?.() ?? `id-${Math.random().toString(16).slice(2)}-${Date.now()}`;
}

export default function CrawlerManagerPage() {
  const profiles = useCrawlerProfiles();
  const schedules = useScheduleJobs();
  const jobs = useJobHistory();
  const workers = useWorkersStatus();

  const profileRows = profiles.data ?? [];
  const scheduleRows = schedules.data ?? [];
  const jobRows = jobs.data ?? [];
  const workerRows = workers.data ?? [];

  // ===== modals =====
  const [modal, setModal] = useState<ModalMode>("NONE");
  const [activeProfile, setActiveProfile] = useState<CrawlerProfileDTO | null>(null);
  const [activeSchedule, setActiveSchedule] = useState<ScheduleJobDTO | null>(null);
  const [activeJob, setActiveJob] = useState<JobHistoryDTO | null>(null);

  // ===== form states =====
  const [pName, setPName] = useState("");
  const [pDomains, setPDomains] = useState("");
  const [pAlertTo, setPAlertTo] = useState("");
  const [pBypass, setPBypass] = useState(false);
  const [pCookie, setPCookie] = useState(false);

  const [sName, setSName] = useState("");
  const [sCrawlerId, setSCrawlerId] = useState("");
  const [sType, setSType] = useState("CRON");

  const infoError = profiles.error || schedules.error || jobs.error || workers.error;
  const infoLoading = profiles.loading || schedules.loading || jobs.loading || workers.loading;

  const crawlerIdOptions = useMemo(() => profileRows.map((p) => ({ id: p.id, name: p.name })), [profileRows]);

  const workerTotals = useMemo(() => {
    const sum = {
      active: 0,
      processed: 0,
      failed: 0,
      succeeded: 0,
      retried: 0,
    };
    for (const w of workerRows) {
      sum.active += w.active;
      sum.processed += w.processed;
      sum.failed += w.failed;
      sum.succeeded += w.succeeded;
      sum.retried += w.retried;
    }
    return sum;
  }, [workerRows]);

  function openAddCrawler() {
    setActiveProfile(null);
    setPName("");
    setPDomains("");
    setPAlertTo("");
    setPBypass(false);
    setPCookie(false);
    setModal("ADD_CRAWLER");
  }

  function openEditCrawler(row: CrawlerProfileDTO) {
    setActiveProfile(row);
    setPName(row.name);
    setPDomains(row.allow_domains.join(", "));
    setPAlertTo(row.alert_to);
    setPBypass(row.bypass_ddos);
    setPCookie(row.session_cookie);
    setModal("EDIT_CRAWLER");
  }

  function saveCrawler() {
    const domains = pDomains
      .split(",")
      .map((x) => x.trim())
      .filter(Boolean);

    if (modal === "ADD_CRAWLER") {
      const newRow: CrawlerProfileDTO = {
        id: genUUIDLike(),
        name: pName || "Untitled crawler",
        allow_domains: domains,
        alert_to: pAlertTo || "-",
        bypass_ddos: pBypass,
        session_cookie: pCookie,
      };
      profiles.setData((prev) => ([...(prev ?? []), newRow]));
    }

    if (modal === "EDIT_CRAWLER" && activeProfile) {
      profiles.setData((prev) =>
        (prev ?? []).map((r) =>
          r.id === activeProfile.id
            ? {
                ...r,
                name: pName || r.name,
                allow_domains: domains,
                alert_to: pAlertTo || r.alert_to,
                bypass_ddos: pBypass,
                session_cookie: pCookie,
              }
            : r
        )
      );
    }

    setModal("NONE");
  }

  function openAddSchedule() {
    setActiveSchedule(null);
    setSName("");
    setSCrawlerId(crawlerIdOptions[0]?.id ?? "");
    setSType("CRON");
    setModal("ADD_SCHEDULE");
  }

  function openEditSchedule(row: ScheduleJobDTO) {
    setActiveSchedule(row);
    setSName(row.name);
    setSCrawlerId(row.crawler_id);
    setSType(row.schedule_type);
    setModal("EDIT_SCHEDULE");
  }

  function saveSchedule() {
    if (modal === "ADD_SCHEDULE") {
      const newRow: ScheduleJobDTO = {
        id: `sch-${Math.random().toString(16).slice(2, 6)}`,
        name: sName || "Untitled schedule",
        crawler_id: sCrawlerId,
        total_run: 0,
        last_run: "-",
        schedule_type: sType,
      };
      schedules.setData((prev) => ([...(prev ?? []), newRow]));
    }

    if (modal === "EDIT_SCHEDULE" && activeSchedule) {
      schedules.setData((prev) =>
        (prev ?? []).map((r) =>
          r.id === activeSchedule.id
            ? { ...r, name: sName || r.name, crawler_id: sCrawlerId, schedule_type: sType }
            : r
        )
      );
    }

    setModal("NONE");
  }

  function openCancelJob(row: JobHistoryDTO) {
    setActiveJob(row);
    setModal("CANCEL_JOB");
  }

  function confirmCancelJob() {
    if (!activeJob) return;

    jobs.setData((prev) =>
      (prev ?? []).map((r) => (r.job_id === activeJob.job_id ? { ...r, status: "CANCELED" } : r))
    );
    setModal("NONE");
  }

  return (
    <div className="cmRoot">
      <div className="cmHeader">
        <h2 className="cmTitle">Crawler Manager</h2>
      </div>

      {infoLoading && <div className="infoBox">Loading…</div>}
      {infoError && <div className="errorBox">{infoError}</div>}

      <div className="cmGridTop">
        {/* Crawler profile */}
        <section className="card cmCard">
          <div className="cardHeaderRow">
            <div className="cardTitle">Crawler profile</div>
            <button className="primaryBtn" onClick={openAddCrawler}>
              + Add crawler
            </button>
          </div>

          <div className="tableWrap">
            <table className="table">
              <thead>
                <tr>
                  <th>ID (UUID)</th>
                  <th>Name</th>
                  <th>Allow domain</th>
                  <th>Alert to</th>
                  <th>Bypass ddos</th>
                  <th>Session cookie</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {profileRows.map((r) => (
                  <tr key={r.id}>
                    <td className="mono">{r.id}</td>
                    <td className="bold">{r.name}</td>
                    <td>{r.allow_domains.join(", ")}</td>
                    <td>{r.alert_to}</td>
                    <td>{r.bypass_ddos ? "T" : "F"}</td>
                    <td>{r.session_cookie ? "T" : "F"}</td>
                    <td className="tdAction">
                      <button className="ghostBtn" onClick={() => openEditCrawler(r)}>
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}

                {!profiles.loading && profileRows.length === 0 && (
                  <tr>
                    <td colSpan={7} className="emptyCell">No data</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* Schedule job */}
        <section className="card cmCard">
          <div className="cardHeaderRow">
            <div className="cardTitle">Schedule Job</div>
            <button className="primaryBtn" onClick={openAddSchedule} disabled={crawlerIdOptions.length === 0}>
              + Add schedule
            </button>
          </div>

          <div className="tableWrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Crawler id</th>
                  <th>Total run</th>
                  <th>Last run</th>
                  <th>Schedule type</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {scheduleRows.map((r) => (
                  <tr key={r.id}>
                    <td className="bold">{r.name}</td>
                    <td className="mono">{r.crawler_id}</td>
                    <td className="mono">{r.total_run}</td>
                    <td className="mono">{r.last_run}</td>
                    <td>{r.schedule_type}</td>
                    <td className="tdAction">
                      <button className="ghostBtn" onClick={() => openEditSchedule(r)}>
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}

                {!schedules.loading && scheduleRows.length === 0 && (
                  <tr>
                    <td colSpan={6} className="emptyCell">No data</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {/* Job history */}
      <section className="card cmCard">
        <div className="cardHeaderRow">
          <div className="cardTitle">Job history</div>
          <div className="muted">Latest jobs (mock)</div>
        </div>

        <div className="tableWrap">
          <table className="table">
            <thead>
              <tr>
                <th>Job id</th>
                <th>Crawler name</th>
                <th>Crawler id</th>
                <th>Start at</th>
                <th>End at</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>

            <tbody>
              {jobRows.map((r) => (
                <tr key={r.job_id}>
                  <td className="mono">{r.job_id}</td>
                  <td className="bold">{r.crawler_name}</td>
                  <td className="mono">{r.crawler_id}</td>
                  <td className="mono">{r.start_at}</td>
                  <td className="mono">{r.end_at ?? "-"}</td>
                  <td>
                    <span
                      className={`status ${
                        r.status === "SUCCESS"
                          ? "ok"
                          : r.status === "FAILED"
                          ? "bad"
                          : r.status === "RUNNING"
                          ? "pending"
                          : "muted"
                      }`}
                    >
                      {r.status}
                    </span>
                  </td>
                  <td className="tdAction">
                    <button
                      className="dangerBtn"
                      onClick={() => openCancelJob(r)}
                      disabled={r.status === "SUCCESS" || r.status === "FAILED" || r.status === "CANCELED"}
                      title="Cancel running job"
                    >
                      Cancel
                    </button>
                  </td>
                </tr>
              ))}

              {!jobs.loading && jobRows.length === 0 && (
                <tr>
                  <td colSpan={7} className="emptyCell">No data</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* ✅ Workers status */}
      <section className="card cmCard">
        <div className="cardHeaderRow">
          <div className="cardTitle">Workers status</div>
          <div className="muted">Snapshot</div>
        </div>

        <div className="tableWrap">
          <table className="table">
            <thead>
              <tr>
                <th>Worker</th>
                <th>Status</th>
                <th>Active</th>
                <th>Processed</th>
                <th>Failed</th>
                <th>Succeeded</th>
                <th>Retried</th>
                <th>Load Average</th>
              </tr>
            </thead>

            <tbody>
              {workerRows.map((w) => (
                <tr key={w.worker}>
                  <td className="mono">{w.worker}</td>
                  <td>
                    <span className={`status ${w.status === "Online" ? "ok" : "bad"}`}>{w.status}</span>
                  </td>
                  <td className="mono">{w.active}</td>
                  <td className="mono">{w.processed}</td>
                  <td className="mono">{w.failed}</td>
                  <td className="mono">{w.succeeded}</td>
                  <td className="mono">{w.retried}</td>
                  <td className="mono">
                    {w.load_average[0].toFixed(2)}, {w.load_average[1].toFixed(2)}, {w.load_average[2].toFixed(2)}
                  </td>
                </tr>
              ))}

              {/* total row */}
              {workerRows.length > 0 && (
                <tr className="totalRow">
                  <td className="bold">Total</td>
                  <td className="muted">-</td>
                  <td className="mono bold">{workerTotals.active}</td>
                  <td className="mono bold">{workerTotals.processed}</td>
                  <td className="mono bold">{workerTotals.failed}</td>
                  <td className="mono bold">{workerTotals.succeeded}</td>
                  <td className="mono bold">{workerTotals.retried}</td>
                  <td className="muted">-</td>
                </tr>
              )}

              {!workers.loading && workerRows.length === 0 && (
                <tr>
                  <td colSpan={8} className="emptyCell">No data</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* ===== Modals ===== */}
      {modal !== "NONE" && (
        <div className="modalOverlay" onMouseDown={() => setModal("NONE")}>
          <div className="modalShell" onMouseDown={(e) => e.stopPropagation()}>
            <div className="modalHeader">
              <div className="modalTitle">
                {modal === "ADD_CRAWLER" && "Add crawler"}
                {modal === "EDIT_CRAWLER" && "Edit crawler"}
                {modal === "ADD_SCHEDULE" && "Add schedule"}
                {modal === "EDIT_SCHEDULE" && "Edit schedule"}
                {modal === "CANCEL_JOB" && "Cancel job"}
              </div>
              <button className="closeBtn" onClick={() => setModal("NONE")}>✕</button>
            </div>

            <div className="modalBody">
              {(modal === "ADD_CRAWLER" || modal === "EDIT_CRAWLER") && (
                <div className="formGrid">
                  <label className="field">
                    <div className="label">Name</div>
                    <input className="input" value={pName} onChange={(e) => setPName(e.target.value)} />
                  </label>

                  <label className="field">
                    <div className="label">Allow domain (comma-separated)</div>
                    <input className="input" value={pDomains} onChange={(e) => setPDomains(e.target.value)} />
                  </label>

                  <label className="field">
                    <div className="label">Alert to</div>
                    <input className="input" value={pAlertTo} onChange={(e) => setPAlertTo(e.target.value)} />
                  </label>

                  <div className="fieldRow">
                    <label className="check">
                      <input type="checkbox" checked={pBypass} onChange={(e) => setPBypass(e.target.checked)} />
                      <span>Bypass ddos (T/F)</span>
                    </label>

                    <label className="check">
                      <input type="checkbox" checked={pCookie} onChange={(e) => setPCookie(e.target.checked)} />
                      <span>Session cookie (T/F)</span>
                    </label>
                  </div>
                </div>
              )}

              {(modal === "ADD_SCHEDULE" || modal === "EDIT_SCHEDULE") && (
                <div className="formGrid">
                  <label className="field">
                    <div className="label">Name</div>
                    <input className="input" value={sName} onChange={(e) => setSName(e.target.value)} />
                  </label>

                  <label className="field">
                    <div className="label">Crawler id</div>
                    <select className="input" value={sCrawlerId} onChange={(e) => setSCrawlerId(e.target.value)}>
                      {crawlerIdOptions.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name} — {c.id}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="field">
                    <div className="label">Schedule type</div>
                    <select className="input" value={sType} onChange={(e) => setSType(e.target.value)}>
                      <option value="CRON">CRON</option>
                      <option value="INTERVAL">INTERVAL</option>
                      <option value="MANUAL">MANUAL</option>
                    </select>
                  </label>

                  <div className="hint">(วันหลังค่อยเพิ่ม cron expression/interval detail)</div>
                </div>
              )}

              {modal === "CANCEL_JOB" && (
                <div className="confirmBox">
                  <div className="confirmTitle">Confirm cancel?</div>
                  <div className="confirmText">
                    Job: <span className="mono">{activeJob?.job_id}</span>
                  </div>
                  <div className="confirmText muted">(ตอนนี้เปลี่ยนสถานะใน UI ก่อน — วันหลังค่อย POST ไป backend)</div>
                </div>
              )}
            </div>

            <div className="modalFooter">
              <button className="ghostBtn" onClick={() => setModal("NONE")}>Close</button>

              {(modal === "ADD_CRAWLER" || modal === "EDIT_CRAWLER") && (
                <button className="primaryBtn" onClick={saveCrawler}>Save</button>
              )}

              {(modal === "ADD_SCHEDULE" || modal === "EDIT_SCHEDULE") && (
                <button className="primaryBtn" onClick={saveSchedule}>Save</button>
              )}

              {modal === "CANCEL_JOB" && (
                <button className="dangerBtn" onClick={confirmCancelJob}>Confirm cancel</button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
