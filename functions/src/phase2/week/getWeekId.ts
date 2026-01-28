import { Timestamp } from "firebase-admin/firestore";

/**
 * Firestore Timestamp から ISO週ベースの weekId を生成する
 * 形式: YYYY-WW（ISO週年）
 * タイムゾーンは UTC 固定
 */
export function getWeekIdFromTimestamp(ts: Timestamp): string {
  const date = ts.toDate();

  // UTCベースで日付を扱う
  const utcDate = new Date(Date.UTC(
    date.getUTCFullYear(),
    date.getUTCMonth(),
    date.getUTCDate()
  ));

  // 木曜日基準でISO週年を確定
  const day = utcDate.getUTCDay() || 7;
  utcDate.setUTCDate(utcDate.getUTCDate() + 4 - day);

  const yearStart = new Date(Date.UTC(utcDate.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((utcDate.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);

  const year = utcDate.getUTCFullYear();
  const week = String(weekNo).padStart(2, "0");

  return `${year}-${week}`;
}
