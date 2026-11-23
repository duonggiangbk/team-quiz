"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import GameAiGenerator from "@/components/GameAiGenerator";
import { isCorrectOrder, parseFlyingWordsSet, SAMPLE_FLYING_WORDS, shuffledWords, words, type FlyingWordsRound, type FlyingWordsSet } from "@/lib/flyingWords";
import { newId } from "@/lib/storage";

const STORAGE_KEY = "team-quiz:flying-words-sets";
const button = "inline-flex min-h-11 items-center justify-center rounded-xl bg-indigo-600 px-4 py-2 font-bold text-white hover:bg-indigo-700 disabled:opacity-50";
const input = "mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2";
const colors = ["bg-rose-500", "bg-sky-600", "bg-violet-600", "bg-emerald-600", "bg-amber-600", "bg-pink-600"];
const emptyRound = (): FlyingWordsRound => ({ clue: "", sentence: "" });

function Editor({ initial, onSave, onCancel }: { initial?: FlyingWordsSet; onSave: (value: FlyingWordsSet) => void; onCancel: () => void }) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [rounds, setRounds] = useState<FlyingWordsRound[]>(initial?.rounds ?? [emptyRound()]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  function update(index: number, patch: Partial<FlyingWordsRound>) {
    setRounds((current) => current.map((round, i) => i === index ? { ...round, ...patch } : round));
  }
  function save() {
    const parsed = parseFlyingWordsSet({ id: initial?.id ?? newId(), title, rounds });
    if (typeof parsed === "string") { setError(parsed); return; }
    try { onSave(parsed); } catch (e) { setError(e instanceof Error ? e.message : "Không lưu được bộ câu."); }
  }

  return <section className="mb-6 rounded-3xl bg-white p-5 shadow-sm" aria-label="Soạn bộ câu">
    <h2 className="mb-4 text-xl font-extrabold text-indigo-800">{initial ? "✏️ Sửa bộ câu" : "✨ Tạo bộ câu mới"}</h2>
    <fieldset disabled={busy} className="space-y-4 disabled:opacity-60">
      <label className="block font-bold">Tên bộ câu<input className={input} value={title} maxLength={100} onChange={(e) => setTitle(e.target.value)} /></label>
      <GameAiGenerator kind="flying-words" busy={busy} setBusy={setBusy} hasContent={rounds.some((round) => round.clue.trim() || round.sentence.trim())} onApply={(data, topic, count) => {
        const parsed = parseFlyingWordsSet({ id: "ai", title: "AI", rounds: data && typeof data === "object" && "rounds" in data ? data.rounds : null });
        if (typeof parsed === "string" || parsed.rounds.length !== count) throw new Error("AI tạo câu chưa hợp lệ. Hãy thử lại.");
        setRounds(parsed.rounds);
        if (!title.trim()) setTitle(topic.slice(0, 100));
        setError("");
      }} />
      <p className="text-sm text-slate-700">Nhập câu hoàn chỉnh theo đúng thứ tự, gồm 2–12 từ. Các từ cách nhau bằng dấu cách; gợi ý là tùy chọn. Hãy kiểm tra để câu chỉ có một thứ tự mong muốn.</p>
      {rounds.map((round, index) => <fieldset key={index} className="space-y-3 rounded-2xl border-2 border-indigo-100 p-4">
        <legend className="px-2 font-extrabold text-indigo-700">Câu {index + 1}</legend>
        <label className="block font-bold">Gợi ý (tùy chọn)<input className={input} maxLength={300} value={round.clue} onChange={(e) => update(index, { clue: e.target.value })} /></label>
        <label className="block font-bold">Câu hoàn chỉnh<input className={input} maxLength={300} value={round.sentence} onChange={(e) => update(index, { sentence: e.target.value })} placeholder="Ví dụ: Mặt trời mọc ở hướng đông" /></label>
        {rounds.length > 1 && <button type="button" className="font-bold text-rose-700" onClick={() => setRounds((current) => current.filter((_, i) => i !== index))}>Xóa câu {index + 1}</button>}
      </fieldset>)}
      <button type="button" className="min-h-11 inline-flex items-center justify-center rounded-xl bg-indigo-50 px-4 py-2 font-bold text-indigo-700 disabled:opacity-50" disabled={rounds.length >= 10} onClick={() => setRounds((current) => [...current, emptyRound()])}>+ Thêm câu</button>
      {error && <p role="alert" className="rounded-xl bg-rose-50 p-3 text-rose-700">{error}</p>}
      <div className="flex flex-wrap gap-2"><button type="button" className={button} onClick={save}>Lưu bộ câu</button><button type="button" className="min-h-11 inline-flex items-center justify-center rounded-xl bg-slate-100 px-4 py-2 font-bold" onClick={onCancel}>Hủy</button></div>
    </fieldset>
  </section>;
}

function Game({ game, onExit }: { game: FlyingWordsSet; onExit: () => void }) {
  const [index, setIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [selected, setSelected] = useState<number[]>([]);
  const [order, setOrder] = useState(() => shuffledWords(game.rounds[0].sentence));
  const [deadline, setDeadline] = useState(() => Date.now() + 30000);
  const [remaining, setRemaining] = useState(30);
  const [result, setResult] = useState<"correct" | "wrong" | "timeout" | "skipped" | null>(null);
  const [finished, setFinished] = useState(false);
  const round = game.rounds[index];
  const tokens = words(round.sentence);

  useEffect(() => {
    if (result || finished) return;
    const timer = window.setInterval(() => {
      const seconds = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
      setRemaining(seconds);
      if (seconds === 0) setResult("timeout");
    }, 100);
    return () => window.clearInterval(timer);
  }, [deadline, result, finished]);

  function startRound(nextIndex: number) {
    setIndex(nextIndex);
    setSelected([]);
    setOrder(shuffledWords(game.rounds[nextIndex].sentence));
    setDeadline(Date.now() + 30000);
    setRemaining(30);
    setResult(null);
  }
  function choose(wordIndex: number, now: number) {
    if (result || selected.includes(wordIndex)) return;
    if (now >= deadline) { setRemaining(0); setResult("timeout"); return; }
    const next = [...selected, wordIndex];
    setSelected(next);
    if (next.length === tokens.length) {
      if (isCorrectOrder(round.sentence, next)) { setScore((value) => value + 1); setResult("correct"); }
      else setResult("wrong");
    }
  }

  if (finished) return <section className="rounded-3xl bg-white p-6 text-center shadow-sm">
    <p className="text-5xl" aria-hidden="true">🎉</p><h2 className="mt-3 text-2xl font-extrabold text-indigo-800">Hoàn thành!</h2>
    <p className="my-4 text-lg font-bold">Con đã ghép đúng {score}/{game.rounds.length} câu.</p>
    <div className="flex flex-wrap justify-center gap-2"><button type="button" className={button} onClick={() => { setFinished(false); setScore(0); startRound(0); }}>Chơi lại</button><button type="button" className="min-h-11 inline-flex items-center justify-center rounded-xl bg-slate-100 px-4 py-2 font-bold" onClick={onExit}>Danh sách bộ câu</button></div>
  </section>;

  return <section className="space-y-4 rounded-3xl bg-white p-4 shadow-sm sm:p-6">
    <div className="flex flex-wrap items-center justify-between gap-2"><h2 className="text-2xl font-extrabold text-indigo-800">{game.title}</h2><button type="button" className="back-link" onClick={onExit}>← Danh sách bộ câu</button></div>
    <div className="flex flex-wrap justify-between gap-2 font-bold text-indigo-800"><span>Câu {index + 1}/{game.rounds.length} · Điểm: {score}</span><span aria-label={`Còn ${remaining} giây`}>⏱️ {remaining} giây</span></div>
    <p className="text-slate-700">{round.clue || "Chọn các từ theo đúng thứ tự để tạo thành câu hoàn chỉnh."}</p>
    <p className="text-sm text-slate-600">Chạm hoặc dùng bàn phím để chọn từ; chọn từ bên dưới để bỏ từ đó và các từ sau.</p>
    <div className="grid min-h-64 grid-cols-2 content-center gap-3 rounded-3xl bg-gradient-to-br from-amber-100 via-yellow-100 to-sky-100 p-4 sm:grid-cols-3" aria-label="Các từ đang bay">
      {order.map((wordIndex, i) => <div key={wordIndex} className="flex min-w-0 items-center justify-center">
        {!selected.includes(wordIndex) && <button type="button" onClick={() => choose(wordIndex, Date.now())} disabled={!!result} style={{ animationDelay: `${i * -0.5}s` }}
          className={`flying-word max-w-full break-words rounded-2xl px-4 py-3 text-lg font-extrabold text-white shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-800 disabled:opacity-60 ${colors[i % colors.length]}`}>{tokens[wordIndex]}</button>}
      </div>)}
    </div>
    <div className="min-h-16 rounded-2xl border-2 border-dashed border-indigo-300 bg-indigo-50 p-3" aria-label="Câu đang ghép">
      <div className="flex flex-wrap gap-2">{selected.map((wordIndex, i) => <button key={wordIndex} type="button" disabled={!!result} onClick={() => setSelected((current) => current.slice(0, i))} className="rounded-xl bg-white px-3 py-2 font-bold text-indigo-800 shadow-sm disabled:opacity-70" aria-label={`Bỏ ${tokens[wordIndex]} và các từ sau`}>{tokens[wordIndex]}</button>)}
        {!selected.length && <span className="text-slate-500">Chọn từ để bắt đầu...</span>}</div>
    </div>
    {result && <div role="status" className={`rounded-xl p-4 font-bold ${result === "correct" ? "bg-emerald-50 text-emerald-800" : "bg-amber-50 text-amber-900"}`}>
      {result === "correct" ? "🌟 Chính xác!" : result === "wrong" ? "Chưa đúng rồi, hãy thử lại nhé!" : result === "timeout" ? "Hết giờ rồi, hãy thử lại nhé!" : "Đã bỏ qua câu này."}
    </div>}
    <div className="flex flex-wrap gap-2">
      {result && result !== "correct" && <button type="button" className={button} onClick={() => startRound(index)}>Thử lại</button>}
      {!result && <button type="button" className="min-h-11 inline-flex items-center justify-center rounded-xl bg-slate-100 px-4 py-2 font-bold" onClick={() => setResult("skipped")}>Bỏ qua câu</button>}
      {result && <button type="button" className={button} onClick={() => index + 1 < game.rounds.length ? startRound(index + 1) : setFinished(true)}>{index + 1 < game.rounds.length ? "Câu tiếp theo →" : "Xem kết quả"}</button>}
    </div>
  </section>;
}

export default function FlyingWordsPage() {
  const [items, setItems] = useState<FlyingWordsSet[]>([]);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState<"new" | string | null>(null);
  const [playing, setPlaying] = useState<FlyingWordsSet | null>(null);

  useEffect(() => {
    let active = true;
    Promise.resolve().then(() => {
      try {
        const raw: unknown = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "[]");
        if (!Array.isArray(raw) || raw.length > 100) throw new Error();
        const parsed = raw.map(parseFlyingWordsSet);
        if (parsed.some((item) => typeof item === "string")) throw new Error();
        const valid = parsed.filter((item): item is FlyingWordsSet => typeof item !== "string");
        if (new Set([SAMPLE_FLYING_WORDS.id, ...valid.map((item) => item.id)]).size !== valid.length + 1) throw new Error();
        if (active) { setItems(valid); setReady(true); }
      } catch {
        if (active) setError("Không đọc được bộ câu đã lưu. Dữ liệu cũ được giữ nguyên; hãy kiểm tra dữ liệu và quyền lưu trữ.");
      }
    });
    return () => { active = false; };
  }, []);

  function write(next: FlyingWordsSet[]) {
    try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); }
    catch { throw new Error("Không lưu được bộ câu. Hãy kiểm tra dung lượng hoặc quyền lưu trữ của trình duyệt."); }
    setItems(next);
  }
  function save(value: FlyingWordsSet) {
    const exists = items.some((item) => item.id === value.id);
    if (!exists && items.length >= 100) throw new Error("Đã đạt giới hạn 100 bộ câu.");
    write(exists ? items.map((item) => item.id === value.id ? value : item) : [...items, value]);
    setEditing(null);
    setError("");
  }
  function remove(value: FlyingWordsSet) {
    if (!window.confirm(`Xóa bộ câu "${value.title}" trên trình duyệt này?`)) return;
    try { write(items.filter((item) => item.id !== value.id)); setError(""); }
    catch (e) { setError(e instanceof Error ? e.message : "Không xóa được bộ câu."); }
  }

  return <main className="mx-auto w-full max-w-4xl flex-1 p-4 sm:p-6">
    <Link href="/" className="back-link">← Trang chủ</Link>
    <header className="my-5 rounded-3xl bg-gradient-to-r from-sky-600 to-violet-600 p-6 text-white"><h1 className="text-3xl font-extrabold">🔤 Từ ngữ biết bay</h1><p className="mt-2">Bắt những từ đang bay và ghép thành câu nhé!</p></header>
    <p className="mb-4 text-sm text-slate-700">Mỗi câu có 30 giây. Bộ tự tạo chỉ lưu trên trình duyệt này, không đồng bộ giữa các thiết bị; tiến độ chơi không được lưu.</p>
    {error && <p role="alert" className="mb-4 rounded-xl bg-rose-50 p-3 text-rose-700">{error}</p>}
    {playing ? <Game key={playing.id} game={playing} onExit={() => setPlaying(null)} /> : <>
      {ready && !editing && <button type="button" className={`${button} mb-5`} onClick={() => setEditing("new")}>+ Tạo bộ câu</button>}
      {editing && <Editor key={editing} initial={editing === "new" ? undefined : items.find((item) => item.id === editing)} onSave={save} onCancel={() => setEditing(null)} />}
      <section aria-label="Danh sách bộ câu"><h2 className="mb-3 text-xl font-extrabold text-indigo-800">Danh sách bộ câu</h2>
        <ul className="grid gap-4 sm:grid-cols-2">{[SAMPLE_FLYING_WORDS, ...items].map((item) => <li key={item.id} className="rounded-2xl bg-white p-5 shadow-sm">
          <h3 className="text-lg font-extrabold text-slate-800">{item.title}</h3><p className="my-2 text-sm text-slate-600">{item.rounds.length} câu · {item.id === SAMPLE_FLYING_WORDS.id ? "Bài mẫu" : "Tự tạo"}</p>
          <div className="flex flex-wrap gap-2"><button type="button" className={button} onClick={() => { setEditing(null); setPlaying(item); }}>Chơi</button>
            {item.id !== SAMPLE_FLYING_WORDS.id && ready && <><button type="button" className="min-h-11 inline-flex items-center justify-center rounded-xl bg-indigo-50 px-4 py-2 font-bold text-indigo-700" onClick={() => setEditing(item.id)}>Sửa</button><button type="button" className="min-h-11 inline-flex items-center justify-center rounded-xl bg-rose-50 px-4 py-2 font-bold text-rose-700" onClick={() => remove(item)}>Xóa</button></>}
          </div>
        </li>)}</ul>
      </section>
    </>}
  </main>;
}
