"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import QuestionImage from "@/components/QuestionImage";
import { errorMessage, fetchSet, newId, newQuestion, upsertSet, writeRequest } from "@/lib/storage";
import type { Question, QuestionSet } from "@/lib/types";
import { isValidImage, MAX_IMAGE_FILE_BYTES } from "@/lib/validate";

function blankSet(): QuestionSet {
  return { id: newId(), title: "", description: "", questions: [newQuestion(), newQuestion(), newQuestion()], updatedAt: Date.now() };
}

export default function EditView() {
  const params = useSearchParams();
  const id = params.get("id");
  const returnToZombies = params.get("returnTo") === "zombies";
  const [initial, setInitial] = useState<QuestionSet | null>(() => (id ? null : blankSet()));

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    fetchSet(id).then((s) => {
      if (!cancelled) setInitial(s ?? blankSet());
    });
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (!initial) {
    return <main className="mx-auto max-w-xl flex-1 p-6 text-center text-lg text-slate-500">Đang tải…</main>;
  }
  return <Editor key={initial.id} initial={initial} returnToZombies={returnToZombies} />;
}

function Editor({ initial, returnToZombies }: { initial: QuestionSet; returnToZombies: boolean }) {
  const router = useRouter();
  const [set, setSet] = useState<QuestionSet>(initial);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [imagesLoading, setImagesLoading] = useState(0);
  const [topic, setTopic] = useState("");
  const [level, setLevel] = useState("Tiểu học");
  const [count, setCount] = useState(5);
  const [generating, setGenerating] = useState(false);

  async function generateQuestions() {
    if (!topic.trim()) { setError("Hãy nhập chủ đề để AI tạo câu hỏi."); return; }
    if (set.questions.length + count > 100) { setError("Bộ câu hỏi tối đa 100 câu. Hãy xóa bớt câu trước."); return; }
    setGenerating(true);
    setError("");
    try {
      const response = await writeRequest("/api/ai", { method: "POST", body: JSON.stringify({ kind: "questions", topic, level, count }) });
      if (!response.ok) throw new Error(await errorMessage(response));
      const data = await response.json() as { questions: Question[] };
      setSet((current) => ({ ...current, questions: [...current.questions, ...data.questions.map((q) => ({ ...q, id: newId() }))] }));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Không tạo được câu hỏi.");
    } finally { setGenerating(false); }
  }

  function updateQuestion(id: string, patch: Partial<Question>) {
    setSet((s) => ({ ...s, questions: s.questions.map((q) => (q.id === id ? { ...q, ...patch } : q)) }));
  }

  function uploadImage(id: string, file: File | undefined) {
    if (!file) return;
    if (!["image/png", "image/jpeg", "image/gif", "image/webp"].includes(file.type)) {
      setError("Hãy chọn ảnh PNG, JPEG, GIF hoặc WebP.");
      return;
    }
    if (file.size > MAX_IMAGE_FILE_BYTES) {
      setError("Ảnh tải lên phải nhỏ hơn 80 KB. Bạn cũng có thể dùng liên kết ảnh.");
      return;
    }
    const reader = new FileReader();
    setImagesLoading((count) => count + 1);
    reader.onload = () => {
      if (typeof reader.result !== "string" || !isValidImage(reader.result)) {
        setError("Không đọc được hình ảnh. Hãy chọn một ảnh khác.");
        return;
      }
      updateQuestion(id, { image: reader.result });
      setError("");
    };
    reader.onerror = () => setError("Không đọc được hình ảnh. Hãy thử lại.");
    reader.onloadend = () => setImagesLoading((count) => count - 1);
    reader.readAsDataURL(file);
  }

  async function save() {
    if (!set.title.trim()) return setError("Hãy nhập tên bộ câu hỏi.");
    const questions = set.questions.filter((q) => q.prompt.trim());
    if (questions.length < 2) return setError("Cần ít nhất 2 câu hỏi có nội dung.");
    const saved = { ...set, title: set.title.trim(), questions, updatedAt: Date.now() };
    setSaving(true);
    setError("");
    try {
      await upsertSet(saved);
      router.push(returnToZombies ? "/zombies" : "/");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Không lưu được bộ câu hỏi.");
      setSaving(false);
    }
  }

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 p-6">
      <div className="mb-6 flex items-center justify-between">
        <Link href={returnToZombies ? "/zombies" : "/"} className="font-semibold text-indigo-600 hover:underline">
          {returnToZombies ? "← Chặn Zombie" : "← Trang chủ"}
        </Link>
        <h1 className="text-2xl font-extrabold text-indigo-800">Soạn bộ câu hỏi</h1>
      </div>

      <fieldset disabled={generating} className="disabled:opacity-60">
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

      <section className="mb-6 space-y-3 rounded-2xl bg-violet-50 p-5">
        <h2 className="text-xl font-bold text-violet-900">✨ Tạo câu hỏi bằng AI</h2>
        <p className="text-sm text-violet-800">Không nhập thông tin cá nhân. Giáo viên cần kiểm tra và sửa câu hỏi, đáp án trước khi lưu.</p>
        <label className="block font-semibold">Chủ đề
          <input value={topic} onChange={(e) => setTopic(e.target.value)} maxLength={300} placeholder="Ví dụ: Phép cộng trong phạm vi 10" className="mt-1 w-full rounded-xl border border-violet-200 bg-white p-3 font-normal" />
        </label>
        <div className="flex flex-wrap gap-3">
          <label className="font-semibold">Độ tuổi
            <select value={level} onChange={(e) => setLevel(e.target.value)} className="ml-2 rounded-xl border border-violet-200 bg-white p-2">
              <option>Mầm non</option><option>Tiểu học</option><option>Trung học cơ sở</option>
            </select>
          </label>
          <label className="font-semibold">Số câu
            <select value={count} onChange={(e) => setCount(Number(e.target.value))} className="ml-2 rounded-xl border border-violet-200 bg-white p-2">
              {[2, 3, 5, 10].map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
          </label>
          <button type="button" disabled={generating} onClick={generateQuestions} className="min-h-11 inline-flex items-center justify-center rounded-xl bg-violet-700 px-4 py-2 font-bold text-white disabled:opacity-50">{generating ? "Đang tạo…" : "Tạo câu hỏi"}</button>
        </div>
      </section>

      <ol className="space-y-4">
        {set.questions.map((q, i) => (
          <li key={q.id} className="rounded-3xl border-2 border-indigo-100 bg-white p-5 shadow">
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
            <label className="mb-3 flex items-center gap-2 font-semibold text-indigo-700">
              <input
                type="checkbox"
                checked={!!q.options}
                onChange={(e) => updateQuestion(q.id, e.target.checked
                  ? { options: [q.answer, ""], correctIndex: 0 }
                  : { options: undefined, correctIndex: undefined })}
              />
              Câu trắc nghiệm để giao bài
            </label>
            {q.options && (
              <fieldset className="mb-3 space-y-2 rounded-2xl bg-indigo-50 p-4">
                <legend className="font-bold text-indigo-800">Chọn một đáp án đúng</legend>
                {q.options.map((option, index) => (
                  <label key={index} className="flex items-center gap-2">
                    <input type="radio" name={`correct-${q.id}`} checked={q.correctIndex === index}
                      onChange={() => updateQuestion(q.id, { correctIndex: index, answer: q.options![index] })} />
                    <span className="font-bold text-indigo-700">{String.fromCharCode(65 + index)}</span>
                    <input value={option} aria-label={`Lựa chọn ${index + 1} câu ${i + 1}`}
                      onChange={(e) => {
                        const options = q.options!.map((value, j) => j === index ? e.target.value : value);
                        updateQuestion(q.id, { options, ...(q.correctIndex === index ? { answer: e.target.value } : {}) });
                      }}
                      className="w-full rounded-xl border border-indigo-200 bg-white px-3 py-2" />
                    {q.options!.length > 2 && <button type="button" aria-label={`Xóa lựa chọn ${index + 1} câu ${i + 1}`}
                      onClick={() => {
                        const options = q.options!.filter((_, j) => j !== index);
                        const correctIndex = q.correctIndex === index ? 0 : (q.correctIndex ?? 0) > index ? (q.correctIndex ?? 0) - 1 : q.correctIndex ?? 0;
                        updateQuestion(q.id, { options, correctIndex, answer: options[correctIndex] });
                      }}
                      className="font-bold text-rose-700">Xóa</button>}
                  </label>
                ))}
                {q.options.length < 4 && <button type="button" onClick={() => updateQuestion(q.id, { options: [...q.options!, ""] })}
                  className="font-semibold text-indigo-700 hover:underline">+ Thêm lựa chọn</button>}
              </fieldset>
            )}
            <div className="mb-3 space-y-3 rounded-2xl bg-sky-50 p-4">
              <label className="block">
                <span className="font-bold text-sky-800">🖼️ Hình minh họa (tùy chọn)</span>
                <input
                  type="url"
                  value={q.image?.startsWith("data:") ? "" : q.image ?? ""}
                  onChange={(e) => updateQuestion(q.id, { image: e.target.value || undefined })}
                  className="mt-2 w-full rounded-xl border border-sky-200 bg-white px-3 py-2"
                  placeholder="Dán liên kết https://…"
                  aria-label={`Liên kết hình ảnh câu ${i + 1}`}
                />
              </label>
              <label className="block text-sm font-semibold text-sky-800">
                Hoặc chọn ảnh từ máy (PNG, JPEG, GIF, WebP; tối đa 80 KB)
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/gif,image/webp"
                  className="mt-2 block w-full text-sm file:mr-3 file:rounded-full file:border-0 file:bg-sky-200 file:px-4 file:py-2 file:font-bold file:text-sky-900"
                  onChange={(e) => {
                    uploadImage(q.id, e.target.files?.[0]);
                    e.target.value = "";
                  }}
                  aria-label={`Chọn hình ảnh câu ${i + 1}`}
                />
              </label>
              {q.image && isValidImage(q.image) && (
                <>
                  <QuestionImage src={q.image} alt={`Hình minh họa câu ${i + 1}`} />
                  <button type="button" onClick={() => updateQuestion(q.id, { image: undefined })} className="font-semibold text-rose-700 hover:underline">
                    Xóa hình
                  </button>
                </>
              )}
              {q.image && !isValidImage(q.image) && <p className="text-sm font-semibold text-rose-700">Liên kết hình ảnh chưa hợp lệ.</p>}
            </div>
            <div className="flex gap-3">
              <input
                value={q.answer}
                onChange={(e) => updateQuestion(q.id, { answer: e.target.value })}
                readOnly={!!q.options}
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

      {error && <p role="alert" className="mt-4 rounded-xl bg-rose-50 p-3 font-semibold text-rose-700">{error}</p>}

      <div className="sticky bottom-0 mt-6 flex gap-3 bg-[var(--background)] py-4">
        <button
          type="button"
          onClick={save}
          disabled={saving || imagesLoading > 0}
          className="flex-1 rounded-xl bg-indigo-600 py-3 text-lg font-bold text-white hover:bg-indigo-700 disabled:opacity-60"
        >
          {saving ? "Đang lưu…" : imagesLoading > 0 ? "Đang tải hình…" : "Lưu bộ câu hỏi"}
        </button>
      </div>
      </fieldset>
    </main>
  );
}
