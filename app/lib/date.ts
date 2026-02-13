import { assertDateId } from "./guards";

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

export function toDateIdLocal(d: Date): string {
  const y = d.getFullYear();
  const m = pad2(d.getMonth() + 1);
  const day = pad2(d.getDate());
  return `${y}-${m}-${day}`;
}

export function todayDateId(): string {
  return toDateIdLocal(new Date());
}

export function normalizeDateId(dateId: string): string {
  return assertDateId(dateId);
}

export function monthIdFromDate(d: Date): string {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  return `${yyyy}-${mm}`;
}

export function shiftMonthId(monthId: string, deltaMonths: number): string {
  const m = /^(\d{4})-(\d{2})$/.exec(monthId);
  if (!m) return monthIdFromDate(new Date());
  const y = Number(m[1]);
  const mo = Number(m[2]) - 1;
  const base = new Date(Date.UTC(y, mo, 1));
  base.setUTCMonth(base.getUTCMonth() + deltaMonths);
  const ny = base.getUTCFullYear();
  const nmo = String(base.getUTCMonth() + 1).padStart(2, "0");
  return `${ny}-${nmo}`;
}

export function monthRangeDateIds(monthId: string): { startDateId: string; endDateId: string } {
  const m = /^(\d{4})-(\d{2})$/.exec(monthId);
  if (!m) {
    const now = new Date();
    const mid = monthIdFromDate(now);
    return monthRangeDateIds(mid);
  }
  const y = Number(m[1]);
  const mo = Number(m[2]) - 1;
  const start = new Date(Date.UTC(y, mo, 1));
  const end = new Date(Date.UTC(y, mo + 1, 0));
  const startDateId = `${start.getUTCFullYear()}-${String(start.getUTCMonth() + 1).padStart(2, "0")}-01`;
  const endDateId = `${end.getUTCFullYear()}-${String(end.getUTCMonth() + 1).padStart(2, "0")}-${String(end.getUTCDate()).padStart(2, "0")}`;
  return { startDateId, endDateId };
}

export function buildMonthMatrix(monthId: string): { dateId: string; inMonth: boolean }[][] {
  const { startDateId, endDateId } = monthRangeDateIds(monthId);
  const start = new Date(Date.UTC(Number(startDateId.slice(0, 4)), Number(startDateId.slice(5, 7)) - 1, Number(startDateId.slice(8, 10))));
  const end = new Date(Date.UTC(Number(endDateId.slice(0, 4)), Number(endDateId.slice(5, 7)) - 1, Number(endDateId.slice(8, 10))));

  const startDow = start.getUTCDay();
  const gridStart = new Date(start);
  gridStart.setUTCDate(gridStart.getUTCDate() - startDow);

  const endDow = end.getUTCDay();
  const gridEnd = new Date(end);
  gridEnd.setUTCDate(gridEnd.getUTCDate() + (6 - endDow));

  const rows: { dateId: string; inMonth: boolean }[][] = [];
  let cur = new Date(gridStart);

  while (cur <= gridEnd) {
    const row: { dateId: string; inMonth: boolean }[] = [];
    for (let i = 0; i < 7; i++) {
      const dateId = `${cur.getUTCFullYear()}-${String(cur.getUTCMonth() + 1).padStart(2, "0")}-${String(cur.getUTCDate()).padStart(2, "0")}`;
      const inMonth = dateId >= startDateId && dateId <= endDateId;
      row.push({ dateId, inMonth });
      cur.setUTCDate(cur.getUTCDate() + 1);
    }
    rows.push(row);
  }

  return rows;
}
