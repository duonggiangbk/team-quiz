"use client";

import Link from "next/link";
import { useState } from "react";
import { errorMessage } from "@/lib/storage";

export default function AiPage() {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function ask() {
    if (!question.trim()) { setError("Bé hãy nhập câu hỏi nhé."); return; }
    setBusy(true);
    setError("");
    setAnswer("");
    try {
      const response = await fetch("/api/ai", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ kind: "help", question }) });
      if (!response.ok) throw new Error(await errorMessage(response));
      const data = await response.json() as { text: string };
      setAnswer(data.text);
    } catch (e) { setError(e instanceof Error ? e.message : "Không nhận được câu trả lời."); }
    finally { setBusy(false); }
  }

  return <main className="mx-auto w-full max-w-3xl flex-1 p-4 sm:p-6">
    <Link href="/" className="font-bold text-indigo-700">← Về trang chủ</Link>
    <header className="my-5 rounded-3xl bg-violet-600 p-6 text-white">
      <h1 className="text-3xl font-extrabold">✨ Trợ lý học tập</h1>
      <p className="mt-2">Bé hãy hỏi một câu về bài học để nhận gợi ý nhé!</p>
    </header>
    <section className="space-y-4 rounded-3xl bg-white p-5 shadow">
      <p className="rounded-xl bg-amber-50 p-3 text-sm text-amber-900">Câu hỏi sẽ được gửi đến Google. Không nhập tên, địa chỉ, số điện thoại hay thông tin riêng tư. Hãy dùng cùng giáo viên hoặc phụ huynh; AI có thể trả lời sai.</p>
      <label className="block font-bold">Câu hỏi của bé
        <textarea value={question} onChange={(e) => setQuestion(e.target.value)} maxLength={500} rows={4} placeholder="Ví dụ: Làm sao để cộng hai số?" className="mt-2 block w-full rounded-xl border border-slate-300 p-3 font-normal" />
      </label>
      <button type="button" disabled={busy} onClick={ask} className="rounded-xl bg-violet-600 px-5 py-3 font-bold text-white disabled:opacity-50">{busy ? "Đang suy nghĩ…" : "Gửi câu hỏi"}</button>
      {error && <p role="alert" className="rounded-xl bg-rose-50 p-3 text-rose-700">{error}</p>}
      {answer && <div role="status" className="whitespace-pre-wrap rounded-2xl bg-emerald-50 p-4 text-slate-800">{answer}</div>}
    </section>
  </main>;
}
