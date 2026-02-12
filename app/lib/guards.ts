export function assertNonEmpty(v:string,msg:string){
  const x=(v??"").trim();
  if(!x)throw new Error(msg);
  return x;
}
