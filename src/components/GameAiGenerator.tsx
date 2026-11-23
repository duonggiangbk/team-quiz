"use client";

import { useState } from "react";
import { normalizeWord } from "@/lib/crossword";
import { errorMessage, writeRequest } from "@/lib/storage";

export default function GameAiGenerator({ kind, keyword, hasContent, busy, setBusy, onApply }: {
  kind: "matching" | "crossword" | "flying-words";
  keyword?: string;
  hasContent: boolean;
  busy: boolean;
  setBusy: (value: boolean) => void;
  onApply: (value: unknown, topic: string, count: number) => void;
}) {
  const [topic, setTopic] = useState("");
  const [level, setLevel] = useState("Tiểu học");
  const [count, setCount] = useState(4);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function generate() {
    if (!topic.trim()) { setError("Hãy nhập chủ đề."); return; }
    if (kind === "crossword" && !/^[A-Z]{2,12}$/.test(normalizeWord(keyword ?? ""))) {
      setError("Hãy nhập từ khóa gồm 2–12 chữ cái trước khi tạo."); return;
    }
    if (hasContent && !window.confirm("Tạo bằng AI sẽ thay thế nội dung đang soạn, bao gồm hình ảnh. Tiếp tục?")) return;
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const response = await writeRequest("/api/ai", {
        method: "POST",
        body: JSON.stringify({ kind, topic, level, ...(kind === "matching" ? { count } : { keyword }) }),
      });
      if (!response.ok) throw new Error(await errorMessage(response));
      const data: unknown = await response.json();
      onApply(data, topic.trim(), count);
      setMessage("Đã tạo bản nháp. Giáo viên hãy kiểm tra và chỉnh sửa trước khi lưu.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Không tạo được nội dung bằng AI.");
    } finally { setBusy(false); }
  }

  return <div className="space-y-3 rounded-2xl bg-violet-50 p-4">
    <h3 className="font-bold text-violet-900">✨ Tạo nhanh bằng AI</h3>
    <p className="text-sm text-violet-900">Chủ đề{kind === "crossword" ? " và từ khóa" : ""} được gửi đến Google. Không nhập thông tin cá nhân; cần mã PIN giáo viên. AI có thể sai, hãy kiểm tra trước khi lưu.</p>
    <label className="block font-bold">Chủ đề<input value={topic} maxLength={300} onChange={(e) => setTopic(e.target.value)} className="mt-1 w-full rounded-xl border border-violet-200 bg-white p-2 font-normal" placeholder="Ví dụ: động vật" /></label>
    <div className="flex flex-wrap gap-3">
      <label className="font-bold">Độ tuổi<select value={level} onChange={(e) => setLevel(e.target.value)} className="ml-2 rounded-xl border border-violet-200 bg-white p-2"><option>Mầm non</option><option>Tiểu học</option><option>Trung học cơ sở</option></select></label>
      {kind !== "crossword" && <label className="font-bold">{kind === "matching" ? "Số cặp" : "Số câu"}<select value={count} onChange={(e) => setCount(Number(e.target.value))} className="ml-2 rounded-xl border border-violet-200 bg-white p-2">{Array.from({ length: kind === "matching" ? 7 : 9 }, (_, i) => i + 2).map((n) => <option key={n}>{n}</option>)}</select></label>}
    </div>
    <button type="button" onClick={generate} disabled={busy} className="min-h-11 inline-flex items-center justify-center rounded-xl bg-violet-600 px-4 py-2 font-bold text-white disabled:opacity-50">{busy ? "Đang tạo…" : "✨ Tạo bằng AI"}</button>
    {error && <p role="alert" className="rounded-xl bg-rose-50 p-3 text-rose-700">{error}</p>}
    {message && <p role="status" className="rounded-xl bg-emerald-50 p-3 text-emerald-800">{message}</p>}
  </div>;
}
