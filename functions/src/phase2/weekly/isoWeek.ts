const pad2=(n:number)=>String(n).padStart(2,"0");

//ISO週のweekId(YYYY-WW)をUTCで返す
export function getIsoWeekIdUTC(date:Date):string{
  const d=new Date(Date.UTC(date.getUTCFullYear(),date.getUTCMonth(),date.getUTCDate()));
  //木曜基準
  const day=(d.getUTCDay()+6)%7; //Mon=0...Sun=6
  d.setUTCDate(d.getUTCDate()-day+3);
  const isoYear=d.getUTCFullYear();
  const firstThursday=new Date(Date.UTC(isoYear,0,4));
  const firstDay=(firstThursday.getUTCDay()+6)%7;
  firstThursday.setUTCDate(firstThursday.getUTCDate()-firstDay+3);
  const week=Math.round((d.getTime()-firstThursday.getTime())/(7*24*60*60*1000))+1;
  return `${isoYear}-${pad2(week)}`;
}

//weekId(YYYY-WW)の週範囲(UTC,半開区間)を返す
export function getIsoWeekRangeUTC(weekId:string):{start:Date;end:Date}{
  const [yStr,wStr]=weekId.split("-");
  const isoYear=Number(yStr);
  const isoWeek=Number(wStr);
  const jan4=new Date(Date.UTC(isoYear,0,4));
  const jan4Day=(jan4.getUTCDay()+6)%7;
  const firstMon=new Date(jan4);
  firstMon.setUTCDate(jan4.getUTCDate()-jan4Day);
  const start=new Date(firstMon);
  start.setUTCDate(firstMon.getUTCDate()+(isoWeek-1)*7);
  const end=new Date(start);
  end.setUTCDate(start.getUTCDate()+7);
  return {start,end};
}

export function getPrevWeekId(weekId:string):string{
  const {start}=getIsoWeekRangeUTC(weekId);
  const prev=new Date(start);
  prev.setUTCDate(start.getUTCDate()-7);
  return getIsoWeekIdUTC(prev);
}
