import { randomUUID } from "node:crypto";
import { ASSIGNMENTS_KEY, grade, isAssignmentCode, submissionsKey } from "@/lib/assignments";
import { errorResponse, getRedis } from "@/lib/db";
import type { Assignment } from "@/lib/types";

export async function POST(request: Request, ctx: RouteContext<"/api/assignments/[code]/submit">) {
  const { code } = await ctx.params;
  if (!isAssignmentCode(code)) return errorResponse("Mã bài tập không hợp lệ.", 400);
  const redis = getRedis();
  if (!redis) return errorResponse("Cần cấu hình Upstash để nộp bài.", 503);
  const text = await request.text();
  if (text.length > 10000) return errorResponse("Dữ liệu quá lớn.", 413);
  let body: { name?: unknown; answers?: unknown };
  try { body = JSON.parse(text); } catch { return errorResponse("JSON không hợp lệ.", 400); }
  if (!body || typeof body.name !== "string" || !Array.isArray(body.answers)) return errorResponse("Dữ liệu không hợp lệ.", 400);
  try {
    const assignment = await redis.hget<Assignment>(ASSIGNMENTS_KEY, code);
    if (!assignment) return errorResponse("Không tìm thấy bài tập.", 404);
    const result = grade(assignment, body.name, body.answers, randomUUID(), Date.now());
    if (typeof result === "string") return errorResponse(result, 400);
    const saved = await redis.eval<[string, string, number], number>(
      `if redis.call("HEXISTS", KEYS[1], ARGV[1]) == 0 then return -1 end
       local t = redis.call("TIME")
       if tonumber(t[1]) * 1000 + math.floor(tonumber(t[2]) / 1000) >= tonumber(ARGV[3]) then return -2 end
       if redis.call("LLEN", KEYS[2]) >= 1000 then return 0 end
       redis.call("RPUSH", KEYS[2], ARGV[2])
       return 1`,
      [ASSIGNMENTS_KEY, submissionsKey(code)], [code, JSON.stringify(result), assignment.expiresAt],
    );
    if (saved === -1) return errorResponse("Bài tập đã bị xóa.", 404);
    if (saved === -2) return errorResponse("Bài tập đã hết hạn.", 410);
    if (saved !== 1) return errorResponse("Bài tập đã đạt giới hạn 1000 lượt nộp.", 409);
    return Response.json({ score: result.score, total: result.total });
  } catch {
    return errorResponse("Không nộp được bài. Hãy thử lại.", 502);
  }
}
