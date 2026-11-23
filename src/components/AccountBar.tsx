import { connection } from "next/server";
import { signInWithGoogle, signOutFromGoogle } from "@/app/auth/actions";
import { auth, googleSignInConfigured } from "@/lib/auth";

export default async function AccountBar() {
  await connection();
  if (!googleSignInConfigured()) {
    return (
      <div className="mx-auto w-full max-w-5xl px-4 pt-4 text-right text-sm text-slate-600 sm:px-6">
        Đăng nhập Google chưa được cấu hình. Bạn vẫn có thể chơi mà không cần đăng nhập.
      </div>
    );
  }

  const session = await auth();
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-wrap items-center justify-end gap-3 px-4 pt-4 sm:px-6">
      {session?.user ? (
        <>
          <span className="text-sm font-semibold text-slate-700">Xin chào, {session.user.name || session.user.email || "bạn"}!</span>
          <form action={signOutFromGoogle}>
            <button className="rounded-xl bg-white px-4 py-2 text-sm font-bold text-indigo-700 shadow-sm hover:bg-indigo-50" type="submit">Đăng xuất</button>
          </form>
        </>
      ) : (
        <form action={signInWithGoogle}>
          <button className="rounded-xl bg-white px-4 py-2 text-sm font-bold text-indigo-700 shadow-sm hover:bg-indigo-50" type="submit">Đăng nhập bằng Google</button>
        </form>
      )}
    </div>
  );
}
