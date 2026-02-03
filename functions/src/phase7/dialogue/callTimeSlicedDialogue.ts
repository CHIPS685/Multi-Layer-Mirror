import * as admin from "firebase-admin";
import { onCall, HttpsError } from "firebase-functions/v2/https";
import { Timestamp } from "firebase-admin/firestore";
import { resolveTimeSliceToRange } from "../shared/timeSlice";
import { computeTimeSlicedPack } from "./computeTimeSlicedPack";
import { buildDialoguePrompt } from "./policy";
import { generateFromGemini } from "../shared/vertex";
import { validateDialogueOutput } from "../shared/schema";
import { assertNoBannedPhrases, trimQuote80, clamp } from "../shared/sanitize";
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

export const callTimeSlicedDialogue = onCall(async (req) => {
  if (!req.auth) throw new HttpsError("unauthenticated", "auth_required");
  const uid = req.auth.uid;

  const queryText = asString(req.data?.queryText, 500);
  if (!queryText) throw new HttpsError("invalid-argument", "queryText_required");

  const timesliceType = parseType(req.data?.timesliceType);
  const timesliceValue = (req.data?.timesliceValue ?? {}) as TimeSliceValue;

  const { start, end, label } = await resolveTimeSliceToRange(uid, timesliceType, timesliceValue);

  const pack = await computeTimeSlicedPack({ uid, start, end });

  const sessionId = `${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
  const sessionRef = getDB().doc(`users/${uid}/dialogueSessions/${sessionId}`);
  const turnRef = sessionRef.collection("turns").doc("turn0");

  const prompt = buildDialoguePrompt({ queryText, packText: pack.packText });

  const raw = await generateFromGemini(prompt);

  let parsed: any;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new HttpsError("internal", "ai_output_not_json");
  }

  const out = validateDialogueOutput(parsed);

  assertNoBannedPhrases(out.dialogueText);

  out.evidenceQuotes = (out.evidenceQuotes ?? []).map(trimQuote80).slice(0, 10);
  out.coverage = clamp(out.coverage ?? 0, 0, 1);
  out.missing = Array.isArray(out.missing) ? out.missing.slice(0, 10) : [];

  const createdAt = Timestamp.now();
  const algorithmVersion = "phase7_v1";

  await sessionRef.set(
    {
      createdAt,
      timesliceType,
      timesliceValue,
      queryText,
      policyVersion: out.policyVersion,
      algorithmVersion,
      coverage: out.coverage,
      missing: out.missing,
      resolvedRange: { start, end, label },
    },
    { merge: false }
  );

  await turnRef.set(
    {
      role: "user",
      text: queryText,
      createdAt,
      evidenceRefs: [],
      evidenceQuotes: [],
      policyVersion: out.policyVersion,
      algorithmVersion,
    },
    { merge: false }
  );

  await sessionRef.collection("turns").doc("turn1").set(
    {
      role: "ai",
      text: out.dialogueText,
      createdAt: Timestamp.now(),
      evidenceRefs: out.evidenceRefs ?? pack.evidenceRefs ?? [],
      evidenceQuotes: out.evidenceQuotes ?? [],
      policyVersion: out.policyVersion,
      algorithmVersion,
    },
    { merge: false }
  );

  return {
    sessionId,
    dialogueText: out.dialogueText,
    evidenceRefs: out.evidenceRefs ?? pack.evidenceRefs ?? [],
    evidenceQuotes: out.evidenceQuotes ?? [],
    coverage: out.coverage,
    missing: out.missing,
    policyVersion: out.policyVersion,
  };
});
