import { randomBytes } from "node:crypto";
import { connection } from "next/server";
import { ASSIGNMENTS_KEY } from "@/lib/assignments";
import { checkPin, errorResponse, getRedis } from "@/lib/db";
import type { Assignment } from "@/lib/types";
import { MAX_BODY_BYTES, parseSet } from "@/lib/validate";

function access(request: Request) {
  if (!process.env.EDIT_PIN) return errorResponse("Cần cấu hình EDIT_PIN để bảo vệ báo cáo học sinh.", 503);
  if (!checkPin(request)) return errorResponse("Sai mã PIN chỉnh sửa.", 401);
  return null;
}

export async function GET(request: Request) {
  await connection();
  const denied = access(request);
  if (denied) return denied;
  const redis = getRedis();
  if (!redis) return errorResponse("Cần cấu hình Upstash để giao bài.", 503);
  try {
    const all = await redis.hgetall<Record<string, Assignment>>(ASSIGNMENTS_KEY) ?? {};
    return Response.json({ assignments: Object.values(all).map(({ code, title, createdAt, expiresAt, questions }) =>
      ({ code, title, createdAt, expiresAt, count: questions.length })).sort((a, b) => b.createdAt - a.createdAt) });
  } catch {
    return errorResponse("Không tải được danh sách bài giao.", 502);
  }
}

export async function POST(request: Request) {
  const denied = access(request);
  if (denied) return denied;
  const redis = getRedis();
  if (!redis) return errorResponse("Cần cấu hình Upstash để giao bài.", 503);
  const text = await request.text();
  if (new TextEncoder().encode(text).length > MAX_BODY_BYTES) return errorResponse("Bộ câu hỏi quá lớn.", 413);
  let input: unknown;
  try { input = JSON.parse(text); } catch { return errorResponse("JSON không hợp lệ.", 400); }
  const parsed = parseSet(input);
  if (typeof parsed === "string") return errorResponse(parsed, 400);
  if (parsed.questions.some((q) => !q.prompt.trim() || !q.options)) {
    return errorResponse("Tất cả câu hỏi phải là trắc nghiệm có nội dung và đáp án hợp lệ.", 400);
  }
  const now = Date.now();
  try {
    const code = randomBytes(6).toString("hex").toUpperCase();
    const assignment: Assignment = { code, title: parsed.title, questions: parsed.questions, createdAt: now, expiresAt: now + 7 * 86400_000 };
    const created = await redis.hsetnx(ASSIGNMENTS_KEY, code, assignment);
    if (!created) return errorResponse("Không tạo được mã bài tập. Hãy thử lại.", 409);
    return Response.json({ code }, { status: 201 });
  } catch {
    return errorResponse("Không lưu được bài giao.", 502);
  }
}
