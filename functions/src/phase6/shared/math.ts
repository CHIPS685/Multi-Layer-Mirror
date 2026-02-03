import { AxisKey, AxisScores } from "./types";

export const AXES: AxisKey[] = ["action", "obstacle", "evaluation", "control"];

export function clamp01(x: number): number {
  if (Number.isNaN(x)) return 0.0;
  if (x < 0) return 0.0;
  if (x > 1) return 1.0;
  return x;
}

export function meanAxisScores(items: AxisScores[]): AxisScores {
  const sums: Record<AxisKey, number> = {
    action: 0,
    obstacle: 0,
    evaluation: 0,
    control: 0,
  };
  if (items.length === 0) {
    return { action: 0.5, obstacle: 0.5, evaluation: 0.5, control: 0.5 };
  }
  for (const s of items) {
    for (const k of AXES) sums[k] += s[k];
  }
  return {
    action: clamp01(sums.action / items.length),
    obstacle: clamp01(sums.obstacle / items.length),
    evaluation: clamp01(sums.evaluation / items.length),
    control: clamp01(sums.control / items.length),
  };
}

export function delta(a: AxisScores, b: AxisScores): AxisScores {
  return {
    action: a.action - b.action,
    obstacle: a.obstacle - b.obstacle,
    evaluation: a.evaluation - b.evaluation,
    control: a.control - b.control,
  };
}

function medianOf(nums: number[]): number {
  if (nums.length === 0) return 0.5;
  const arr = [...nums].sort((x, y) => x - y);
  const mid = Math.floor(arr.length / 2);
  if (arr.length % 2 === 1) return arr[mid];
  return (arr[mid - 1] + arr[mid]) / 2;
}

export function medianAxisScores(items: AxisScores[]): AxisScores {
  const buckets: Record<AxisKey, number[]> = {
    action: [],
    obstacle: [],
    evaluation: [],
    control: [],
  };
  for (const s of items) {
    for (const k of AXES) buckets[k].push(s[k]);
  }
  return {
    action: clamp01(medianOf(buckets.action)),
    obstacle: clamp01(medianOf(buckets.obstacle)),
    evaluation: clamp01(medianOf(buckets.evaluation)),
    control: clamp01(medianOf(buckets.control)),
  };
}
