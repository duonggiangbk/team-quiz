import { isValidId, isValidImage } from "./validate.ts";

export interface MatchingPair {
  left: string;
  right: string;
  image?: string;
}

export interface MatchingSet {
  id: string;
  title: string;
  pairs: MatchingPair[];
}

export type Connections = Record<number, number>;

const key = (text: string) => text.trim().replace(/\s+/g, " ").toLocaleLowerCase("vi");

export function parseMatchingSet(value: unknown): MatchingSet | string {
  if (!value || typeof value !== "object") return "Dữ liệu bộ nối ý không hợp lệ.";
  const raw = value as Record<string, unknown>;
  if (typeof raw.id !== "string" || !isValidId(raw.id)) return "Mã bộ nối ý không hợp lệ.";
  if (typeof raw.title !== "string" || !raw.title.trim() || raw.title.length > 100) return "Hãy nhập tên bộ nối ý (tối đa 100 ký tự).";
  if (!Array.isArray(raw.pairs) || raw.pairs.length < 2 || raw.pairs.length > 8) return "Mỗi bộ cần từ 2 đến 8 cặp.";
  const pairs: MatchingPair[] = [];
  for (const [index, value] of raw.pairs.entries()) {
    if (!value || typeof value !== "object") return `Cặp ${index + 1} không hợp lệ.`;
    const pair = value as Record<string, unknown>;
    if (typeof pair.left !== "string" || !pair.left.trim() || pair.left.length > 1000 ||
        typeof pair.right !== "string" || !pair.right.trim() || pair.right.length > 1000) return `Hãy nhập hai ý cho cặp ${index + 1} (tối đa 1000 ký tự mỗi ý).`;
    if (pair.image !== undefined && (typeof pair.image !== "string" || !isValidImage(pair.image))) return `Hình ảnh cặp ${index + 1} không hợp lệ.`;
    pairs.push({ left: pair.left.trim(), right: pair.right.trim(), ...(typeof pair.image === "string" ? { image: pair.image } : {}) });
  }
  if (new Set(pairs.map((pair) => key(pair.left))).size !== pairs.length ||
      new Set(pairs.map((pair) => key(pair.right))).size !== pairs.length) return "Các ý trong cùng một cột phải khác nhau để tránh nhiều đáp án đúng.";
  return { id: raw.id, title: raw.title.trim(), pairs };
}

export function connectPair(connections: Connections, left: number, right: number): Connections {
  const next = Object.fromEntries(Object.entries(connections).filter(([a, b]) => Number(a) !== left && b !== right));
  next[left] = right;
  return next;
}

export function countCorrect(connections: Connections): number {
  return Object.entries(connections).filter(([left, right]) => Number(left) === right).length;
}

export function shuffleIndexes(length: number, random = Math.random): number[] {
  const indexes = Array.from({ length }, (_, index) => index);
  for (let i = indexes.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [indexes[i], indexes[j]] = [indexes[j], indexes[i]];
  }
  return indexes;
}

export const SAMPLE_MATCHING: MatchingSet = {
  id: "sample-matching",
  title: "Các nước và thủ đô",
  pairs: [
    { left: "Việt Nam", right: "Hà Nội" },
    { left: "Pháp", right: "Paris" },
    { left: "Nhật Bản", right: "Tokyo" },
    { left: "Úc", right: "Canberra" },
  ],
};
