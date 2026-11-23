"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import QuestionImage from "@/components/QuestionImage";
import { fetchSets } from "@/lib/storage";
import type { QuestionSet } from "@/lib/types";
import { prepareZombieQuestions, startZombieGame, zombieReducer, type ZombieAction, type ZombieGame } from "@/lib/zombies";

export default function ZombiesPage() {
  const [sets, setSets] = useState<QuestionSet[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [game, setGame] = useState<ZombieGame | null>(null);
  const selected = sets.find((set) => set.id === selectedId);
  const questions = useMemo(() => selected ? prepareZombieQuestions(selected.questions) : [], [selected]);

  useEffect(() => {
    let active = true;
    fetchSets().then((result) => {
      if (!active) return;
      setSets(result.sets);
      setError(result.error ?? "");
      setLoading(false);
    }).catch((reason: unknown) => {
      if (!active) return;
      setError(reason instanceof Error ? reason.message : "Không tải được kho câu hỏi.");
      setLoading(false);
    });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (game?.status !== "playing") return;
    const timer = window.setInterval(() => {
      setGame((current) => current ? zombieReducer(current, { type: "tick", now: performance.now() }) : current);
    }, 100);
    const onVisibilityChange = () => {
      if (document.hidden) setGame((current) => current ? zombieReducer(current, { type: "pause", now: performance.now() }) : current);
    };
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => { window.clearInterval(timer); document.removeEventListener("visibilitychange", onVisibilityChange); };
  }, [game?.status]);

  function act(action: ZombieAction) {
    setGame((current) => current ? zombieReducer(current, action) : current);
  }

  function start() {
    if (questions.length) setGame(startZombieGame(questions, performance.now()));
  }

  if (!game) return (
    <main className="mx-auto w-full max-w-5xl flex-1 p-4 sm:p-6">
      <Link href="/" className="font-bold text-indigo-700 hover:underline">← Danh sách trò chơi</Link>
      <header className="my-5 rounded-3xl bg-gradient-to-r from-lime-100 via-emerald-100 to-sky-100 p-6">
        <p className="text-4xl" aria-hidden="true">🧟 🌻 🏡</p>
        <h1 className="mt-2 text-3xl font-extrabold text-emerald-900">Chặn Zombie</h1>
        <p className="mt-2 text-emerald-900">Trả lời đúng để bảo vệ hàng rào. Chọn sai thì zombie chạy nhanh hơn, nhưng bé vẫn được chọn lại!</p>
      </header>
      {error && <p role="alert" className="mb-4 rounded-xl bg-amber-50 p-4 font-semibold text-amber-900">{error}</p>}
      <section className="rounded-3xl bg-white p-5 shadow-sm">
        <h2 className="text-xl font-extrabold text-slate-800">Chọn bộ câu hỏi</h2>
        <p className="mt-1 text-sm text-slate-600">Mỗi câu bắt đầu với 30 giây; mỗi lần chọn sai tốc độ tăng thêm 50% tốc độ ban đầu.</p>
        <label htmlFor="zombie-set" className="mt-4 block font-bold">Bộ câu hỏi trong kho</label>
        <select id="zombie-set" value={selectedId} onChange={(e) => setSelectedId(e.target.value)} className="mt-2 w-full rounded-xl border border-slate-300 bg-white p-3">
          <option value="">{loading ? "Đang tải…" : "Chọn một bộ câu hỏi"}</option>
          {sets.map((set) => <option key={set.id} value={set.id}>{set.title}</option>)}
        </select>
        {selected && <>
          <p className="mt-4 font-semibold text-slate-700">Chơi được {questions.length}/{selected.questions.length} câu.</p>
          <p className="mt-2 rounded-xl bg-amber-50 p-3 text-sm text-amber-900">Câu chưa có lựa chọn được lấy đáp án từ các câu khác trong cùng bộ. Giáo viên cần xem trước: lựa chọn tự tạo có thể không phù hợp hoặc có nhiều đáp án đúng. Câu không đủ dữ liệu được bỏ qua.</p>
          {questions.length > 0 ? <>
            <details className="mt-4 rounded-xl bg-slate-50 p-4">
              <summary className="cursor-pointer font-bold text-indigo-700">Xem trước câu hỏi và đáp án</summary>
              <ol className="mt-3 space-y-3">
                {questions.map((question, index) => <li key={`${question.id}-${index}`} className="rounded-xl bg-white p-3">
                  <p className="font-bold">{index + 1}. {question.prompt} {question.generated && <span className="text-xs text-amber-700">(lựa chọn tự tạo)</span>}</p>
                  {question.image && <div className="my-2"><QuestionImage src={question.image} alt={`Hình minh họa câu ${index + 1}`} /></div>}
                  <ul className="mt-1 text-sm text-slate-700">{question.options.map((option, i) => <li key={i}>{String.fromCharCode(65 + i)}. {option}{i === question.correctIndex ? " ✓" : ""}</li>)}</ul>
                </li>)}
              </ol>
            </details>
            <button type="button" onClick={start} className="mt-4 rounded-xl bg-emerald-600 px-6 py-3 font-bold text-white hover:bg-emerald-700">▶ Bắt đầu chơi</button>
          </> : <p className="mt-3 font-semibold text-rose-700">Chưa đủ câu để chơi. Hãy thêm câu trắc nghiệm hoặc ít nhất hai đáp án khác nhau vào bộ.</p>}
          <Link href={`/edit?id=${encodeURIComponent(selected.id)}`} className="ml-4 inline-block font-bold text-indigo-700 hover:underline">Sửa bộ câu hỏi</Link>
        </>}
      </section>
    </main>
  );

  const question = game.questions[game.index];
  const finished = game.status === "won" || game.status === "lost";
  const completed = game.status === "won" ? game.questions.length : game.index;
  return (
    <main className="w-full flex-1 bg-violet-950 p-3 text-white sm:p-5">
      <div className="mx-auto max-w-5xl">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <button type="button" onClick={() => setGame(null)} className="rounded-xl border border-violet-400 px-3 py-2 font-bold hover:bg-violet-800">← Chọn bộ khác</button>
          <h1 className="font-extrabold">🧟 Chặn Zombie</h1>
          <span className="font-bold">⭐ {completed}/{game.questions.length}</span>
          {!finished && <button type="button" onClick={() => act({ type: game.status === "paused" ? "resume" : "pause", now: performance.now() })} className="rounded-xl bg-violet-700 px-4 py-2 font-bold hover:bg-violet-600">{game.status === "paused" ? "▶ Tiếp tục" : "⏸ Tạm dừng"}</button>}
        </div>
        {finished ? <section className="mt-6 rounded-3xl bg-white p-8 text-center text-slate-800" role="status">
          <p className="text-5xl" aria-hidden="true">{game.status === "won" ? "🎉 🏡 🌟" : "🧟 🏡 💪"}</p>
          <h2 className="mt-4 text-3xl font-extrabold">{game.status === "won" ? "Bảo vệ thành công!" : "Zombie đã tới hàng rào!"}</h2>
          <p className="mt-2">Đã vượt qua {completed}/{game.questions.length} câu · Chọn sai {game.mistakes} lần</p>
          <div className="mt-5 flex justify-center gap-3">
            <button type="button" onClick={start} className="rounded-xl bg-emerald-600 px-5 py-3 font-bold text-white hover:bg-emerald-700">Chơi lại</button>
            <button type="button" onClick={() => setGame(null)} className="rounded-xl bg-slate-100 px-5 py-3 font-bold text-slate-800 hover:bg-slate-200">Chọn bộ khác</button>
          </div>
        </section> : <>
          <section className="mt-4 rounded-3xl bg-amber-50 p-5 text-center text-slate-900">
            <p className="text-sm font-bold text-amber-800">CÂU {game.index + 1}/{game.questions.length}</p>
            <h2 className="mt-1 text-xl font-extrabold sm:text-3xl">{question.prompt}</h2>
            {question.image && <div className="mx-auto mt-3 max-w-md"><QuestionImage src={question.image} alt="Hình minh họa câu hỏi" /></div>}
          </section>
          <div className="mt-3 rounded-xl bg-violet-900 p-3">
            <div className="flex justify-between text-sm font-bold"><span>🏡 Hàng rào</span><span>Zombie đang đến 🧟</span></div>
            <div className="mt-2 h-3 overflow-hidden rounded-full bg-violet-700" role="progressbar" aria-label="Khoảng đường zombie đã đi" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(game.distance * 100)}>
              <div className="h-full rounded-full bg-lime-400" style={{ width: `${game.distance * 100}%` }} />
            </div>
          </div>
          <p className="mt-2 min-h-6 text-center font-bold" role="status">{game.status === "paused" ? "Đang tạm dừng" : game.wrong.length ? "Chưa đúng! Zombie chạy nhanh hơn, hãy chọn đáp án khác." : "Chọn đáp án đúng để ngăn zombie!"}</p>
          <div className="mt-2 overflow-hidden rounded-3xl border-4 border-emerald-800">
            {question.options.map((option, index) => <div key={index} className={`relative flex min-h-24 items-center gap-2 border-l-8 border-amber-800 px-3 py-3 sm:gap-4 sm:px-5 ${index % 2 ? "bg-lime-600" : "bg-lime-700"}`}>
              <span className="text-3xl" aria-hidden="true">🏡</span>
              <div className="relative hidden h-12 flex-1 sm:block" aria-hidden="true">
                <span className="absolute text-4xl" style={{ left: `${(1 - game.distance) * 80}%` }}>🧟</span>
              </div>
              <button type="button" disabled={game.status !== "playing" || game.wrong.includes(index)} onClick={() => act({ type: "answer", index, now: performance.now() })} className="flex min-h-14 flex-1 items-center gap-3 rounded-2xl border-2 border-amber-700 bg-amber-100 px-4 py-2 text-left font-extrabold text-amber-950 shadow hover:bg-amber-200 focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-white disabled:cursor-not-allowed disabled:opacity-55 sm:flex-none sm:w-1/2">
                <span className="rounded-full bg-amber-800 px-3 py-1 text-white">{String.fromCharCode(65 + index)}</span>
                <span className="min-w-0 break-words">{option}</span>{game.wrong.includes(index) && <span aria-label="Sai">✕</span>}
              </button>
            </div>)}
          </div>
        </>}
      </div>
    </main>
  );
}
