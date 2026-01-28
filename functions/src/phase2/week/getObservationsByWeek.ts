import { getFirestore } from "firebase-admin/firestore";
import { getWeekRangeFromWeekId } from "./getWeekRange";

/**
 * uid と weekId を指定して、その週の Observation ドキュメントID集合を返す
 * 順序は意味を持たない（集合）
 */
export async function getObservationsByWeek(
  uid: string,
  weekId: string
): Promise<string[]> {
  const db = getFirestore();
  const { startAt, endAt } = getWeekRangeFromWeekId(weekId);

  const snapshot = await db
    .collection(`users/${uid}/observations`)
    .where("createdAt", ">=", startAt)
    .where("createdAt", "<", endAt)
    .get();

  return snapshot.docs.map(doc => doc.id);
}
