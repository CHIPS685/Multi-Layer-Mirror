export function clampText(s:string,max:number){
  if(!s)return"";
  return s.length>max ? s.slice(0,max)+"…" : s;
}

export function fmtDateRange(a:string,b:string){
  if(!a||!b)return"";
  return `${a}→${b}`;
}
