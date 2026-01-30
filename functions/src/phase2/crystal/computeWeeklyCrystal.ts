import * as admin from "firebase-admin";
import { WeeklyDoc, AxisScores } from "../weekly/types";
import { CrystalDoc } from "./types";

const AXES = ["action", "obstacle", "evaluation", "control"] as const;
type Axis = (typeof AXES)[number];

const fmtSigned = (n: number): string => {
  const s = n >= 0 ? "+" : "";
  return `${s}${n.toFixed(2)}`;
};

const abs = (n: number) => (n < 0 ? -n : n);

const pickImportantAxes = (delta: AxisScores): Axis[] => {
  const axes = AXES.slice();
  axes.sort((a, b) => {
    const da = typeof delta[a] === "number" ? abs(delta[a]) : -1;
    const db = typeof delta[b] === "number" ? abs(delta[b]) : -1;
    if (db !== da) return db - da;
    return a < b ? -1 : a > b ? 1 : 0;
  });
  return axes;
};

const shouldGenerate = (weekly: WeeklyDoc): boolean => {
  if (weekly.deltaStatus !== 0) return false;
  if (!weekly.selected || !weekly.delta) return false;

  const d = weekly.delta;

  // 条件A:単一軸|Δ|>=0.15
  for (const a of AXES) {
    const v = d[a];
    if (typeof v === "number" && abs(v) >= 0.15) return true;
  }

  // 条件B:複数軸|Δ|>=0.10が2軸以上
  let cnt = 0;
  for (const a of AXES) {
    const v = d[a];
    if (typeof v === "number" && abs(v) >= 0.1) cnt += 1;
  }
  if (cnt >= 2) return true;

  // 条件C:control平均が0.5跨ぎ
  const controlDelta = d.control;
  const controlMean = weekly.selected.means.control;
  if (typeof controlDelta === "number" && typeof controlMean === "number") {
    const prev = controlMean - controlDelta;
    const now = controlMean;
    if ((prev < 0.5 && now >= 0.5) || (prev >= 0.5 && now < 0.5)) return true;
  }

  return false;
};

const buildLines = (weekly: WeeklyDoc): string[] => {
  const lines: string[] = [];
  const d = weekly.delta!;
  const means = weekly.selected!.means;

  const ordered = pickImportantAxes(d);

  // まずは大きいΔを優先して最大2行
  for (const a of ordered) {
    const v = d[a];
    if (typeof v !== "number") continue;
    if (abs(v) < 0.1) continue;
    lines.push(`観測結果:${a}Δ${fmtSigned(v)}`);
    if (lines.length >= 2) break;
  }

  // control跨ぎが起きてるなら優先して入れる(まだ3行未満なら)
  if (lines.length < 3) {
    const controlDelta = d.control;
    const controlMean = means.control;
    if (typeof controlDelta === "number" && typeof controlMean === "number") {
      const prev = controlMean - controlDelta;
      const now = controlMean;
      const crossed =
        (prev < 0.5 && now >= 0.5) || (prev >= 0.5 && now < 0.5);
      if (crossed) {
        lines.push("観測結果:controlが0.5を跨いだ");
      }
    }
  }

  // まだ何も入ってない場合(条件Aのみで片軸0.15以上とかを拾い損ねないため)最低1行は作る
  if (lines.length === 0) {
    for (const a of ordered) {
      const v = d[a];
      if (typeof v !== "number") continue;
      lines.push(`観測結果:${a}Δ${fmtSigned(v)}`);
      break;
    }
  }

  // 3行を超えない
  return lines.slice(0, 3);
};

export async function computeWeeklyCrystalForUser(
  uid: string,
  weekId: string
): Promise<void> {
  const db = admin.firestore();

  const weeklyRef = db.doc(`users/${uid}/weekly/${weekId}`);
  const weeklySnap = await weeklyRef.get();
  if (!weeklySnap.exists) return;

  const weekly = weeklySnap.data() as WeeklyDoc;

  if (!shouldGenerate(weekly)) return;

  const crystalRef = db.doc(`users/${uid}/crystals/${weekId}`);
  const crystalSnap = await crystalRef.get();
  if (crystalSnap.exists) return; // immutable

  const lines = buildLines(weekly);
  if (lines.length === 0) return;

  const doc: CrystalDoc = {
    weekId,
    generatedAt: admin.firestore.FieldValue.serverTimestamp(),
    algorithmVersion: "v1",
    sourceWeeklyVersion: "v1",
    selectedVersionSignature: weekly.selectedVersionSignature || "",
    lines,
  };

  // merge禁止=上書き不能
  await crystalRef.set(doc);
}
