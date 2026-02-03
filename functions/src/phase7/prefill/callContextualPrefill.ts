import * as admin from "firebase-admin";
import { onCall, HttpsError } from "firebase-functions/v2/https";
import { Timestamp } from "firebase-admin/firestore";
import { resolveTimeSliceToRange } from "../shared/timeSlice";
import { computePrefillPack } from "./computePrefillPack";
import { buildPrefillPrompt } from "./policy";
import { generateFromGemini } from "../shared/vertex";
import { validatePrefillOutput } from "../shared/schema";
import { assertNoBannedPhrases, trimQuote80 } from "../shared/sanitize";
import { TimeSliceType, TimeSliceValue } from "../shared/types";

function getDB() {
  return admin.firestore();
}

function asString(v: any, maxLen: number): string {
  const s = typeof v === "string" ? v.trim() : "";
  if (!s) return "";
  return s.length > maxLen ? s.slice(0, maxLen) : s;
}

function parseType(v: any): TimeSliceType {
  const s = typeof v === "string" ? v : "";
  if (s === "absoluteDate" || s === "relativeDays" || s === "weekUntil" || s === "contextId") return s;
  return "relativeDays";
}

export const callContextualPrefill = onCall(async (req) => {
  if (!req.auth) throw new HttpsError("unauthenticated", "auth_required");
  const uid = req.auth.uid;

  const questionText = asString(req.data?.questionText, 300);
  if (!questionText) throw new HttpsError("invalid-argument", "questionText_required");

  const timesliceType = parseType(req.data?.timesliceType ?? "relativeDays");
  const timesliceValue = (req.data?.timesliceValue ?? { relativeDays: 90 }) as TimeSliceValue;

  const { start, end, label } = await resolveTimeSliceToRange(uid, timesliceType, timesliceValue);

  const pack = await computePrefillPack({ uid, start, end });

  const prompt = buildPrefillPrompt({ questionText, packText: pack.packText });

  const raw = await generateFromGemini(prompt);

  let parsed: any;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new HttpsError("internal", "ai_output_not_json");
  }

  const out = validatePrefillOutput(parsed);

  assertNoBannedPhrases(out.draftText);

  out.prefillCandidates = (out.prefillCandidates ?? []).slice(0, 12).map((c: any, idx: number) => {
    const id = typeof c?.id === "string" && c.id ? c.id : `c${idx + 1}`;
    const label2 = asString(c?.label, 120);
    const quote2 = trimQuote80(c?.quote);
    return {
      id,
      label: label2,
      sourceRefs: Array.isArray(c?.sourceRefs) ? c.sourceRefs.slice(0, 8) : pack.evidenceRefs.slice(0, 8),
      quote: quote2,
    };
  });

  const createdAt = Timestamp.now();
  const algorithmVersion = "phase7_v1";
  const prefillId = `${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
  const ref = getDB().doc(`users/${uid}/prefills/${prefillId}`);

  await ref.set(
    {
      createdAt,
      questionText,
      policyVersion: out.policyVersion,
      algorithmVersion,
      candidates: out.prefillCandidates,
      draftText: out.draftText,
      selectedCandidateIds: [],
      resolvedRange: { start, end, label },
    },
    { merge: false }
  );

  return {
    prefillId,
    candidates: out.prefillCandidates,
    draftText: out.draftText,
    policyVersion: out.policyVersion,
  };
});
