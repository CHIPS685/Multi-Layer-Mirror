"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  {href:"/write",label:"write"},
  {href:"/context",label:"context"},
  {href:"/timeline",label:"timeline"},
  {href:"/daily",label:"daily"},
  {href:"/talk",label:"talk"},
  {href:"/prefill",label:"prefill"},
];

export default function Nav(){
  const p = usePathname();
  return (
    <div className="card" style={{boxShadow:"none",background:"rgba(255,255,255,.55)"}}>
      <div className="cardPad" style={{display:"flex",gap:26,flexWrap:"wrap",alignItems:"center"}}>
        {items.map(it=>{
          const on = p?.startsWith(it.href);
          return (
            <Link
              key={it.href}
              href={it.href}
              style={{
                padding:"8px 10px",
                borderRadius:12,
                border:on ? "1px solid rgba(15,23,42,.12)" : "1px solid transparent",
                background:on ? "rgba(255,255,255,.8)" : "transparent",
                fontWeight:on ? 700 : 500
              }}
            >
              {it.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
