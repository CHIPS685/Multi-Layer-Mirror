import { AXES, AnalyzerResult, AxisKey } from "./types";

function clamp01(x: number): number {
  if (Number.isNaN(x) || !Number.isFinite(x)) return 0.5;
  if (x < 0) return 0;
  if (x > 1) return 1;
  return x;
}

function asStringArray(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return v.filter((x) => typeof x === "string") as string[];
}

export function validateAndNormalize(raw: any, fragmentContent: string): AnalyzerResult | null {
  if (!raw || typeof raw !== "object") return null;

  const axisScores: any = raw.axisScores;
  const axisEvidence: any = raw.axisEvidence;

  if (!axisScores || typeof axisScores !== "object") return null;
  if (!axisEvidence || typeof axisEvidence !== "object") return null;

  const outScores: Record<AxisKey, number> = { action: 0.5, obstacle: 0.5, evaluation: 0.5, control: 0.5 };
  const outEvidence: Record<AxisKey, string[]> = { action: [], obstacle: [], evaluation: [], control: [] };

  for (const k of AXES) {
    const s = axisScores[k];
    outScores[k] = clamp01(typeof s === "number" ? s : 0.5);

    const ev = asStringArray(axisEvidence[k]);
    outEvidence[k] = ev
      .map((t) => t.trim())
      .filter((t) => t.length > 0)
      .filter((t) => fragmentContent.includes(t))
      .slice(0, 8);
  }

  const axisVersionMap: Record<AxisKey, string> = {
    action: "gemini_v1",
    obstacle: "gemini_v1",
    evaluation: "gemini_v1",
    control: "gemini_v1",
  };

  return { axisScores: outScores, axisEvidence: outEvidence, axisVersionMap };
}
