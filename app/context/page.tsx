"use client";

import { useState } from "react";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { auth, db } from "../lib/firebase";

export default function ContextPage() {
  const [label, setLabel] = useState("");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");

  const save = async () => {
    if (!auth.currentUser) return;
    if (!label || !start || !end) return;

    await addDoc(
      collection(db, `users/${auth.currentUser.uid}/contexts`),
      {
        label,
        startAt: new Date(start),
        endAt: new Date(end),
        createdAt: serverTimestamp(),
      }
    );

    setLabel("");
    setStart("");
    setEnd("");
  };

  return (
    <div className="context-page">
      <main>
        <h1 className="page-title">Context</h1>
        <div>
          <label>Label</label>
          <br />
          <input value={label} onChange={(e) => setLabel(e.target.value)} />
        </div>

        <div style={{ marginTop: "12px" }}>
          <label>Start</label>
          <br />
          <input type="date" value={start} onChange={(e) => setStart(e.target.value)} />
        </div>

        <div style={{ marginTop: "12px" }}>
          <label>End</label>
          <br />
          <input type="date" value={end} onChange={(e) => setEnd(e.target.value)} />
        </div>

        <div style={{ marginTop: "16px" }}>
          <button onClick={save}>save context</button>
        </div>
      </main>
    </div>
  );
}
