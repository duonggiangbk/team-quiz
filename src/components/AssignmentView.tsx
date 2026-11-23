"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { errorMessage, fetchSets, writeRequest } from "@/lib/storage";
import type { Assignment, QuestionSet, Submission } from "@/lib/types";

type Summary = { code: string; title: string; createdAt: number; expiresAt: number; count: number };
type Report = { assignment: Assignment; submissions: Submission[] };

export default function AssignmentView() {
  const [sets, setSets] = useState<QuestionSet[]>([]);
  const [assignments, setAssignments] = useState<Summary[]>([]);
  const [selected, setSelected] = useState("");
  const [report, setReport] = useState<Report | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function loadAssignments() {
    const res = await writeRequest("/api/assignments", { method: "GET" });
    if (!res.ok) throw new Error(await errorMessage(res));
    const data = await res.json() as { assignments: Summary[] };
    setAssignments(data.assignments);
  }

  useEffect(() => {
    fetchSets().then((result) => {
      setSets(result.sets);
      if (result.error) setError(result.error);
    }).catch(() => setError("Không tải được kho câu hỏi."));
    writeRequest("/api/assignments", { method: "GET" }).then(async (res) => {
      if (!res.ok) throw new Error(await errorMessage(res));
      const data = await res.json() as { assignments: Summary[] };
      setAssignments(data.assignments);
    }).catch((e: unknown) => setError(e instanceof Error ? e.message : "Không tải được bài giao."));
  }, []);

  async function create() {
    const chosen = sets.find((s) => s.id === selected);
    if (!chosen) return setError("Hãy chọn bộ câu hỏi.");
    const questions = chosen.questions.filter((q) => q.prompt.trim() && q.options);
    if (!questions.length) return setError("Bộ này chưa có câu trắc nghiệm. Hãy sửa bộ và thêm lựa chọn.");
    setBusy(true);
    setError("");
    try {
      const res = await writeRequest("/api/assignments", { method: "POST", body: JSON.stringify({ ...chosen, questions }) });
      if (!res.ok) throw new Error(await errorMessage(res));
      await loadAssignments();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Không tạo được bài giao.");
    } finally { setBusy(false); }
  }

  async function showReport(code: string) {
    setError("");
    try {
      const res = await writeRequest(`/api/assignments/${code}/report`, { method: "GET" });
      if (!res.ok) throw new Error(await errorMessage(res));
      setReport(await res.json() as Report);
    } catch (e) { setError(e instanceof Error ? e.message : "Không tải được báo cáo."); }
  }

  async function remove(code: string) {
    if (!window.confirm("Xóa bài giao và tất cả bài nộp? Không thể khôi phục.")) return;
    setError("");
    try {
      const res = await writeRequest(`/api/assignments/${code}/report`, { method: "DELETE" });
      if (!res.ok) throw new Error(await errorMessage(res));
      setReport(null);
      await loadAssignments();
    } catch (e) { setError(e instanceof Error ? e.message : "Không xóa được bài giao."); }
  }

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 p-4 sm:p-6">
      <Link href="/" className="back-link">← Trang chủ</Link>
      <header className="my-5 rounded-3xl bg-indigo-600 p-6 text-white">
        <h1 className="text-3xl font-extrabold">📋 Giao bài &amp; báo cáo</h1>
        <p className="mt-2">Tạo bài trắc nghiệm, chia sẻ mã và xem kết quả của lớp.</p>
      </header>
      <section className="rounded-3xl bg-white p-5 shadow">
        <h2 className="text-xl font-bold">Tạo bài giao</h2>
        <p className="my-2 text-sm text-slate-600">Chỉ các câu trắc nghiệm trong bộ được giao. Bài có hiệu lực 7 ngày.</p>
        <div className="flex flex-wrap gap-3">
          <select aria-label="Chọn bộ câu hỏi" value={selected} onChange={(e) => setSelected(e.target.value)} className="min-w-0 flex-1 rounded-xl border border-slate-300 p-3">
            <option value="">Chọn bộ câu hỏi</option>
            {sets.map((s) => <option key={s.id} value={s.id}>{s.title} ({s.questions.filter((q) => q.options).length} câu trắc nghiệm)</option>)}
          </select>
          <button type="button" disabled={busy} onClick={create} className="min-h-11 inline-flex items-center justify-center rounded-xl bg-indigo-600 px-5 py-3 font-bold text-white disabled:opacity-50">Tạo mã bài</button>
        </div>
      </section>
      {error && <p role="alert" className="mt-4 rounded-xl bg-rose-50 p-4 font-semibold text-rose-700">{error}</p>}
      <h2 className="mb-3 mt-6 text-xl font-bold">Bài đã giao</h2>
      {assignments.length === 0 ? <p className="rounded-2xl bg-white p-5 text-slate-600">Chưa có bài giao hoặc chưa tải được danh sách.</p> :
        <ul className="space-y-3">{assignments.map((a) => (
          <li key={a.code} className="rounded-2xl bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div><h3 className="font-bold">{a.title}</h3><p className="text-sm text-slate-600">{a.count} câu · Hạn: {new Date(a.expiresAt).toLocaleString("vi-VN")}</p></div>
              <span className="rounded-full bg-sky-100 px-4 py-2 font-mono font-bold text-sky-900">{a.code}</span>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <Link href={`/join?code=${a.code}`} className="rounded-lg bg-emerald-50 px-3 py-2 font-bold text-emerald-800">Mở bài</Link>
              <button type="button" onClick={async () => {
                try { await navigator.clipboard.writeText(`${window.location.origin}/join?code=${a.code}`); }
                catch { setError("Không sao chép được liên kết; hãy mở bài và sao chép địa chỉ."); }
              }} className="rounded-lg bg-sky-50 px-3 py-2 font-bold text-sky-800">Sao chép liên kết</button>
              <button type="button" onClick={() => showReport(a.code)} className="rounded-lg bg-indigo-50 px-3 py-2 font-bold text-indigo-800">Xem báo cáo</button>
              <button type="button" onClick={() => remove(a.code)} className="rounded-lg bg-rose-50 px-3 py-2 font-bold text-rose-800">Xóa</button>
            </div>
          </li>
        ))}</ul>}
      {report && <section className="mt-6 rounded-3xl bg-white p-5 shadow">
        <h2 className="text-xl font-bold">Báo cáo: {report.assignment.title}</h2>
        <p className="my-2 text-slate-600">{report.submissions.length} lượt nộp · {report.submissions.length ? `Điểm trung bình ${Math.round(report.submissions.reduce((sum, s) => sum + (s.total ? s.score / s.total : 0), 0) / report.submissions.length * 100)}%` : "Chưa có bài nộp"}</p>
        <div className="overflow-x-auto"><table className="w-full text-left">
          <thead><tr><th className="p-2">Học sinh</th><th className="p-2">Điểm</th><th className="p-2">Nộp lúc</th></tr></thead>
          <tbody>{report.submissions.map((s) => <tr key={s.id} className="border-t border-slate-100"><td className="p-2">{s.name}</td><td className="p-2">{s.score}/{s.total}</td><td className="p-2">{new Date(s.submittedAt).toLocaleString("vi-VN")}</td></tr>)}</tbody>
        </table></div>
      </section>}
    </main>
  );
}
