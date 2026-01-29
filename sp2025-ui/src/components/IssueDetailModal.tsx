import { useEffect } from "react";
import type { DashboardAlertRowDTO, SeverityLevel } from "@/features/dashboard/types";
import "./issueDetailModal.css";

type Props = {
  open: boolean;
  record: DashboardAlertRowDTO | null;
  comment: string;
  onChangeComment: (v: string) => void;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
  hasPrev: boolean;
  hasNext: boolean;
};

function sevClass(sev?: SeverityLevel) {
  if (!sev) return "sevPill";
  return `sevPill sev_${sev}`;
}

export default function IssueDetailModal({
  open,
  record,
  comment,
  onChangeComment,
  onClose,
  onPrev,
  onNext,
  hasPrev,
  hasNext,
}: Props) {
  // ปิดด้วย ESC
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft" && hasPrev) onPrev();
      if (e.key === "ArrowRight" && hasNext) onNext();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose, onPrev, onNext, hasPrev, hasNext]);

  if (!open || !record) return null;

  return (
    <div className="modalOverlay" onMouseDown={onClose}>
      <div className="modalShell" onMouseDown={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modalHeader">
          <div className="modalHeaderLeft">
            <div className="modalTitle">Issue Details</div>

            <div className="navGroup" aria-label="Navigate records">
              <button
                className="navArrow"
                onClick={onPrev}
                disabled={!hasPrev}
                aria-label="Previous"
                type="button"
              >
                ‹
              </button>

              <button
                className="navArrow"
                onClick={onNext}
                disabled={!hasNext}
                aria-label="Next"
                type="button"
              >
                ›
              </button>
            </div>
          </div>

          <button className="closeBtn" onClick={onClose} aria-label="Close" type="button">
            ✕
          </button>
        </div>


        {/* Body */}
        <div className="modalBody">
          {/* LEFT: details + content */}
          <div className="modalLeft">
            <div className="detailGrid">
              <div className="detailItem">
                <div className="detailLabel">Severity</div>
                <div className={sevClass(record.severity)}>{record.severity ?? "-"}</div>
              </div>

              <div className="detailItem">
                <div className="detailLabel">Final score</div>
                <div className="detailValue">{record.final_score ?? "-"}</div>
              </div>

              <div className="detailItem">
                <div className="detailLabel">Fetched date</div>
                <div className="detailValue">{record.fetched_at ?? "-"}</div>
              </div>

              <div className="detailItem">
                <div className="detailLabel">Post date</div>
                <div className="detailValue">{record.post_at ?? "-"}</div>
              </div>

              <div className="detailItem fullSpan">
                <div className="detailLabel">Full URL</div>
                <div className="detailValue">
                  {record.full_url ? (
                    <a className="urlLink" href={record.full_url} target="_blank" rel="noreferrer">
                      {record.full_url}
                    </a>
                  ) : (
                    "-"
                  )}
                </div>
              </div>
            </div>

            <div className="contentBox">
              <div className="contentHeader">
                <div className="contentTitle">Content</div>
                <div className="contentMeta">{record.topic_name}</div>
              </div>
              <div className="contentScroll">
                {record.content ? record.content : "No content"}
              </div>
            </div>
          </div>

          {/* RIGHT: metadata + comment */}
          <div className="modalRight">
            <div className="sideCard">
              <div className="kvRow">
                <div className="kvKey">ID</div>
                <div className="kvVal">{record.id}</div>
              </div>

              <div className="kvRow">
                <div className="kvKey">Keyword</div>
                <div className="kvVal">{record.keyword}</div>
              </div>

              <div className="kvRow">
                <div className="kvKey">AI tags</div>
                <div className="kvVal">
                  <div className="tagWrap">
                    {(record.ai_tags ?? []).map((t) => (
                      <span key={t} className="pill">
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="kvRow">
                <div className="kvKey">Crawler id</div>
                <div className="kvVal">{record.crawler_id ?? "-"}</div>
              </div>

              <div className="kvRow">
                <div className="kvKey">Status</div>
                <div className="kvVal">{record.status}</div>
              </div>

              <div className="commentBlock">
                <div className="kvKey">Comment</div>
                <textarea
                  className="commentBox"
                  placeholder="Write a comment..."
                  value={comment}
                  onChange={(e) => onChangeComment(e.target.value)}
                />
                <div className="hint">
                  (ตอนนี้ comment เก็บใน state ฝั่ง UI ก่อน — วันหลังค่อย POST ไป backend)
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="modalFooter">
          <div className="footerHint">Tip: ใช้ปุ่มลูกศรคีย์บอร์ด ← / → เพื่อเลื่อนได้</div>
        </div>
      </div>
    </div>
  );
}
