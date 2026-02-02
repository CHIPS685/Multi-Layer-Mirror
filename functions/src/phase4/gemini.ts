import { VertexAI } from "@google-cloud/vertexai";

export async function analyzeFragmentWithGemini(content: string) {
  try {
    const vertexAI = new VertexAI({
      project: "multi-layer-mirror-664a2",
      location: "us-central1",
    });

    const model = vertexAI.getGenerativeModel({
      model: "gemini-2.0-flash",
    });

    // 設計書に従い、数値(0-1)と根拠語のみを要求するプロンプト
    const prompt = `
Analyze the following text on 4 axes: action, obstacle, evaluation, control.
Output ONLY a valid JSON object. No conversation, no markdown blocks.

Required JSON Structure:
{
  "axisScores": { "action": 0.5, "obstacle": 0.1, "evaluation": 0.8, "control": 0.5 },
  "axisEvidence": { "action": ["text"], "obstacle": [], "evaluation": ["text"], "control": [] }
}

Text:
${content}
`;

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
    });

    const rawText = result.response.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!rawText) throw new Error("No response text from Gemini");

    // Markdownの装飾 (```json ... ```) が混入してもパースできるよう整形
    const cleanJson = rawText.replace(/```json/g, "").replace(/```/g, "").trim();
    const parsed = JSON.parse(cleanJson);

    return {
      axisScores: parsed.axisScores,
      axisEvidence: parsed.axisEvidence ?? {
        action: [],
        obstacle: [],
        evaluation: [],
        control: [],
      },
      axisVersionMap: {
        action: "gemini_v1",
        obstacle: "gemini_v1",
        evaluation: "gemini_v1",
        control: "gemini_v1",
      },
    };
  } catch (err) {
    console.error("Gemini Analyzer error:", err);
    return null;
  }
}