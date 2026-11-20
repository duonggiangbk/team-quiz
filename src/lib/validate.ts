import type { Question, QuestionSet } from "./types";

export const MAX_BODY_BYTES = 200_000;
const ID_RE = /^[A-Za-z0-9_-]{1,64}$/;

function str(value: unknown, max: number): string | null {
  return typeof value === "string" && value.length <= max ? value : null;
}

export function isValidId(id: string): boolean {
  return ID_RE.test(id);
}

export function parseSet(input: unknown): QuestionSet | string {
  if (!input || typeof input !== "object") return "Dữ liệu không hợp lệ.";
  const raw = input as Record<string, unknown>;
  const id = str(raw.id, 64);
  if (!id || !isValidId(id)) return "Mã bộ câu hỏi không hợp lệ.";
  const title = str(raw.title, 120)?.trim();
  if (!title) return "Tên bộ câu hỏi trống hoặc quá dài (tối đa 120 ký tự).";
  const description = raw.description === undefined ? "" : str(raw.description, 300);
  if (description === null) return "Mô tả quá dài (tối đa 300 ký tự).";
  const category = raw.category === undefined ? undefined : str(raw.category, 40);
  if (category === null) return "Chủ đề không hợp lệ.";
  if (!Array.isArray(raw.questions) || raw.questions.length < 1 || raw.questions.length > 100) {
    return "Bộ câu hỏi phải có từ 1 đến 100 câu.";
  }
  const questions: Question[] = [];
  for (const q of raw.questions as unknown[]) {
    if (!q || typeof q !== "object") return "Câu hỏi không hợp lệ.";
    const item = q as Record<string, unknown>;
    const qid = str(item.id, 64);
    const prompt = str(item.prompt, 1000);
    const answer = str(item.answer, 500);
    const points = item.points;
    if (!qid || prompt === null || answer === null) return "Câu hỏi quá dài hoặc thiếu dữ liệu.";
    if (typeof points !== "number" || !Number.isInteger(points) || points < 0 || points > 1000) {
      return "Điểm câu hỏi không hợp lệ.";
    }
    questions.push({ id: qid, prompt, answer, points });
  }
  return { id, title, description, questions, updatedAt: Date.now(), ...(category ? { category } : {}) };
}
