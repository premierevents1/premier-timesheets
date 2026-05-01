"use client";

import { useState, useEffect } from "react";

const secStyle: React.CSSProperties = { fontSize: 13, fontWeight: 700, color: "#888", textTransform: "uppercase", letterSpacing: 1, marginBottom: 12 };
const lblStyle: React.CSSProperties = { fontSize: 12, fontWeight: 700, color: "#888", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 6 };
const inputStyle: React.CSSProperties = { width: "100%", padding: "10px 12px", borderRadius: 10, border: "1px solid #ddd", fontSize: 15, boxSizing: "border-box", background: "#fff", fontFamily: "inherit" };
const btnStyle: React.CSSProperties = { width: "100%", padding: "15px 0", borderRadius: 14, border: "none", background: "#e63946", color: "#fff", fontSize: 16, fontWeight: 700, cursor: "pointer", boxShadow: "0 4px 16px rgba(230,57,70,.25)", fontFamily: "inherit" };

export default function ExportView() {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [count, setCount] = useState<number | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [done, setDone] = useState(false);

  // Fetch count when range changes
  useEffect(() => {
    let cancelled = false;
    async function fetchCount() {
      const params = new URLSearchParams();
      if (from) params.set("from", from);
      if (to) params.set("to", to);
      // Use HEAD-like GET to just count — we reuse the export endpoint and count rows
      // We'll use a lightweight API call instead
      const res = await fetch(`/api/export/count?${params}`);
      if (!cancelled && res.ok) {
        const data = await res.json();
        setCount(data.count);
      }
    }
    fetchCount();
    return () => { cancelled = true; };
  }, [from, to]);

  async function download() {
    setDownloading(true);
    const params = new URLSearchParams();
    if (from) params.set("from", from);
    if (to) params.set("to", to);

    const res = await fetch(`/api/export?${params}`);
    if (res.ok) {
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `timesheets_${from || "all"}_${to || "all"}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      setDone(true);
      setTimeout(() => setDone(false), 3000);
    }
    setDownloading(false);
  }

  return (
    <div style={{ padding: 18 }}>
      <div style={secStyle}>Export for Xero</div>
      <div style={{ fontSize: 13, color: "#888", marginBottom: 16, lineHeight: 1.5 }}>
        Downloads approved timesheets as CSV matching the Deputy format.
      </div>

      <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
        <div style={{ flex: 1 }}>
          <div style={lblStyle}>From</div>
          <input type="date" style={inputStyle} value={from} onChange={(e) => setFrom(e.target.value)} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={lblStyle}>To</div>
          <input type="date" style={inputStyle} value={to} onChange={(e) => setTo(e.target.value)} />
        </div>
      </div>

      <div style={{ textAlign: "center", fontSize: 14, fontWeight: 600, marginBottom: 14, color: "#444" }}>
        {count === null ? "…" : count} approved {count === 1 ? "entry" : "entries"}
      </div>

      <button
        style={{ ...btnStyle, opacity: !count || downloading ? 0.45 : 1 }}
        onClick={download}
        disabled={!count || downloading}
      >
        {done ? "✓ Downloaded" : downloading ? "Preparing…" : "Download CSV"}
      </button>
    </div>
  );
}
