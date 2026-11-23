import { googleSignInConfigured, handlers } from "@/lib/auth";

function unavailable() {
  return Response.json({ error: "Đăng nhập Google chưa được cấu hình." }, { status: 503 });
}

export const GET: typeof handlers.GET = async (request) =>
  googleSignInConfigured() ? handlers.GET(request) : unavailable();

export const POST: typeof handlers.POST = async (request) =>
  googleSignInConfigured() ? handlers.POST(request) : unavailable();
