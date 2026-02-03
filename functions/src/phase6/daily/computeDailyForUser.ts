import * as admin from "firebase-admin";
import { Timestamp } from "firebase-admin/firestore";
import { DailyDoc, AxisScores } from "../shared/types";
import { meanAxisScores, delta } from "../shared/math";
import { timestampRangeFromJstDateId, prevDateId } from "../shared/time";

function getDb() {
  return admin.firestore();
}


type ObservationDoc = {
  createdAt: Timestamp;
  axisScores: AxisScores;
};

export async function computeDailyForUser(uid: string, dateId: string): Promise<void> {
  const dailyRef = getDb().doc(`users/${uid}/dailies/${dateId}`);
  const existing = await dailyRef.get();
  if (existing.exists) return; // 前日分はimmutableとして扱う(最小事故)

  const { startAt, endAt } = timestampRangeFromJstDateId(dateId);

  const [obsSnap, fragSnap] = await Promise.all([
    getDb()
      .collection(`users/${uid}/observations`)
      .where("createdAt", ">=", startAt)
      .where("createdAt", "<", endAt)
      .get(),
    getDb()
      .collection(`users/${uid}/fragments`)
      .where("createdAt", ">=", startAt)
      .where("createdAt", "<", endAt)
      .get(),
  ]);

  const observationCount = obsSnap.size;
  const fragmentCount = fragSnap.size;

  const scores: AxisScores[] = [];
  for (const doc of obsSnap.docs) {
    const data = doc.data() as ObservationDoc;
    if (!data || !data.axisScores) continue;
    scores.push(data.axisScores);
  }

  const axesMean = meanAxisScores(scores);

  const prevId = prevDateId(dateId);
  const prevDailySnap = await getDb().doc(`users/${uid}/dailies/${prevId}`).get();
  let deltaPrevDay: AxisScores | null = null;
  if (prevDailySnap.exists) {
    const prev = prevDailySnap.data() as DailyDoc;
    if (prev && prev.axesMean) deltaPrevDay = delta(axesMean, prev.axesMean);
  }

  const baselineSnap = await getDb().doc(`users/${uid}/baselines/current`).get();
  let deltaBaseline: AxisScores | null = null;
  let baselineRef: string | null = null;
  if (baselineSnap.exists) {
    const b = baselineSnap.data() as { axesMedian?: AxisScores } | undefined;
    if (b?.axesMedian) {
      deltaBaseline = delta(axesMean, b.axesMedian);
      baselineRef = "current";
    }
  }

  const daily: DailyDoc = {
    dateId,
    timezone: "Asia/Tokyo",
    algorithmVersion: "v1",
    sourceRange: { startAt, endAt },
    fragmentCount,
    observationCount,
    axesMean,
    deltaPrevDay,
    deltaBaseline,
    baselineRef,
    computedAt: Timestamp.now(),
  };

  await dailyRef.set(daily, { merge: false });
}
