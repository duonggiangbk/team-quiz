import { isValidImage } from "./validate.ts";

export interface CrosswordRow {
  clue: string;
  answer: string;
  position: number;
  image?: string;
}

export interface Crossword {
  id: string;
  title: string;
  keyword: string;
  rows: CrosswordRow[];
}

export function normalizeWord(value: string): string {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[đĐ]/g, "d").toUpperCase().replace(/[\s-]+/g, "");
}

export function parseCrossword(value: unknown): Crossword | string {
  if (!value || typeof value !== "object") return "Dữ liệu ô chữ không hợp lệ.";
  const raw = value as Record<string, unknown>;
  if (typeof raw.id !== "string" || !raw.id || raw.id.length > 64 ||
      typeof raw.title !== "string" || !raw.title.trim() || raw.title.length > 100 ||
      typeof raw.keyword !== "string" || raw.keyword.length > 80) return "Hãy nhập tên và từ khóa hợp lệ.";
  const keyword = normalizeWord(raw.keyword);
  if (!/^[A-Z]{2,12}$/.test(keyword)) return "Từ khóa cần 2–12 chữ cái tiếng Việt hoặc tiếng Anh.";
  if (!Array.isArray(raw.rows) || raw.rows.length !== keyword.length) return "Mỗi chữ cái trong từ khóa cần một hàng ngang.";
  const rows: CrosswordRow[] = [];
  for (let i = 0; i < raw.rows.length; i++) {
    const item: unknown = raw.rows[i];
    if (!item || typeof item !== "object") return `Hàng ${i + 1} không hợp lệ.`;
    const row = item as Record<string, unknown>;
    if (typeof row.clue !== "string" || !row.clue.trim() || row.clue.length > 1000 ||
        typeof row.answer !== "string" || row.answer.length > 100) return `Hãy nhập câu hỏi và đáp án cho hàng ${i + 1}.`;
    const answer = normalizeWord(row.answer);
    if (!/^[A-Z]{1,20}$/.test(answer)) return `Đáp án hàng ${i + 1} chỉ gồm chữ cái, tối đa 20 ô.`;
    if (typeof row.position !== "number" || !Number.isInteger(row.position) || row.position < 0 ||
        row.position >= answer.length || answer[row.position] !== keyword[i]) {
      return `Chọn chữ ${keyword[i]} trong đáp án hàng ${i + 1}.`;
    }
    if (row.image !== undefined && (typeof row.image !== "string" || !isValidImage(row.image))) return `Hình ảnh hàng ${i + 1} không hợp lệ.`;
    rows.push({ clue: row.clue.trim(), answer, position: row.position, ...(typeof row.image === "string" ? { image: row.image } : {}) });
  }
  return { id: raw.id, title: raw.title.trim(), keyword, rows };
}

export const SAMPLE_CROSSWORD: Crossword = {
  id: "sample-crossword",
  title: "Khám phá thiên nhiên",
  keyword: "HOA",
  rows: [
    { clue: "Con vật nào kêu gâu gâu?", answer: "CHO", position: 1 },
    { clue: "Con vật nào thường gáy vào buổi sáng?", answer: "GATRONG", position: 4 },
    { clue: "Quả màu đỏ thường dùng làm sốt?", answer: "CACHUA", position: 1 },
  ],
};
