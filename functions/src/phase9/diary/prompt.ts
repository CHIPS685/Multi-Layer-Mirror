import { FragmentMaterial } from "./types";

export const PROMPT_VERSION = "phase9-2_v1";

export function buildPrompt(dateId: string, materials: FragmentMaterial[]): string {
  const header =
    `あなたは日記生成器ではなく、断片素材をもとに「当日の記録」を整形する鏡である。\n` +
    `次の素材以外の事実を絶対に追加しない。\n` +
    `助言をしない。過剰な因果を作らない。根拠がない断定をしない。\n` +
    `一人称でユーザー視点。プレーンテキスト。段落改行は保持。\n` +
    `目安は600〜900文字。\n` +
    `対象日付:${dateId}\n`;

  const body = materials
    .map((m, i) => `#${i + 1} ${m.createdAtLabel}\n${m.text}`)
    .join("\n\n");

  const out =
    `\n出力は日記本文のみ。\n` +
    `素材数:${materials.length}\n`;

  return `${header}\n素材:\n${body}\n${out}`;
}
