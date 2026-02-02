"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Nav() {
  const pathname = usePathname();

  const style = (path: string) => ({
    marginRight: "16px",
    textDecoration: pathname === path ? "underline" : "none",
  });

  return (
    <nav className="nav">
      <a href="/write">write</a>
      <a href="/context">context</a>
      <a href="/timeline">timeline</a>
    </nav>
  );
}
