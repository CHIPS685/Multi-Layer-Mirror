import { Timestamp } from "firebase-admin/firestore";

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

/**
 * dateId(YYYY-MM-DD, JST) -> UTC range [start,end)
 * JST 00:00 == UTC 15:00(previous day)
 */
export function utcRangeFromJstDateId(dateId: string): { start: Date; end: Date } {
  const [yStr, mStr, dStr] = dateId.split("-");
  const y = Number(yStr);
  const m = Number(mStr);
  const d = Number(dStr);

  // start UTC = JST 00:00 - 9h
  const start = new Date(Date.UTC(y, m - 1, d, -9, 0, 0, 0));
  const end = new Date(Date.UTC(y, m - 1, d + 1, -9, 0, 0, 0));
  return { start, end };
}

export function timestampRangeFromJstDateId(dateId: string): { startAt: Timestamp; endAt: Timestamp } {
  const { start, end } = utcRangeFromJstDateId(dateId);
  return { startAt: Timestamp.fromDate(start), endAt: Timestamp.fromDate(end) };
}

/**
 * 今日のJST dateIdを返す
 */
export function jstTodayDateId(now: Date = new Date()): string {
  // JSTとして扱うため、UTCに+9hしてからUTC系getterで組み立てる
  const jst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  const y = jst.getUTCFullYear();
  const m = jst.getUTCMonth() + 1;
  const d = jst.getUTCDate();
  return `${y}-${pad2(m)}-${pad2(d)}`;
}

/**
 * dateId(YYYY-MM-DD)を1日戻す(UTC計算で決定論)
 */
export function prevDateId(dateId: string): string {
  const [yStr, mStr, dStr] = dateId.split("-");
  const y = Number(yStr);
  const m = Number(mStr);
  const d = Number(dStr);

  // JST正規化のため、JST正午を作って1日戻す→dateId化
  const jstNoonUtc = new Date(Date.UTC(y, m - 1, d, 3, 0, 0, 0)); // JST 12:00 == UTC 03:00
  jstNoonUtc.setUTCDate(jstNoonUtc.getUTCDate() - 1);
  const jst = new Date(jstNoonUtc.getTime() + 9 * 60 * 60 * 1000);
  const yy = jst.getUTCFullYear();
  const mm = jst.getUTCMonth() + 1;
  const dd = jst.getUTCDate();
  return `${yy}-${pad2(mm)}-${pad2(dd)}`;
}
