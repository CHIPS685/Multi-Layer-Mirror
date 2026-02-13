import { VertexAI } from "@google-cloud/vertexai";

export type LlmConfig = {
  project: string;
  location: string;
  model: string;
};

export async function generateText(prompt: string, cfg: LlmConfig): Promise<string> {
  const vertexAi = new VertexAI({ project: cfg.project, location: cfg.location });
  const model = vertexAi.getGenerativeModel({ model: cfg.model });

  const resp = await model.generateContent({
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    generationConfig: { temperature: 0.4, maxOutputTokens: 1200 },
  });

  const text = resp.response.candidates?.[0]?.content?.parts?.map((p: any) => p.text || "").join("") || "";
  return text;
}