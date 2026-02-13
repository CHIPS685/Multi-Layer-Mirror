"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

function Tab(props: { href: string; label: string }) {
  const pathname = usePathname();
  const active = pathname === props.href;
  return (
    <Link
      href={props.href}
      style={{
        padding: "10px 12px",
        borderRadius: 10,
        textDecoration: "none",
        color: active ? "white" : "inherit",
        background: active ? "black" : "transparent",
        border: "1px solid rgba(0,0,0,0.12)",
      }}
    >
      {props.label}
    </Link>
  );
}

export default function Nav() {
  return (
    <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
      <Tab href="/write" label="write" />
      <Tab href="/day" label="day" />
    </div>
  );
}