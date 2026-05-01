"use client";

import { useState } from "react";
import type { SessionUser } from "@/lib/types";

interface Props {
  onLogin: (user: SessionUser) => void;
}

const keyStyle: React.CSSProperties = {
  height: 56,
  borderRadius: 14,
  border: "none",
  background: "#f4f4f5",
  fontSize: 22,
  fontWeight: 500,
  color: "#212121",
  cursor: "pointer",
};

export default function PinLogin({ onLogin }: Props) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState(false);
  const [shake, setShake] = useState(false);
  const [loading, setLoading] = useState(false);
  async function attempt(p: string) {
    setLoading(true);
    const res = await fetch("/api/auth/pin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pin: p }),
    });
    const data = await res.json();
    setLoading(false);

    if (res.ok && data.user) {
      onLogin(data.user);
    } else {
      setError(true);
      setShake(true);
      setTimeout(() => {
        setPin("");
        setError(false);
        setShake(false);
      }, 600);
    }
  }

  function press(n: string) {
    if (loading || pin.length >= 4) return;
    const next = pin + n;
    setPin(next);
    setError(false);
    if (next.length === 4) attempt(next);
  }

  function del() {
    setPin((p) => p.slice(0, -1));
    setError(false);
  }

  const keys = [1, 2, 3, 4, 5, 6, 7, 8, 9, "blank", 0, "del"] as const;

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#212121", padding: 16 }}>
      <div style={{ background: "#fff", borderRadius: 24, padding: "32px 28px", width: "100%", maxWidth: 360, boxShadow: "0 24px 80px rgba(0,0,0,.35)" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 28 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="Premier Events" style={{ height: 48, marginBottom: 12 }} />
          <div style={{ fontSize: 18, fontWeight: 700, color: "#212121" }}>Timesheets</div>
          <div style={{ fontSize: 13, color: "#888", marginTop: 4 }}>Enter your 4-digit PIN</div>
        </div>

        {/* PIN dots */}
        <div
          className={shake ? "pin-shake" : ""}
          style={{ display: "flex", justifyContent: "center", gap: 16, marginBottom: 8 }}
        >
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              style={{
                width: 18,
                height: 18,
                borderRadius: 9,
                border: `2px solid ${error ? "#ef4444" : i < pin.length ? "#e63946" : "#ccc"}`,
                background: i < pin.length ? (error ? "#ef4444" : "#e63946") : "transparent",
                transition: "all .15s",
                transform: i < pin.length ? "scale(1.15)" : "scale(1)",
              }}
            />
          ))}
        </div>

        <div style={{ textAlign: "center", minHeight: 20, fontSize: 13, fontWeight: 600, color: "#ef4444" }}>
          {error ? "PIN not recognised" : ""}
        </div>

        {/* Keypad */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, maxWidth: 260, margin: "8px auto 0" }}>
          {keys.map((k, i) => {
            if (k === "blank") return <div key={i} />;
            if (k === "del") return (
              <button key={i} style={keyStyle} onClick={del} disabled={loading}>←</button>
            );
            return (
              <button key={i} style={{ ...keyStyle, opacity: loading ? 0.5 : 1 }} onClick={() => press(String(k))} disabled={loading}>
                {k}
              </button>
            );
          })}
        </div>

        <div style={{ textAlign: "center", fontSize: 13, color: "#aaa", marginTop: 24 }}>
          Forgotten your PIN? Speak to your manager.
        </div>

      </div>
    </div>
  );
}
