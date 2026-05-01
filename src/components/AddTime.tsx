"use client";

import { useState, useEffect } from "react";
import type { SessionUser, TimesheetEntry } from "@/lib/types";
import { DEPARTMENTS, LEAVE_TYPES, getDept } from "@/lib/types";
import { todayKey, yesterdayKey, formatDate, calcHours } from "@/lib/utils";

const lblStyle: React.CSSProperties = { fontSize: 12, fontWeight: 700, color: "#888", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 6 };
const inputStyle: React.CSSProperties = { width: "100%", padding: "10px 12px", borderRadius: 10, border: "1px solid #ddd", fontSize: 15, boxSizing: "border-box", background: "#fff", fontFamily: "inherit" };
const chip: React.CSSProperties = { padding: "8px 14px", borderRadius: 10, border: "2px solid #e5e5e5", background: "#fff", fontSize: 13, fontWeight: 600, color: "#555", cursor: "pointer", fontFamily: "inherit" };
const chipAct: React.CSSProperties = { padding: "8px 14px", borderRadius: 10, border: "2px solid #e63946", background: "#fff5f5", fontSize: 13, fontWeight: 600, color: "#e63946", cursor: "pointer", fontFamily: "inherit" };
const togBase: React.CSSProperties = { flex: 1, padding: "11px 0", borderRadius: 10, border: "2px solid #e5e5e5", background: "#fff", fontSize: 13, fontWeight: 600, color: "#888", cursor: "pointer", textAlign: "center", fontFamily: "inherit" };
const btnStyle: React.CSSProperties = { width: "100%", padding: "15px 0", borderRadius: 14, border: "none", background: "#e63946", color: "#fff", fontSize: 16, fontWeight: 700, cursor: "pointer", boxShadow: "0 4px 16px rgba(230,57,70,.25)", fontFamily: "inherit" };

interface Props {
  user: SessionUser;
  editEntry?: TimesheetEntry;
  onDone?: () => void;
}

export default function AddTime({ user, editEntry, onDone }: Props) {
  const today = todayKey();
  const yest = yesterdayKey();

  const initDept = editEntry?.department_id ?? user.default_dept;
  const defDept = getDept(initDept);

  const [date, setDate] = useState(editEntry?.date ?? today);
  const [type, setType] = useState<"work" | "leave">(editEntry?.leave_type ? "leave" : "work");
  const [leaveId, setLeaveId] = useState(() => {
    if (!editEntry?.leave_type) return "annual";
    return LEAVE_TYPES.find((l) => l.label === editEntry.leave_type)?.id ?? "annual";
  });
  const [dept, setDept] = useState(initDept);
  const [start, setStart] = useState(editEntry?.start_time ?? defDept.default_start);
  const [end, setEnd] = useState(editEntry?.end_time ?? defDept.default_end);
  const [brk, setBrk] = useState(String(editEntry?.break_mins ?? defDept.default_break));
  const [cmt, setCmt] = useState(editEntry?.comment ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [dupError, setDupError] = useState(false);

  const isFuture = date > today;
  const hrs = calcHours(start, end, parseInt(brk) || 0);
  const userDepts = DEPARTMENTS.filter((d) => user.departments.includes(d.id));

  function changeDept(newDept: string) {
    setDept(newDept);
    if (!editEntry) {
      const d = getDept(newDept);
      setStart(d.default_start);
      setEnd(d.default_end);
      setBrk(String(d.default_break));
    }
  }

  // Reset dup error when date changes
  useEffect(() => { setDupError(false); }, [date]);

  async function save() {
    if (isFuture || saving) return;
    setSaving(true);
    setDupError(false);

    const body = {
      department_id: dept,
      start_time: type === "work" ? start : null,
      end_time: type === "work" ? end : null,
      break_mins: type === "work" ? parseInt(brk) || 0 : 0,
      leave_type: type === "leave" ? (LEAVE_TYPES.find((l) => l.id === leaveId)?.label ?? null) : null,
      comment: cmt.trim(),
      ...(!editEntry ? { date } : {}),
    };

    const url = editEntry ? `/api/entries/${editEntry.id}` : "/api/entries";
    const method = editEntry ? "PATCH" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    setSaving(false);

    if (res.status === 409) {
      setDupError(true);
      return;
    }

    if (res.ok) {
      setSaved(true);
      setCmt("");
      if (onDone) {
        setTimeout(onDone, 1200);
      } else {
        setTimeout(() => setSaved(false), 2500);
      }
    }
  }

  return (
    <div style={{ padding: 18 }}>
      {editEntry && (
        <div style={{ fontSize: 15, fontWeight: 700, color: "#e63946", marginBottom: 14 }}>
          Editing: {formatDate(editEntry.date)}
        </div>
      )}

      {/* Date picker */}
      {!editEntry && (
        <div>
          <div style={lblStyle}>Date</div>
          <div style={{ display: "flex", gap: 8, marginBottom: 18, flexWrap: "wrap" }}>
            <button style={date === today ? chipAct : chip} onClick={() => setDate(today)}>Today</button>
            <button style={date === yest ? chipAct : chip} onClick={() => setDate(yest)}>Yesterday</button>
            <input
              type="date"
              max={today}
              style={{
                ...chip,
                borderColor: (date !== today && date !== yest && !isFuture) ? "#e63946" : "#e5e5e5",
                color: (date !== today && date !== yest && !isFuture) ? "#e63946" : "#555",
                background: (date !== today && date !== yest && !isFuture) ? "#fff5f5" : "#fff",
              }}
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
        </div>
      )}

      {isFuture && (
        <div style={{ background: "#fee2e2", border: "1px solid #fca5a5", borderRadius: 10, padding: "10px 14px", fontSize: 13, color: "#b91c1c", marginBottom: 16 }}>
          You can&apos;t add a timesheet for a future date.
        </div>
      )}
      {dupError && (
        <div style={{ background: "#fef3c7", border: "1px solid #fcd34d", borderRadius: 10, padding: "10px 14px", fontSize: 13, color: "#92400e", marginBottom: 16 }}>
          You already have an entry for {formatDate(date)}.
        </div>
      )}

      {/* Working / Leave toggle */}
      <div style={{ display: "flex", gap: 8, marginBottom: 18 }}>
        <button
          style={type === "work" ? { ...togBase, borderColor: "#10b981", color: "#10b981", background: "#ecfdf5" } : togBase}
          onClick={() => setType("work")}
        >
          Working
        </button>
        <button
          style={type === "leave" ? { ...togBase, borderColor: "#6366f1", color: "#6366f1", background: "#eef2ff" } : togBase}
          onClick={() => setType("leave")}
        >
          Leave / TOIL
        </button>
      </div>

      {type === "leave" ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 18 }}>
          {LEAVE_TYPES.map((lt) => {
            const sel = leaveId === lt.id;
            return (
              <button
                key={lt.id}
                style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", borderRadius: 12, border: `2px solid ${sel ? lt.color : "#e5e5e5"}`, background: sel ? lt.color + "18" : "#fff", cursor: "pointer", fontFamily: "inherit" }}
                onClick={() => setLeaveId(lt.id)}
              >
                <span style={{ fontSize: 22 }}>{lt.icon}</span>
                <span style={{ fontWeight: 600, fontSize: 13, color: sel ? lt.color : "#555" }}>{lt.label}</span>
              </button>
            );
          })}
        </div>
      ) : (
        <div>
          <div style={lblStyle}>Department</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 18 }}>
            {userDepts.map((d) => (
              <button key={d.id} style={dept === d.id ? chipAct : chip} onClick={() => changeDept(d.id)}>
                {d.name}
              </button>
            ))}
          </div>

          <div style={{ display: "flex", gap: 10, marginBottom: 12 }}>
            <div style={{ flex: 1 }}>
              <div style={lblStyle}>Start</div>
              <input type="time" style={inputStyle} value={start} onChange={(e) => setStart(e.target.value)} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={lblStyle}>End</div>
              <input type="time" style={inputStyle} value={end} onChange={(e) => setEnd(e.target.value)} />
            </div>
            <div style={{ flex: 0.7 }}>
              <div style={lblStyle}>Break</div>
              <select style={inputStyle} value={brk} onChange={(e) => setBrk(e.target.value)}>
                <option value="30">30m</option>
                <option value="45">45m</option>
                <option value="60">1hr</option>
              </select>
            </div>
          </div>

          <div style={{ textAlign: "center", padding: "8px 0 16px" }}>
            <span style={{ fontSize: 32, fontWeight: 200, color: "#212121" }}>{hrs.toFixed(1)}</span>
            <span style={{ fontSize: 15, color: "#888" }}> hours</span>
          </div>

          <input
            style={{ ...inputStyle, marginBottom: 18 }}
            placeholder="Job note — e.g. confex, hotthorpe hotel…"
            value={cmt}
            onChange={(e) => setCmt(e.target.value)}
          />
        </div>
      )}

      <button
        style={{ ...btnStyle, opacity: isFuture || saving ? 0.45 : 1 }}
        onClick={save}
        disabled={isFuture || saving}
      >
        {saved ? "✓ Saved!" : saving ? "Saving…" : editEntry ? "Update Timesheet" : "Submit Timesheet"}
      </button>

      {saved && !editEntry && (
        <div style={{ textAlign: "center", fontSize: 13, color: "#10b981", fontWeight: 600, marginTop: 10 }}>
          Sent for approval
        </div>
      )}

      {editEntry && !saved && (
        <button
          style={{ background: "none", border: "none", color: "#888", fontSize: 13, marginTop: 12, cursor: "pointer", display: "block", width: "100%", textAlign: "center", fontFamily: "inherit" }}
          onClick={onDone}
        >
          Cancel
        </button>
      )}
    </div>
  );
}
