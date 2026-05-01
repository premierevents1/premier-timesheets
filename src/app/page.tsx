"use client";

import { useState, useEffect } from "react";
import PinLogin from "@/components/PinLogin";
import AppShell from "@/components/AppShell";
import type { SessionUser } from "@/lib/types";

export default function Page() {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((data) => {
        if (data.user) setUser(data.user);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#212121",
        }}
      >
        <div style={{ width: 40, height: 40, borderRadius: "50%", border: "3px solid rgba(255,255,255,.2)", borderTopColor: "#e63946", animation: "spin 0.7s linear infinite" }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!user) {
    return <PinLogin onLogin={setUser} />;
  }

  return <AppShell user={user} onLogout={() => setUser(null)} />;
}
