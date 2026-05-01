"use client";

import { useState, useEffect, useCallback } from "react";
import type { SessionUser } from "@/lib/types";
import { getLeave, getDept } from "@/lib/types";
import { formatDate, fmtTime } from "@/lib/utils";

const secStyle: React.CSSProperties = { fontSize: 13, fontWeight: 700, color: "#888", textTransform: "uppercase", letterSpacing: 1, marginBottom: 12 };
const avStyle: React.CSSProperties = { width: 34, height: 34, borderRadius: 10, background: "#212121", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700, flexShrink: 0 };

interface EntryRow {
  id: string;
  user_id: string;
  user_name: string;
  user_first: string;
  user_last: string;
  user_default_dept: string;
  date: string;
  department_id: string;
  start_time: string | null;
  end_time: string | null;
  break_mins: number;
  total_hours: number;
  leave_type: string | null;
  comment: string;
  status: string;
}

interface Props {
  user: SessionUser;
}

export default function Approve({ user: _user }: Props) {
  const [entries, setEntries] = useState<EntryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/approve");
    if (res.ok) {
      const data = await res.json();
      setEntries(data.entries ?? []);
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function act(ids: string[], action: "approve" | "reject" | "approve-all") {
    const firstId = ids[0];
    setActing(action === "approve-all" ? "all" : firstId);
    await fetch("/api/approve", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, ids }),
    });
    setActing(null);
    load();
  }

  // Group by user
  const groups: Record<string, EntryRow[]> = {};
  for (const e of entries) {
    if (!groups[e.user_id]) groups[e.user_id] = [];
    groups[e.user_id].push(e);
  }

  return (
    <div style={{ padding: 18 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={secStyle}>Pending ({entries.length})</div>
        {entries.length > 0 && (
          <button
            style={{ padding: "6px 14px", borderRadius: 8, border: "none", background: "#10b981", color: "#fff", fontSize: 12, fontWeight: 600, cursor: "pointer", opacity: acting === "all" ? 0.5 : 1, fontFamily: "inherit" }}
            onClick={() => act([], "approve-all")}
            disabled={acting === "all"}
          >
            Approve all
          </button>
        )}
      </div>

      {loading && (
        <div style={{ textAlign: "center", color: "#bbb", padding: "40px 20px", fontSize: 14 }}>Loading…</div>
      )}

      {!loading && entries.length === 0 && (
        <div style={{ textAlign: "center", color: "#bbb", padding: "40px 20px", fontSize: 14 }}>Nothing to approve.</div>
      )}

      {Object.keys(groups).map((uid) => {
        const ents = [...groups[uid]].sort((a, b) => (a.date > b.date ? 1 : -1));
        const first = ents[0];

        return (
          <div key={uid} style={{ background: "#fff", borderRadius: 14, padding: 14, marginBottom: 12, border: "1px solid #eee", boxShadow: "0 1px 4px rgba(0,0,0,.04)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
              <div style={avStyle}>{first.user_first?.[0] ?? "?"}</div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 15 }}>{first.user_name}</div>
                <div style={{ fontSize: 12, color: "#999" }}>{getDept(first.user_default_dept).name}</div>
              </div>
            </div>

            {ents.map((e) => {
              const lc = e.leave_type ? getLeave(e.leave_type) : null;
              const isActing = acting === e.id;

              return (
                <div key={e.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 0", borderTop: "1px solid #f5f5f5" }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 13, color: "#444" }}>{formatDate(e.date)}</div>
                    {e.leave_type ? (
                      <span style={{ padding: "2px 8px", borderRadius: 6, fontSize: 11, fontWeight: 600, background: (lc?.color ?? "#888") + "18", color: lc?.color ?? "#888" }}>
                        {e.leave_type}
                      </span>
                    ) : (
                      <div style={{ fontSize: 12, color: "#777", marginTop: 2 }}>
                        {fmtTime(e.start_time)}–{fmtTime(e.end_time)} · {e.break_mins}m break · <strong>{Number(e.total_hours).toFixed(1)}h</strong>
                        {e.comment && <span style={{ color: "#999" }}> · {e.comment}</span>}
                      </div>
                    )}
                    {e.department_id !== e.user_default_dept && (
                      <div style={{ fontSize: 11, color: "#e63946", marginTop: 2 }}>↳ {getDept(e.department_id).name}</div>
                    )}
                  </div>

                  <div style={{ display: "flex", gap: 6, opacity: isActing ? 0.5 : 1 }}>
                    <button
                      style={{ width: 36, height: 36, borderRadius: 10, border: "1px solid #fca5a5", background: "#fff", color: "#ef4444", fontSize: 16, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                      onClick={() => act([e.id], "reject")}
                      disabled={!!acting}
                    >
                      ✕
                    </button>
                    <button
                      style={{ width: 36, height: 36, borderRadius: 10, border: "none", background: "#10b981", color: "#fff", fontSize: 16, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                      onClick={() => act([e.id], "approve")}
                      disabled={!!acting}
                    >
                      ✓
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}
