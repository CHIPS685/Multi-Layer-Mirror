export function assertDateId(dateId: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateId)) throw new Error("dateId形式が不正です(YYYY-MM-DD)");
  const [y, m, d] = dateId.split("-").map((v) => Number(v));
  const dt = new Date(Date.UTC(y, m - 1, d));
  if (dt.getUTCFullYear() !== y || dt.getUTCMonth() !== m - 1 || dt.getUTCDate() !== d) throw new Error("dateIdが不正です");
  return dateId;
}