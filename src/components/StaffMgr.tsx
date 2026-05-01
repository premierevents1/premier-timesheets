"use client";

import { useState, useEffect, useCallback } from "react";
import { DEPARTMENTS } from "@/lib/types";

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "8px 10px", borderRadius: 8, border: "1px solid #e0e0e0",
  fontSize: 13, boxSizing: "border-box", fontFamily: "inherit", background: "#fafafa",
};
const selectStyle: React.CSSProperties = { ...{ width: "100%", padding: "8px 10px", borderRadius: 8, border: "1px solid #e0e0e0", fontSize: 13, boxSizing: "border-box", fontFamily: "inherit", background: "#fafafa" } };

interface StaffUser {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
  default_dept: string;
  manager_id: string | null;
  departments: string[];
}

const roleColours: Record<string, string> = {
  admin: "#e63946",
  manager: "#6366f1",
  staff: "#10b981",
};

const blank = (): Omit<StaffUser, "id"> => ({
  first_name: "", last_name: "", email: "", role: "staff",
  default_dept: "warehouse", manager_id: null, departments: ["warehouse"],
});

export default function StaffMgr() {
  const [staff, setStaff] = useState<StaffUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<string | null>(null); // user id or "new"
  const [form, setForm] = useState<Omit<StaffUser, "id">>(blank());
  const [saving, setSaving] = useState(false);
  const [newPin, setNewPin] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/staff");
    if (res.ok) {
      const data = await res.json();
      setStaff(data.staff ?? []);
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  function startEdit(u: StaffUser) {
    setEditing(u.id);
    setForm({ first_name: u.first_name, last_name: u.last_name, email: u.email, role: u.role, default_dept: u.default_dept, manager_id: u.manager_id, departments: u.departments });
    setNewPin(null);
  }

  function startNew() {
    setEditing("new");
    setForm(blank());
    setNewPin(null);
  }

  function cancel() { setEditing(null); setNewPin(null); }

  function toggleDept(d: string) {
    setForm(f => ({
      ...f,
      departments: f.departments.includes(d) ? f.departments.filter(x => x !== d) : [...f.departments, d],
    }));
  }

  async function save() {
    setSaving(true);
    if (editing === "new") {
      const res = await fetch("/api/staff", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form),
      });
      if (res.ok) {
        const data = await res.json();
        setNewPin(data.pin);
        await load();
        setEditing(null);
      }
    } else if (editing) {
      await fetch(`/api/staff/${editing}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form),
      });
      await load();
      setEditing(null);
    }
    setSaving(false);
  }

  const managers = staff.filter(u => u.role === "manager" || u.role === "admin");

  const formPanel = (
    <div style={{ background: "#f9fafb", borderRadius: 12, padding: 14, marginBottom: 12 }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: "#888", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 12 }}>
        {editing === "new" ? "New staff member" : "Edit staff member"}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 8 }}>
        <div>
          <div style={{ fontSize: 11, color: "#888", marginBottom: 3 }}>First name</div>
          <input style={inputStyle} value={form.first_name} onChange={e => setForm(f => ({ ...f, first_name: e.target.value }))} />
        </div>
        <div>
          <div style={{ fontSize: 11, color: "#888", marginBottom: 3 }}>Last name</div>
          <input style={inputStyle} value={form.last_name} onChange={e => setForm(f => ({ ...f, last_name: e.target.value }))} />
        </div>
      </div>

      <div style={{ marginBottom: 8 }}>
        <div style={{ fontSize: 11, color: "#888", marginBottom: 3 }}>Email</div>
        <input style={inputStyle} type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 8 }}>
        <div>
          <div style={{ fontSize: 11, color: "#888", marginBottom: 3 }}>Role</div>
          <select style={selectStyle} value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}>
            <option value="staff">Staff</option>
            <option value="manager">Manager</option>
            <option value="admin">Admin</option>
          </select>
        </div>
        <div>
          <div style={{ fontSize: 11, color: "#888", marginBottom: 3 }}>Default dept</div>
          <select style={selectStyle} value={form.default_dept} onChange={e => setForm(f => ({ ...f, default_dept: e.target.value }))}>
            {DEPARTMENTS.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
        </div>
      </div>

      <div style={{ marginBottom: 10 }}>
        <div style={{ fontSize: 11, color: "#888", marginBottom: 3 }}>Manager</div>
        <select style={selectStyle} value={form.manager_id ?? ""} onChange={e => setForm(f => ({ ...f, manager_id: e.target.value || null }))}>
          <option value="">— No manager</option>
          {managers.map(m => <option key={m.id} value={m.id}>{m.first_name} {m.last_name}</option>)}
        </select>
      </div>

      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 11, color: "#888", marginBottom: 6 }}>Department access</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {DEPARTMENTS.map(d => {
            const on = form.departments.includes(d.id);
            return (
              <button
                key={d.id}
                onClick={() => toggleDept(d.id)}
                style={{ padding: "4px 10px", borderRadius: 8, border: `1px solid ${on ? "#212121" : "#e0e0e0"}`, background: on ? "#212121" : "#fff", color: on ? "#fff" : "#666", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}
              >
                {d.name}
              </button>
            );
          })}
        </div>
      </div>

      <div style={{ display: "flex", gap: 8 }}>
        <button
          style={{ flex: 1, padding: "9px 0", borderRadius: 8, border: "none", background: "#212121", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", opacity: saving ? 0.5 : 1 }}
          onClick={save} disabled={saving}
        >
          {saving ? "Saving…" : editing === "new" ? "Add staff member" : "Save changes"}
        </button>
        <button
          style={{ padding: "9px 14px", borderRadius: 8, border: "1px solid #e0e0e0", background: "#fff", color: "#555", fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}
          onClick={cancel} disabled={saving}
        >
          Cancel
        </button>
      </div>
    </div>
  );

  return (
    <div style={{ padding: 18 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#888", textTransform: "uppercase", letterSpacing: 1 }}>Staff ({staff.length})</div>
        {editing !== "new" && (
          <button
            style={{ padding: "6px 14px", borderRadius: 8, border: "none", background: "#212121", color: "#fff", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}
            onClick={startNew}
          >
            + Add staff
          </button>
        )}
      </div>

      {newPin && (
        <div style={{ background: "#ecfdf5", border: "1px solid #6ee7b7", borderRadius: 10, padding: 14, marginBottom: 14, fontSize: 13 }}>
          <div style={{ fontWeight: 700, color: "#065f46", marginBottom: 4 }}>Staff member added!</div>
          <div style={{ color: "#065f46" }}>Their starting PIN is <strong style={{ fontSize: 16 }}>{newPin}</strong> — give this to them in person. They can change it via the PINs tab.</div>
          <button style={{ marginTop: 8, background: "none", border: "none", color: "#065f46", fontSize: 12, cursor: "pointer", fontFamily: "inherit", textDecoration: "underline" }} onClick={() => setNewPin(null)}>Dismiss</button>
        </div>
      )}

      {editing === "new" && formPanel}

      {loading ? (
        <div style={{ textAlign: "center", color: "#bbb", padding: "40px 0", fontSize: 14 }}>Loading…</div>
      ) : (
        staff.map(u => (
          <div key={u.id}>
            <div style={{ background: "#fff", borderRadius: 12, padding: 12, marginBottom: 8, border: "1px solid #eee", boxShadow: "0 1px 3px rgba(0,0,0,.04)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 34, height: 34, borderRadius: 10, background: "#212121", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700, flexShrink: 0 }}>
                  {u.first_name[0]}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>{u.first_name} {u.last_name}</div>
                  <div style={{ fontSize: 11, color: "#999", marginTop: 1 }}>{u.email}</div>
                </div>
                <span style={{ padding: "2px 8px", borderRadius: 6, fontSize: 11, fontWeight: 700, background: (roleColours[u.role] ?? "#888") + "18", color: roleColours[u.role] ?? "#888", textTransform: "capitalize" }}>
                  {u.role}
                </span>
                {editing !== u.id && (
                  <button
                    style={{ padding: "5px 12px", borderRadius: 8, border: "1px solid #e0e0e0", background: "#fff", color: "#555", fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}
                    onClick={() => startEdit(u)}
                  >
                    Edit
                  </button>
                )}
              </div>

              <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 8 }}>
                {u.departments.map(d => {
                  const dept = DEPARTMENTS.find(x => x.id === d);
                  return dept ? (
                    <span key={d} style={{ padding: "2px 8px", borderRadius: 6, fontSize: 11, background: "#f4f4f5", color: "#555", fontWeight: 500 }}>
                      {dept.name}
                    </span>
                  ) : null;
                })}
              </div>
            </div>

            {editing === u.id && formPanel}
          </div>
        ))
      )}
    </div>
  );
}
