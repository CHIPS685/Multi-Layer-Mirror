export type AxisKey = "action" | "obstacle" | "evaluation" | "control";

export type AnalyzerResult = {
  axisScores: Record<AxisKey, number>;
  axisEvidence: Record<AxisKey, string[]>;
  axisVersionMap: Record<AxisKey, string>;
};

export const AXES: AxisKey[] = ["action", "obstacle", "evaluation", "control"];

export function dummyObservation(): AnalyzerResult {
  return {
    axisScores: { action: 0.5, obstacle: 0.5, evaluation: 0.5, control: 0.5 },
    axisEvidence: { action: [], obstacle: [], evaluation: [], control: [] },
    axisVersionMap: {
      action: "dummy_v1",
      obstacle: "dummy_v1",
      evaluation: "dummy_v1",
      control: "dummy_v1",
    },
  };
}
