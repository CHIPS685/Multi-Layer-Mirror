const bannedPatterns = [
  /すべき/g,
  /したほうがいい/g,
  /しなさい/g,
  /おすすめ/g,
  /診断/g,
  /タイプ/g,
  /向いている/g,
  /治る/g,
  /メンタル/g,
  /あなたは/g,
  /絶対/g,
];

export function assertNoBannedPhrases(text: string): void {
  for (const p of bannedPatterns) {
    if (p.test(text)) {
      throw new Error("policy_violation_banned_phrase");
    }
  }
}

export function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

export function trimQuote80(s: string): string {
  const t = (s ?? "").replace(/\s+/g, " ").trim();
  return t.length > 80 ? t.slice(0, 80) : t;
}
