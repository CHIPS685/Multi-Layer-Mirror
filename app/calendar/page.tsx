"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import PageShell from "../components/PageShell";
import Nav from "../components/Nav";
import Card from "../components/Card";
import SectionHeader from "../components/SectionHeader";
import EmptyState from "../components/EmptyState";
import Skeleton from "../components/Skeleton";

import { auth, db, ensureSignedIn } from "../lib/firebase";
import { buildMonthMatrix, monthIdFromDate, shiftMonthId, todayDateId, normalizeDateId } from "../lib/date";
import { getMonthMarks, type DayMark } from "../lib/calendar";


type Cell = {
  dateId: string;
  inMonth: boolean;
};

export default function CalendarPage() {
  const router = useRouter();

  const [uid, setUid] = useState<string | null>(null);
  const [monthId, setMonthId] = useState<string>(() => monthIdFromDate(new Date()));
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [marks, setMarks] = useState<Record<string, DayMark>>({});

  const matrix: Cell[][] = useMemo(() => {
    return buildMonthMatrix(monthId).map((row) =>
      row.map((d) => ({
        dateId: d.dateId,
        inMonth: d.inMonth,
      }))
    );
  }, [monthId]);

  useEffect(() => {
    ensureSignedIn()
        .then(setUid)
        .catch(() => setUid(""));
  }, []);

  useEffect(() => {
    if (!uid) return;

    const run = async () => {
        setLoading(true);
        setErrorMsg(null);
        try {
            const next = await getMonthMarks({ uid, monthId });
            setMarks(next);
            } catch (e: any) {
            console.error(e);
            const msg =
                e?.message ||
                e?.code ||
                (typeof e === "string" ? e : "") ||
                "load failed";
            setErrorMsg(msg);
            setMarks({});
            } finally {
            setLoading(false);
            }
    };

    run();
  }, [uid, monthId]);


  const onClickDate = (dateId: string) => {
    try {
        const normalized = normalizeDateId(dateId);
        router.push(`/day?dateId=${normalized}`);
    } catch {
        return;
    }
   };

  const today = todayDateId();

  return (
    <PageShell>
      <SectionHeader title="Calendar" subtitle={monthId} />

      <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 12 }}>
        <button onClick={() => setMonthId((m) => shiftMonthId(m, -1))}>prev</button>
        <button onClick={() => setMonthId(monthIdFromDate(new Date()))}>today</button>
        <button onClick={() => setMonthId((m) => shiftMonthId(m, +1))}>next</button>
      </div>

      {loading ? (
        <Skeleton />
      ) : errorMsg ? (
        <Card>
          <div style={{ opacity: 0.8 }}>{errorMsg}</div>
        </Card>
      ) : (
        <Card>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 6 }}>
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((w) => (
              <div key={w} style={{ fontSize: 12, opacity: 0.7, padding: "4px 2px" }}>
                {w}
              </div>
            ))}

            {matrix.flat().map((cell) => {
              const m = marks[cell.dateId];
              const hasFragments = !!m?.hasFragments;
              const hasDiary = !!m?.hasDiary;
              const isToday = cell.dateId === today;

              const badge = `${hasFragments ? "●" : ""}${hasDiary ? "✨" : ""}` || "";

              return (
                <button
                  key={cell.dateId}
                  onClick={() => onClickDate(cell.dateId)}
                  style={{
                    textAlign: "left",
                    padding: 10,
                    borderRadius: 12,
                    border: "1px solid rgba(255,255,255,0.08)",
                    background: isToday ? "rgba(255,255,255,0.06)" : "transparent",
                    opacity: cell.inMonth ? 1 : 0.35,
                    cursor: "pointer",
                    minHeight: 54,
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>{cell.dateId.slice(-2)}</div>
                    <div style={{ fontSize: 12, opacity: 0.9 }}>{badge}</div>
                  </div>
                  <div style={{ fontSize: 11, opacity: 0.6, marginTop: 4 }}>{cell.dateId}</div>
                </button>
              );
            })}
          </div>

          {Object.keys(marks).length === 0 ? (
            <div style={{ marginTop: 12 }}>
              <EmptyState title="No data" description="writeで断片を追加すると、ここに●が出る" />
            </div>
          ) : null}
        </Card>
      )}

      <div style={{ marginTop: 10, fontSize: 12, opacity: 0.65 }}>
        ●=Fragmentsあり reminder,✨=生成済み
      </div>
    </PageShell>
  );
}
