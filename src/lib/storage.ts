import { BUILTIN_SETS } from "./builtinSets";
import type { GameState, Question, QuestionSet } from "./types";

const SETS_KEY = "team-quiz:sets";
const GAME_KEY = "team-quiz:game";
const SEEDED_KEY = "team-quiz:seeded";

export function newId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
}

export function newQuestion(partial: Partial<Question> = {}): Question {
  return { id: newId(), prompt: "", answer: "", points: 10, ...partial };
}

function sampleSet(): QuestionSet {
  const qa: [string, string][] = [
    ["Thủ đô của Việt Nam là gì?", "Hà Nội"],
    ["7 × 8 = ?", "56"],
    ["Hành tinh lớn nhất trong Hệ Mặt Trời?", "Sao Mộc"],
    ["Nước sôi ở bao nhiêu độ C (ở mực nước biển)?", "100 °C"],
    ["\"Apple\" trong tiếng Việt là gì?", "Quả táo"],
    ["Một tam giác có bao nhiêu cạnh?", "3"],
    ["Sông dài nhất thế giới (theo nhiều nguồn)?", "Sông Nile"],
    ["Ai viết \"Truyện Kiều\"?", "Nguyễn Du"],
    ["144 chia 12 bằng mấy?", "12"],
    ["Loài động vật nào được gọi là \"chúa sơn lâm\"?", "Hổ"],
    ["Đại dương lớn nhất?", "Thái Bình Dương"],
    ["Chất khí cây xanh hấp thụ để quang hợp?", "CO₂ (khí cacbonic)"],
  ];
  return {
    id: "sample",
    category: "Giải trí",
    title: "Bộ câu hỏi mẫu – Kiến thức chung",
    description: "Bộ câu hỏi ví dụ để thử trò chơi.",
    questions: qa.map(([prompt, answer], i) => ({
      id: `sample-${i}`,
      prompt,
      answer,
      points: i % 3 === 2 ? 20 : 10,
    })),
    updatedAt: Date.now(),
  };
}

function read<T>(key: string): T | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function write(key: string, value: unknown) {
  window.localStorage.setItem(key, JSON.stringify(value));
}

export function loadSets(): QuestionSet[] {
  const stored = read<QuestionSet[]>(SETS_KEY);
  const sets = stored && Array.isArray(stored) ? stored : [sampleSet()];
  // Remember which built-ins were offered so sets the user deleted are not re-added.
  const seeded = new Set(read<string[]>(SEEDED_KEY) ?? ["sample"]);
  const present = new Set(sets.map((s) => s.id));
  const added = BUILTIN_SETS.filter((b) => !seeded.has(b.id) && !present.has(b.id));
  const merged = [...sets, ...added];
  for (const b of BUILTIN_SETS) seeded.add(b.id);
  if (!stored || added.length > 0) write(SETS_KEY, merged);
  write(SEEDED_KEY, [...seeded]);
  return merged;
}

export function saveSets(sets: QuestionSet[]) {
  write(SETS_KEY, sets);
}

export function loadGame(): GameState | null {
  return read<GameState>(GAME_KEY);
}

export function saveGame(game: GameState | null) {
  if (game) write(GAME_KEY, game);
  else window.localStorage.removeItem(GAME_KEY);
}
