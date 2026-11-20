import { Redis } from "@upstash/redis";
import { MAX_BODY_BYTES, parseSet } from "./validate";

export const SETS_HASH = "team-quiz:sets";
export const MAX_SETS = 500;

let client: Redis | null | undefined;

export function getRedis(): Redis | null {
  if (client !== undefined) return client;
  const url = process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN;
  client = url && token ? new Redis({ url, token }) : null;
  return client;
}

export function checkPin(request: Request): boolean {
  const pin = process.env.EDIT_PIN;
  return !pin || request.headers.get("x-edit-pin") === pin;
}

function error(message: string, status: number): Response {
  return Response.json({ error: message }, { status });
}

export async function saveSetFromRequest(request: Request, expectedId?: string): Promise<Response> {
  const redis = getRedis();
  if (!redis) return error("Chưa cấu hình cơ sở dữ liệu.", 503);
  if (!checkPin(request)) return error("Sai mã PIN chỉnh sửa.", 401);
  const text = await request.text();
  if (new TextEncoder().encode(text).length > MAX_BODY_BYTES) return error("Dữ liệu quá lớn.", 413);
  let body: unknown;
  try {
    body = JSON.parse(text);
  } catch {
    return error("JSON không hợp lệ.", 400);
  }
  const set = parseSet(body);
  if (typeof set === "string") return error(set, 400);
  if (expectedId !== undefined && set.id !== expectedId) return error("Mã bộ câu hỏi không khớp.", 400);
  const exists = await redis.hexists(SETS_HASH, set.id);
  if (!exists && (await redis.hlen(SETS_HASH)) >= MAX_SETS) {
    return error(`Đã đạt giới hạn ${MAX_SETS} bộ câu hỏi.`, 409);
  }
  await redis.hset(SETS_HASH, { [set.id]: set });
  return Response.json({ set }, { status: exists ? 200 : 201 });
}

export { error as errorResponse };
