import { BUILTIN_SETS } from "./builtinSets";
import type { GameState, Question, QuestionSet } from "./types";
import { MAX_BODY_BYTES, parseSet } from "./validate";

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

// ---------- Shared (cloud) storage with local fallback ----------

const HIDDEN_KEY = "team-quiz:hidden";
const MIGRATED_KEY = "team-quiz:migrated";
const PIN_KEY = "team-quiz:pin";

export interface SetsResult {
  sets: QuestionSet[];
  sharedIds: Set<string>;
  cloud: boolean;
  error?: string;
}

let cloudMode: boolean | null = null;

function builtinIds(): Set<string> {
  return new Set(["sample", ...BUILTIN_SETS.map((b) => b.id)]);
}

function readHidden(): Set<string> {
  return new Set(read<string[]>(HIDDEN_KEY) ?? []);
}

function writeHidden(hidden: Set<string>) {
  write(HIDDEN_KEY, [...hidden]);
}

export async function errorMessage(res: Response): Promise<string> {
  try {
    const body = (await res.json()) as { error?: string };
    if (body.error) return body.error;
  } catch {
    // ignore
  }
  return `Lỗi máy chủ (${res.status}).`;
}

export async function writeRequest(url: string, init: RequestInit): Promise<Response> {
  const send = (pin: string | null) =>
    fetch(url, {
      ...init,
      headers: {
        "content-type": "application/json",
        ...(pin ? { "x-edit-pin": pin } : {}),
      },
    });
  let res = await send(window.localStorage.getItem(PIN_KEY));
  if (res.status === 401) {
    const pin = window.prompt("Nhập mã PIN chỉnh sửa:");
    if (pin) {
      res = await send(pin);
      if (res.ok) window.localStorage.setItem(PIN_KEY, pin);
    }
  }
  return res;
}

async function migrateLocal(): Promise<boolean> {
  if (read<boolean>(MIGRATED_KEY)) return false;
  const local = read<QuestionSet[]>(SETS_KEY);
  let posted = false;
  if (local && Array.isArray(local)) {
    for (const set of local.filter((s) => !s.category)) {
      const res = await writeRequest("/api/sets", { method: "POST", body: JSON.stringify(set) });
      if (!res.ok && res.status !== 400) throw new Error(await errorMessage(res));
      if (res.ok) posted = true;
    }
    // Keep built-ins the user had already deleted hidden.
    const seeded = new Set(read<string[]>(SEEDED_KEY) ?? []);
    seeded.add("sample");
    const present = new Set(local.map((s) => s.id));
    const hidden = readHidden();
    for (const id of seeded) if (!present.has(id)) hidden.add(id);
    writeHidden(hidden);
  }
  write(MIGRATED_KEY, true);
  return posted;
}

function localResult(error?: string): SetsResult {
  cloudMode = false;
  return { sets: loadSets(), sharedIds: new Set(), cloud: false, error };
}

export async function fetchSets(): Promise<SetsResult> {
  let remote: QuestionSet[];
  try {
    const res = await fetch("/api/sets", { cache: "no-store" });
    if (!res.ok) return localResult(await errorMessage(res));
    const body = (await res.json()) as { enabled: boolean; sets: QuestionSet[] };
    if (!body.enabled) return localResult();
    cloudMode = true;
    let error: string | undefined;
    let posted = false;
    try {
      posted = await migrateLocal();
    } catch (e) {
      error = e instanceof Error ? e.message : "Không chuyển được dữ liệu cũ lên máy chủ.";
    }
    remote = body.sets;
    if (posted) {
      const again = await fetch("/api/sets", { cache: "no-store" });
      if (again.ok) remote = ((await again.json()) as { sets: QuestionSet[] }).sets;
    }
    const hidden = readHidden();
    const sharedIds = new Set(remote.map((s) => s.id));
    const sets = [sampleSet(), ...BUILTIN_SETS].filter((s) => !hidden.has(s.id) && !sharedIds.has(s.id));
    const builtins = builtinIds();
    const overrides = remote.filter((s) => builtins.has(s.id) && !hidden.has(s.id));
    const mine = remote.filter((s) => !builtins.has(s.id)).sort((a, b) => b.updatedAt - a.updatedAt);
    return { sets: [...mine, ...overrides, ...sets], sharedIds, cloud: true, error };
  } catch {
    return localResult("Không kết nối được máy chủ, đang dùng dữ liệu trên máy này.");
  }
}

async function isCloud(): Promise<boolean> {
  if (cloudMode === null) await fetchSets();
  return cloudMode === true;
}

export async function fetchSet(id: string): Promise<QuestionSet | null> {
  if (await isCloud()) {
    try {
      const res = await fetch(`/api/sets/${encodeURIComponent(id)}`, { cache: "no-store" });
      if (res.ok) return ((await res.json()) as { set: QuestionSet }).set;
    } catch {
      // fall through to built-ins
    }
    if (readHidden().has(id)) return null;
    return [sampleSet(), ...BUILTIN_SETS].find((s) => s.id === id) ?? null;
  }
  return loadSets().find((s) => s.id === id) ?? null;
}

export async function upsertSet(set: QuestionSet): Promise<void> {
  const value = { ...set, updatedAt: Date.now() };
  if (new TextEncoder().encode(JSON.stringify(value)).length > MAX_BODY_BYTES) {
    throw new Error("Bộ câu hỏi quá lớn (tối đa 200 KB). Hãy dùng liên kết ảnh hoặc giảm số ảnh tải lên.");
  }
  const parsed = parseSet(value);
  if (typeof parsed === "string") throw new Error(parsed);
  if (await isCloud()) {
    let res: Response;
    try {
      res = await writeRequest(`/api/sets/${encodeURIComponent(set.id)}`, {
        method: "PUT",
        body: JSON.stringify(value),
      });
    } catch {
      throw new Error("Không kết nối được máy chủ.");
    }
    if (!res.ok) throw new Error(await errorMessage(res));
    const hidden = readHidden();
    if (hidden.delete(set.id)) writeHidden(hidden);
    return;
  }
  const sets = loadSets();
  const exists = sets.some((s) => s.id === set.id);
  saveSets(exists ? sets.map((s) => (s.id === set.id ? value : s)) : [value, ...sets]);
}

export async function deleteSet(id: string, shared: boolean): Promise<void> {
  if (await isCloud()) {
    if (shared) {
      let res: Response;
      try {
        res = await writeRequest(`/api/sets/${encodeURIComponent(id)}`, { method: "DELETE" });
      } catch {
        throw new Error("Không kết nối được máy chủ.");
      }
      if (!res.ok) throw new Error(await errorMessage(res));
    }
    if (builtinIds().has(id)) {
      const hidden = readHidden();
      hidden.add(id);
      writeHidden(hidden);
    }
    return;
  }
  saveSets(loadSets().filter((s) => s.id !== id));
}

export function loadGame(): GameState | null {
  return read<GameState>(GAME_KEY);
}

export function saveGame(game: GameState | null) {
  if (game) write(GAME_KEY, game);
  else window.localStorage.removeItem(GAME_KEY);
}
