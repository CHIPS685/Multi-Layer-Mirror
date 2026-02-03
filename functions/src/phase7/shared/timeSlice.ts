import * as admin from "firebase-admin";
import { Timestamp } from "firebase-admin/firestore";
import { TimeSliceType, TimeSliceValue } from "./types";

function getDB() {
  return admin.firestore();
}

function parseYYYYMMDD(s: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  const dt = new Date(Date.UTC(y, mo - 1, d, 23, 59, 59));
  if (Number.isNaN(dt.getTime())) return null;
  return dt;
}

function isoWeekRangeUTC(weekId: string): { start: Date; end: Date } {
  const [yearStr, weekStr] = weekId.split("-");
  const year = Number(yearStr);
  const week = Number(weekStr);
  const jan4 = new Date(Date.UTC(year, 0, 4));
  const jan4Day = jan4.getUTCDay() || 7;
  const monday = new Date(jan4);
  monday.setUTCDate(jan4.getUTCDate() - jan4Day + 1);
  const start = new Date(monday);
  start.setUTCDate(monday.getUTCDate() + (week - 1) * 7);
  const end = new Date(start);
  end.setUTCDate(start.getUTCDate() + 7);
  return { start, end };
}

export async function resolveTimeSliceToRange(
  uid: string,
  type: TimeSliceType,
  value: TimeSliceValue
): Promise<{ start: Timestamp; end: Timestamp; label: string }> {
  const endNow = Timestamp.now();

  if (type === "relativeDays") {
    const days = value.relativeDays ?? 90;
    const ms = days * 24 * 60 * 60 * 1000;
    const start = new Date(Date.now() - ms);
    return {
      start: Timestamp.fromDate(start),
      end: endNow,
      label: `past${days}days`,
    };
  }

  if (type === "absoluteDate") {
    const dt = parseYYYYMMDD(value.absoluteDate ?? "");
    const end = dt ? Timestamp.fromDate(dt) : endNow;
    const start = Timestamp.fromDate(new Date(0));
    return { start, end, label: `until${value.absoluteDate ?? "invalid"}` };
  }

  if (type === "weekUntil") {
    const w = value.weekUntil ?? "";
    const { end } = isoWeekRangeUTC(w);
    return {
      start: Timestamp.fromDate(new Date(0)),
      end: Timestamp.fromDate(end),
      label: `untilWeek${w || "invalid"}`,
    };
  }

  if (type === "contextId") {
    const contextId = value.contextId ?? "";
    const ref = getDB().doc(`users/${uid}/contexts/${contextId}`);
    const snap = await ref.get();
    if (!snap.exists) {
      return {
        start: Timestamp.fromDate(new Date(0)),
        end: endNow,
        label: `contextMissing${contextId}`,
      };
    }
    const data = snap.data() as any;
    const startAt = data?.startAt as Timestamp | undefined;
    const endAt = data?.endAt as Timestamp | undefined;
    if (!startAt || !endAt) {
      return {
        start: Timestamp.fromDate(new Date(0)),
        end: endNow,
        label: `contextInvalid${contextId}`,
      };
    }
    return { start: startAt, end: endAt, label: `context${contextId}` };
  }

  return { start: Timestamp.fromDate(new Date(0)), end: endNow, label: "all" };
}
