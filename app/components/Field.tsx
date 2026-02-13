"use client";

import React from "react";

export default function Field(props: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "grid", gap: 6 }}>
      <div style={{ fontSize: 12, opacity: 0.75 }}>{props.label}</div>
      {props.children}
    </div>
  );
}