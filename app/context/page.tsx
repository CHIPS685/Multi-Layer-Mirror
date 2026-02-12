"use client";

import { useEffect, useMemo, useState } from "react";
import PageShell from "../components/PageShell";
import Card from "../components/Card";
import SectionHeader from "../components/SectionHeader";
import EmptyState from "../components/EmptyState";
import { Field } from "../components/Field";
import { addDoc, collection, onSnapshot, orderBy, query, serverTimestamp } from "firebase/firestore";
import { auth, db } from "../lib/firebase";
import { fmtDateRange } from "../lib/format";

type CtxDoc = {
  id:string;
  label:string;
  startAt:string;
  endAt:string;
  createdAt?:any;
};

function dotColor(label:string){
  let h=0;
  for(let i=0;i<label.length;i++)h=(h*31+label.charCodeAt(i))%360;
  return `hsla(${h},35%,55%,.55)`;
}

export default function ContextPage(){
  const [uid,setUid]=useState<string|null>(null);
  const [items,setItems]=useState<CtxDoc[]>([]);
  const [label,setLabel]=useState("");
  const [startAt,setStartAt]=useState("");
  const [endAt,setEndAt]=useState("");
  const [saving,setSaving]=useState(false);
  const canSave = useMemo(()=>{
    return !!uid && label.trim().length>0 && startAt.length>0 && endAt.length>0 && !saving;
  },[uid,label,startAt,endAt,saving]);

  useEffect(()=>{
    const u = auth.currentUser;
    if(!u)return;
    setUid(u.uid);
    const q = query(collection(db,`users/${u.uid}/contexts`),orderBy("startAt","desc"));
    return onSnapshot(q,(snap)=>{
      const next:CtxDoc[] = snap.docs.map(d=>({id:d.id,...(d.data() as any)}));
      setItems(next);
    });
  },[]);

  async function save(){
    if(!uid)return;
    if(!label.trim())return;
    if(!startAt||!endAt)return;
    setSaving(true);
    try{
      await addDoc(collection(db,`users/${uid}/contexts`),{
        label:label.trim(),
        startAt,
        endAt,
        createdAt:serverTimestamp(),
      });
      setLabel("");
      setStartAt("");
      setEndAt("");
    }finally{
      setSaving(false);
    }
  }

  return (
    <PageShell title="Context" sub="一定期間に存在した文脈を、ラベルと期間として登録します。">
      <div className="row">
        <div className="col">
          <Card>
            <SectionHeader title="登録済みの文脈" sub="ラベルと期間のみを一覧で表示します。"/>
            <div className="hr"/>
            {items.length===0 ? (
              <EmptyState title="まだ文脈がありません" sub="右側でラベルと期間を登録できます。"/>
            ) : (
              <div style={{display:"flex",flexDirection:"column",gap:10}}>
                {items.map(it=>(
                  <div key={it.id} className="card" style={{boxShadow:"none",background:"rgba(255,255,255,.75)"}}>
                    <div className="cardPad" style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:14}}>
                      <div style={{display:"flex",alignItems:"flex-start",gap:12,minWidth:0}}>
                        <div className="dot" style={{background:dotColor(it.label),marginTop:6}}/>
                        <div style={{minWidth:0}}>
                          <div style={{fontWeight:800,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{it.label}</div>
                          <div className="small" style={{marginTop:6}}>{fmtDateRange(it.startAt,it.endAt)}</div>
                        </div>
                      </div>
                      <div className="small"> </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        <div className="col">
          <Card>
            <SectionHeader title="新しい文脈を登録" sub="意味付けや分類は行わず、期間だけを置きます。"/>
            <div className="hr"/>
            <div style={{display:"flex",flexDirection:"column",gap:14}}>
              <Field label="ラベル" value={label} onChange={setLabel} placeholder="例:期末試験"/>
              <div className="row" style={{gap:12}}>
                <div className="col">
                  <Field label="開始日" value={startAt} onChange={setStartAt} type="date"/>
                </div>
                <div className="col">
                  <Field label="終了日" value={endAt} onChange={setEndAt} type="date"/>
                </div>
              </div>
              <div style={{display:"flex",justifyContent:"flex-end",gap:10}}>
                <button className="btnPrimary" disabled={!canSave} onClick={save}>登録</button>
              </div>
              <div className="small">登録完了は機械的に反映されます。関連週や影響は表示しません。</div>
            </div>
          </Card>
        </div>
      </div>
    </PageShell>
  );
}
