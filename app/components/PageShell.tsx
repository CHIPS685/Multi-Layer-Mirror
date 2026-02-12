export default function PageShell(props:{
  title:string;
  sub?:string;
  children:React.ReactNode;
}){
  return (
    <div className="container">
      <h1 className="h1">{props.title}</h1>
      {props.sub ? <p className="sub">{props.sub}</p> : null}
      <div style={{height:22}}/>
      {props.children}
    </div>
  );
}
