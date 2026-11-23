import { isValidId } from "./validate.ts";
import { shuffleIndexes } from "./matching.ts";

export interface FlyingWordsRound {
  clue: string;
  sentence: string;
}

export interface FlyingWordsSet {
  id: string;
  title: string;
  rounds: FlyingWordsRound[];
}

export function words(sentence: string): string[] {
  return sentence.trim().split(/\s+/u).filter(Boolean);
}

export function parseFlyingWordsSet(value: unknown): FlyingWordsSet | string {
  if (!value || typeof value !== "object") return "Dữ liệu bộ từ ngữ không hợp lệ.";
  const raw = value as Record<string, unknown>;
  if (typeof raw.id !== "string" || !isValidId(raw.id) || typeof raw.title !== "string" || !raw.title.trim() || raw.title.length > 100) return "Hãy nhập tên bộ hợp lệ (tối đa 100 ký tự).";
  if (!Array.isArray(raw.rounds) || raw.rounds.length < 1 || raw.rounds.length > 10) return "Mỗi bộ cần từ 1 đến 10 câu.";
  const rounds: FlyingWordsRound[] = [];
  for (const [index, item] of raw.rounds.entries()) {
    if (!item || typeof item !== "object") return `Câu ${index + 1} không hợp lệ.`;
    const row = item as Record<string, unknown>;
    if (typeof row.clue !== "string" || row.clue.length > 300 || typeof row.sentence !== "string" || row.sentence.length > 300) return `Gợi ý hoặc câu ${index + 1} không hợp lệ.`;
    const tokens = words(row.sentence);
    if (tokens.length < 2 || tokens.length > 12 || tokens.some((token) => token.length > 30)) return `Câu ${index + 1} cần 2–12 từ, mỗi từ tối đa 30 ký tự.`;
    rounds.push({ clue: row.clue.trim(), sentence: tokens.join(" ") });
  }
  return { id: raw.id, title: raw.title.trim(), rounds };
}

export function shuffledWords(sentence: string, random = Math.random): number[] {
  return shuffleIndexes(words(sentence).length, random);
}

export function isCorrectOrder(sentence: string, selected: number[]): boolean {
  const tokens = words(sentence);
  if (selected.length !== tokens.length || new Set(selected).size !== tokens.length) return false;
  return selected.every((index, i) => Number.isInteger(index) && index >= 0 && index < tokens.length &&
    tokens[index].normalize("NFC").toLocaleLowerCase("vi") === tokens[i].normalize("NFC").toLocaleLowerCase("vi"));
}

export const SAMPLE_FLYING_WORDS: FlyingWordsSet = {
  id: "sample-flying-words",
  title: "Cùng khám phá thế giới",
  rounds: [
    { clue: "Thành phố nào là thủ đô Việt Nam?", sentence: "Hà Nội là thủ đô của Việt Nam" },
    { clue: "Cây xanh cần ánh sáng để làm gì?", sentence: "Cây xanh cần ánh sáng để quang hợp" },
    { clue: "Một tuần có bao nhiêu ngày?", sentence: "Một tuần có bảy ngày" },
  ],
};
