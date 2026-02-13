"use client";

import { httpsCallable } from "firebase/functions";
import { functions } from "./firebase";
import { assertDateId } from "./guards";

export type GenerateDayDiaryResult = {
  versionId: string;
  generatedAt: string;
  dateId: string;
  text: string;
  facts: Record<string, unknown>;
  stats: { fragmentCount: number };
};

export async function callGenerateDayDiary(dateId: string): Promise<GenerateDayDiaryResult> {
  const safe = assertDateId(dateId);
  const fn = httpsCallable<{ dateId: string }, GenerateDayDiaryResult>(functions, "callGenerateDayDiary");
  const res = await fn({ dateId: safe });
  return res.data;
}