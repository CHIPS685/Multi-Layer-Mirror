import { httpsCallable } from "firebase/functions";
import { functions } from "./firebase";

export async function callTimeSlicedDialogue(input:{
  queryText:string;
  timesliceType:string;
  timesliceValue:any;
}){
  const fn = httpsCallable(functions,"callTimeSlicedDialogue");
  const res:any = await fn(input);
  return res.data;
}

export async function callContextualPrefill(input:{
  questionText:string;
  timeslice?:{type:string;value:any};
}){
  const fn = httpsCallable(functions,"callContextualPrefill");
  const res:any = await fn(input);
  return res.data;
}
