/**
 * Migration: Backfill Daily documents from existing Observations
 *
 * 実行方法:
 * cd functions
 * npx ts-node src/migrations/2026_backfill_daily.ts
 */

import * as admin from "firebase-admin";
import * as fs from "fs";

// ================================
// migration 設定（必ず確認）
// ================================

// Firestore の users/{uid} の uid をそのまま入れる
const TARGET_UID = "DqWHywOrvQOaovlcPFBdJz3c9O43";

// true: 既に daily がある日はスキップ（安全）
// false: 強制上書き（非推奨）
const SKIP_IF_EXISTS = true;

// ================================

// サービスアカウントキーを読み込む
const serviceAccount = JSON.parse(
  fs.readFileSync("multi-layer-mirror-664a2-firebase-adminsdk-fbsvc-732e48b0f7.json", "utf8")
);

// Firebase Admin 初期化
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

// JST 日付ID生成（YYYY-MM-DD）
const toDateIdJst = (date: Date): string => {
  const jst = new Date(date.getTime() + 9 * 60 * 60 * 1000);
  const y = jst.getFullYear();
  const m = String(jst.getMonth() + 1).padStart(2, "0");
  const d = String(jst.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

// 4軸スコア型
type AxisScores = {
  action: number;
  obstacle: number;
  evaluation: number;
  control: number;
};

// 平均計算
const meanAxis = (list: AxisScores[]): AxisScores => {
  const sum = list.reduce(
    (acc, cur) => ({
      action: acc.action + cur.action,
      obstacle: acc.obstacle + cur.obstacle,
      evaluation: acc.evaluation + cur.evaluation,
      control: acc.control + cur.control,
    }),
    { action: 0, obstacle: 0, evaluation: 0, control: 0 }
  );

  return {
    action: sum.action / list.length,
    obstacle: sum.obstacle / list.length,
    evaluation: sum.evaluation / list.length,
    control: sum.control / list.length,
  };
};

async function run() {
  console.log("=== Daily backfill migration start ===");

  // Observation を全取得
  const obsSnap = await db
    .collection(`users/${TARGET_UID}/observations`)
    .get();

  if (obsSnap.empty) {
    console.log("No observations found.");
    return;
  }

  // 日付ごとに group 化
  const grouped: Record<string, AxisScores[]> = {};

  obsSnap.docs.forEach((doc) => {
    const data = doc.data();
    if (!data.createdAt || !data.axisScores) return;

    const dateId = toDateIdJst(data.createdAt.toDate());
    grouped[dateId] = grouped[dateId] || [];
    grouped[dateId].push(data.axisScores);
  });

  const dateIds = Object.keys(grouped).sort();

  let prevMean: AxisScores | null = null;

  for (const dateId of dateIds) {
    const dailyRef = db.doc(`users/${TARGET_UID}/dailies/${dateId}`);

    if (SKIP_IF_EXISTS) {
      const existsSnap = await dailyRef.get();
      if (existsSnap.exists) {
        console.log(`skip ${dateId} (already exists)`);
        prevMean = existsSnap.data()?.axesMean ?? prevMean;
        continue;
      }
    }

    const mean = meanAxis(grouped[dateId]);

    const delta = prevMean
      ? {
          action: mean.action - prevMean.action,
          obstacle: mean.obstacle - prevMean.obstacle,
          evaluation: mean.evaluation - prevMean.evaluation,
          control: mean.control - prevMean.control,
        }
      : null;

    await dailyRef.set({
      dateId,
      axesMean: mean,
      delta,
      source: {
        observationCount: grouped[dateId].length,
      },
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      migration: "2026_backfill_daily",
    });

    console.log(`created daily ${dateId}`);
    prevMean = mean;
  }

  console.log("=== Daily backfill migration done ===");
}

// 実行
run().catch((e) => {
  console.error(e);
  process.exit(1);
});
