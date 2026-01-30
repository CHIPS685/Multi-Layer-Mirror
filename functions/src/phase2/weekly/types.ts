export type AxisScores=Record<string,number>;
export type AxisVersionMap=Record<string,string>;

export type ObservationDoc={
  id:string;
  createdAt:FirebaseFirestore.Timestamp;
  axisScores:AxisScores;
  axisVersionMap:AxisVersionMap;
};

export type WeeklyStats={
  count:number;
  means:AxisScores;
};

export type WeeklyByVersion=Record<string,WeeklyStats>;

export type DeltaStatus=0|1|2|3;
//0:OK
//1:PREV_EMPTY
//2:VERSION_MISMATCH
//3:THIS_EMPTY

export type WeeklyDoc={
  weekId:string;
  periodStartAt:FirebaseFirestore.Timestamp;
  periodEndAt:FirebaseFirestore.Timestamp;
  computedAt:FirebaseFirestore.FieldValue;
  algorithmVersion:"v1";
  selectedVersionSignature:string|null;
  deltaStatus:DeltaStatus;
  byVersion:WeeklyByVersion;
  selected:WeeklyStats|null;
  delta:AxisScores|null;
};
