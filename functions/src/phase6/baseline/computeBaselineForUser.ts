import * as admin from "firebase-admin";
import { Timestamp } from "firebase-admin/firestore";
import { BaselineDoc, AxisScores } from "../shared/types";
import { medianAxisScores } from "../shared/math";

function getDb() {
  return admin.firestore();
}


type DailyLike = {
  axesMean: AxisScores;
};

async function fetchRecentDailies(uid: string, limit: number): Promise<AxisScores[]> {
  const snap = await getDb()
    .collection(`users/${uid}/dailies`)
    .orderBy("dateId", "desc")
    .limit(limit)
    .get();

  const scores: AxisScores[] = [];
  for (const doc of snap.docs) {
    const data = doc.data() as DailyLike;
    if (data?.axesMean) scores.push(data.axesMean);
  }
  return scores;
}

export async function computeBaselineForUser(uid: string): Promise<void> {
  // まず90日相当を取りにいく(最大90件)
  let periodDays = 90;
  let scores = await fetchRecentDailies(uid, 90);

  // データが少なすぎると基準線が不安定なので30に落とす
  if (scores.length < 30) {
    periodDays = 30;
    scores = await fetchRecentDailies(uid, 30);
  }

  const axesMedian = medianAxisScores(scores);

  const baseline: BaselineDoc = {
    baselineId: "current",
    timezone: "Asia/Tokyo",
    algorithmVersion: "v1",
    periodDays,
    dataDaysUsed: scores.length,
    axesMedian,
    computedAt: Timestamp.now(),
  };

  await getDb().doc(`users/${uid}/baselines/current`).set(baseline, { merge: false });
}
