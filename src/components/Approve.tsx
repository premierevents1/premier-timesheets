"use client";

import { useState, useEffect, useCallback } from "react";
import type { SessionUser } from "@/lib/types";
import { getLeave, getDept, LEAVE_TYPES } from "@/lib/types";
import { formatDate, fmtTime, calcHours } from "@/lib/utils";

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

interface EditForm {
  department_id: string;
  start_time: string;
  end_time: string;
  break_mins: number;
  leave_type: string;
  comment: string;
}

interface Props {
  user: SessionUser;
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "7px 10px",
  borderRadius: 8,
  border: "1px solid #e0e0e0",
  fontSize: 13,
  boxSizing: "border-box",
  fontFamily: "inherit",
  background: "#fafafa",
};

export default function Approve({ user: _user }: Props) {
  const [entries, setEntries] = useState<EntryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState<string | null>(null);
  const [editing, setEditing] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<EditForm | null>(null);
  const [saving, setSaving] = useState(false);
  const [rejecting, setRejecting] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");

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

  async function act(ids: string[], action: "approve" | "reject" | "approve-all", reason?: string) {
    const firstId = ids[0];
    setActing(action === "approve-all" ? "all" : firstId);
    await fetch("/api/approve", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, ids, reason }),
    });
    setActing(null);
    setRejecting(null);
    setRejectReason("");
    load();
  }

  function startEdit(e: EntryRow) {
    setEditing(e.id);
    setEditForm({
      department_id: e.department_id,
      start_time: fmtTime(e.start_time) || "09:00",
      end_time: fmtTime(e.end_time) || "17:00",
      break_mins: e.break_mins ?? 0,
      leave_type: e.leave_type ?? "",
      comment: e.comment ?? "",
    });
  }

  async function saveEdit() {
    if (!editing || !editForm) return;
    setSaving(true);
    await fetch(`/api/entries/${editing}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...editForm,
        leave_type: editForm.leave_type || null,
        managerApprove: true,
      }),
    });
    setSaving(false);
    setEditing(null);
    setEditForm(null);
    load();
  }

  // Group by user
  const groups: Record<string, EntryRow[]> = {};
  for (const e of entries) {
    if (!groups[e.user_id]) groups[e.user_id] = [];
    groups[e.user_id].push(e);
  }

  const isWorking = editForm && !editForm.leave_type;
  const previewHours = editForm && isWorking
    ? calcHours(editForm.start_time, editForm.end_time, editForm.break_mins)
    : null;

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
              const isEditingThis = editing === e.id;

              return (
                <div key={e.id} style={{ borderTop: "1px solid #f5f5f5" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 0" }}>
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
                        style={{ width: 36, height: 36, borderRadius: 10, border: "1px solid #d1d5db", background: isEditingThis ? "#f4f4f5" : "#fff", color: "#555", fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                        onClick={() => { isEditingThis ? (setEditing(null), setEditForm(null)) : startEdit(e); setRejecting(null); setRejectReason(""); }}
                        disabled={!!acting || saving}
                        title="Edit"
                      >
                        ✎
                      </button>
                      <button
                        style={{ width: 36, height: 36, borderRadius: 10, border: "1px solid #fca5a5", background: rejecting === e.id ? "#fef2f2" : "#fff", color: "#ef4444", fontSize: 16, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                        onClick={() => { setRejecting(rejecting === e.id ? null : e.id); setRejectReason(""); setEditing(null); setEditForm(null); }}
                        disabled={!!acting || saving}
                      >
                        ✕
                      </button>
                      <button
                        style={{ width: 36, height: 36, borderRadius: 10, border: "none", background: "#10b981", color: "#fff", fontSize: 16, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                        onClick={() => act([e.id], "approve")}
                        disabled={!!acting || saving}
                      >
                        ✓
                      </button>
                    </div>
                  </div>

                  {rejecting === e.id && (
                    <div style={{ background: "#fef2f2", borderRadius: 10, padding: 12, marginBottom: 8 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: "#ef4444", marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.5 }}>Reason for rejection</div>
                      <input
                        style={{ ...inputStyle, marginBottom: 8 }}
                        type="text"
                        placeholder="Optional — staff will see this"
                        value={rejectReason}
                        onChange={e2 => setRejectReason(e2.target.value)}
                      />
                      <div style={{ display: "flex", gap: 8 }}>
                        <button
                          style={{ flex: 1, padding: "9px 0", borderRadius: 8, border: "none", background: "#ef4444", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", opacity: acting ? 0.5 : 1 }}
                          onClick={() => act([e.id], "reject", rejectReason || undefined)}
                          disabled={!!acting}
                        >
                          {acting === e.id ? "Rejecting…" : "Confirm Reject"}
                        </button>
                        <button
                          style={{ padding: "9px 14px", borderRadius: 8, border: "1px solid #e0e0e0", background: "#fff", color: "#555", fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}
                          onClick={() => { setRejecting(null); setRejectReason(""); }}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}

                  {isEditingThis && editForm && (
                    <div style={{ background: "#f9fafb", borderRadius: 10, padding: 12, marginBottom: 8 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: "#888", marginBottom: 10, textTransform: "uppercase", letterSpacing: 0.5 }}>Edit entry</div>

                      {/* Working / Leave toggle */}
                      <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
                        <button
                          style={{ flex: 1, padding: "6px 0", borderRadius: 8, border: "none", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", background: isWorking ? "#212121" : "#e5e7eb", color: isWorking ? "#fff" : "#555" }}
                          onClick={() => setEditForm(f => f ? { ...f, leave_type: "" } : f)}
                        >Working</button>
                        <button
                          style={{ flex: 1, padding: "6px 0", borderRadius: 8, border: "none", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", background: !isWorking ? "#212121" : "#e5e7eb", color: !isWorking ? "#fff" : "#555" }}
                          onClick={() => setEditForm(f => f ? { ...f, leave_type: LEAVE_TYPES[0].label } : f)}
                        >Leave / TOIL</button>
                      </div>

                      {isWorking ? (
                        <>
                          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 8 }}>
                            <div>
                              <div style={{ fontSize: 11, color: "#888", marginBottom: 3 }}>Start</div>
                              <input style={inputStyle} type="time" value={editForm.start_time}
                                onChange={e => setEditForm(f => f ? { ...f, start_time: e.target.value } : f)} />
                            </div>
                            <div>
                              <div style={{ fontSize: 11, color: "#888", marginBottom: 3 }}>End</div>
                              <input style={inputStyle} type="time" value={editForm.end_time}
                                onChange={e => setEditForm(f => f ? { ...f, end_time: e.target.value } : f)} />
                            </div>
                          </div>
                          <div style={{ marginBottom: 8 }}>
                            <div style={{ fontSize: 11, color: "#888", marginBottom: 3 }}>Break</div>
                            <select style={inputStyle} value={editForm.break_mins}
                              onChange={e => setEditForm(f => f ? { ...f, break_mins: Number(e.target.value) } : f)}>
                              <option value={30}>30 min</option>
                              <option value={45}>45 min</option>
                              <option value={60}>1 hour</option>
                            </select>
                          </div>
                          {previewHours !== null && (
                            <div style={{ fontSize: 12, color: "#10b981", fontWeight: 600, marginBottom: 8 }}>
                              {previewHours.toFixed(1)} hours
                            </div>
                          )}
                        </>
                      ) : (
                        <div style={{ marginBottom: 8 }}>
                          <div style={{ fontSize: 11, color: "#888", marginBottom: 3 }}>Leave type</div>
                          <select style={inputStyle} value={editForm.leave_type}
                            onChange={e => setEditForm(f => f ? { ...f, leave_type: e.target.value } : f)}>
                            {LEAVE_TYPES.map(lt => (
                              <option key={lt.id} value={lt.label}>{lt.label}</option>
                            ))}
                          </select>
                        </div>
                      )}

                      <div style={{ marginBottom: 10 }}>
                        <div style={{ fontSize: 11, color: "#888", marginBottom: 3 }}>Job note</div>
                        <input style={inputStyle} type="text" placeholder="Optional" value={editForm.comment}
                          onChange={e => setEditForm(f => f ? { ...f, comment: e.target.value } : f)} />
                      </div>

                      <div style={{ display: "flex", gap: 8 }}>
                        <button
                          style={{ flex: 1, padding: "9px 0", borderRadius: 8, border: "none", background: "#10b981", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", opacity: saving ? 0.5 : 1 }}
                          onClick={saveEdit}
                          disabled={saving}
                        >
                          {saving ? "Saving…" : "Save & Approve"}
                        </button>
                        <button
                          style={{ padding: "9px 14px", borderRadius: 8, border: "1px solid #e0e0e0", background: "#fff", color: "#555", fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}
                          onClick={() => { setEditing(null); setEditForm(null); }}
                          disabled={saving}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}
