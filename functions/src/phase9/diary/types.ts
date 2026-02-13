export type FragmentMaterial = {
  createdAtLabel: string;
  text: string;
};

export type GenerateResult = {
  dateId: string;
  versionId: string;
  generatedAt: string;
  text: string;
  facts: Record<string, unknown>;
  stats: { fragmentCount: number };
  model: string;
  promptVersion: string;
};