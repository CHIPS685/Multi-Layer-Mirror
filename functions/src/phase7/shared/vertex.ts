import { VertexAI } from "@google-cloud/vertexai";

function getEnv(name: string, fallback: string): string {
  const v = process.env[name];
  return v && v.length > 0 ? v : fallback;
}

const project = getEnv("GCP_PROJECT", getEnv("GCLOUD_PROJECT", ""));
const location = getEnv("VERTEX_LOCATION", "us-central1");
const modelName = getEnv("PHASE7_MODEL", "gemini-2.0-flash");

export async function generateFromGemini(prompt: string): Promise<string> {
  if (!project) throw new Error("missing_project_id");

  const vertex = new VertexAI({ project, location });

  const generativeModel = vertex.getGenerativeModel({
    model: modelName,
    generationConfig: {
      responseMimeType: "application/json",
    },
  });

  const result = await generativeModel.generateContent({
    contents: [
      {
        role: "user",
        parts: [{ text: prompt }],
      },
    ],
  });

  const text =
    result?.response?.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!text) {
    throw new Error("empty_model_output");
  }

  return text;
}
