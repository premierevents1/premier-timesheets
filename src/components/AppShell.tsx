"use client";

import { useState } from "react";
import type { SessionUser } from "@/lib/types";
import { getDept } from "@/lib/types";
import AddTime from "./AddTime";
import MyTimes from "./MyTimes";
import Approve from "./Approve";
import ExportView from "./ExportView";
import PinMgr from "./PinMgr";

type Tab = "add" | "my" | "approve" | "export" | "pins";

interface Props {
  user: SessionUser;
  onLogout: () => void;
}

function TabBtn({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: string; label: string }) {
  return (
    <button
      onClick={onClick}
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 1,
        padding: "9px 0",
        border: "none",
        background: "transparent",
        color: active ? "#e63946" : "#aaa",
        cursor: "pointer",
        borderBottom: `2px solid ${active ? "#e63946" : "transparent"}`,
        transition: "all .15s",
        fontSize: 11,
        fontFamily: "inherit",
        fontWeight: active ? 700 : 500,
      }}
    >
      <span style={{ fontSize: 14, fontWeight: 700 }}>{icon}</span>
      <span>{label}</span>
    </button>
  );
}

export default function AppShell({ user, onLogout }: Props) {
  const [tab, setTab] = useState<Tab>("add");

  const isMgr = user.role === "manager";
  const isAdmin = user.role === "admin";

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    onLogout();
  }

  const deptLabel = isAdmin ? "Admin" : isMgr ? "Manager" : getDept(user.default_dept).name;

  return (
    <div
      style={{
        maxWidth: 440,
        margin: "0 auto",
        minHeight: "100vh",
        fontFamily: "'DM Sans','Segoe UI',system-ui,sans-serif",
        background: "#f5f5f7",
        color: "#212121",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Header */}
      <div style={{ background: "#212121", color: "#fff", padding: "10px 16px 12px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="Premier Events" style={{ height: 32 }} />
          <button
            onClick={logout}
            style={{ background: "rgba(255,255,255,.1)", border: "none", color: "#fff", padding: "6px 14px", borderRadius: 8, fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}
          >
            Sign out
          </button>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 34, height: 34, borderRadius: 10, background: "#e63946", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, fontWeight: 700, flexShrink: 0 }}>
            {user.first_name[0]}
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 600 }}>{user.first_name} {user.last_name}</div>
            <div style={{ fontSize: 11, color: "#999" }}>{deptLabel}</div>
          </div>
        </div>
      </div>

      {/* Tab bar */}
      <div style={{ display: "flex", background: "#fff", borderBottom: "1px solid #eaeaea" }}>
        <TabBtn active={tab === "add"} onClick={() => setTab("add")} icon="+" label="Add Time" />
        <TabBtn active={tab === "my"} onClick={() => setTab("my")} icon="≡" label="My Times" />
        {(isMgr || isAdmin) && (
          <TabBtn active={tab === "approve"} onClick={() => setTab("approve")} icon="✓" label="Approve" />
        )}
        {isAdmin && (
          <TabBtn active={tab === "export"} onClick={() => setTab("export")} icon="↓" label="Export" />
        )}
        {(isMgr || isAdmin) && (
          <TabBtn active={tab === "pins"} onClick={() => setTab("pins")} icon="🔑" label="PINs" />
        )}
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: "auto" }}>
        {tab === "add" && <AddTime user={user} />}
        {tab === "my" && <MyTimes user={user} />}
        {tab === "approve" && <Approve user={user} />}
        {tab === "export" && <ExportView />}
        {tab === "pins" && <PinMgr user={user} />}
      </div>
    </div>
  );
}
