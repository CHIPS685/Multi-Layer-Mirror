export default function SectionHeader(props:{title:string;sub?:string;right?:React.ReactNode;}){
  return (
    <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:14}}>
      <div style={{minWidth:0}}>
        <div style={{fontSize:18,fontWeight:700}}>{props.title}</div>
        {props.sub ? <div className="small" style={{marginTop:6,lineHeight:1.6}}>{props.sub}</div> : null}
      </div>
      {props.right ? <div>{props.right}</div> : null}
    </div>
  );
}
