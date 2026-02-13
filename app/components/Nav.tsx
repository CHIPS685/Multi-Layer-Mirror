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
