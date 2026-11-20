import { connection } from "next/server";
import { checkPin, errorResponse, getRedis, saveSetFromRequest, SETS_HASH } from "@/lib/db";
import { isValidId } from "@/lib/validate";
import type { QuestionSet } from "@/lib/types";

export async function GET(_request: Request, ctx: RouteContext<"/api/sets/[id]">) {
  await connection();
  const { id } = await ctx.params;
  if (!isValidId(id)) return errorResponse("Mã bộ câu hỏi không hợp lệ", 400);
  const redis = getRedis();
  if (!redis) return errorResponse("Chưa cấu hình cơ sở dữ liệu", 503);
  const set = await redis.hget<QuestionSet>(SETS_HASH, id);
  if (!set) return errorResponse("Không tìm thấy", 404);
  return Response.json({ set });
}

export async function PUT(request: Request, ctx: RouteContext<"/api/sets/[id]">) {
  const { id } = await ctx.params;
  if (!isValidId(id)) return errorResponse("Mã bộ câu hỏi không hợp lệ", 400);
  return saveSetFromRequest(request, id);
}

export async function DELETE(request: Request, ctx: RouteContext<"/api/sets/[id]">) {
  const { id } = await ctx.params;
  if (!isValidId(id)) return errorResponse("Mã bộ câu hỏi không hợp lệ", 400);
  const redis = getRedis();
  if (!redis) return errorResponse("Chưa cấu hình cơ sở dữ liệu", 503);
  if (!checkPin(request)) return errorResponse("Sai mã PIN chỉnh sửa", 401);
  await redis.hdel(SETS_HASH, id);
  return new Response(null, { status: 204 });
}
