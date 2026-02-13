"use client";

export default function SectionHeader(props: { title: string; subtitle?: string }) {
  return (
    <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12 }}>
      <div>
        <div style={{ fontSize: 16, fontWeight: 700 }}>{props.title}</div>
        {props.subtitle ? <div style={{ marginTop: 4, fontSize: 12, opacity: 0.75 }}>{props.subtitle}</div> : null}
      </div>
    </div>
  );
}