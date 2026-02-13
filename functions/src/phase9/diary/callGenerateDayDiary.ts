import { onCall, HttpsError } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";
import { assertDateId } from "../shared/dateId";
import { makeVersionId } from "../shared/versionId";
import { policyCheckOrThrow } from "../shared/policy";
import { buildPrompt, PROMPT_VERSION } from "./prompt";
import { generateText } from "./llm";
import { FragmentMaterial, GenerateResult } from "./types";

function labelTime(ts: admin.firestore.Timestamp | null): string {
  if (!ts) return "時刻不明";
  const d = ts.toDate();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${y}/${m}/${day} ${hh}:${mm}`;
}

export const callGenerateDayDiary = onCall(async (req) => {
  if (!req.auth?.uid) throw new HttpsError("unauthenticated", "認証が必要です");
  const uid = req.auth.uid;

  const rawDateId = (req.data?.dateId ?? "") as string;
  let dateId: string;
  try {
    dateId = assertDateId(rawDateId);
  } catch (e: any) {
    throw new HttpsError("invalid-argument", e?.message || "dateIdが不正です");
  }

  const db = admin.firestore();

  let fragSnap: admin.firestore.QuerySnapshot;
  try {
    fragSnap = await db
      .collection(`users/${uid}/fragments`)
      .where("dateId", "==", dateId)
      .orderBy("createdAt", "asc")
      .get();
  } catch (e: any) {
    throw new HttpsError("failed-precondition", e?.message || "Fragments取得に失敗しました(インデックス確認)");
  }

  const fragmentCount = fragSnap.size;
  if (fragmentCount === 0) throw new HttpsError("failed-precondition", "材料がありません");

  const materials: FragmentMaterial[] = fragSnap.docs.map((d) => {
    const data = d.data() as any;
    const createdAt = (data.createdAt as admin.firestore.Timestamp) ?? null;
    return { createdAtLabel: labelTime(createdAt), text: String(data.text ?? "") };
  });

  const prompt = buildPrompt(dateId, materials);

  const project = process.env.GCP_PROJECT || process.env.GCLOUD_PROJECT;
  const location = process.env.GCP_LOCATION || "us-central1";
  const model = process.env.GEMINI_MODEL || "gemini-2.0-flash";

  if (!project) throw new HttpsError("internal", "GCP_PROJECTが未設定です");

  let text: string;
  try {
    text = await generateText(prompt, { project, location, model });
  } catch (e: any) {
    throw new HttpsError("internal", e?.message || "LLM呼び出しに失敗しました");
  }

  try {
    policyCheckOrThrow(text);
  } catch (e: any) {
    throw new HttpsError("failed-precondition", e?.message || "ポリシーチェックに失敗しました");
  }

  const now = new Date();
  const versionId = makeVersionId(now);
  const generatedAt = admin.firestore.Timestamp.fromDate(now);

  const versionRef = db.doc(`users/${uid}/dayDiaries/${dateId}/versions/${versionId}`);

  const payload = {
    dateId,
    generatedAt,
    model,
    promptVersion: PROMPT_VERSION,
    text,
    facts: {},
    stats: { fragmentCount },
  };

  try {
    await versionRef.create(payload);
  } catch (e: any) {
    throw new HttpsError("already-exists", e?.message || "同一versionIdが既に存在します");
  }

  const result: GenerateResult = {
    dateId,
    versionId,
    generatedAt: now.toISOString(),
    text,
    facts: {},
    stats: { fragmentCount },
    model,
    promptVersion: PROMPT_VERSION,
  };

  return result;
});
