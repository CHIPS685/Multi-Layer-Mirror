import * as admin from "firebase-admin";
import {getIsoWeekIdUTC,getIsoWeekRangeUTC,getPrevWeekId} from "./isoWeek";
import {ObservationDoc,WeeklyDoc,WeeklyStats,WeeklyByVersion,DeltaStatus,AxisScores} from "./types";

//既存のPhase2-0抽出関数があるなら、ここだけパスを合わせて
//戻り値はObservationDoc[]相当で、最低限id,createdAt,axisScores,axisVersionMapが取れればOK
import { getObservationDocsByWeek } from "./getObservationDocsByWeek";


const signatureOf=(axisVersionMap:Record<string,string>):string=>{
  const keys=Object.keys(axisVersionMap).sort();
  return keys.map(k=>`${k}=${axisVersionMap[k]}`).join("|");
};

const computeStats=(obs:ObservationDoc[]):{byVersion:WeeklyByVersion;selectedSig:string|null;selected:WeeklyStats|null;}=>{
  const byVersion:WeeklyByVersion={};

  for(const o of obs){
    const sig=signatureOf(o.axisVersionMap||{});
    if(!byVersion[sig]){
      byVersion[sig]={count:0,means:{}};
    }
    byVersion[sig].count+=1;
    const cur=byVersion[sig];
    for(const [axis,val] of Object.entries(o.axisScores||{})){
      cur.means[axis]=(cur.means[axis]??0)+val;
    }
  }

  for(const sig of Object.keys(byVersion)){
    const cur=byVersion[sig];
    const axes=Object.keys(cur.means);
    for(const a of axes){
      cur.means[a]=cur.means[a]/cur.count;
    }
  }

  const sigs=Object.keys(byVersion).sort();
  if(sigs.length===0) return {byVersion,selectedSig:null,selected:null};

  let bestSig=sigs[0];
  for(const s of sigs){
    if(byVersion[s].count>byVersion[bestSig].count) bestSig=s;
    else if(byVersion[s].count===byVersion[bestSig].count && s<bestSig) bestSig=s;
  }

  return {byVersion,selectedSig:bestSig,selected:byVersion[bestSig]};
};

const computeDelta=(thisMeans:AxisScores,prevMeans:AxisScores):AxisScores=>{
  const keys=Array.from(new Set([...Object.keys(thisMeans),...Object.keys(prevMeans)])).sort();
  const delta:AxisScores={};
  for(const k of keys){
    const a=thisMeans[k];
    const b=prevMeans[k];
    if(typeof a==="number" && typeof b==="number") delta[k]=a-b;
  }
  return delta;
};

export async function computeWeeklyObservationForUser(uid:string,weekId:string):Promise<void>{
  const db=admin.firestore();

  const range=getIsoWeekRangeUTC(weekId);
  const periodStartAt=admin.firestore.Timestamp.fromDate(range.start);
  const periodEndAt=admin.firestore.Timestamp.fromDate(range.end);

  const prevWeekId=getPrevWeekId(weekId);

  const thisObs = await getObservationDocsByWeek(uid, weekId);
  const prevObs = await getObservationDocsByWeek(uid, prevWeekId);


  const thisComputed=computeStats(thisObs);
  const prevComputed=computeStats(prevObs);

  let deltaStatus:DeltaStatus=0;
  let delta:AxisScores|null=null;

  if(!thisComputed.selectedSig){
    deltaStatus=3;
  }else if(!prevComputed.selectedSig){
    deltaStatus=1;
  }else if(thisComputed.selectedSig!==prevComputed.selectedSig){
    deltaStatus=2;
  }else{
    deltaStatus=0;
    delta=computeDelta(thisComputed.selected!.means,prevComputed.selected!.means);
  }

  const doc:WeeklyDoc={
    weekId,
    periodStartAt,
    periodEndAt,
    computedAt:admin.firestore.FieldValue.serverTimestamp(),
    algorithmVersion:"v1",
    selectedVersionSignature:thisComputed.selectedSig,
    deltaStatus,
    byVersion:thisComputed.byVersion,
    selected:thisComputed.selected,
    delta
  };

  await db.doc(`users/${uid}/weekly/${weekId}`).set(doc,{merge:true});
}

//スケジューラ用:今週を計算する
export async function computeWeeklyObservationNow(uid:string):Promise<void>{
  const now=new Date();
  const weekId=getIsoWeekIdUTC(now);
  await computeWeeklyObservationForUser(uid,weekId);
}
