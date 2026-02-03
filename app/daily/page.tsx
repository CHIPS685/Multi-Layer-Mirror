"use client";

import { useEffect, useState } from "react";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "../lib/firebase";

type AxisScores = {
  action: number;
  obstacle: number;
  evaluation: number;
  control: number;
};

type DailyDoc = {
  dateId: string;
  axesMean: AxisScores;
  delta?: AxisScores;
  source?: {
    fragmentCount?: number;
    observationCount?: number;
  };
};

export default function DailyPage() {
  const [uid, setUid] = useState<string | null>(null);
  const [dailies, setDailies] = useState<DailyDoc[]>([]);

  // 認証状態を正しく待つ
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUid(user.uid);
      }
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!uid) return;

    const q = query(
      collection(db, `users/${uid}/dailies`),
      orderBy("dateId", "desc")
    );

    const unsub = onSnapshot(q, (snap) => {
      const list: DailyDoc[] = [];
      snap.forEach((doc) => list.push(doc.data() as DailyDoc));
      setDailies(list);
    });

    return () => unsub();
  }, [uid]);

  return (
    <div className="app-container">
      <h1 className="page-title">Daily</h1>
      <p className="page-subtitle">日ごとの観測結果</p>

      {dailies.length === 0 && (
        <p style={{ color: "#666" }}>まだDailyは生成されていません</p>
      )}

      {dailies.map((d) => (
        <div
          key={d.dateId}
          style={{
            border: "1px solid #ddd",
            borderRadius: "8px",
            padding: "12px",
            marginBottom: "16px",
          }}
        >
          <div style={{ fontSize: "14px", fontWeight: 500 }}>
            {d.dateId}
          </div>

          <div style={{ fontSize: "13px", color: "#666", marginTop: "4px" }}>
            fragments: {d.source?.fragmentCount ?? 0} / observations:{" "}
            {d.source?.observationCount ?? 0}
          </div>

          <div style={{ marginTop: "8px", fontSize: "13px" }}>
            <div>action: {d.axesMean.action.toFixed(2)}</div>
            <div>obstacle: {d.axesMean.obstacle.toFixed(2)}</div>
            <div>evaluation: {d.axesMean.evaluation.toFixed(2)}</div>
            <div>control: {d.axesMean.control.toFixed(2)}</div>
          </div>

          {d.delta && (
            <div style={{ marginTop: "8px", fontSize: "12px", color: "#555" }}>
              <div>Δ action: {d.delta.action.toFixed(2)}</div>
              <div>Δ obstacle: {d.delta.obstacle.toFixed(2)}</div>
              <div>Δ evaluation: {d.delta.evaluation.toFixed(2)}</div>
              <div>Δ control: {d.delta.control.toFixed(2)}</div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
