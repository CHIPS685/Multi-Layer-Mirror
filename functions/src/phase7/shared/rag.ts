import * as admin from "firebase-admin";
import { Timestamp } from "firebase-admin/firestore";
import { EvidenceRef } from "./types";
import { trimQuote80 } from "./sanitize";

function getDB() {
  return admin.firestore();
}

function safeStr(v: any): string {
  if (typeof v === "string") return v;
  return "";
}

export async function collectEvidencePack(params: {
  uid: string;
  start: Timestamp;
  end: Timestamp;
  limitFragments?: number;
}): Promise<{
  evidenceRefs: EvidenceRef[];
  quotes: string[];
  missing: string[];
  packText: string;
}> {
  const { uid, start, end } = params;
  const limitFragments = params.limitFragments ?? 40;

  const evidenceRefs: EvidenceRef[] = [];
  const quotes: string[] = [];
  const missing: string[] = [];

  const fragmentsQuery = getDB()
    .collection(`users/${uid}/fragments`)
    .where("createdAt", ">=", start)
    .where("createdAt", "<=", end)
    .orderBy("createdAt", "desc")
    .limit(limitFragments);

  const contextsQuery = getDB().collection(`users/${uid}/contexts`).get();

  const [fragmentsSnap, contextsSnap] = await Promise.all([
    fragmentsQuery.get().catch(() => null),
    contextsQuery.catch(() => null),
  ]);

  if (!fragmentsSnap || fragmentsSnap.empty) {
    missing.push("fragment不足");
  } else {
    for (const d of fragmentsSnap.docs) {
      const data = d.data() as any;
      const text = safeStr(data?.text || data?.body || data?.content);
      const createdAt = data?.createdAt as Timestamp | undefined;
      evidenceRefs.push({
        path: d.ref.path,
        kind: "fragment",
        ts: createdAt,
      });
      if (text) quotes.push(trimQuote80(text));
    }
  }

  if (!contextsSnap || contextsSnap.empty) {
    missing.push("context不足");
  } else {
    for (const d of contextsSnap.docs) {
      const data = d.data() as any;
      const label = safeStr(data?.label);
      const startAt = data?.startAt as Timestamp | undefined;
      const endAt = data?.endAt as Timestamp | undefined;
      if (!startAt || !endAt) continue;
      const overlaps = startAt.toDate() < end.toDate() && endAt.toDate() > start.toDate();
      if (!overlaps) continue;
      evidenceRefs.push({ path: d.ref.path, kind: "context", ts: data?.createdAt });
      if (label) quotes.push(trimQuote80(`context:${label}`));
    }
  }

  const packLines: string[] = [];
  packLines.push(`rangeUTC:${start.toDate().toISOString()}..${end.toDate().toISOString()}`);
  packLines.push(`fragmentsQuotes:`);
  for (const q of quotes.slice(0, 60)) {
    packLines.push(`- ${q}`);
  }

  const packText = packLines.join("\n");
  return { evidenceRefs, quotes, missing, packText };
}
