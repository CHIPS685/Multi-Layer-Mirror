import { Timestamp } from "firebase-admin/firestore";

/**
 * weekId(YYYY-WW) から ISO週の UTC期間を返す
 * 開始は含む、終了は含まない [startAt, endAt)
 */
export function getWeekRangeFromWeekId(weekId: string): {
  startAt: Timestamp;
  endAt: Timestamp;
} {
  const [yearStr, weekStr] = weekId.split("-");
  const year = Number(yearStr);
  const week = Number(weekStr);

  // ISO週の最初の木曜日を基準にする
  const jan4 = new Date(Date.UTC(year, 0, 4));
  const day = jan4.getUTCDay() || 7;
  const weekStart = new Date(jan4);
  weekStart.setUTCDate(jan4.getUTCDate() - day + 1 + (week - 1) * 7);

  const weekEnd = new Date(weekStart);
  weekEnd.setUTCDate(weekStart.getUTCDate() + 7);

  return {
    startAt: Timestamp.fromDate(weekStart),
    endAt: Timestamp.fromDate(weekEnd),
  };
}
