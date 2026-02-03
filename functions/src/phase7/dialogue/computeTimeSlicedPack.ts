import { Timestamp } from "firebase-admin/firestore";
import { collectEvidencePack } from "../shared/rag";

export async function computeTimeSlicedPack(params: {
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
    limitFragments: 40,
  });
  return {
    evidenceRefs: res.evidenceRefs,
    evidenceQuotes: res.quotes.slice(0, 20),
    missing: res.missing,
    packText: res.packText,
  };
}
