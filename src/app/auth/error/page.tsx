import Link from "next/link";

export default function AuthErrorPage() {
  return (
    <main className="mx-auto w-full max-w-xl flex-1 p-6">
      <section className="rounded-3xl bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-extrabold text-indigo-800">Không thể đăng nhập</h1>
        <p className="mt-3 text-slate-600">Đăng nhập Google chưa được cấu hình hoặc đã xảy ra lỗi. Hãy thử lại hoặc liên hệ người quản lý website. Bạn vẫn có thể sử dụng ứng dụng mà không cần đăng nhập.</p>
        <Link href="/" className="min-h-11 inline-flex items-center justify-center mt-5 rounded-xl bg-indigo-600 px-5 py-3 font-bold text-white hover:bg-indigo-700">Về trang chủ</Link>
      </section>
    </main>
  );
}
