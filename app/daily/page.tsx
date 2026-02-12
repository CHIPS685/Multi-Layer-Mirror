"use client";

import { useEffect, useMemo, useState } from "react";
import PageShell from "../components/PageShell";
import Card from "../components/Card";
import SectionHeader from "../components/SectionHeader";
import EmptyState from "../components/EmptyState";
import Skeleton from "../components/Skeleton";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../lib/firebase";

type AxisScores = { action:number; obstacle:number; evaluation:number; control:number; };
type DailyDoc = {
  dateId:string;
  axesMean:AxisScores;
  deltaPrevDay?:AxisScores;
  baseline?:AxisScores;
  fragmentCount?:number;
  observationCount?:number;
  text?:string;
};

const labels:Record<keyof AxisScores,string> = {
  action:"動きやすさ",
  obstacle:"引っかかり",
  evaluation:"手応え",
  control:"整い具合",
};

function fmt(n:number|undefined){
  if(n===undefined||n===null||Number.isNaN(n))return"—";
  return n.toFixed(2);
}

function fmtDelta(n:number|undefined){
  if(n===undefined||n===null||Number.isNaN(n))return"";
  const s = n>=0 ? `+${n.toFixed(2)}` : `${n.toFixed(2)}`;
  return `(${s})`;
}

export default function DailyPage(){
  const [uid,setUid]=useState<string|null>(null);
  const [dateId,setDateId]=useState(()=>new Date().toISOString().slice(0,10));
  const [loading,setLoading]=useState(false);
  const [daily,setDaily]=useState<DailyDoc|null>(null);
  const [baseline,setBaseline]=useState<AxisScores|null>(null);

  useEffect(()=>{
    const u=auth.currentUser;
    if(!u)return;
    setUid(u.uid);
  },[]);

  useEffect(()=>{
    if(!uid)return;
    (async()=>{
      setLoading(true);
      try{
        const b = await getDoc(doc(db,`users/${uid}/baselines/current`));
        setBaseline(b.exists() ? (b.data() as any).axesMedian ?? (b.data() as any).axesMean ?? null : null);
        const d = await getDoc(doc(db,`users/${uid}/dailies/${dateId}`));
        setDaily(d.exists() ? ({dateId, ...(d.data() as any)}) : null);
      }finally{
        setLoading(false);
      }
    })();
  },[uid,dateId]);

  const blocks = useMemo(()=>{
    const a=daily?.axesMean;
    const dp=daily?.deltaPrevDay;
    const base = (daily as any)?.baseline ?? baseline;
    const keys:(keyof AxisScores)[]=["action","obstacle","evaluation","control"];
    return keys.map(k=>({
      k,
      label:labels[k],
      value:fmt(a?.[k]),
      delta:fmtDelta(dp?.[k]),
      base:fmt(base?.[k]),
    }));
  },[daily,baseline]);

  return (
    <PageShell title="Daily" sub="当日値と前日比と基準差を、評価せずに並べます。">
      <Card>
        <SectionHeader
          title="日付"
          sub="日付を切り替えて、その日の輪郭だけを確認します。"
          right={<input className="input" style={{width:190}} type="date" value={dateId} onChange={(e)=>setDateId(e.target.value)}/>}
        />
      </Card>

      <div style={{height:16}}/>

      {loading ? (
        <Card>
          <div style={{display:"flex",flexDirection:"column",gap:10}}>
            <Skeleton h={18}/>
            <Skeleton h={18}/>
            <Skeleton h={18}/>
          </div>
        </Card>
      ) : !daily ? (
        <EmptyState title="この日のDailyはまだありません" sub="未生成は正常です。推測で埋めません。"/>
      ) : (
        <Card>
          <SectionHeader title={dateId} sub={`記録${daily.fragmentCount ?? 0}件観測${daily.observationCount ?? 0}件`}/>
          <div className="hr"/>
          <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12}}>
            {blocks.map(b=>(
              <div key={b.k} className="card" style={{boxShadow:"none",background:"rgba(255,255,255,.75)"}}>
                <div className="cardPad">
                  <div className="small" style={{display:"flex",alignItems:"center",gap:10}}>
                    <span className="dot"/>
                    <span>{b.label}</span>
                  </div>
                  <div style={{marginTop:10,fontSize:28,fontWeight:900,letterSpacing:"-.02em"}}>
                    {b.value}<span className="small" style={{marginLeft:8}}>{b.delta}</span>
                  </div>
                  <div className="small" style={{marginTop:10}}>基準{b.base}</div>
                </div>
              </div>
            ))}
          </div>
          {daily.text ? (
            <>
              <div className="hr"/>
              <div className="small" style={{lineHeight:1.8,whiteSpace:"pre-wrap"}}>{daily.text}</div>
            </>
          ) : null}
        </Card>
      )}
    </PageShell>
  );
}
