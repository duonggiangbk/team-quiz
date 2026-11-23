import type { Assignment, StudentAssignment, Submission } from "./types";

export const ASSIGNMENTS_KEY = "team-quiz:assignments";
export const submissionsKey = (code: string) => `team-quiz:submissions:${code}`;
export const isAssignmentCode = (code: string) => /^[A-F0-9]{12}$/.test(code);

export function studentAssignment(assignment: Assignment): StudentAssignment {
  return {
    code: assignment.code,
    title: assignment.title,
    expiresAt: assignment.expiresAt,
    questions: assignment.questions.map(({ id, prompt, image, options }) => ({ id, prompt, image, options })),
  };
}

export function grade(assignment: Assignment, name: string, answers: number[], id: string, now: number): Submission | string {
  const student = name.trim();
  if (!student || student.length > 80) return "Hãy nhập tên học sinh (tối đa 80 ký tự).";
  if (now >= assignment.expiresAt) return "Bài tập đã hết hạn.";
  if (!Array.isArray(answers) || answers.length !== assignment.questions.length ||
    answers.some((answer, i) => !Array.isArray(assignment.questions[i].options) || !Number.isInteger(answer) || answer < 0 || answer >= assignment.questions[i].options!.length)) {
    return "Hãy chọn một đáp án cho mỗi câu hỏi.";
  }
  return {
    id, name: student, submittedAt: now, answers,
    score: assignment.questions.reduce((sum, question, i) => sum + (question.correctIndex === answers[i] ? question.points : 0), 0),
    total: assignment.questions.reduce((sum, question) => sum + question.points, 0),
  };
}
