import * as admin from "firebase-admin";
import { Timestamp } from "firebase-admin/firestore";
import {
  WeeklyDoc,
  CrystalDoc,
  ContextDoc,
  OverlayDoc,
} from "./types";

function isoWeekRangeUTC(weekId: string): {
  start: Date;
  end: Date;
} {
  const [yearStr, weekStr] = weekId.split("-");
  const year = Number(yearStr);
  const week = Number(weekStr);

  const jan4 = new Date(Date.UTC(year, 0, 4));
  const jan4Day = jan4.getUTCDay() || 7;
  const monday = new Date(jan4);
  monday.setUTCDate(jan4.getUTCDate() - jan4Day + 1);

  const start = new Date(monday);
  start.setUTCDate(start.getUTCDate() + (week - 1) * 7);

  const end = new Date(start);
  end.setUTCDate(start.getUTCDate() + 7);

  return { start, end };
}

function isOverlapping(
  aStart: Date,
  aEnd: Date,
  bStart: Date,
  bEnd: Date
): boolean {
  return aStart < bEnd && aEnd > bStart;
}

export async function computeWeeklyOverlayForUser(
  uid: string,
  weekId: string
): Promise<void> {

  // 🔽 ここで初めて firestore を取得する
  const db = admin.firestore();

  const weeklyRef = db.doc(`users/${uid}/weekly/${weekId}`);
  const crystalRef = db.doc(`users/${uid}/crystals/${weekId}`);

  const [weeklySnap, crystalSnap] = await Promise.all([
    weeklyRef.get(),
    crystalRef.get(),
  ]);

  if (!weeklySnap.exists) return;
  if (!crystalSnap.exists) return;

  const weekly = weeklySnap.data() as WeeklyDoc;
  const crystal = crystalSnap.data() as CrystalDoc;

  if (!weekly || !crystal) return;

  const { start, end } = isoWeekRangeUTC(weekId);

  const contextsSnap = await db
    .collection(`users/${uid}/contexts`)
    .get();

  for (const doc of contextsSnap.docs) {
    const context = doc.data() as ContextDoc;

    const cStart = context.startAt.toDate();
    const cEnd = context.endAt.toDate();

    if (!isOverlapping(start, end, cStart, cEnd)) continue;

    const overlayId = `${weekId}_${doc.id}`;
    const overlayRef = db.doc(
      `users/${uid}/overlays/${overlayId}`
    );

    const existing = await overlayRef.get();
    if (existing.exists) continue;

    const overlay: OverlayDoc = {
      weekId,
      contextId: doc.id,
      createdAt: Timestamp.now(),
    };

    await overlayRef.set(overlay, { merge: false });
  }
}
