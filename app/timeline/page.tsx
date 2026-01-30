"use client";

import { useEffect, useState } from "react";
import { collection, doc, getDoc, getDocs } from "firebase/firestore";
import { auth, db } from "../lib/firebase";

type WeeklyDoc = {
  weekId: string;
  selected?: {
    means: Record<string, number>;
  } | null;
  deltaStatus: number;
};

type CrystalDoc = {
  lines: string[];
};

type ContextDoc = {
  label: string;
  startAt: any;
  endAt: any;
};

type WeekRow = {
  weekId: string;
  weekly: WeeklyDoc | null;
  crystal: CrystalDoc | null;
  contexts: ContextDoc[];
};

export default function TimelinePage() {
  const [uid, setUid] = useState<string | null>(null);
  const [weeks, setWeeks] = useState<WeekRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = auth.onAuthStateChanged((user) => {
      if (user) setUid(user.uid);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!uid) return;

    const load = async () => {
      setLoading(true);

      // 表示したい週数（直近12週）
      const targetWeeks = buildRecentWeekIds(12);

      // Contextを一括取得
      const ctxSnap = await getDocs(
        collection(db, `users/${uid}/contexts`)
      );
      const contexts: ContextDoc[] = ctxSnap.docs.map((d) => d.data() as any);

      const rows: WeekRow[] = [];

      for (const weekId of targetWeeks) {
        const weeklySnap = await getDoc(
          doc(db, `users/${uid}/weekly/${weekId}`)
        );

        const crystalSnap = await getDoc(
          doc(db, `users/${uid}/crystals/${weekId}`)
        );

        const weekly = weeklySnap.exists()
          ? (weeklySnap.data() as WeeklyDoc)
          : null;

        const crystal = crystalSnap.exists()
          ? (crystalSnap.data() as CrystalDoc)
          : null;

        // Context重なり判定（UTC基準）
        const period = isoWeekRangeUTC(weekId);
        const overlapped = contexts.filter((c) => {
          const s = c.startAt.toDate();
          const e = c.endAt.toDate();
          return s < period.end && e > period.start;
        });

        rows.push({
          weekId,
          weekly,
          crystal,
          contexts: overlapped,
        });
      }

      setWeeks(rows);
      setLoading(false);
    };

    load();
  }, [uid]);

  if (loading) return <div>loading...</div>;

  return (
    <div style={{ padding: 24 }}>
      <h1>Weekly Timeline</h1>

      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {weeks.map((w) => (
          <div
            key={w.weekId}
            style={{
              border: "1px solid #ddd",
              padding: 12,
              display: "grid",
              gridTemplateColumns: "120px 1fr 1fr 1fr",
              gap: 12,
            }}
          >
            <div>{w.weekId}</div>

            <div>
              <strong>Weekly</strong>
              {w.weekly?.selected ? (
                <ul>
                  {Object.entries(w.weekly.selected.means).map(
                    ([axis, val]) => (
                      <li key={axis}>
                        {axis}: {val.toFixed(3)}
                      </li>
                    )
                  )}
                </ul>
              ) : (
                <div>—</div>
              )}
            </div>

            <div>
              <strong>Crystal</strong>
              {w.crystal ? (
                <ul>
                  {w.crystal.lines.map((l, i) => (
                    <li key={i}>{l}</li>
                  ))}
                </ul>
              ) : (
                <div>—</div>
              )}
            </div>

            <div>
              <strong>Context</strong>
              {w.contexts.length > 0 ? (
                <ul>
                  {w.contexts.map((c, i) => (
                    <li key={i}>{c.label}</li>
                  ))}
                </ul>
              ) : (
                <div>—</div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function buildRecentWeekIds(n: number): string[] {
  const ids: string[] = [];
  const now = new Date();

  for (let i = 0; i < n; i++) {
    const d = new Date(Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate() - i * 7
    ));
    ids.push(getIsoWeekIdUTC(d));
  }

  return ids;
}

function getIsoWeekIdUTC(date: Date): string {
  const d = new Date(Date.UTC(
    date.getUTCFullYear(),
    date.getUTCMonth(),
    date.getUTCDate()
  ));
  const day = (d.getUTCDay() + 6) % 7;
  d.setUTCDate(d.getUTCDate() - day + 3);
  const isoYear = d.getUTCFullYear();
  const firstThursday = new Date(Date.UTC(isoYear, 0, 4));
  const firstDay = (firstThursday.getUTCDay() + 6) % 7;
  firstThursday.setUTCDate(firstThursday.getUTCDate() - firstDay + 3);
  const week =
    Math.round(
      (d.getTime() - firstThursday.getTime()) /
        (7 * 24 * 60 * 60 * 1000)
    ) + 1;
  return `${isoYear}-${String(week).padStart(2, "0")}`;
}

function isoWeekRangeUTC(weekId: string): { start: Date; end: Date } {
  const [yearStr, weekStr] = weekId.split("-");
  const year = Number(yearStr);
  const week = Number(weekStr);

  const jan4 = new Date(Date.UTC(year, 0, 4));
  const day = jan4.getUTCDay() || 7;
  const start = new Date(jan4);
  start.setUTCDate(jan4.getUTCDate() - day + 1 + (week - 1) * 7);

  const end = new Date(start);
  end.setUTCDate(start.getUTCDate() + 7);

  return { start, end };
}
