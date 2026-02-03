import { Timestamp } from "firebase-admin/firestore";
import { collectEvidencePack } from "../shared/rag";

export async function computePrefillPack(params: {
  uid: string;
  start: Timestamp;
  end: Timestamp;
}): Promise<{
  evidenceRefs: any[];
  evidenceQuotes: string[];
  missing: string[];
  packText: string;
}> {
  const res = await collectEvidencePack({
    uid: params.uid,
    start: params.start,
    end: params.end,
    limitFragments: 60,
  });
  return {
    evidenceRefs: res.evidenceRefs,
    evidenceQuotes: res.quotes.slice(0, 30),
    missing: res.missing,
    packText: res.packText,
  };
}
