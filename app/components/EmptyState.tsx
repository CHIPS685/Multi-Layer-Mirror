"use client";

export default function EmptyState(props: { title: string; description: string }) {
  return (
    <div style={{ padding: 14, borderRadius: 16, border: "1px dashed rgba(0,0,0,0.18)" }}>
      <div style={{ fontWeight: 700 }}>{props.title}</div>
      <div style={{ marginTop: 6, opacity: 0.8 }}>{props.description}</div>
    </div>
  );
}