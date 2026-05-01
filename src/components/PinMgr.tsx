"use client";

import { useState, useEffect, useCallback } from "react";
import type { SessionUser } from "@/lib/types";
import { getDept } from "@/lib/types";

const secStyle: React.CSSProperties = { fontSize: 13, fontWeight: 700, color: "#888", textTransform: "uppercase", letterSpacing: 1, marginBottom: 12 };
const avStyle: React.CSSProperties = { width: 34, height: 34, borderRadius: 10, background: "#212121", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700, flexShrink: 0 };

interface TeamMember {
  id: string;
  name: string;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
  default_dept: string;
}

interface Props {
  user: SessionUser;
}

export default function PinMgr({ user: _user }: Props) {
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [resetMap, setResetMap] = useState<Record<string, string>>({});
  const [resetting, setResetting] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/pins/reset");
    if (res.ok) {
      const data = await res.json();
      setTeam(data.users ?? []);
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function resetPin(member: TeamMember) {
    setResetting(member.id);
    const res = await fetch("/api/pins/reset", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ targetUserId: member.id }),
    });
    if (res.ok) {
      const data = await res.json();
      setResetMap((prev) => ({ ...prev, [member.id]: data.pin }));
    }
    setResetting(null);
  }

  return (
    <div style={{ padding: 18 }}>
      <div style={secStyle}>Team PINs</div>
      <div style={{ fontSize: 13, color: "#888", marginBottom: 16, lineHeight: 1.5 }}>
        Reset a team member&apos;s PIN. Give them the new code verbally.
      </div>

      {loading && (
        <div style={{ textAlign: "center", color: "#bbb", padding: "40px 20px", fontSize: 14 }}>Loading…</div>
      )}

      {!loading && team.length === 0 && (
        <div style={{ textAlign: "center", color: "#bbb", padding: "40px 20px", fontSize: 14 }}>No team members found.</div>
      )}

      {team.map((member) => (
        <div
          key={member.id}
          style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 0", borderBottom: "1px solid #f0f0f2" }}
        >
          <div style={avStyle}>{member.first_name[0]}</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 600, fontSize: 14 }}>{member.first_name} {member.last_name}</div>
            <div style={{ fontSize: 12, color: "#999" }}>{getDept(member.default_dept).name}</div>
            {resetMap[member.id] && (
              <div style={{ fontSize: 13, color: "#10b981", marginTop: 4 }}>
                New PIN: <strong style={{ letterSpacing: 2 }}>{resetMap[member.id]}</strong>
              </div>
            )}
          </div>
          <button
            style={{
              padding: "6px 14px",
              borderRadius: 8,
              border: "1px solid #ddd",
              background: "#fff",
              fontSize: 12,
              fontWeight: 600,
              color: "#555",
              cursor: "pointer",
              opacity: resetting === member.id ? 0.5 : 1,
              fontFamily: "inherit",
            }}
            onClick={() => resetPin(member)}
            disabled={resetting === member.id}
          >
            {resetting === member.id ? "Resetting…" : "Reset PIN"}
          </button>
        </div>
      ))}
    </div>
  );
}
