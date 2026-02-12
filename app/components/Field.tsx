export function Field(props:{
  label:string;
  value:string;
  onChange:(v:string)=>void;
  placeholder?:string;
  type?:"text"|"date";
}){
  return (
    <div>
      <div className="label">{props.label}</div>
      <input
        className="input"
        value={props.value}
        placeholder={props.placeholder}
        type={props.type ?? "text"}
        onChange={(e)=>props.onChange(e.target.value)}
      />
    </div>
  );
}

export function TextArea(props:{
  label:string;
  value:string;
  onChange:(v:string)=>void;
  placeholder?:string;
  rows?:number;
}){
  return (
    <div>
      <div className="label">{props.label}</div>
      <textarea
        className="input"
        style={{minHeight:(props.rows ?? 6)*22,resize:"vertical"}}
        value={props.value}
        placeholder={props.placeholder}
        onChange={(e)=>props.onChange(e.target.value)}
      />
    </div>
  );
}
