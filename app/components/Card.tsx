export default function Card(props:{children:React.ReactNode;pad?:boolean;}){
  return (
    <div className="card">
      <div className={props.pad===false ? "" : "cardPad"}>
        {props.children}
      </div>
    </div>
  );
}
