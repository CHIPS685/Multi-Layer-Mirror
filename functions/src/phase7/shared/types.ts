import { Timestamp } from "firebase-admin/firestore";

export type TimeSliceType =
  | "absoluteDate"
  | "relativeDays"
  | "weekUntil"
  | "contextId";

export type TimeSliceValue = {
  absoluteDate?: string; // YYYY-MM-DD
  relativeDays?: number; // 30/90/365など
  weekUntil?: string; // YYYY-WW
  contextId?: string; // contexts/{contextId}
};

export type EvidenceRef = {
  path: string; // Firestore doc path
  kind:
    | "fragment"
    | "context"
    | "daily"
    | "weekly"
    | "crystal"
    | "overlay"
    | "baseline"
    | "tendency";
  ts?: Timestamp;
};

export type DialogueAIOutput = {
  dialogueText: string; // 最大3段落想定
  evidenceRefs: EvidenceRef[];
  evidenceQuotes: string[]; // 各最大80文字程度
  coverage: number; // 0..1
  missing: string[]; // 例: ["context不足","期間が短い"]
  policyVersion: "phase7_dialogue_v1";
};

export type PrefillCandidate = {
  id: string;
  label: string;
  sourceRefs: EvidenceRef[];
  quote: string;
};

export type PrefillAIOutput = {
  prefillCandidates: PrefillCandidate[];
  draftText: string;
  policyVersion: "phase7_prefill_v1";
};
