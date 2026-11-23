import { parseSet } from "./validate";
import type { Question } from "./types";

export function parseGeneratedQuestions(value: unknown, count: number): Question[] | string {
  if (!Array.isArray(value) || value.length !== count) return "AI không tạo đúng số câu. Hãy thử lại.";
  const questions = value.map((item, index) => {
    if (!item || typeof item !== "object") return null;
    const raw = item as Record<string, unknown>;
    const options = raw.options;
    const correctIndex = raw.correctIndex;
    return {
      id: `ai-${index}`, prompt: raw.prompt, options, correctIndex, points: 10,
      answer: Array.isArray(options) && typeof correctIndex === "number" ? options[correctIndex] : undefined,
    };
  });
  const parsed = parseSet({ id: "ai", title: "AI", questions });
  if (typeof parsed === "string" || parsed.questions.some((q) => !q.prompt.trim())) {
    return "AI tạo câu hỏi chưa hợp lệ. Hãy thử lại.";
  }
  return parsed.questions;
}

export function validAiInput(value: unknown, max: number): value is string {
  return typeof value === "string" && value.trim().length > 0 && value.length <= max;
}
