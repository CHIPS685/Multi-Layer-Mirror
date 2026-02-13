"use client";

import { useEffect, useMemo, useState } from "react";
import { collection, onSnapshot, orderBy, query, where } from "firebase/firestore";

import PageShell from "../components/PageShell";
import Nav from "../components/Nav";
import Card from "../components/Card";
import Field from "../components/Field";
import SectionHeader from "../components/SectionHeader";
import EmptyState from "../components/EmptyState";
import Skeleton from "../components/Skeleton";

import { db, ensureSignedIn } from "../lib/firebase";
import { normalizeDateId, todayDateId } from "../lib/date";
import { formatDateTimeJP } from "../lib/format";
import { callGenerateDayDiary } from "../lib/callables";

type FragmentDoc = {
  id: string;
  dateId: string;
  text: string;
  createdAt?: any;
};

type VersionDoc = {
  id: string;
  dateId: string;
  text: string;
  generatedAt?: any;
  stats?: { fragmentCount?: number };
};

function tsToDateMaybe(ts: any): Date | null {
  if (!ts) return null;
  if (typeof ts.toDate === "function") return ts.toDate();
  return null;
}

export default function DayPage() {
  const [uid, setUid] = useState<string>("");

  const [dateId, setDateId] = useState<string>(todayDateId());

  const [fragments, setFragments] = useState<FragmentDoc[]>([]);
  const [fragmentsLoading, setFragmentsLoading] = useState<boolean>(true);
  const [fragmentsError, setFragmentsError] = useState<string>("");

  const [latest, setLatest] = useState<VersionDoc | null>(null);
  const [versions, setVersions] = useState<VersionDoc[]>([]);
  const [versionsLoading, setVersionsLoading] = useState<boolean>(true);
  const [versionsError, setVersionsError] = useState<string>("");

  const [generating, setGenerating] = useState<boolean>(false);
  const [genError, setGenError] = useState<string>("");

  useEffect(() => {
    ensureSignedIn()
      .then(setUid)
      .catch(() => setUid(""));
  }, []);

  const safeDateId = useMemo(() => {
    try {
      return normalizeDateId(dateId);
    } catch {
      return "";
    }
  }, [dateId]);

  // --- Fragments購読（当日素材のみ） ---
  useEffect(() => {
    if (!uid || !safeDateId) {
      setFragments([]);
      setFragmentsLoading(false);
      return;
    }

    setFragmentsLoading(true);
    setFragmentsError("");

    const colRef = collection(db, `users/${uid}/fragments`);
    const qy = query(colRef, where("dateId", "==", safeDateId), orderBy("createdAt", "asc"));

    const unsub = onSnapshot(
      qy,
      (snap) => {
        const rows: FragmentDoc[] = snap.docs.map((d) => {
          const data = d.data() as any;
          return {
            id: d.id,
            dateId: data.dateId,
            text: data.text,
            createdAt: data.createdAt,
          };
        });
        setFragments(rows);
        setFragmentsLoading(false);
      },
      (err) => {
        setFragmentsError(err?.message || "Fragmentsの取得に失敗しました");
        setFragmentsLoading(false);
      },
    );

    return () => unsub();
  }, [uid, safeDateId]);

  // --- Versions購読（最新＋履歴） ---
  useEffect(() => {
    if (!uid || !safeDateId) {
      setLatest(null);
      setVersions([]);
      setVersionsLoading(false);
      return;
    }

    setVersionsLoading(true);
    setVersionsError("");

    const colRef = collection(db, `users/${uid}/dayDiaries/${safeDateId}/versions`);
    const qy = query(colRef, orderBy("generatedAt", "desc"));

    const unsub = onSnapshot(
      qy,
      (snap) => {
        const rows: VersionDoc[] = snap.docs.map((d) => {
          const data = d.data() as any;
          return {
            id: d.id,
            dateId: data.dateId,
            text: data.text,
            generatedAt: data.generatedAt,
            stats: data.stats,
          };
        });

        setVersions(rows);
        setLatest(rows[0] ?? null);
        setVersionsLoading(false);
      },
      (err) => {
        setVersionsError(err?.message || "Versionsの取得に失敗しました");
        setVersionsLoading(false);
      },
    );

    return () => unsub();
  }, [uid, safeDateId]);

  const canGenerate = useMemo(() => {
    return !!uid && !!safeDateId && fragments.length > 0 && !generating;
  }, [uid, safeDateId, fragments.length, generating]);

  async function onGenerate() {
    setGenError("");
    if (!canGenerate) return;

    setGenerating(true);
    try {
      await callGenerateDayDiary(safeDateId);
    } catch (e: any) {
      // まずは詳細をconsoleに吐く（internalの原因切り分け用）
      console.error("callGenerateDayDiary error", e);
      console.error("code", e?.code, "message", e?.message, "details", e?.details);
      setGenError(e?.message || "生成に失敗しました。もう一度お試しください。");
    } finally {
      setGenerating(false);
    }
  }

  const latestGeneratedAt = latest ? tsToDateMaybe(latest.generatedAt) : null;
  const latestFragmentCount = latest?.stats?.fragmentCount ?? null;

  return (
    <PageShell title="day">
      <Nav />

      <div style={{ marginTop: 16, display: "grid", gap: 12 }}>
        {/* dateId入力 */}
        <Card>
          <div style={{ display: "grid", gap: 10 }}>
            <Field label="dateId(YYYY-MM-DD)">
              <input
                value={dateId}
                onChange={(e) => setDateId(e.target.value)}
                style={{
                  width: "100%",
                  padding: 10,
                  borderRadius: 10,
                  border: "1px solid rgba(0,0,0,0.18)",
                }}
              />
            </Field>
          </div>
        </Card>

        {/* 生成結果（最新） */}
        <Card>
          <SectionHeader
            title="生成結果(最新)"
            subtitle={
              latest
                ? `${latestGeneratedAt ? formatDateTimeJP(latestGeneratedAt) : "時刻不明"} / fragmentCount:${latestFragmentCount ?? "?"}`
                : "まだ生成されていません"
            }
          />

          <div style={{ marginTop: 12 }}>
            {versionsLoading ? (
              <div style={{ display: "grid", gap: 8 }}>
                <Skeleton height={14} />
                <Skeleton height={14} />
                <Skeleton height={14} />
                <Skeleton height={14} />
              </div>
            ) : latest ? (
              <div style={{ whiteSpace: "pre-wrap", lineHeight: 1.75 }}>{latest.text}</div>
            ) : fragmentsLoading ? (
              <EmptyState title="読み込み中" description="Fragmentsを読み込んでいます" />
            ) : fragments.length === 0 ? (
              <EmptyState title="材料がありません" description="まずはwriteで断片を追加してください" />
            ) : (
              <EmptyState title="未生成" description="材料が揃ったら下のボタンで生成できます" />
            )}

            {versionsError ? <div style={{ marginTop: 10, color: "crimson", fontSize: 12 }}>{versionsError}</div> : null}
          </div>

          <div style={{ marginTop: 14, display: "flex", alignItems: "center", gap: 10 }}>
            <button
              onClick={onGenerate}
              disabled={!canGenerate}
              style={{
                padding: "10px 14px",
                borderRadius: 12,
                border: "1px solid rgba(0,0,0,0.18)",
                background: canGenerate ? "black" : "rgba(0,0,0,0.06)",
                color: canGenerate ? "white" : "rgba(0,0,0,0.55)",
                cursor: canGenerate ? "pointer" : "not-allowed",
              }}
            >
              日記を生成/更新
            </button>
            <div style={{ fontSize: 12, opacity: 0.8 }}>{generating ? "生成中…" : ""}</div>
          </div>

          {genError ? <div style={{ marginTop: 10, color: "crimson", fontSize: 12 }}>{genError}</div> : null}
        </Card>

        {/* 素材パック（Fragments） */}
        <Card>
          <SectionHeader title="素材パック(Fragments)" subtitle={safeDateId ? `dateId:${safeDateId}` : "dateIdが不正です"} />

          <div style={{ marginTop: 12 }}>
            {fragmentsLoading ? (
              <div style={{ display: "grid", gap: 8 }}>
                <Skeleton height={14} />
                <Skeleton height={14} />
                <Skeleton height={14} />
              </div>
            ) : fragmentsError ? (
              <div style={{ color: "crimson", fontSize: 12 }}>{fragmentsError}</div>
            ) : fragments.length === 0 ? (
              <EmptyState title="0件" description="writeで断片を追加してください" />
            ) : (
              <div style={{ display: "grid", gap: 10 }}>
                {fragments.map((f) => {
                  const d = tsToDateMaybe(f.createdAt);
                  return (
                    <div key={f.id} style={{ padding: 12, borderRadius: 14, border: "1px solid rgba(0,0,0,0.12)" }}>
                      <div style={{ fontSize: 12, opacity: 0.7 }}>{d ? formatDateTimeJP(d) : "時刻未確定"}</div>
                      <div style={{ marginTop: 6, whiteSpace: "pre-wrap", lineHeight: 1.65 }}>{f.text}</div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </Card>

        {/* 過去の生成履歴（最小） */}
        <Card>
          <SectionHeader title="過去の生成履歴" subtitle="generatedAt降順" />
          <div style={{ marginTop: 12 }}>
            {versionsLoading ? (
              <EmptyState title="読み込み中" description="少し待ってください" />
            ) : versions.length === 0 ? (
              <EmptyState title="履歴なし" description="生成するとversionsが増えます" />
            ) : (
              <div style={{ display: "grid", gap: 10 }}>
                {versions.map((v) => {
                  const d = tsToDateMaybe(v.generatedAt);
                  const subtitle = `${d ? formatDateTimeJP(d) : "時刻不明"} / fragmentCount:${v.stats?.fragmentCount ?? "?"}`;
                  return (
                    <details key={v.id} style={{ borderRadius: 14, border: "1px solid rgba(0,0,0,0.12)", padding: 12 }}>
                      <summary style={{ cursor: "pointer" }}>
                        <span style={{ fontWeight: 700 }}>{v.id}</span>
                        <span style={{ marginLeft: 10, fontSize: 12, opacity: 0.75 }}>{subtitle}</span>
                      </summary>
                      <div style={{ marginTop: 10, whiteSpace: "pre-wrap", lineHeight: 1.75 }}>{v.text}</div>
                    </details>
                  );
                })}
              </div>
            )}
          </div>
        </Card>
      </div>
    </PageShell>
  );
}
