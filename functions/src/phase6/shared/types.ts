import { Timestamp } from "firebase-admin/firestore";

export type AxisKey = "action" | "obstacle" | "evaluation" | "control";

export type AxisScores = Record<AxisKey, number>;

export type DailyDoc = {
  dateId: string; // YYYY-MM-DD (Asia/Tokyo)
  timezone: "Asia/Tokyo";
  algorithmVersion: "v1";
  sourceRange: {
    startAt: Timestamp; // UTC
    endAt: Timestamp;   // UTC (exclusive)
  };
  fragmentCount: number;
  observationCount: number;
  axesMean: AxisScores;
  deltaPrevDay: AxisScores | null;
  deltaBaseline: AxisScores | null;
  baselineRef: string | null; // "current" etc.
  computedAt: Timestamp;
};

export type BaselineDoc = {
  baselineId: "current";
  timezone: "Asia/Tokyo";
  algorithmVersion: "v1";
  periodDays: number;      // 90 or 30
  dataDaysUsed: number;    // 実際に使えた日数
  axesMedian: AxisScores;  // 自分の過去中央値
  computedAt: Timestamp;
};
