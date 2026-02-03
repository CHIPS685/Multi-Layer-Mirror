"use client";

import { useEffect, useState } from "react";
import { signInAnonymously } from "firebase/auth";
import { httpsCallable } from "firebase/functions";
import { auth } from "../lib/firebase";
import { functions } from "../lib/firebase";
import Nav from "../components/Nav";

type DialogueResult = {
  sessionId: string;
  dialogueText: string;
  evidenceQuotes: string[];
  coverage: number;
  missing: string[];
};

export default function TalkPage() {
  const [uid, setUid] = useState<string>("");
  const [queryText, setQueryText] = useState<string>("");
  const [sliceType, setSliceType] = useState<"relativeDays" | "absoluteDate">("relativeDays");
  const [relativeDays, setRelativeDays] = useState<number>(90);
  const [absoluteDate, setAbsoluteDate] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [res, setRes] = useState<DialogueResult | null>(null);
  const [err, setErr] = useState<string>("");

  useEffect(() => {
    signInAnonymously(auth).then((r) => setUid(r.user.uid));
  }, []);

  async function run() {
    setErr("");
    setRes(null);
    setLoading(true);
    try {
      const fn = httpsCallable(functions, "callTimeSlicedDialogue");
      const timesliceValue =
        sliceType === "relativeDays"
          ? { relativeDays }
          : { absoluteDate };

      const out = await fn({
        queryText,
        timesliceType: sliceType,
        timesliceValue,
      });

      setRes(out.data as any);
    } catch (e: any) {
      setErr(e?.message || "error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ padding: 16, maxWidth: 720 }}>

      <div style={{ marginBottom: 8 }}>
        <div>question</div>
        <textarea
          value={queryText}
          onChange={(e) => setQueryText(e.target.value)}
          rows={4}
          style={{ width: "100%" }}
        />
      </div>

      <div style={{ marginBottom: 8 }}>
        <div>timeslice</div>
        <select value={sliceType} onChange={(e) => setSliceType(e.target.value as any)}>
          <option value="relativeDays">past days</option>
          <option value="absoluteDate">until date</option>
        </select>

        {sliceType === "relativeDays" && (
          <input
            type="number"
            value={relativeDays}
            onChange={(e) => setRelativeDays(Number(e.target.value))}
            style={{ marginLeft: 8, width: 120 }}
          />
        )}

        {sliceType === "absoluteDate" && (
          <input
            type="date"
            value={absoluteDate}
            onChange={(e) => setAbsoluteDate(e.target.value)}
            style={{ marginLeft: 8 }}
          />
        )}
      </div>

      <button onClick={run} disabled={loading || queryText.trim().length === 0}>
        {loading ? "running..." : "run"}
      </button>

      {err && <div style={{ marginTop: 12 }}>error:{err}</div>}

      {res && (
        <div style={{ marginTop: 16 }}>
          <div>sessionId:{res.sessionId}</div>
          <div>coverage:{res.coverage}</div>
          <div>missing:{(res.missing || []).join(",") || "—"}</div>
          <div style={{ marginTop: 12, whiteSpace: "pre-wrap" }}>{res.dialogueText}</div>
        </div>
      )}
    </div>
  );
}
