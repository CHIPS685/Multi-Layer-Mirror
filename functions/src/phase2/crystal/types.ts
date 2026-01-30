export type CrystalDoc = {
  weekId: string;
  generatedAt: FirebaseFirestore.Timestamp | FirebaseFirestore.FieldValue;
  algorithmVersion: "v1";
  sourceWeeklyVersion: "v1";
  selectedVersionSignature: string;
  lines: string[]; // 最大3行
};
