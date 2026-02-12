export default function Skeleton(props:{h?:number;}){
  return (
    <div style={{
      height:props.h ?? 14,
      borderRadius:12,
      border:"1px solid rgba(15,23,42,.06)",
      background:"rgba(255,255,255,.55)",
      overflow:"hidden"
    }}/>
  );
}
