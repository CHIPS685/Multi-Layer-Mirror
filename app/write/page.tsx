"use client";

import { useState } from "react";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { auth, db } from "../lib/firebase";

export default function WritePage() {
  const [text, setText] = useState("");

  const save = async () => {
    if (!auth.currentUser) return;
    if (!text.trim()) return;

    await addDoc(
      collection(db, `users/${auth.currentUser.uid}/fragments`),
      {
        text,
        createdAt: serverTimestamp(),
      }
    );

    setText("");
  };

  return (
    <div className="write-page">
      <main>
        <h1 className="page-title">Write</h1>
        <p className="page-subtitle">ここにそのまま書く</p>

        <div style={{ marginTop: "16px" }}>
          <button onClick={save}>保存</button>
        </div>
      </main>
    </div>
  );
}
