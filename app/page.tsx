"use client";

import { useEffect, useState } from "react";
import { signInAnonymously } from "firebase/auth";
import { addDoc, collection, onSnapshot, serverTimestamp,query,orderBy,getDocs, } from "firebase/firestore";
import { auth, db } from "./lib/firebase";

export default function Home() {
  const [uid, setUid] = useState<string | null>(null);
  const [text, setText] = useState("");
  const [fragments, setFragments] = useState<any[]>([]);

  const [contextLabel, setContextLabel] = useState("");
  const [contextStart, setContextStart] = useState("");
  const [contextEnd, setContextEnd] = useState("");
  const [contexts, setContexts] = useState<
    { id: string; label: string; startAt: any; endAt: any }[]
  >([]);

  useEffect(() => {
    signInAnonymously(auth)
      .then((result) => {
        setUid(result.user.uid);
        console.log("uid:", result.user.uid);
      })
      .catch((error) => {
        console.error("auth error:", error);
      });
  }, []);

  const saveFragment = async () => {
    if (!uid || !text.trim()) return;

    await addDoc(
      collection(db, "users", uid, "fragments"),
      {
        content: text,
        createdAt: serverTimestamp(),
      }
    );

    setText("");
    alert("saved");
  };

  const saveContext = async () => {
    if (!uid) return;
    if (!contextLabel.trim()) return;
    if (!contextStart || !contextEnd) return;

    const startDate = new Date(contextStart);
    const endDate = new Date(contextEnd);

    await addDoc(collection(db, `users/${uid}/contexts`), {
      label: contextLabel,
      startAt: startDate,
      endAt: endDate,
      createdAt: serverTimestamp(),
    });

    setContextLabel("");
    setContextStart("");
    setContextEnd("");
  };

  useEffect(() => {
    if (!uid) return;

    const q = query(
      collection(db, `users/${uid}/contexts`),
      orderBy("startAt", "desc")
    );

    const unsub = onSnapshot(q, (snap) => {
      const list = snap.docs.map((d) => {
        const data = d.data() as any;
        return {
          id: d.id,
          label: data.label,
          startAt: data.startAt,
          endAt: data.endAt,
        };
      });
      setContexts(list);
    });

    return () => unsub();
  }, [uid]);


  useEffect(() => {
    if (!uid) return;

    const fetchFragments = async () => {
      const q = query(
        collection(db, "users", uid, "fragments"),
        orderBy("createdAt", "desc")
      );
      const snapshot = await getDocs(q);
      const list = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      console.log("fragments:", list);
      setFragments(list);
    };

    fetchFragments();
  }, [uid]);


  return (
    <div style={{ padding: 16 }}>
      <h1>Multi-Layer Mirror</h1>

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={5}
        style={{ width: "100%", marginBottom: 8 }}
        placeholder="ここにそのまま書く"
      />

      <button onClick={saveFragment}>保存</button>

      <hr style={{ margin: "16px 0" }} />

        <div>
          {fragments.map((f) => (
            <div key={f.id} style={{ marginBottom: 8 }}>
              <div>{f.content}</div>
            </div>
          ))}
        </div>

      <hr style={{ margin: "24px 0" }} />

        <h2>Context</h2>

        <div style={{ display: "flex", flexDirection: "column", gap: 8, maxWidth: 520 }}>
          <input
            value={contextLabel}
            onChange={(e) => setContextLabel(e.target.value)}
            placeholder="label (例: 試験期間 / 旅行 / 体調不良)"
          />

          <label>
            start
            <input
              type="datetime-local"
              value={contextStart}
              onChange={(e) => setContextStart(e.target.value)}
            />
          </label>

          <label>
            end
            <input
              type="datetime-local"
              value={contextEnd}
              onChange={(e) => setContextEnd(e.target.value)}
            />
          </label>

          <button onClick={saveContext}>save context</button>
        </div>

        <div style={{ marginTop: 16 }}>
          {contexts.map((c) => (
            <div
              key={c.id}
              style={{
                padding: 8,
                border: "1px solid #ddd",
                marginBottom: 8,
              }}
            >
              <div>{c.label}</div>
              <div>
                {c.startAt?.toDate
                  ? c.startAt.toDate().toISOString()
                  : String(c.startAt)}
                {" 〜 "}
                {c.endAt?.toDate
                  ? c.endAt.toDate().toISOString()
                  : String(c.endAt)}
              </div>
            </div>
          ))}
        </div>


    </div>
  );
}
