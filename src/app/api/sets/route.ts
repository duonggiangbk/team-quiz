import { connection } from "next/server";
import { getRedis, saveSetFromRequest, SETS_HASH, errorResponse } from "@/lib/db";
import type { QuestionSet } from "@/lib/types";

export async function GET() {
  await connection();
  const redis = getRedis();
  if (!redis) return Response.json({ enabled: false, sets: [] });
  try {
    const all = (await redis.hgetall<Record<string, QuestionSet>>(SETS_HASH)) ?? {};
    return Response.json({ enabled: true, sets: Object.values(all) });
  } catch {
    return errorResponse("Không kết nối được cơ sở dữ liệu", 502);
  }
}

export async function POST(request: Request) {
  return saveSetFromRequest(request);
}
