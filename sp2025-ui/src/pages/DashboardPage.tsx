import { useMemo, useState } from "react";
import { useDashboardAlerts, useDashboardSummary } from "@/features/dashboard/hooks";
import IssueDetailModal from "@/components/IssueDetailModal";
import "./dashboard.css";
import type { DashboardAlertRowDTO } from "@/features/dashboard/types";

export default function DashboardPage() {
  const [q, setQ] = useState("");
  const [pageSize, setPageSize] = useState(50);
  const [page, setPage] = useState(1);

  const summary = useDashboardSummary();
  const alerts = useDashboardAlerts(q, page, pageSize);

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

  const goPrev = () => {
    setSelectedIndex((i) => Math.max(0, i - 1));
  };

  const goNext = () => {
    setSelectedIndex((i) => Math.min(rows.length - 1, i + 1));
  };

  const onChangeComment = (v: string) => {
    if (!selectedRecord) return;
    setCommentById((prev) => ({ ...prev, [selectedRecord.id]: v }));
  };

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

          <section className="card">
            <div className="cardTitle">Severity</div>

            {!summaryData ? (
              <div className="muted">No data</div>
            ) : (
              <div className="sevList">
                {(["CRITICAL", "HIGH", "MED", "LOW"] as const).map((s) => (
                  <div key={s} className="sevRow">
                    <div className={`sevBadge sev_${s}`}>{s}</div>
                    <div className="sevValue">{summaryData.severity_counts[s]}</div>
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
                    <th>Keyword</th>
                    <th>AI Tags</th>
                    <th>Alert type</th>
                    <th>Post at</th>
                    <th>Date</th>
                    <th>Status</th>
                  </tr>
                </thead>

                <tbody>
                  {rows.map((r, idx) => (
                    <tr key={r.id} className="clickRow" onClick={() => openDetail(idx)}>
                      <td className="tdTopic">{r.topic_name}</td>
                      <td>{r.keyword}</td>
                      <td>
                        <div className="tagWrap">
                          {r.ai_tags.map((t) => (
                            <span key={t} className="pill">
                              {t}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td>{r.alert_type}</td>
                      <td>{r.post_at}</td>
                      <td>{r.date}</td>
                      <td>
                        <span className={`status ${r.status === "reviewed" ? "ok" : "pending"}`}>
                          {r.status}
                        </span>
                      </td>
                    </tr>
                  ))}

                  {!alerts.loading && rows.length === 0 && (
                    <tr>
                      <td colSpan={7} className="emptyCell">
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
                <div className="pageInfo">{safePage} / {totalPages}</div>
                <button className="pageBtn" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={safePage === totalPages}>
                  ▶
                </button>
              </div>
            </div>
          </section>
        </div>
      </div>

      {/* ===== Issue Detail Modal ===== */}
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
