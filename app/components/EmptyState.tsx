import Card from "./Card";

export default function EmptyState(props:{title:string;sub?:string;}){
  return (
    <Card>
      <div style={{fontWeight:700}}>{props.title}</div>
      {props.sub ? <div className="small" style={{marginTop:8,lineHeight:1.7}}>{props.sub}</div> : null}
    </Card>
  );
}
