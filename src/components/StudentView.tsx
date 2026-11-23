"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import QuestionImage from "@/components/QuestionImage";
import { errorMessage } from "@/lib/storage";
import type { StudentAssignment } from "@/lib/types";

export default function StudentView() {
  const params = useSearchParams();
  const [code, setCode] = useState(params.get("code")?.toUpperCase() ?? "");
  const [assignment, setAssignment] = useState<StudentAssignment | null>(null);
  const [name, setName] = useState("");
  const [answers, setAnswers] = useState<number[]>([]);
  const [result, setResult] = useState<{ score: number; total: number } | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function load(value: string) {
    const normalized = value.trim().toUpperCase();
    if (!/^[A-F0-9]{12}$/.test(normalized)) { setError("Mã bài gồm 12 ký tự từ 0–9 và A–F."); return; }
    setBusy(true);
    setError("");
    setAssignment(null);
    setResult(null);
    try {
      const res = await fetch(`/api/assignments/${normalized}`, { cache: "no-store" });
      if (!res.ok) throw new Error(await errorMessage(res));
      const data = await res.json() as { assignment: StudentAssignment };
      setCode(normalized);
      setAssignment(data.assignment);
      setAnswers(Array(data.assignment.questions.length).fill(-1));
    } catch (e) { setError(e instanceof Error ? e.message : "Không tải được bài tập."); }
    finally { setBusy(false); }
  }

  useEffect(() => {
    const initial = params.get("code");
    if (!initial) return;
    const normalized = initial.trim().toUpperCase();
    if (!/^[A-F0-9]{12}$/.test(normalized)) return;
    let active = true;
    fetch(`/api/assignments/${normalized}`, { cache: "no-store" }).then(async (res) => {
      if (!res.ok) throw new Error(await errorMessage(res));
      return await res.json() as { assignment: StudentAssignment };
    }).then((data) => {
      if (!active) return;
      setAssignment(data.assignment);
      setAnswers(Array(data.assignment.questions.length).fill(-1));
    }).catch((e: unknown) => {
      if (active) setError(e instanceof Error ? e.message : "Không tải được bài tập.");
    });
    return () => { active = false; };
  }, [params]);

  async function submit() {
    if (!assignment || busy) return;
    if (!name.trim()) { setError("Bé hãy nhập tên trước nhé!"); return; }
    if (answers.some((answer) => answer < 0)) { setError("Bé hãy trả lời tất cả câu hỏi nhé!"); return; }
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`/api/assignments/${assignment.code}/submit`, {
        method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ name, answers }),
      });
      if (!res.ok) throw new Error(await errorMessage(res));
      setResult(await res.json() as { score: number; total: number });
    } catch (e) { setError(e instanceof Error ? e.message : "Không nộp được bài."); }
    finally { setBusy(false); }
  }

  return <main className="mx-auto w-full max-w-3xl flex-1 p-4 sm:p-6">
    <Link href="/" className="back-link">← Trang chủ</Link>
    <header className="my-5 rounded-3xl bg-emerald-600 p-6 text-white">
      <h1 className="text-3xl font-extrabold">🎒 Cùng làm bài nhé!</h1>
      <p className="mt-2">Nhập mã cô giáo hoặc thầy giáo đã gửi cho bé.</p>
    </header>
    <form onSubmit={(e) => { e.preventDefault(); void load(code); }} className="flex flex-wrap gap-2 rounded-2xl bg-white p-4 shadow-sm">
      <input aria-label="Mã bài tập" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} maxLength={12} placeholder="Nhập mã bài" className="min-w-0 flex-1 rounded-xl border border-slate-300 p-3 font-mono uppercase" />
      <button disabled={busy} className="min-h-11 inline-flex items-center justify-center rounded-xl bg-indigo-600 px-5 py-3 font-bold text-white disabled:opacity-50">Mở bài</button>
    </form>
    {error && <p role="alert" className="mt-4 rounded-xl bg-rose-50 p-4 font-bold text-rose-700">{error}</p>}
    {assignment && (result ? <section className="mt-5 rounded-3xl bg-amber-100 p-8 text-center">
      <h2 className="text-3xl font-extrabold">🌟 Bé đã hoàn thành!</h2>
      <p className="mt-3 text-xl">Điểm của bé: <strong>{result.score}/{result.total}</strong></p>
      <p className="mt-2">Kết quả đã được gửi cho giáo viên.</p>
    </section> : <section className="mt-5 space-y-4">
      <div className="rounded-2xl bg-white p-5"><h2 className="text-2xl font-bold">{assignment.title}</h2><p className="text-sm text-slate-600">Hạn nộp: {new Date(assignment.expiresAt).toLocaleString("vi-VN")}</p>
        <label className="mt-4 block font-bold">Tên của bé<input value={name} onChange={(e) => setName(e.target.value)} maxLength={80} className="mt-2 block w-full rounded-xl border border-slate-300 p-3 font-normal" /></label>
      </div>
      {assignment.questions.map((q, i) => <fieldset key={`${q.id}-${i}`} className="rounded-2xl bg-white p-5 shadow-sm">
        <legend className="px-2 font-bold text-indigo-700">Câu {i + 1}</legend>
        <p className="mb-3 text-lg font-bold">{q.prompt}</p>
        {q.image && <QuestionImage src={q.image} alt={`Hình minh họa câu ${i + 1}`} />}
        <div className="mt-3 grid gap-2 sm:grid-cols-2">{q.options?.map((option, j) => <label key={j} className={`flex cursor-pointer gap-3 rounded-xl border-2 p-3 ${answers[i] === j ? "border-indigo-500 bg-indigo-50" : "border-slate-100"}`}>
          <input type="radio" name={`question-${i}`} checked={answers[i] === j} onChange={() => setAnswers((prev) => prev.map((value, index) => index === i ? j : value))} />
          <span>{option}</span>
        </label>)}</div>
      </fieldset>)}
      <button type="button" disabled={busy} onClick={submit} className="w-full rounded-2xl bg-emerald-600 p-4 text-lg font-extrabold text-white disabled:opacity-50">{busy ? "Đang gửi…" : "🚀 Nộp bài"}</button>
    </section>)}
  </main>;
}
