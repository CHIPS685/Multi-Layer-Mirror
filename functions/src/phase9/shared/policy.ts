const bannedAdvice = [
  "すべき",
  "したほうがいい",
  "するといい",
  "おすすめ",
  "推奨",
  "アドバイス",
];

const bannedSelfRef = [
  "私はAI",
  "AIとして",
  "言語モデル",
  "ChatGPT",
  "Gemini",
];

const shakyAssertion = [
  "きっと",
  "間違いなく",
  "確実に",
];

export function policyCheckOrThrow(text: string): void {
  const t = text || "";
  for (const w of bannedAdvice) {
    if (t.includes(w)) throw new Error("生成文が助言表現を含むため保存できません");
  }
  for (const w of bannedSelfRef) {
    if (t.includes(w)) throw new Error("生成文が自己言及を含むため保存できません");
  }
  for (const w of shakyAssertion) {
    if (t.includes(w)) throw new Error("生成文が根拠なき断定表現を含むため保存できません");
  }
  if (t.trim().length === 0) throw new Error("生成文が空です");
}
