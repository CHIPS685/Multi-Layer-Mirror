"use client";

import { useEffect, useMemo, useState } from "react";
import { signInAnonymously } from "firebase/auth";
import { httpsCallable } from "firebase/functions";
import { auth } from "../lib/firebase";
import { functions } from "../lib/firebase";
import Nav from "../components/Nav";

type Candidate = {
  id: string;
  label: string;
  quote: string;
};

export default function PrefillPage() {
  const [uid, setUid] = useState<string>("");
  const [questionText, setQuestionText] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [prefillId, setPrefillId] = useState<string>("");
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [draftText, setDraftText] = useState<string>("");
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [err, setErr] = useState<string>("");

  useEffect(() => {
    signInAnonymously(auth).then((r) => setUid(r.user.uid));
  }, []);

  const selectedText = useMemo(() => {
    const picked = candidates.filter((c) => selected[c.id]);
    const lines = picked.map((c) => `- ${c.label}`);
    return lines.join("\n");
  }, [candidates, selected]);

  async function run() {
    setErr("");
    setLoading(true);
    setPrefillId("");
    setCandidates([]);
    setDraftText("");
    setSelected({});
    try {
      const fn = httpsCallable(functions, "callContextualPrefill");
      const out = await fn({
        questionText,
        timesliceType: "relativeDays",
        timesliceValue: { relativeDays: 90 },
      });

      const data: any = out.data;
      setPrefillId(data.prefillId);
      setCandidates((data.candidates || []).map((c: any) => ({ id: c.id, label: c.label, quote: c.quote })));
      setDraftText(data.draftText || "");
    } catch (e: any) {
      setErr(e?.message || "error");
    } finally {
      setLoading(false);
    }
  }

  function toggle(id: string) {
    setSelected((p) => ({ ...p, [id]: !p[id] }));
  }

  return (
    <div style={{ padding: 16, maxWidth: 720 }}>

      <div style={{ marginBottom: 8 }}>
        <div>question</div>
        <textarea
          value={questionText}
          onChange={(e) => setQuestionText(e.target.value)}
          rows={3}
          style={{ width: "100%" }}
        />
      </div>

      <button onClick={run} disabled={loading || questionText.trim().length === 0}>
        {loading ? "running..." : "generate"}
      </button>

      {err && <div style={{ marginTop: 12 }}>error:{err}</div>}

      {prefillId && <div style={{ marginTop: 12 }}>prefillId:{prefillId}</div>}

      {candidates.length > 0 && (
        <div style={{ marginTop: 16 }}>
          <div>candidates</div>
          <div style={{ marginTop: 8 }}>
            {candidates.map((c) => (
              <div key={c.id} style={{ padding: 8, border: "1px solid #ccc", marginBottom: 8 }}>
                <label style={{ display: "block" }}>
                  <input type="checkbox" checked={!!selected[c.id]} onChange={() => toggle(c.id)} />
                  <span style={{ marginLeft: 8 }}>{c.label}</span>
                </label>
                <div style={{ marginTop: 6, opacity: 0.8 }}>{c.quote}</div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 12 }}>
            <div>selected bullets(local only)</div>
            <pre style={{ whiteSpace: "pre-wrap" }}>{selectedText || "—"}</pre>
          </div>
        </div>
      )}

      {draftText && (
        <div style={{ marginTop: 16 }}>
          <div>draft</div>
          <textarea value={draftText} onChange={(e) => setDraftText(e.target.value)} rows={6} style={{ width: "100%" }} />
        </div>
      )}
    </div>
  );
}
