import { getFirestore, Timestamp } from "firebase-admin/firestore";
import { getWeekRangeFromWeekId } from "../week/getWeekRange";
import { ObservationDoc } from "./types";

/**
 * Phase2-1 用
 * uid と weekId を指定して、その週の Observation「実体」を返す
 */
export async function getObservationDocsByWeek(
  uid: string,
  weekId: string
): Promise<ObservationDoc[]> {
  const db = getFirestore();
  const { startAt, endAt } = getWeekRangeFromWeekId(weekId);

  const snapshot = await db
    .collection(`users/${uid}/observations`)
    .where("createdAt", ">=", startAt)
    .where("createdAt", "<", endAt)
    .get();

  return snapshot.docs
    .map(doc => {
      const data = doc.data();

      // createdAt が無いものは Phase1 DoD 違反なので除外
      if (!data.createdAt) return null;

      return {
        id: doc.id,
        createdAt: data.createdAt as Timestamp,
        axisScores: data.axisScores ?? {},
        axisVersionMap: data.axisVersionMap ?? {},
      };
    })
    .filter((v): v is ObservationDoc => v !== null);
}
