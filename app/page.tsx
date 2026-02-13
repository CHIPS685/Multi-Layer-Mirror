"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { signInAnonymously } from "firebase/auth";

import { auth } from "./lib/firebase";
import { buildMonthMatrix, monthIdFromDate, shiftMonthId, todayDateId } from "./lib/date";
import { getMonthMarks, DayMark } from "./lib/calendar";

function monthLabel(monthId: string): string {
  const m = /^(\d{4})-(\d{2})$/.exec(monthId);
  if (!m) return monthId;
  const yyyy = m[1];
  const mm = Number(m[2]);
  const names = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const name = names[Math.max(0, Math.min(11, mm - 1))];
  return `${name} ${yyyy}`;
}

function dayNum(dateId: string): string {
  return String(Number(dateId.slice(8, 10)));
}

export default function Home() {
  const router = useRouter();

  const [uid, setUid] = useState<string | null>(null);
  const [monthId, setMonthId] = useState<string>(() => monthIdFromDate(new Date()));
  const [marks, setMarks] = useState<Record<string, DayMark>>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [err, setErr] = useState<string | null>(null);

  const today = useMemo(() => todayDateId(), []);
  const matrix = useMemo(() => buildMonthMatrix(monthId), [monthId]);

  useEffect(() => {
    let canceled = false;

    async function run() {
      try {
        if (auth.currentUser) {
          if (!canceled) setUid(auth.currentUser.uid);
          return;
        }
        const res = await signInAnonymously(auth);
        if (!canceled) setUid(res.user.uid);
      } catch (e) {
        console.error(e);
        if (!canceled) {
          setErr("auth failed");
          setLoading(false);
        }
      }
    }

    run();
    return () => {
      canceled = true;
    };
  }, []);

  useEffect(() => {
    let canceled = false;

    async function load() {
      if (!uid) return;
      setLoading(true);
      setErr(null);
      try {
        const m = await getMonthMarks({ uid, monthId });
        if (canceled) return;
        setMarks(m);
        setLoading(false);
      } catch (e) {
        console.error(e);
        if (canceled) return;
        setErr("load failed");
        setLoading(false);
      }
    }

    load();
    return () => {
      canceled = true;
    };
  }, [uid, monthId]);

  return (
    <div className="mlm-home">
      <header className="mlm-homeHeader">
        <div className="mlm-homeHeaderRow">
          <div className="mlm-homeTitle">
            <div className="mlm-avatar" />
            <div className="mlm-titleText">私の日記記録</div>
          </div>
        </div>
      </header>

      <main className="mlm-homeBody">
        <div className="mlm-container">
          <section className="mlm-card mlm-calendarCard" aria-label="month calendar">
            <div className="mlm-calTop">
              <div className="mlm-calTopRow">
                <div className="mlm-monthLabel">{monthLabel(monthId)}</div>
                <div className="mlm-calNav">
                  <button className="mlm-calNavBtn" type="button" onClick={() => setMonthId((v) => shiftMonthId(v, -1))}>◀</button>
                  <button className="mlm-calNavBtn" type="button" onClick={() => setMonthId(monthIdFromDate(new Date()))}>●</button>
                  <button className="mlm-calNavBtn" type="button" onClick={() => setMonthId((v) => shiftMonthId(v, 1))}>▶</button>
                </div>
              </div>

              <div style={{ marginTop: 10, display: "flex", justifyContent: "flex-end" }}>
                <div className="mlm-chip">3日達成</div>
              </div>

              <div className="mlm-dow">
                <div>SUN</div><div>MON</div><div>TUE</div><div>WED</div><div>THU</div><div>FRI</div><div>SAT</div>
              </div>

              <div className="mlm-calGrid">
                {matrix.map((row, r) => (
                  <div key={r} className="mlm-calRow">
                    {row.map((cell) => {
                      const mk = marks[cell.dateId] ?? { hasFragments: false, hasDiary: false };
                      const isToday = cell.dateId === today;

                      const cls =
                        "mlm-dayBtn " +
                        (cell.inMonth ? "mlm-dayInMonth " : "mlm-dayOutMonth ") +
                        (isToday ? "mlm-dayToday" : "mlm-dayNormal");

                      return (
                        <button
                          key={cell.dateId}
                          className={cls}
                          type="button"
                          onClick={() => router.push(`/day?dateId=${cell.dateId}`)}
                          title={cell.dateId}
                          aria-label={`open ${cell.dateId}`}
                        >
                          {dayNum(cell.dateId)}
                          {(mk.hasFragments || mk.hasDiary) && (
                            <div className="mlm-mark">
                              {mk.hasFragments ? <span title="has fragments">●</span> : null}
                              {mk.hasDiary ? <span title="has diary">✨</span> : null}
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>

            <div className="mlm-calBottom">
              <button className="mlm-cta" type="button" onClick={() => router.push(`/day?dateId=${todayDateId()}`)}>
                今日の記録を追加
              </button>

              <div style={{ marginTop: 10 }}>
                <button className="mlm-ctaSub" type="button" onClick={() => router.push("/write")}>
                  破片を書く
                </button>
              </div>

              {loading ? (
                <div className="mlm-hint">読み込み中…</div>
              ) : err ? (
                <div className="mlm-hint">{err}</div>
              ) : (
                <div className="mlm-hint">日付をタップするとdayに移動する</div>
              )}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
