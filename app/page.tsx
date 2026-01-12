"use client";

import { useEffect, useState } from "react";
import { signInAnonymously } from "firebase/auth";
import { addDoc, collection, serverTimestamp,query,orderBy,getDocs, } from "firebase/firestore";
import { auth, db } from "./lib/firebase";

export default function Home() {
  const [uid, setUid] = useState<string | null>(null);
  const [text, setText] = useState("");
  const [fragments, setFragments] = useState<any[]>([]);


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

    </div>
  );
}
