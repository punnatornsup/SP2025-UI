import { useMemo, useState } from "react";
import { useDashboardAlerts, useDashboardSummary, type DashboardColumnFilters } from "@/features/dashboard/hooks";
import IssueDetailModal from "@/components/IssueDetailModal";
import "./dashboard.css";
import type { DashboardAlertRowDTO, SeverityLevel } from "@/features/dashboard/types";

const SEVERITY_OPTIONS: Array<{ label: string; value: SeverityLevel | "" }> = [
  { label: "Severity", value: "" }, // placeholder = column name
  { label: "critical", value: "CRITICAL" },
  { label: "high", value: "HIGH" },
  { label: "medium", value: "MEDIUM" },
  { label: "low", value: "LOW" },
  { label: "info", value: "INFO" },
];

const STATUS_OPTIONS: Array<{ label: string; value: "" | "reviewed" | "unreviewed" }> = [
  { label: "Status", value: "" }, // placeholder = column name
  { label: "reviewed", value: "reviewed" },
  { label: "unreviewed", value: "unreviewed" },
];

export default function DashboardPage() {
  const [q, setQ] = useState("");
  const [pageSize, setPageSize] = useState(50);
  const [page, setPage] = useState(1);

  // ✅ Only 4 filter columns per req: Keyword, AI Tags, Severity, Status
  const [filters, setFilters] = useState<DashboardColumnFilters>({
    keyword_mode: "",
    keyword: "",
    ai_tags_mode: "",
    ai_tags: "",
    severity: "",
    status: "",
  });

  const summary = useDashboardSummary();
  const alerts = useDashboardAlerts(q, page, pageSize, filters);

  // ===== modal state =====
  const [open, setOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);
  const [commentById, setCommentById] = useState<Record<string, string>>({});

  const rows = alerts.data?.items ?? [];
  const total = alerts.data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(page, totalPages);

  const rangeText = useMemo(() => {
    if (!alerts.data) return "";
    const start = (alerts.data.page - 1) * alerts.data.page_size + 1;
    const end = Math.min(start + alerts.data.items.length - 1, alerts.data.total);
    return alerts.data.total ? `${start}-${end} of ${alerts.data.total}` : "0 results";
  }, [alerts.data]);

  const summaryData = summary.data;
  const topKeywordMax = summaryData?.top_keywords?.[0]?.count ?? 1;

  const selectedRecord: DashboardAlertRowDTO | null =
    selectedIndex >= 0 && selectedIndex < rows.length ? rows[selectedIndex] : null;

  const selectedComment = selectedRecord ? (commentById[selectedRecord.id] ?? "") : "";

  const openDetail = (idx: number) => {
    setSelectedIndex(idx);
    setOpen(true);
  };
  const closeDetail = () => setOpen(false);

  const hasPrev = selectedIndex > 0;
  const hasNext = selectedIndex >= 0 && selectedIndex < rows.length - 1;
  const goPrev = () => setSelectedIndex((i) => Math.max(0, i - 1));
  const goNext = () => setSelectedIndex((i) => Math.min(rows.length - 1, i + 1));

  const onChangeComment = (v: string) => {
    if (!selectedRecord) return;
    setCommentById((prev) => ({ ...prev, [selectedRecord.id]: v }));
  };

  // ===== helpers =====
  const normalizeSeverity = (r: DashboardAlertRowDTO): SeverityLevel => {
    if (r.severity) return r.severity;
    // fallback (when backend doesn't provide): empty tags => INFO else LOW
    return (r.ai_tags?.length ?? 0) === 0 ? "INFO" : "LOW";
  };

  const keywordText = (r: DashboardAlertRowDTO) => (r.keyword ?? "").trim();
  const isKeywordNA = (r: DashboardAlertRowDTO) => keywordText(r) === "";
  const isTagsNA = (r: DashboardAlertRowDTO) => (r.ai_tags?.length ?? 0) === 0;

  return (
    <div className="dashRoot">
      <div className="dashHeader">
        <h2 className="dashTitle">Dashboard</h2>
      </div>

      {(summary.loading || alerts.loading) && <div className="infoBox">Loading…</div>}
      {(summary.error || alerts.error) && <div className="errorBox">{summary.error || alerts.error}</div>}

      <div className="dashGrid">
        {/* LEFT */}
        <div className="dashLeft">
          <section className="card">
            <div className="cardTitle">Top Keywords</div>
            {!summaryData ? (
              <div className="muted">No data</div>
            ) : (
              <div className="topKwList">
                {summaryData.top_keywords.map((k) => (
                  <div key={k.keyword} className="topKwRow">
                    <div className="topKwLabel">{k.keyword}</div>
                    <div className="topKwBarWrap">
                      <div
                        className="topKwBar"
                        style={{ width: `${Math.min(100, (k.count / topKeywordMax) * 100)}%` }}
                      />
                    </div>
                    <div className="topKwCount">{k.count}</div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Severity standalone box: only 5 levels */}
          <section className="card">
            <div className="cardTitle">Severity</div>
            {!summaryData ? (
              <div className="muted">No data</div>
            ) : (
              <div className="sevList">
                {(["CRITICAL", "HIGH", "MEDIUM", "LOW", "INFO"] as const).map((s) => (
                  <div key={s} className="sevRow">
                    <div className={`sevBadge sev_${s}`}>{s}</div>
                    <div className="sevValue">{summaryData.severity_counts[s] ?? 0}</div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* RIGHT */}
        <div className="dashRight">
          <section className="card">
            <div className="searchRow">
              <input
                className="searchInput"
                placeholder="Search"
                value={q}
                onChange={(e) => {
                  setQ(e.target.value);
                  setPage(1);
                }}
              />
              <div className="searchMeta">{rangeText}</div>
            </div>
          </section>

          <section className="card tableCard">
            <div className="tableWrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Topic name</th>

                    {/* ✅ Keyword filter in header */}
                    <th>
                      <div className="thFilter">
                        <select
                          className="thSelect"
                          value={filters.keyword_mode ?? ""}
                          onChange={(e) => {
                            const v = e.target.value as "" | "NA" | "HAS";
                            setFilters((p) => ({ ...p, keyword_mode: v, keyword: v === "HAS" ? p.keyword ?? "" : "" }));
                            setPage(1);
                          }}
                        >
                          <option value="">Keyword</option>
                          <option value="">All</option>
                          <option value="NA">N/A</option>
                          <option value="HAS">Has value</option>
                        </select>

                        {(filters.keyword_mode ?? "") === "HAS" && (
                          <input
                            className="thInput"
                            value={filters.keyword ?? ""}
                            placeholder="contains…"
                            onChange={(e) => {
                              setFilters((p) => ({ ...p, keyword: e.target.value }));
                              setPage(1);
                            }}
                          />
                        )}
                      </div>
                    </th>

                    {/* ✅ AI Tags filter in header */}
                    <th>
                      <div className="thFilter">
                        <select
                          className="thSelect"
                          value={filters.ai_tags_mode ?? ""}
                          onChange={(e) => {
                            const v = e.target.value as "" | "NA" | "HAS";
                            setFilters((p) => ({ ...p, ai_tags_mode: v, ai_tags: v === "HAS" ? p.ai_tags ?? "" : "" }));
                            setPage(1);
                          }}
                        >
                          <option value="">AI Tags</option>
                          <option value="">All</option>
                          <option value="NA">N/A</option>
                          <option value="HAS">Has value</option>
                        </select>

                        {(filters.ai_tags_mode ?? "") === "HAS" && (
                          <input
                            className="thInput"
                            value={filters.ai_tags ?? ""}
                            placeholder="contains…"
                            onChange={(e) => {
                              setFilters((p) => ({ ...p, ai_tags: e.target.value }));
                              setPage(1);
                            }}
                          />
                        )}
                      </div>
                    </th>

                    <th>Alert type</th>
                    <th>Post at</th>
                    <th>Date</th>

                    {/* ✅ Severity dropdown in header */}
                    <th>
                      <select
                        className="thSelectSolo"
                        value={(filters.severity ?? "") as string}
                        onChange={(e) => {
                          setFilters((p) => ({ ...p, severity: (e.target.value as SeverityLevel) || "" }));
                          setPage(1);
                        }}
                      >
                        {SEVERITY_OPTIONS.map((o) => (
                          <option key={o.label} value={o.value}>
                            {o.label}
                          </option>
                        ))}
                      </select>
                    </th>

                    {/* ✅ Status dropdown in header */}
                    <th>
                      <select
                        className="thSelectSolo"
                        value={filters.status ?? ""}
                        onChange={(e) => {
                          const v = e.target.value as "" | "reviewed" | "unreviewed";
                          setFilters((p) => ({ ...p, status: v }));
                          setPage(1);
                        }}
                        
                      >
                        {STATUS_OPTIONS.map((o) => (
                          <option key={o.label} value={o.value}>
                            {o.label}
                          </option>
                        ))}
                      </select>
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {rows.map((r, idx) => {
                    const sev = normalizeSeverity(r);

                    return (
                      <tr key={r.id} className="clickRow" onClick={() => openDetail(idx)}>
                        <td className="tdTopic">{r.topic_name}</td>

                        {/* Keyword N/A */}
                        <td>{isKeywordNA(r) ? <span className="pill pillNA">N/A</span> : <span>{keywordText(r)}</span>}</td>

                        {/* AI Tags multi-tag join */}
                        <td>
                          <div className="tagWrap">
                            {isTagsNA(r) ? <span className="pill pillNA">N/A</span> : <span className="pill">{r.ai_tags.join(", ")}</span>}
                          </div>
                        </td>

                        <td>{r.alert_type}</td>
                        <td>{r.post_at}</td>
                        <td>{r.date}</td>

                        <td>
                          <span className={`pill sevPill sevPill_${sev}`}>{sev.toLowerCase()}</span>
                        </td>

                        <td>
                          <span className={`status ${r.status === "reviewed" ? "ok" : "pending"}`}>{r.status}</span>
                        </td>
                      </tr>
                    );
                  })}

                  {!alerts.loading && rows.length === 0 && (
                    <tr>
                      <td colSpan={8} className="emptyCell">
                        No data
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="tableFooter">
              <div className="footerLeft">
                <span className="muted">Items per page</span>
                <select
                  className="select"
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(parseInt(e.target.value, 10));
                    setPage(1);
                  }}
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>

              <div className="footerRight">
                <button className="pageBtn" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={safePage === 1}>
                  ◀
                </button>
                <div className="pageInfo">
                  {safePage} / {totalPages}
                </div>
                <button className="pageBtn" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={safePage === totalPages}>
                  ▶
                </button>
              </div>
            </div>
          </section>
        </div>
      </div>

      <IssueDetailModal
        open={open}
        record={selectedRecord}
        comment={selectedComment}
        onChangeComment={onChangeComment}
        onClose={closeDetail}
        onPrev={goPrev}
        onNext={goNext}
        hasPrev={hasPrev}
        hasNext={hasNext}
      />
    </div>
  );
}
