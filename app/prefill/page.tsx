"use client";

import { useMemo, useState } from "react";
import PageShell from "../components/PageShell";
import Card from "../components/Card";
import SectionHeader from "../components/SectionHeader";
import EmptyState from "../components/EmptyState";
import Skeleton from "../components/Skeleton";
import { TextArea } from "../components/Field";
import { callContextualPrefill } from "../lib/callables";
import { assertNonEmpty } from "../lib/guards";
import { clampText } from "../lib/format";

type Candidate = { id:string; label:string; quote?:string; sourceRefs?:any[]; };
type PrefillOut = { prefillCandidates:Candidate[]; draftText:string; };

export default function PrefillPage(){
  const [questionText,setQuestionText]=useState("");
  const [loading,setLoading]=useState(false);
  const [out,setOut]=useState<PrefillOut|null>(null);
  const [err,setErr]=useState("");
  const [selected,setSelected]=useState<Record<string,boolean>>({});

  const selectedList = useMemo(()=>{
    const all = out?.prefillCandidates ?? [];
    return all.filter(c=>selected[c.id]);
  },[out,selected]);

  const draft = useMemo(()=>{
    if(!out)return"";
    if(selectedList.length===0)return out.draftText || "";
    const lines = selectedList.map(c=>`・${c.label}`);
    const base = out.draftText ? out.draftText.trim() : questionText.trim();
    return `${base}\n\n前提候補\n${lines.join("\n")}`;
  },[out,selectedList,questionText]);

  async function run(){
    setErr("");
    setOut(null);
    setSelected({});
    try{
      const q = assertNonEmpty(questionText,"質問を入力してください。");
      setLoading(true);
      const data = await callContextualPrefill({questionText:q});
      setOut(data as any);
    }catch(e:any){
      setErr(e?.message ?? "失敗しました。");
    }finally{
      setLoading(false);
    }
  }

  async function copy(){
    await navigator.clipboard.writeText(draft);
  }

  return (
    <PageShell title="Prefill" sub="前提候補を並べ、選んだ材料だけで下書きを組み立てます。答えは作りません。">
      <Card>
        <SectionHeader title="質問" sub="一文でOKです。前提は後で選べます。"/>
        <div className="hr"/>
        <TextArea label="入力" value={questionText} onChange={setQuestionText} placeholder="例:最近やる気が出ない" rows={4}/>
        <div style={{height:14}}/>
        <div style={{display:"flex",justifyContent:"flex-end",gap:10}}>
          <button className="btnPrimary" disabled={loading} onClick={run}>候補を出す</button>
        </div>
        {err ? <div className="small" style={{marginTop:12}}>{err}</div> : null}
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
        <EmptyState title="まだ候補はありません" sub="実行すると、記録から拾える事実が候補として並びます。"/>
      ) : (
        <>
          <div className="row">
            <div className="col">
              <Card>
                <SectionHeader title="前提候補" sub="断定しません。事実だけを並べます。"/>
                <div className="hr"/>
                {(out.prefillCandidates ?? []).length===0 ? (
                  <div className="small">候補が空でも正常です。見つからなかっただけです。</div>
                ) : (
                  <div style={{display:"flex",flexDirection:"column",gap:10}}>
                    {out.prefillCandidates.slice(0,12).map(c=>(
                      <div key={c.id} className="card" style={{boxShadow:"none",background:"rgba(255,255,255,.75)"}}>
                        <div className="cardPad" style={{display:"flex",gap:12,alignItems:"flex-start"}}>
                          <input
                            type="checkbox"
                            checked={!!selected[c.id]}
                            onChange={(e)=>setSelected(s=>({ ...s,[c.id]:e.target.checked }))}
                            style={{marginTop:4}}
                          />
                          <div style={{minWidth:0}}>
                            <div style={{fontWeight:800,lineHeight:1.6}}>{c.label}</div>
                            {c.quote ? <div className="small" style={{marginTop:8,lineHeight:1.7}}>{clampText(c.quote,120)}</div> : null}
                            <div className="small" style={{marginTop:8}}>参照fragment/daily/contextなど</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </div>

            <div className="col">
              <Card>
                <SectionHeader title="選択中" sub="採用した候補だけが並びます。"/>
                <div className="hr"/>
                {selectedList.length===0 ? (
                  <div className="small">未選択でも正常です。下書きはそのまま使えます。</div>
                ) : (
                  <div style={{display:"flex",flexDirection:"column",gap:10}}>
                    {selectedList.map(c=>(
                      <div key={c.id} className="pill">
                        <span className="dot"/>
                        <span style={{fontWeight:700}}>{clampText(c.label,48)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </div>
          </div>

          <div style={{height:16}}/>

          <Card>
            <SectionHeader
              title="下書き"
              sub="これは下書きです。結論や提案は混ぜません。"
              right={<button className="btnPrimary" onClick={copy}>コピー</button>}
            />
            <div className="hr"/>
            <div className="card" style={{boxShadow:"none",background:"rgba(255,255,255,.75)"}}>
              <div className="cardPad" style={{whiteSpace:"pre-wrap",lineHeight:1.9}}>
                {draft || "—"}
              </div>
            </div>
          </Card>
        </>
      )}
    </PageShell>
  );
}
