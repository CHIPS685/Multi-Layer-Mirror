"use client";

import React from "react";

export default function PageShell(props: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: 16 }}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>{props.title}</h1>
      </div>
      <div style={{ marginTop: 16 }}>{props.children}</div>
    </div>
  );
}