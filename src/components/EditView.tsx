"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { loadSets, newId, newQuestion, saveSets } from "@/lib/storage";
import type { Question, QuestionSet } from "@/lib/types";

function initialSet(id: string | null): QuestionSet {
  const existing = id ? loadSets().find((s) => s.id === id) : undefined;
  if (existing) return existing;
  return { id: newId(), title: "", description: "", questions: [newQuestion(), newQuestion(), newQuestion()], updatedAt: Date.now() };
}

export default function EditView() {
  const router = useRouter();
  const params = useSearchParams();
  const [set, setSet] = useState<QuestionSet>(() => initialSet(params.get("id")));
  const [error, setError] = useState("");

  function updateQuestion(id: string, patch: Partial<Question>) {
    setSet((s) => ({ ...s, questions: s.questions.map((q) => (q.id === id ? { ...q, ...patch } : q)) }));
  }

  function save() {
    if (!set.title.trim()) return setError("Hãy nhập tên bộ câu hỏi.");
    const questions = set.questions.filter((q) => q.prompt.trim());
    if (questions.length < 2) return setError("Cần ít nhất 2 câu hỏi có nội dung.");
    const saved = { ...set, title: set.title.trim(), questions, updatedAt: Date.now() };
    const sets = loadSets();
    const idx = sets.findIndex((s) => s.id === saved.id);
    if (idx >= 0) sets[idx] = saved;
    else sets.push(saved);
    saveSets(sets);
    router.push("/");
  }

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 p-6">
      <div className="mb-6 flex items-center justify-between">
        <Link href="/" className="font-semibold text-indigo-600 hover:underline">
          ← Trang chủ
        </Link>
        <h1 className="text-2xl font-extrabold text-indigo-800">Soạn bộ câu hỏi</h1>
      </div>

      <section className="mb-6 space-y-3 rounded-2xl bg-white p-5 shadow">
        <label className="block">
          <span className="text-sm font-semibold text-slate-600">Tên bộ câu hỏi</span>
          <input
            value={set.title}
            onChange={(e) => setSet({ ...set, title: e.target.value })}
            className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2"
            placeholder="Ví dụ: Toán lớp 3 – Phép nhân"
          />
        </label>
        <label className="block">
          <span className="text-sm font-semibold text-slate-600">Mô tả (tùy chọn)</span>
          <input
            value={set.description}
            onChange={(e) => setSet({ ...set, description: e.target.value })}
            className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2"
          />
        </label>
      </section>

      <ol className="space-y-4">
        {set.questions.map((q, i) => (
          <li key={q.id} className="rounded-2xl bg-white p-5 shadow">
            <div className="mb-2 flex items-center justify-between">
              <span className="font-bold text-indigo-700">Câu {i + 1}</span>
              <button
                type="button"
                onClick={() => setSet((s) => ({ ...s, questions: s.questions.filter((x) => x.id !== q.id) }))}
                className="text-sm font-semibold text-rose-600 hover:underline"
              >
                Xóa câu
              </button>
            </div>
            <textarea
              value={q.prompt}
              onChange={(e) => updateQuestion(q.id, { prompt: e.target.value })}
              className="mb-2 w-full rounded-xl border border-slate-300 px-3 py-2"
              rows={2}
              placeholder="Nội dung câu hỏi"
              aria-label={`Câu hỏi ${i + 1}`}
            />
            <div className="flex gap-3">
              <input
                value={q.answer}
                onChange={(e) => updateQuestion(q.id, { answer: e.target.value })}
                className="flex-1 rounded-xl border border-slate-300 px-3 py-2"
                placeholder="Đáp án"
                aria-label={`Đáp án ${i + 1}`}
              />
              <select
                value={q.points}
                onChange={(e) => updateQuestion(q.id, { points: Number(e.target.value) })}
                className="rounded-xl border border-slate-300 px-3 py-2"
                aria-label={`Điểm câu ${i + 1}`}
              >
                {[5, 10, 15, 20, 25, 30].map((p) => (
                  <option key={p} value={p}>
                    {p} điểm
                  </option>
                ))}
              </select>
            </div>
          </li>
        ))}
      </ol>

      <button
        type="button"
        onClick={() => setSet((s) => ({ ...s, questions: [...s.questions, newQuestion()] }))}
        className="mt-4 w-full rounded-2xl border-2 border-dashed border-indigo-300 py-3 font-bold text-indigo-600 hover:bg-indigo-50"
      >
        + Thêm câu hỏi
      </button>

      {error && <p className="mt-4 rounded-xl bg-rose-50 p-3 font-semibold text-rose-700">{error}</p>}

      <div className="sticky bottom-0 mt-6 flex gap-3 bg-[var(--background)] py-4">
        <button
          type="button"
          onClick={save}
          className="flex-1 rounded-xl bg-indigo-600 py-3 text-lg font-bold text-white hover:bg-indigo-700"
        >
          Lưu bộ câu hỏi
        </button>
      </div>
    </main>
  );
}
