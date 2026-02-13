"use client";

import React from "react";

export type MiniDayMark = {
  hasFragments: boolean;
  hasDiary: boolean;
};

type Cell = { dateId: string; inMonth: boolean };

function monthLabel(monthId: string): string {
  const m = /^(\d{4})-(\d{2})$/.exec(monthId);
  if (!m) return monthId;
  const yyyy = m[1];
  const mm = Number(m[2]);
  const names = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const name = names[Math.max(0, Math.min(11, mm - 1))];
  return `${name} ${yyyy}`;
}

function dayOfMonth(dateId: string): string {
  return String(Number(dateId.slice(8, 10)));
}

export default function HomeMiniCalendar(props: {
  monthId: string;
  matrix: Cell[][];
  marks: Record<string, MiniDayMark>;
  todayDateId: string;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onTodayMonth: () => void;
  onPickDate: (dateId: string) => void;
  onCTA: () => void;
}) {
  const { monthId, matrix, marks, todayDateId } = props;

  return (
    <div
      style={{
        borderRadius: 22,
        overflow: "hidden",
        background: "linear-gradient(180deg,#ff6a5f 0%, #ff8b4e 100%)",
        boxShadow: "0 8px 22px rgba(0,0,0,0.08)",
      }}
    >
      <div style={{ padding: 16, color: "white" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          <div style={{ fontSize: 34, fontWeight: 800, letterSpacing: 0.2 }}>{monthLabel(monthId)}</div>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={props.onPrevMonth}
              style={{
                border: "1px solid rgba(255,255,255,0.35)",
                background: "rgba(255,255,255,0.12)",
                color: "white",
                borderRadius: 999,
                padding: "8px 10px",
                cursor: "pointer",
              }}
              aria-label="prev month"
            >
              ◀
            </button>
            <button
              onClick={props.onTodayMonth}
              style={{
                border: "1px solid rgba(255,255,255,0.35)",
                background: "rgba(255,255,255,0.12)",
                color: "white",
                borderRadius: 999,
                padding: "8px 10px",
                cursor: "pointer",
              }}
              aria-label="this month"
            >
              ●
            </button>
            <button
              onClick={props.onNextMonth}
              style={{
                border: "1px solid rgba(255,255,255,0.35)",
                background: "rgba(255,255,255,0.12)",
                color: "white",
                borderRadius: 999,
                padding: "8px 10px",
                cursor: "pointer",
              }}
              aria-label="next month"
            >
              ▶
            </button>
          </div>
        </div>

        <div style={{ marginTop: 12, display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 8, fontSize: 12, opacity: 0.95 }}>
          <div style={{ textAlign: "center" }}>SUN</div>
          <div style={{ textAlign: "center" }}>MON</div>
          <div style={{ textAlign: "center" }}>TUE</div>
          <div style={{ textAlign: "center" }}>WED</div>
          <div style={{ textAlign: "center" }}>THU</div>
          <div style={{ textAlign: "center" }}>FRI</div>
          <div style={{ textAlign: "center" }}>SAT</div>
        </div>

        <div style={{ marginTop: 10, display: "grid", gap: 8 }}>
          {matrix.map((row, r) => (
            <div key={r} style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 8 }}>
              {row.map((cell) => {
                const mk = marks[cell.dateId] ?? { hasFragments: false, hasDiary: false };
                const isToday = cell.dateId === todayDateId;

                const baseBg = isToday ? "rgba(255,255,255,0.92)" : "rgba(255,255,255,0.18)";
                const baseColor = isToday ? "#ff4d4d" : "white";
                const dim = cell.inMonth ? 1 : 0.45;

                return (
                  <button
                    key={cell.dateId}
                    onClick={() => props.onPickDate(cell.dateId)}
                    style={{
                      position: "relative",
                      width: "100%",
                      aspectRatio: "1 / 1",
                      borderRadius: 999,
                      border: "1px solid rgba(255,255,255,0.25)",
                      background: baseBg,
                      color: baseColor,
                      cursor: "pointer",
                      opacity: dim,
                      fontWeight: 800,
                      fontSize: 16,
                    }}
                    aria-label={`open ${cell.dateId}`}
                    title={cell.dateId}
                  >
                    {dayOfMonth(cell.dateId)}

                    {(mk.hasFragments || mk.hasDiary) && (
                      <div
                        style={{
                          position: "absolute",
                          top: 6,
                          right: 6,
                          display: "flex",
                          alignItems: "center",
                          gap: 4,
                          fontSize: 12,
                          lineHeight: "12px",
                        }}
                      >
                        {mk.hasFragments && <span title="has fragments">●</span>}
                        {mk.hasDiary && <span title="has diary">✨</span>}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        <div style={{ marginTop: 14 }}>
          <button
            onClick={props.onCTA}
            style={{
              width: "100%",
              borderRadius: 18,
              border: "1px solid rgba(255,255,255,0.25)",
              background: "linear-gradient(180deg,#ff3f3f 0%, #ffb22e 100%)",
              color: "white",
              fontWeight: 800,
              fontSize: 16,
              padding: "14px 12px",
              cursor: "pointer",
              boxShadow: "0 10px 18px rgba(0,0,0,0.10)",
            }}
          >
            今日の記録・断片を追加
          </button>
        </div>
      </div>
    </div>
  );
}
