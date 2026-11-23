import { connection } from "next/server";
import { ASSIGNMENTS_KEY, isAssignmentCode, submissionsKey } from "@/lib/assignments";
import { checkPin, errorResponse, getRedis } from "@/lib/db";
import type { Assignment, Submission } from "@/lib/types";

export async function GET(request: Request, ctx: RouteContext<"/api/assignments/[code]/report">) {
  await connection();
  if (!process.env.EDIT_PIN) return errorResponse("Cần cấu hình EDIT_PIN để bảo vệ báo cáo học sinh.", 503);
  if (!checkPin(request)) return errorResponse("Sai mã PIN chỉnh sửa.", 401);
  const { code } = await ctx.params;
  if (!isAssignmentCode(code)) return errorResponse("Mã bài tập không hợp lệ.", 400);
  const redis = getRedis();
  if (!redis) return errorResponse("Cần cấu hình Upstash để xem báo cáo.", 503);
  try {
    const assignment = await redis.hget<Assignment>(ASSIGNMENTS_KEY, code);
    if (!assignment) return errorResponse("Không tìm thấy bài tập.", 404);
    const submissions = await redis.lrange<Submission>(submissionsKey(code), 0, -1);
    return Response.json({ assignment, submissions });
  } catch {
    return errorResponse("Không tải được báo cáo.", 502);
  }
}

export async function DELETE(request: Request, ctx: RouteContext<"/api/assignments/[code]/report">) {
    if (!process.env.EDIT_PIN) return errorResponse("Cần cấu hình EDIT_PIN để bảo vệ báo cáo học sinh.", 503);
    if (!checkPin(request)) return errorResponse("Sai mã PIN chỉnh sửa.", 401);
    const { code } = await ctx.params;
    if (!isAssignmentCode(code)) return errorResponse("Mã bài tập không hợp lệ.", 400);
    const redis = getRedis();
    if (!redis) return errorResponse("Cần cấu hình Upstash.", 503);
    try {
      await redis.multi().hdel(ASSIGNMENTS_KEY, code).del(submissionsKey(code)).exec();
      return new Response(null, { status: 204 });
    } catch {
      return errorResponse("Không xóa được bài tập.", 502);
  }
}
