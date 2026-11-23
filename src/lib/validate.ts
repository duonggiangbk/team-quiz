import type { Question, QuestionSet } from "./types";

export const MAX_BODY_BYTES = 200_000;
export const MAX_IMAGE_FILE_BYTES = 80_000;
export const MAX_IMAGE_LENGTH = 110_000;
const ID_RE = /^[A-Za-z0-9_-]{1,64}$/;
const IMAGE_DATA_RE = /^data:image\/(?:png|jpeg|webp|gif);base64,[A-Za-z0-9+/]+={0,2}$/;

export function isValidImage(value: string): boolean {
  if (!value || value.length > MAX_IMAGE_LENGTH) return false;
  if (IMAGE_DATA_RE.test(value)) return true;
  if (/^\/(?!\/)[^\s\\]*$/.test(value)) return true;
  try {
    const url = new URL(value);
    return (url.protocol === "https:" || url.protocol === "http:") && !url.username && !url.password;
  } catch {
    return false;
  }
}

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
    const image = item.image;
    if (image !== undefined && (typeof image !== "string" || !isValidImage(image))) {
      return "Hình ảnh không hợp lệ. Hãy dùng liên kết http(s) hoặc ảnh PNG, JPEG, GIF, WebP.";
    }
    if (typeof points !== "number" || !Number.isInteger(points) || points < 0 || points > 1000) {
      return "Điểm câu hỏi không hợp lệ.";
    }
    const options = item.options;
    const correctIndex = item.correctIndex;
    if (options !== undefined || correctIndex !== undefined) {
      if (!Array.isArray(options) || options.length < 2 || options.length > 4 ||
          options.some((option) => typeof option !== "string" || !option.trim() || option.length > 500) ||
          new Set(options.map((option: string) => option.trim().toLocaleLowerCase())).size !== options.length ||
          typeof correctIndex !== "number" || !Number.isInteger(correctIndex) || correctIndex < 0 || correctIndex >= options.length) {
        return "Câu trắc nghiệm cần 2–4 lựa chọn khác nhau và một đáp án đúng.";
      }
      if (answer !== options[correctIndex]) return "Đáp án không khớp với lựa chọn đúng.";
      questions.push({ id: qid, prompt, answer, points, options, correctIndex, ...(image ? { image } : {}) });
    } else {
      questions.push({ id: qid, prompt, answer, points, ...(image ? { image } : {}) });
    }
  }
  return { id, title, description, questions, updatedAt: Date.now(), ...(category ? { category } : {}) };
}
