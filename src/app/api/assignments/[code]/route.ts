import { connection } from "next/server";
import { ASSIGNMENTS_KEY, isAssignmentCode, studentAssignment } from "@/lib/assignments";
import { errorResponse, getRedis } from "@/lib/db";
import type { Assignment } from "@/lib/types";

export async function GET(_request: Request, ctx: RouteContext<"/api/assignments/[code]">) {
  await connection();
  const { code } = await ctx.params;
  if (!isAssignmentCode(code)) return errorResponse("Mã bài tập không hợp lệ.", 400);
  const redis = getRedis();
  if (!redis) return errorResponse("Cần cấu hình Upstash để làm bài.", 503);
  try {
    const assignment = await redis.hget<Assignment>(ASSIGNMENTS_KEY, code);
    if (!assignment) return errorResponse("Không tìm thấy bài tập.", 404);
    if (Date.now() >= assignment.expiresAt) return errorResponse("Bài tập đã hết hạn.", 410);
    return Response.json({ assignment: studentAssignment(assignment) });
  } catch {
    return errorResponse("Không tải được bài tập.", 502);
  }
}
