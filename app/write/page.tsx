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
        content: text,
        createdAt: serverTimestamp(),
      }
    );

    setText("");
  };

  return (
    <div className="write-page">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="ここに書く"
        style={{
          width: "100%",
          minHeight: "160px",
          marginTop: "12px",
        }}
      />

      <div style={{ marginTop: "16px" }}>
        <button onClick={save}>保存</button>
      </div>
    </div>
  );
}
