"use client";

export default function Skeleton(props: { height?: number }) {
  return (
    <div
      style={{
        height: props.height ?? 12,
        borderRadius: 10,
        background: "rgba(0,0,0,0.08)",
        animation: "pulse 1.2s ease-in-out infinite",
      }}
    />
  );
}