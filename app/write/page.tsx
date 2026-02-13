"use client";

import { useEffect, useMemo, useState } from "react";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import PageShell from "../components/PageShell";
import Nav from "../components/Nav";
import Card from "../components/Card";
import Field from "../components/Field";
import EmptyState from "../components/EmptyState";
import { db, ensureSignedIn } from "../lib/firebase";
import { normalizeDateId, todayDateId } from "../lib/date";
import { uploadPhotoForDay } from "../lib/photos";
import { auth } from "../lib/firebase";

type SaveState = "idle" | "saving" | "saved" | "error";

export default function WritePage() {
  const [uid, setUid] = useState<string>("");
  const [dateId, setDateId] = useState<string>(todayDateId());
  const [text, setText] = useState<string>("");
  const [state, setState] = useState<SaveState>("idle");
  const [error, setError] = useState<string>("");

  const [uploading, setUploading] = useState(false);
  const [photoCaption, setPhotoCaption] = useState("");


  useEffect(() => {
    ensureSignedIn()
      .then(setUid)
      .catch((e) => {
        setError(e?.message || "ログインに失敗しました");
        setState("error");
      });
  }, []);

  const canSave = useMemo(() => {
    if (!uid) return false;
    try {
      normalizeDateId(dateId);
      return text.trim().length > 0;
    } catch {
      return false;
    }
  }, [uid, dateId, text]);

  async function onSave() {
    setError("");
    if (!canSave) return;
    setState("saving");
    try {
      const safeDateId = normalizeDateId(dateId);
      const col = collection(db, `users/${uid}/fragments`);
      await addDoc(col, {
        dateId: safeDateId,
        text: text.trim(),
        createdAt: serverTimestamp(),
      });
      setText("");
      setState("saved");
      setTimeout(() => setState("idle"), 600);
    } catch (e: any) {
      setError(e?.message || "保存に失敗しました");
      setState("error");
    }
  }

  return (
    <div className="mlm-page">
      <header className="mlm-homeHeader">
        <div className="mlm-homeHeaderRow">
          <div className="mlm-homeTitle">
            <div className="mlm-avatar" />
            <div className="mlm-titleText">私の日記記録</div>
          </div>
        </div>
      </header>

      <main className="mlm-pageBody">
        <div className="mlm-container">
          <div className="mlm-card mlm-panel">
            
            <div style={{ marginTop: 16, display: "grid", gap: 12 }}>
              <Card>
                <div style={{ display: "grid", gap: 12 }}>
                  <Field label="dateId(YYYY-MM-DD)">
                    <input
                      value={dateId}
                      onChange={(e) => setDateId(e.target.value)}
                      style={{ width: "100%", padding: 10, borderRadius: 10, border: "1px solid rgba(0,0,0,0.18)" }}
                    />
                  </Field>

                  <Field label="fragment">
                    <textarea
                      value={text}
                      onChange={(e) => setText(e.target.value)}
                      rows={6}
                      style={{ width: "100%", padding: 10, borderRadius: 10, border: "1px solid rgba(0,0,0,0.18)", resize: "vertical" }}
                      placeholder="断片を書いて保存"
                    />
                  </Field>

                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <button
                      onClick={onSave}
                      disabled={!canSave || state === "saving"}
                      style={{
                        padding: "10px 14px",
                        borderRadius: 12,
                        border: "1px solid rgba(0,0,0,0.18)",
                        background: !canSave || state === "saving" ? "rgba(0,0,0,0.06)" : "black",
                        color: !canSave || state === "saving" ? "rgba(0,0,0,0.55)" : "white",
                        cursor: !canSave || state === "saving" ? "not-allowed" : "pointer",
                      }}
                    >
                      保存
                    </button>

                    <div style={{ fontSize: 12, opacity: 0.8 }}>
                      {state === "saving" ? "保存中…" : state === "saved" ? "保存しました" : state === "error" ? "失敗" : ""}
                    </div>
                  </div>

                  {error ? <div style={{ color: "crimson", fontSize: 12 }}>{error}</div> : null}
                </div>
              </Card>

              {!uid ? <EmptyState title="ログイン準備中" description="匿名ログイン完了後に保存できます" /> : null}
            </div>

            
          </div>
        </div>
      </main>
    </div>
  );
}
