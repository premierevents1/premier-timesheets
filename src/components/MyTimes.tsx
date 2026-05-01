"use client";

import { useState, useEffect, useCallback } from "react";
import type { SessionUser, TimesheetEntry } from "@/lib/types";
import { getLeave } from "@/lib/types";
import { formatDate, mondayOfWeek } from "@/lib/utils";
import AddTime from "./AddTime";

const secStyle: React.CSSProperties = { fontSize: 13, fontWeight: 700, color: "#888", textTransform: "uppercase", letterSpacing: 1, marginBottom: 12 };

interface Props {
  user: SessionUser;
}

export default function MyTimes({ user }: Props) {
  const [entries, setEntries] = useState<TimesheetEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<TimesheetEntry | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/entries");
    if (res.ok) {
      const data = await res.json();
      setEntries(data.entries ?? []);
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  if (editing) {
    return (
      <AddTime
        user={user}
        editEntry={editing}
        onDone={() => { setEditing(null); load(); }}
      />
    );
  }

  if (loading) {
    return (
      <div style={{ padding: 18, textAlign: "center", color: "#bbb", paddingTop: 48 }}>
        Loading…
      </div>
    );
  }

  // Group by week
  const sorted = [...entries].sort((a, b) => (b.date > a.date ? 1 : -1));
  const weekMap: Record<string, { entries: TimesheetEntry[]; hrs: number }> = {};

  for (const e of sorted) {
    const wk = mondayOfWeek(e.date);
    if (!weekMap[wk]) weekMap[wk] = { entries: [], hrs: 0 };
    weekMap[wk].entries.push(e);
    if (e.total_hours) weekMap[wk].hrs += Number(e.total_hours);
  }

  const weekKeys = Object.keys(weekMap).sort().reverse();

  return (
    <div style={{ padding: 18 }}>
      <div style={secStyle}>My Timesheets</div>

      {entries.length === 0 && (
        <div style={{ textAlign: "center", color: "#bbb", padding: "40px 20px", fontSize: 14 }}>
          No entries yet.
        </div>
      )}

      {weekKeys.map((wk) => {
        const week = weekMap[wk];
        const weekEntries = [...week.entries].sort((a, b) => (a.date > b.date ? 1 : -1));

        return (
          <div key={wk} style={{ marginBottom: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "2px solid #212121", marginBottom: 4, fontSize: 13, fontWeight: 700 }}>
              <span>w/c {formatDate(wk)}</span>
              <span style={{ color: "#e63946", fontWeight: 800 }}>{week.hrs.toFixed(1)}h</span>
            </div>

            {weekEntries.map((e) => {
              const lc = e.leave_type ? getLeave(e.leave_type) : null;
              const dotCol = e.status === "approved" ? "#10b981" : e.status === "rejected" ? "#ef4444" : "#f59e0b";

              return (
                <div
                  key={e.id}
                  style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 0", borderBottom: "1px solid #f0f0f2", fontSize: 13 }}
                >
                  <div style={{ flex: 1.3, fontWeight: 600, color: "#444" }}>{formatDate(e.date)}</div>
                  <div style={{ flex: 2.5, color: "#666" }}>
                    {e.leave_type ? (
                      <span style={{ padding: "2px 8px", borderRadius: 6, fontSize: 11, fontWeight: 600, background: (lc?.color ?? "#888") + "18", color: lc?.color ?? "#888" }}>
                        {e.leave_type}
                      </span>
                    ) : (
                      <span style={{ fontVariantNumeric: "tabular-nums" }}>
                        {e.start_time} → {e.end_time}
                      </span>
                    )}
                  </div>
                  <div style={{ flex: 0.6, textAlign: "right", fontWeight: 700, color: "#212121", fontSize: 14 }}>
                    {e.total_hours ? Number(e.total_hours).toFixed(1) + "h" : ""}
                  </div>
                  <div style={{ width: 8, height: 8, borderRadius: 4, flexShrink: 0, background: dotCol }} />
                  {e.status === "pending" && (
                    <button
                      style={{ background: "none", border: "none", color: "#e63946", fontSize: 11, fontWeight: 700, cursor: "pointer", padding: "2px 6px", fontFamily: "inherit" }}
                      onClick={() => setEditing(e)}
                    >
                      Edit
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        );
      })}

      {entries.length > 0 && (
        <div style={{ display: "flex", gap: 16, justifyContent: "center", padding: "16px 0", fontSize: 12, color: "#888" }}>
          {[
            { col: "#f59e0b", label: "Pending" },
            { col: "#10b981", label: "Approved" },
            { col: "#ef4444", label: "Rejected" },
          ].map(({ col, label }) => (
            <span key={label}>
              <span style={{ display: "inline-block", width: 8, height: 8, borderRadius: 4, background: col, verticalAlign: "middle", marginRight: 4 }} />
              {label}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
