"use client";

import { useMemo, useState } from "react";
import PageShell from "../components/PageShell";
import Card from "../components/Card";
import SectionHeader from "../components/SectionHeader";
import EmptyState from "../components/EmptyState";
import Skeleton from "../components/Skeleton";
import { Field, TextArea } from "../components/Field";
import { callTimeSlicedDialogue } from "../lib/callables";
import { assertNonEmpty } from "../lib/guards";
import { clampText } from "../lib/format";

type DialogueOut = {
  dialogueText:string;
  evidenceQuotes?:string[];
  evidenceRefs?:any[];
  coverage?:number;
  missing?:string[];
};

export default function TalkPage(){
  const [queryText,setQueryText]=useState("");
  const [sliceType,setSliceType]=useState("relative");
  const [relativeDays,setRelativeDays]=useState("90");
  const [absoluteDate,setAbsoluteDate]=useState("");
  const [weekId,setWeekId]=useState("");
  const [contextId,setContextId]=useState("");
  const [loading,setLoading]=useState(false);
  const [out,setOut]=useState<DialogueOut|null>(null);
  const [err,setErr]=useState<string>("");

  const timesliceValue = useMemo(()=>{
    if(sliceType==="relative")return {days:Number(relativeDays||"90")};
    if(sliceType==="absolute")return {before:absoluteDate};
    if(sliceType==="week")return {weekId};
    if(sliceType==="context")return {contextId};
    return {};
  },[sliceType,relativeDays,absoluteDate,weekId,contextId]);

  async function run(){
    setErr("");
    setOut(null);
    try{
      const q = assertNonEmpty(queryText,"質問を入力してください。");
      setLoading(true);
      const data = await callTimeSlicedDialogue({
        queryText:q,
        timesliceType:sliceType,
        timesliceValue,
      });
      setOut(data as any);
    }catch(e:any){
      setErr(e?.message ?? "失敗しました。");
    }finally{
      setLoading(false);
    }
  }

  return (
    <PageShell title="TimeSliced Dialogue" sub="時点を制限し、その範囲の材料だけで返します。結論や助言は出しません。">
      <Card>
        <SectionHeader title="質問" sub="短くて大丈夫です。"/>
        <div className="hr"/>
        <TextArea label="入力" value={queryText} onChange={setQueryText} placeholder="例:このテーマを続けるべきか迷っている" rows={4}/>
        <div style={{height:14}}/>
        <div className="row" style={{gap:12}}>
          <div className="col">
            <div className="label">TimeSlice</div>
            <select className="input" value={sliceType} onChange={(e)=>setSliceType(e.target.value)}>
              <option value="relative">過去N日</option>
              <option value="absolute">YYYY-MM-DD以前</option>
              <option value="week">weekIdまで</option>
              <option value="context">contextId</option>
            </select>
          </div>
          <div className="col">
            {sliceType==="relative" ? <Field label="日数" value={relativeDays} onChange={setRelativeDays} placeholder="90"/> : null}
            {sliceType==="absolute" ? <Field label="日付" value={absoluteDate} onChange={setAbsoluteDate} placeholder="2026-02-03"/> : null}
            {sliceType==="week" ? <Field label="weekId" value={weekId} onChange={setWeekId} placeholder="2026-W06"/> : null}
            {sliceType==="context" ? <Field label="contextId" value={contextId} onChange={setContextId} placeholder="xxxxxxxx"/> : null}
          </div>
        </div>
        <div style={{height:14}}/>
        <div style={{display:"flex",justifyContent:"flex-end",gap:10}}>
          <button className="btnPrimary" disabled={loading} onClick={run}>対話する</button>
        </div>
        {err ? <div className="small" style={{marginTop:12,color:"rgba(15,23,42,.7)"}}>{err}</div> : null}
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
      ) : !out ? (
        <EmptyState title="まだ結果はありません" sub="時点を選んで実行すると、材料に基づく返答が出ます。"/>
      ) : (
        <>
          <Card>
            <SectionHeader title="返答" sub="断定・助言・診断はしません。"/>
            <div className="hr"/>
            <div style={{whiteSpace:"pre-wrap",lineHeight:1.9}}>{out.dialogueText || "材料不足"}</div>
            <div style={{height:10}}/>
            <div className="small">coverage{out.coverage ?? 0}missing{(out.missing ?? []).join(",")}</div>
          </Card>

          <div style={{height:16}}/>

          <Card>
            <SectionHeader title="根拠断片" sub="短い断片だけを表示します。"/>
            <div className="hr"/>
            {(out.evidenceQuotes ?? []).length===0 ? (
              <div className="small">根拠が足りない場合は空で正常です。</div>
            ) : (
              <div style={{display:"flex",flexDirection:"column",gap:10}}>
                {(out.evidenceQuotes ?? []).slice(0,8).map((q,i)=>(
                  <div key={i} className="card" style={{boxShadow:"none",background:"rgba(255,255,255,.75)"}}>
                    <div className="cardPad" style={{lineHeight:1.7}}>{clampText(q,120)}</div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </>
      )}
    </PageShell>
  );
}
