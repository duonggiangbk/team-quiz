import { getRedis } from "./db";

export class AiError extends Error {
  constructor(message: string, public status: number) { super(message); }
}

const schema = {
  type: "ARRAY",
  items: {
    type: "OBJECT",
    properties: {
      prompt: { type: "STRING" },
      options: { type: "ARRAY", items: { type: "STRING" } },
      correctIndex: { type: "INTEGER" },
    },
    required: ["prompt", "options", "correctIndex"],
  },
};

const flashcardSchema = {
  type: "ARRAY",
  items: {
    type: "OBJECT",
    properties: {
      english: { type: "STRING" },
      vietnamese: { type: "STRING" },
      picture: { type: "STRING" },
    },
    required: ["english", "vietnamese", "picture"],
  },
};

const matchingSchema = {
  type: "ARRAY",
  items: { type: "OBJECT", properties: { left: { type: "STRING" }, right: { type: "STRING" } }, required: ["left", "right"] },
};

const crosswordSchema = {
  type: "ARRAY",
  items: { type: "OBJECT", properties: { clue: { type: "STRING" }, answer: { type: "STRING" } }, required: ["clue", "answer"] },
};

const flyingWordsSchema = {
  type: "ARRAY",
  items: { type: "OBJECT", properties: { clue: { type: "STRING" }, sentence: { type: "STRING" } }, required: ["clue", "sentence"] },
};

export async function generateAiText(instruction: string, input: string, structured: boolean | "flashcards" | "matching" | "crossword" | "flying-words"): Promise<string> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new AiError("Chưa cấu hình GEMINI_API_KEY trên máy chủ.", 503);
  const redis = getRedis();
  if (!redis) throw new AiError("Cần cấu hình Upstash để giới hạn lượt sử dụng AI.", 503);

  const allowed = await redis.eval<[], number>(
    `local minute = redis.call("GET", KEYS[1])
     local day = redis.call("GET", KEYS[2])
     if tonumber(minute or "0") >= 10 or tonumber(day or "0") >= 100 then return 0 end
     if redis.call("INCR", KEYS[1]) == 1 then redis.call("EXPIRE", KEYS[1], 60) end
     if redis.call("INCR", KEYS[2]) == 1 then redis.call("EXPIRE", KEYS[2], 86400) end
     return 1`,
    ["team-quiz:ai:minute", "team-quiz:ai:day"], [],
  );
  if (allowed !== 1) throw new AiError("AI đã đạt giới hạn lượt dùng. Hãy thử lại sau.", 429);

  const model = process.env.GEMINI_MODEL || "gemini-3.5-flash-lite";
  if (!/^[a-z0-9][a-z0-9.-]{0,80}$/.test(model)) throw new AiError("Tên model Gemini không hợp lệ.", 503);
  let response: Response;
  try {
    response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
      method: "POST",
      headers: { "content-type": "application/json", "x-goog-api-key": key },
      signal: AbortSignal.timeout(30000),
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: instruction }] },
        contents: [{ role: "user", parts: [{ text: input }] }],
        generationConfig: { maxOutputTokens: 4096, ...(structured ? { responseMimeType: "application/json", responseSchema: structured === "flashcards" ? flashcardSchema : structured === "matching" ? matchingSchema : structured === "crossword" ? crosswordSchema : structured === "flying-words" ? flyingWordsSchema : schema } : {}) },
        safetySettings: ["HARM_CATEGORY_HARASSMENT", "HARM_CATEGORY_HATE_SPEECH", "HARM_CATEGORY_SEXUALLY_EXPLICIT", "HARM_CATEGORY_DANGEROUS_CONTENT"].map((category) => ({ category, threshold: "BLOCK_LOW_AND_ABOVE" })),
      }),
    });
  } catch {
    throw new AiError("Không kết nối được Gemini. Hãy thử lại.", 502);
  }
  if (response.status === 429) throw new AiError("Gemini đã hết lượt miễn phí hoặc đang quá tải. Hãy thử lại sau.", 429);
  if (!response.ok) throw new AiError(`Gemini không nhận yêu cầu (mã ${response.status}). Hãy kiểm tra model và API key.`, 502);
  const data: unknown = await response.json();
  if (!data || typeof data !== "object" || !("candidates" in data) || !Array.isArray(data.candidates)) {
    throw new AiError("Gemini không trả lời hoặc đã chặn nội dung. Hãy thử câu hỏi khác.", 502);
  }
  const candidate = data.candidates[0];
  if (!candidate || candidate.finishReason !== "STOP" || !Array.isArray(candidate.content?.parts)) {
    throw new AiError("Gemini không hoàn tất câu trả lời hoặc đã chặn nội dung. Hãy thử lại.", 502);
  }
  const text = candidate.content.parts.map((part: { text?: unknown }) => typeof part.text === "string" ? part.text : "").join("").trim();
  if (!text || text.length > 30000) throw new AiError("Câu trả lời AI không hợp lệ. Hãy thử lại.", 502);
  return text;
}
