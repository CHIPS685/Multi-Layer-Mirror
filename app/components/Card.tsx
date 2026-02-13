"use client";

import React from "react";

export default function Card(props: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div
      style={{
        border: "1px solid rgba(0,0,0,0.12)",
        borderRadius: 16,
        padding: 14,
        background: "white",
        ...props.style,
      }}
    >
      {props.children}
    </div>
  );
}