import { useMemo, useState } from "react";
import "./crawlerManager.css";

import {
  useCrawlerProfiles,
  useJobHistory,
  useScheduleJobs,
  useWorkersStatus,
} from "@/features/crawlerManager/hooks";
import type {
  CrawlerProfileDTO,
  ScheduleJobDTO,
  JobHistoryDTO,
  CookieKV,
} from "@/features/crawlerManager/types";

type ModalMode =
  | "NONE"
  | "ADD_CRAWLER"
  | "EDIT_CRAWLER"
  | "ADD_SCHEDULE"
  | "EDIT_SCHEDULE"
  | "CANCEL_JOB";

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

  // ===== form states (Crawler) =====
  const [pName, setPName] = useState("");
  const [pDesc, setPDesc] = useState("");
  const [pDomains, setPDomains] = useState("");
  const [pStartUrl, setPStartUrl] = useState("");
  const [pAlertTo, setPAlertTo] = useState("");
  const [pBypass, setPBypass] = useState(false);
  const [pCookies, setPCookies] = useState<CookieKV[]>([{ name: "", value: "" }]);

  // ===== form states (Schedule) =====
  const [sName, setSName] = useState("");
  const [sEnabled, setSEnabled] = useState(true);
  const [sCrawlerId, setSCrawlerId] = useState("");
  const [sMode, setSMode] = useState<"INTERVAL" | "CRONTAB" | "CLOCKED">("INTERVAL");

  // Interval
  const [sEvery, setSEvery] = useState(2);
  const [sPeriod, setSPeriod] = useState<"seconds" | "minutes" | "hours" | "days">("minutes");

  // Crontab
  const [cMinute, setCMinute] = useState("30");
  const [cHour, setCHour] = useState("*");
  const [cDow, setCDow] = useState("*");
  const [cDom, setCDom] = useState("*");
  const [cMoy, setCMoy] = useState("*");

  // Clocked (datetime-local)
  const [clockLocal, setClockLocal] = useState(""); // "YYYY-MM-DDTHH:mm"

  const infoError = profiles.error || schedules.error || jobs.error || workers.error;
  const infoLoading = profiles.loading || schedules.loading || jobs.loading || workers.loading;

  const crawlerIdOptions = useMemo(
    () => profileRows.map((p) => ({ id: p.id, name: p.name })),
    [profileRows]
  );

  const workerTotals = useMemo(() => {
    const sum = { active: 0, processed: 0, failed: 0, succeeded: 0, retried: 0 };
    for (const w of workerRows) {
      sum.active += w.active;
      sum.processed += w.processed;
      sum.failed += w.failed;
      sum.succeeded += w.succeeded;
      sum.retried += w.retried;
    }
    return sum;
  }, [workerRows]);

  // ===== helpers =====
  function normalizeDomains(raw: string) {
    return raw
      .split(",")
      .map((x) => x.trim())
      .filter(Boolean);
  }

  function normalizeCookies(rows: CookieKV[]) {
    return (rows ?? [])
      .map((r) => ({ name: r.name?.trim() ?? "", value: r.value?.trim() ?? "" }))
      .filter((r) => r.name.length > 0 && r.value.length > 0);
  }

  function toBangkokISO(local: string) {
    // "YYYY-MM-DDTHH:mm" -> "YYYY-MM-DDTHH:mm:00+07:00"
    if (!local) return "";
    return `${local}:00+07:00`;
  }

  function fromBangkokISO(iso: string) {
    // "2025-12-15T09:30:00+07:00" -> "2025-12-15T09:30"
    if (!iso) return "";
    return iso.slice(0, 16);
  }

  // ===== crawler modal actions =====
  function openAddCrawler() {
    setActiveProfile(null);
    setPName("");
    setPDesc("");
    setPDomains("");
    setPStartUrl("");
    setPAlertTo("");
    setPBypass(false);
    setPCookies([{ name: "", value: "" }]);
    setModal("ADD_CRAWLER");
  }

  function openEditCrawler(row: CrawlerProfileDTO) {
    setActiveProfile(row);
    setPName(row.name);
    setPDesc(row.description);
    setPDomains(row.allow_domains.join(", "));
    setPStartUrl(row.start_url);
    setPAlertTo(row.alert_to);
    setPBypass(row.bypass_ddos);
    setPCookies(row.cookies?.length ? row.cookies : [{ name: "", value: "" }]);
    setModal("EDIT_CRAWLER");
  }

  function saveCrawler() {
    const domains = normalizeDomains(pDomains);
    const cookies = normalizeCookies(pCookies);

    if (modal === "ADD_CRAWLER") {
      const newRow: CrawlerProfileDTO = {
        id: genUUIDLike(),
        name: pName || "Untitled crawler",
        description: pDesc || "-",
        allow_domains: domains,
        start_url: pStartUrl || "-",
        alert_to: pAlertTo || "-",
        bypass_ddos: pBypass,
        cookies,
      };
      profiles.setData((prev) => [...(prev ?? []), newRow]);
    }

    if (modal === "EDIT_CRAWLER" && activeProfile) {
      profiles.setData((prev) =>
        (prev ?? []).map((r) =>
          r.id === activeProfile.id
            ? {
                ...r,
                name: pName || r.name,
                description: pDesc || r.description,
                allow_domains: domains,
                start_url: pStartUrl || r.start_url,
                alert_to: pAlertTo || r.alert_to,
                bypass_ddos: pBypass,
                cookies,
              }
            : r
        )
      );
    }

    setModal("NONE");
  }

  function addCookieRow() {
    setPCookies((prev) => [...prev, { name: "", value: "" }]);
  }

  function removeCookieRow(idx: number) {
    setPCookies((prev) => {
      const next = prev.filter((_, i) => i !== idx);
      return next.length ? next : [{ name: "", value: "" }];
    });
  }

  function updateCookieRow(idx: number, patch: Partial<CookieKV>) {
    setPCookies((prev) => prev.map((r, i) => (i === idx ? { ...r, ...patch } : r)));
  }

  // ===== schedule modal actions =====
  function openAddSchedule() {
    setActiveSchedule(null);
    setSName("");
    setSEnabled(true);
    setSCrawlerId(crawlerIdOptions[0]?.id ?? "");
    setSMode("INTERVAL");

    setSEvery(2);
    setSPeriod("minutes");

    setCMinute("30");
    setCHour("*");
    setCDow("*");
    setCDom("*");
    setCMoy("*");

    setClockLocal("");
    setModal("ADD_SCHEDULE");
  }

  function openEditSchedule(row: ScheduleJobDTO) {
    setActiveSchedule(row);
    setSName(row.name);
    setSEnabled(row.enabled);
    setSCrawlerId(row.crawler_id);
    setSMode(row.schedule_mode);

    // Interval
    setSEvery(row.interval?.every ?? 2);
    setSPeriod(row.interval?.period ?? "minutes");

    // Crontab
    setCMinute(row.crontab?.minute ?? "30");
    setCHour(row.crontab?.hour ?? "*");
    setCDow(row.crontab?.day_of_week ?? "*");
    setCDom(row.crontab?.day_of_month ?? "*");
    setCMoy(row.crontab?.month_of_year ?? "*");

    // Clocked
    setClockLocal(fromBangkokISO(row.clocked?.clocked_time ?? ""));

    setModal("EDIT_SCHEDULE");
  }

  function saveSchedule() {
    const base = {
      name: sName || "Untitled schedule",
      crawler_id: sCrawlerId,
      enabled: sEnabled,
      schedule_mode: sMode as ScheduleJobDTO["schedule_mode"],
    };

    const modePayload =
      sMode === "INTERVAL"
        ? {
            interval: { every: Math.max(1, Math.floor(sEvery)), period: sPeriod },
            crontab: undefined,
            clocked: undefined,
          }
        : sMode === "CRONTAB"
        ? {
            crontab: {
              minute: cMinute || "*",
              hour: cHour || "*",
              day_of_week: cDow || "*",
              day_of_month: cDom || "*",
              month_of_year: cMoy || "*",
            },
            interval: undefined,
            clocked: undefined,
          }
        : {
            clocked: { clocked_time: toBangkokISO(clockLocal) || "2025-12-15T09:30:00+07:00" },
            interval: undefined,
            crontab: undefined,
          };

    if (modal === "ADD_SCHEDULE") {
      const newRow: ScheduleJobDTO = {
        id: `sch-${Math.random().toString(16).slice(2, 6)}`,
        ...base,
        ...modePayload,
        total_run: 0,
        last_run: "-",
      };
      schedules.setData((prev) => [...(prev ?? []), newRow]);
    }

    if (modal === "EDIT_SCHEDULE" && activeSchedule) {
      schedules.setData((prev) =>
        (prev ?? []).map((r) => (r.id === activeSchedule.id ? { ...r, ...base, ...modePayload } : r))
      );
    }

    setModal("NONE");
  }

  // ===== job actions =====
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
                  <th>Description</th>
                  <th>Allow domain</th>
                  <th>Start url</th>
                  <th>To alert email</th>
                  <th>Cookies</th>
                  <th>Bypass ddos</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {profileRows.map((r) => (
                  <tr key={r.id}>
                    <td className="mono">{r.id}</td>
                    <td className="bold">{r.name}</td>
                    <td>{r.description}</td>
                    <td>{r.allow_domains.join(", ")}</td>
                    <td className="mono">{r.start_url}</td>
                    <td className="mono">{r.alert_to}</td>
                    <td className="mono">{r.cookies?.length ?? 0}</td>
                    <td>{r.bypass_ddos ? "T" : "F"}</td>
                    <td className="tdAction">
                      <button className="ghostBtn" onClick={() => openEditCrawler(r)}>
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}

                {!profiles.loading && profileRows.length === 0 && (
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
                  <th>Enabled</th>
                  <th>Mode</th>
                  <th>Crawler</th>
                  <th>Total run</th>
                  <th>Last run</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {scheduleRows.map((r) => {
                  const crawlerName = crawlerIdOptions.find((x) => x.id === r.crawler_id)?.name ?? "-";
                  return (
                    <tr key={r.id}>
                      <td className="bold">{r.name}</td>
                      <td>{r.enabled ? "T" : "F"}</td>
                      <td className="mono">{r.schedule_mode}</td>
                      <td className="mono">
                        {crawlerName} — {r.crawler_id}
                      </td>
                      <td className="mono">{r.total_run}</td>
                      <td className="mono">{r.last_run}</td>
                      <td className="tdAction">
                        <button className="ghostBtn" onClick={() => openEditSchedule(r)}>
                          Edit
                        </button>
                      </td>
                    </tr>
                  );
                })}

                {!schedules.loading && scheduleRows.length === 0 && (
                  <tr>
                    <td colSpan={7} className="emptyCell">
                      No data
                    </td>
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
                  <td colSpan={7} className="emptyCell">
                    No data
                  </td>
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
                  <td colSpan={8} className="emptyCell">
                    No data
                  </td>
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
              <button className="closeBtn" onClick={() => setModal("NONE")}>
                ✕
              </button>
            </div>

            <div className="modalBody">
              {(modal === "ADD_CRAWLER" || modal === "EDIT_CRAWLER") && (
                <div className="formGrid">
                  <label className="field">
                    <div className="label">Name</div>
                    <input className="input" value={pName} onChange={(e) => setPName(e.target.value)} />
                  </label>

                  <label className="field">
                    <div className="label">Description</div>
                    <input className="input" value={pDesc} onChange={(e) => setPDesc(e.target.value)} />
                  </label>

                  <label className="field">
                    <div className="label">Allow domain (comma-separated)</div>
                    <input className="input" value={pDomains} onChange={(e) => setPDomains(e.target.value)} />
                  </label>

                  <label className="field">
                    <div className="label">Start url</div>
                    <input
                      className="input"
                      value={pStartUrl}
                      onChange={(e) => setPStartUrl(e.target.value)}
                      placeholder="https://..."
                    />
                  </label>

                  <label className="field">
                    <div className="label">To alert email</div>
                    <input
                      className="input"
                      value={pAlertTo}
                      onChange={(e) => setPAlertTo(e.target.value)}
                      placeholder="name@org.com"
                    />
                  </label>

                  <div className="field">
                    <div className="label">Cookies (Cookie_name, value)</div>

                    <div className="cookieList">
                      {pCookies.map((c, idx) => (
                        <div className="cookieRow" key={idx}>
                          <input
                            className="input"
                            value={c.name}
                            onChange={(e) => updateCookieRow(idx, { name: e.target.value })}
                            placeholder="Cookie_name"
                          />
                          <input
                            className="input"
                            value={c.value}
                            onChange={(e) => updateCookieRow(idx, { value: e.target.value })}
                            placeholder="value"
                          />

                          <button
                            className="ghostBtn"
                            onClick={() => removeCookieRow(idx)}
                            title="Remove cookie row"
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>

                    <button className="ghostBtn" onClick={addCookieRow}>
                      + Add cookie row
                    </button>

                    <div className="hint">(ระบบจะเก็บเฉพาะแถวที่ name/value ไม่ว่างทั้งคู่)</div>
                  </div>

                  <div className="field">
                    <label className="check">
                      <input type="checkbox" checked={pBypass} onChange={(e) => setPBypass(e.target.checked)} />
                      <span>Bypass ddos</span>
                    </label>

                    <div className="ddosNote">
                      *not recommend since it very slow, check ddos protection by yourself by accessing directly to the
                      website
                    </div>
                  </div>
                </div>
              )}

              {(modal === "ADD_SCHEDULE" || modal === "EDIT_SCHEDULE") && (
                <div className="formGrid">
                  <label className="field">
                    <div className="label">Name</div>
                    <input className="input" value={sName} onChange={(e) => setSName(e.target.value)} />
                  </label>

                  <div className="fieldRow">
                    <label className="check">
                      <input type="checkbox" checked={sEnabled} onChange={(e) => setSEnabled(e.target.checked)} />
                      <span>Enable</span>
                    </label>
                  </div>

                  <label className="field">
                    <div className="label">Crawler (map scheduler → crawler)</div>
                    <select className="input" value={sCrawlerId} onChange={(e) => setSCrawlerId(e.target.value)}>
                      {crawlerIdOptions.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name} — {c.id}
                        </option>
                      ))}
                    </select>
                    <div className="hint">เลือก crawler ที่มีอยู่ในระบบเพื่อ mapped กับ scheduler</div>
                  </label>

                  <label className="field">
                    <div className="label">Schedule mode</div>
                    <select className="input" value={sMode} onChange={(e) => setSMode(e.target.value as any)}>
                      <option value="INTERVAL">Interval</option>
                      <option value="CRONTAB">Crontab</option>
                      <option value="CLOCKED">Clocked (run once)</option>
                    </select>
                    <div className="hint">** 1 scheduler ตั้งได้แค่ 1 รูปแบบเท่านั้น</div>
                  </label>

                  {/* ===== Mode: INTERVAL ===== */}
                  {sMode === "INTERVAL" && (
                    <div className="field">
                      <div className="label">Interval</div>

                      <div className="schedule2col">
                        <label className="field">
                          <div className="label small">every</div>
                          <input
                            className="input"
                            type="number"
                            min={1}
                            step={1}
                            value={sEvery}
                            onChange={(e) => setSEvery(Number(e.target.value || 1))}
                          />
                        </label>

                        <label className="field">
                          <div className="label small">period</div>
                          <select className="input" value={sPeriod} onChange={(e) => setSPeriod(e.target.value as any)}>
                            <option value="seconds">seconds</option>
                            <option value="minutes">minutes</option>
                            <option value="hours">hours</option>
                            <option value="days">days</option>
                          </select>
                        </label>
                      </div>

                      <div className="hint">
                        Must be an Integer greater than 0 (e.g., 1, 30, 60, 90) + period ∈
                        seconds/minutes/hours/days
                      </div>
                    </div>
                  )}

                  {/* ===== Mode: CRONTAB ===== */}
                  {sMode === "CRONTAB" && (
                    <div className="field">
                      <div className="label">Crontab</div>

                      <div className="cronGrid">
                        <label className="field">
                          <div className="label small">minute (0-59 or "*")</div>
                          <input className="input" value={cMinute} onChange={(e) => setCMinute(e.target.value)} />
                        </label>

                        <label className="field">
                          <div className="label small">hour (0-23 or "*")</div>
                          <input className="input" value={cHour} onChange={(e) => setCHour(e.target.value)} />
                        </label>

                        <label className="field">
                          <div className="label small">day_of_week (0-6 or "*")</div>
                          <input className="input" value={cDow} onChange={(e) => setCDow(e.target.value)} />
                        </label>

                        <label className="field">
                          <div className="label small">day_of_month (1-31 or "*")</div>
                          <input className="input" value={cDom} onChange={(e) => setCDom(e.target.value)} />
                        </label>

                        <label className="field">
                          <div className="label small">month_of_year (1-12 or "*")</div>
                          <input className="input" value={cMoy} onChange={(e) => setCMoy(e.target.value)} />
                        </label>
                      </div>

                      <div className="hint">ใส่ "*" เพื่อ wildcard หรือใส่เลขตามฟิลด์ (เช่น minute="30", hour="*")</div>
                    </div>
                  )}

                  {/* ===== Mode: CLOCKED ===== */}
                  {sMode === "CLOCKED" && (
                    <div className="field">
                      <div className="label">Clocked (run once)</div>

                      <label className="field">
                        <div className="label small">clocked_time (Bangkok +07:00)</div>
                        <input
                          className="input"
                          type="datetime-local"
                          value={clockLocal}
                          onChange={(e) => setClockLocal(e.target.value)}
                        />
                      </label>

                      <div className="hint">
                        ใช้ "+07:00" แทน "Z" เพื่อให้เป็น Bangkok timezone (เช่น 2025-12-15T09:30:00+07:00)
                      </div>
                    </div>
                  )}
                </div>
              )}

              {modal === "CANCEL_JOB" && (
                <div className="confirmBox">
                  <div className="confirmTitle">Confirm cancel?</div>
                  <div className="confirmText">
                    Job: <span className="mono">{activeJob?.job_id}</span>
                  </div>
                  <div className="confirmText muted">
                    (ตอนนี้เปลี่ยนสถานะใน UI ก่อน — วันหลังค่อย POST ไป backend)
                  </div>
                </div>
              )}
            </div>

            <div className="modalFooter">
              <button className="ghostBtn" onClick={() => setModal("NONE")}>
                Close
              </button>

              {(modal === "ADD_CRAWLER" || modal === "EDIT_CRAWLER") && (
                <button className="primaryBtn" onClick={saveCrawler}>
                  Save
                </button>
              )}

              {(modal === "ADD_SCHEDULE" || modal === "EDIT_SCHEDULE") && (
                <button className="primaryBtn" onClick={saveSchedule}>
                  Save
                </button>
              )}

              {modal === "CANCEL_JOB" && (
                <button className="dangerBtn" onClick={confirmCancelJob}>
                  Confirm cancel
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
