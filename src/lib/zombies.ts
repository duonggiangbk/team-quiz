import type { Question } from "./types";

export interface ZombieQuestion {
  id: string;
  prompt: string;
  image?: string;
  options: string[];
  correctIndex: number;
  generated: boolean;
}

function key(value: string) {
  return value.trim().toLocaleLowerCase();
}

export function prepareZombieQuestions(questions: Question[]): ZombieQuestion[] {
  const answersByKey = new Map<string, string>();
  for (const q of questions) {
    if (q.answer?.trim() && !answersByKey.has(key(q.answer))) answersByKey.set(key(q.answer), q.answer.trim());
  }
  const answers = [...answersByKey.values()];
  return questions.flatMap<ZombieQuestion>((q, questionIndex) => {
    if (!q.prompt?.trim() || !q.answer?.trim()) return [];
    if (q.options && q.options.length >= 2 && q.options.length <= 4 &&
      q.options.every((option) => typeof option === "string" && option.trim()) &&
      new Set(q.options.map(key)).size === q.options.length &&
      Number.isInteger(q.correctIndex) && q.correctIndex !== undefined &&
      q.correctIndex >= 0 && q.correctIndex < q.options.length && key(q.options[q.correctIndex]) === key(q.answer)) {
      return [{ id: q.id, prompt: q.prompt, image: q.image, options: [...q.options], correctIndex: q.correctIndex, generated: false }];
    }
    // An invalid authored multiple-choice question is never silently replaced.
    if (q.options !== undefined || q.correctIndex !== undefined) return [];
    const distractors = answers.filter((answer) => key(answer) !== key(q.answer)).slice(0, 3);
    if (!distractors.length) return [];
    const options = [q.answer.trim(), ...distractors];
    const correctIndex = questionIndex % options.length;
    [options[0], options[correctIndex]] = [options[correctIndex], options[0]];
    return [{ id: q.id, prompt: q.prompt, image: q.image, options, correctIndex, generated: true }];
  });
}

export interface ZombieGame {
  questions: ZombieQuestion[];
  index: number;
  distance: number;
  mistakes: number;
  wrong: number[];
  status: "playing" | "paused" | "won" | "lost";
  lastAt: number;
}

export type ZombieAction =
  | { type: "tick"; now: number }
  | { type: "pause"; now: number }
  | { type: "resume"; now: number }
  | { type: "answer"; index: number; now: number };

export function startZombieGame(questions: ZombieQuestion[], now: number): ZombieGame {
  if (!questions.length) throw new Error("Bộ câu hỏi chưa có câu có thể chơi.");
  return { questions, index: 0, distance: 0, mistakes: 0, wrong: [], status: "playing", lastAt: now };
}

function advance(game: ZombieGame, now: number): ZombieGame {
  const elapsed = Math.max(0, now - game.lastAt);
  const distance = Math.min(1, game.distance + elapsed / 30_000 * (1 + game.wrong.length * 0.5));
  return { ...game, distance, lastAt: Math.max(now, game.lastAt), status: distance >= 1 ? "lost" : "playing" };
}

export function zombieReducer(game: ZombieGame, action: ZombieAction): ZombieGame {
  if (action.type === "resume") return game.status === "paused" ? { ...game, status: "playing", lastAt: action.now } : game;
  if (game.status !== "playing") return game;
  const updated = advance(game, action.now);
  if (updated.status === "lost") return updated;
  if (action.type === "pause") return { ...updated, status: "paused" };
  if (action.type === "tick") return updated;
  const question = updated.questions[updated.index];
  if (!Number.isInteger(action.index) || action.index < 0 || action.index >= question.options.length || updated.wrong.includes(action.index)) return updated;
  if (action.index !== question.correctIndex) return { ...updated, mistakes: updated.mistakes + 1, wrong: [...updated.wrong, action.index] };
  if (updated.index === updated.questions.length - 1) return { ...updated, status: "won" };
  return { ...updated, index: updated.index + 1, distance: 0, wrong: [], lastAt: action.now };
}
