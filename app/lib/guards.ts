export function isValidDateId(dateId: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateId)) return false;
  const [y, m, d] = dateId.split("-").map((v) => Number(v));
  if (!Number.isFinite(y) || !Number.isFinite(m) || !Number.isFinite(d)) return false;
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d;
}

export function assertDateId(dateId: string): string {
  if (!isValidDateId(dateId)) throw new Error("dateId形式が不正です(YYYY-MM-DD)");
  return dateId;
}
