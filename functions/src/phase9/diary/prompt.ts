import { FragmentMaterial } from "./types";

export const PROMPT_VERSION = "phase11_v1";

function targetRange(count: number): { min: number; max: number } {
  if (count <= 0) return { min: 0, max: 0 };
  if (count <= 2) return { min: 200, max: 340 };
  if (count <= 6) return { min: 340, max: 540 };
  if (count <= 12) return { min: 540, max: 760 };
  return { min: 760, max: 900 };
}

function buildMaterials(materials: FragmentMaterial[]): string {
  return materials
    .map((m, i) => {
      const text = (m.text ?? "").trim();
      return `(${i + 1})\n${text}`;
    })
    .join("\n\n");
}

function buildHeader(dateId: string, count: number): string {
  const r = targetRange(count);

  return (
    `あなたは断片素材から当日の記録を整形する「鏡」。対象日付:${dateId}。素材数:${count}。\n` +
    `\n` +
    `絶対ルール:\n` +
    `素材にない事実を一切追加しない(出来事/人物/場所/理由/因果/評価/感情)。\n` +
    `推測は禁止(「〜ようだ」「〜かもしれない」等を使わない)。\n` +
    `助言/提案/説教/教訓は禁止。\n` +
    `AI/生成/モデル/プロンプト/ルール/素材などの自己言及は禁止。\n` +
    `\n` +
    `時刻ルール:\n` +
    `時刻や時間帯表現(朝/昼/夕方/夜)は原則書かない。\n` +
    `例外として、素材本文に同じ語がそのまま含まれている場合のみ、その語をそのまま使ってよい(言い換え禁止)。\n` +
    `存在しない時刻や時間帯を作らない。\n` +
    `\n` +
    `文体:\n` +
    `日記として自然な日本語。報告書/説明文/レビュー口調にしない。\n` +
    `箇条書きにしない。\n` +
    `見出し/番号/ラベルを出力しない(例:「要約」「本文」「締め」「1)」など禁止)。\n` +
    `素材の再掲や引用はしない(例:「(1)」を本文に出さない)。\n` +
    `\n` +
    `品質ルール(ここが重要):\n` +
    `各段落は「名詞だけ」や「単語だけ」で終わらせない(例:「テスト。」だけは禁止)。\n` +
    `短い素材でも、自然な日本語の文に整えて終える(ただし事実を増やさない)。\n` +
    `列挙になりそうなときは、出来事同士を無理に因果で繋げず、時間の流れとして滑らかに並べる。\n` +
    `同じ語尾が続く場合は言い回しを調整して読みやすくする(事実は変えない)。\n` +
    `\n` +
    `内部構造(出力に見せない):\n` +
    `最初に短い全体像を1〜3文。\n` +
    `次に時系列で自然な文章へ編み直した本文。\n` +
    `最後に静かな余韻で閉じる(素材範囲内、ポエム化しない)。\n` +
    `\n` +
    `長さ指針:\n` +
    `目安は${r.min}〜${r.max}字。素材量に応じて自然な長さにし、冗長にしない。少素材日は短くてよい。\n` +
    `\n` +
    `出力は日記本文のみ。余計な注釈、ルール説明、メタ情報は一切出さない。\n`+
    `未来の決意や目標を新たに生成しない。\n`+
    `短文を連続させず、適度に文を接続して流れを作る。\n`+
    `語尾が単調にならないように調整する。\n`

  );
}

export function buildPrompt(dateId: string, materials: FragmentMaterial[]): string {
  const header = buildHeader(dateId, materials.length);
  const body = buildMaterials(materials);
  return `${header}\n素材:\n${body}`;
}