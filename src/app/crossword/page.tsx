"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import QuestionImage from "@/components/QuestionImage";
import GameAiGenerator from "@/components/GameAiGenerator";
import { normalizeWord, parseCrossword, SAMPLE_CROSSWORD, type Crossword, type CrosswordRow } from "@/lib/crossword";
import { fetchSets, newId } from "@/lib/storage";
import type { QuestionSet } from "@/lib/types";

const STORAGE_KEY = "team-quiz:crosswords";
const button = "inline-flex min-h-11 items-center justify-center rounded-xl bg-indigo-600 px-4 py-2 font-bold text-white hover:bg-indigo-700 disabled:opacity-50";
const input = "w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900";
const emptyRow = (): CrosswordRow => ({ clue: "", answer: "", position: -1 });

function Editor({ initial, onSave, onCancel }: { initial?: Crossword; onSave: (crossword: Crossword) => void; onCancel: () => void }) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [keyword, setKeyword] = useState(initial?.keyword ?? "");
  const [rows, setRows] = useState<CrosswordRow[]>(() => Array.from({ length: 12 }, (_, i) => initial?.rows[i] ?? emptyRow()));
  const [sets, setSets] = useState<QuestionSet[]>([]);
  const [setId, setSetId] = useState("");
  const [message, setMessage] = useState("");
  const [loadError, setLoadError] = useState("");
  const [busy, setBusy] = useState(false);
  const word = normalizeWord(keyword);
  const selectedSet = sets.find((set) => set.id === setId);

  useEffect(() => {
    let active = true;
    fetchSets().then((result) => {
      if (!active) return;
      setSets(result.sets);
      setSetId(result.sets[0]?.id ?? "");
      setLoadError(result.error ?? "");
    }).catch(() => { if (active) setLoadError("Không tải được kho câu hỏi. Bạn vẫn có thể tự nhập."); });
    return () => { active = false; };
  }, []);

  function updateRow(index: number, patch: Partial<CrosswordRow>) {
    setRows((current) => current.map((row, i) => i === index ? { ...row, ...patch } : row));
  }

  function save() {
    const parsed = parseCrossword({ id: initial?.id ?? newId(), title, keyword, rows: rows.slice(0, word.length) });
    if (typeof parsed === "string") { setMessage(parsed); return; }
    try { onSave(parsed); } catch (error) { setMessage(error instanceof Error ? error.message : "Không lưu được ô chữ."); }
  }

  return <section className="mb-6 space-y-4 rounded-3xl bg-white p-5 shadow-sm" aria-label="Soạn ô chữ">
    <h2 className="text-xl font-extrabold text-indigo-800">{initial ? "✏️ Sửa ô chữ" : "✨ Tạo ô chữ mới"}</h2>
    <fieldset disabled={busy} className="space-y-4 disabled:opacity-60">
    <label className="block font-bold">Tên ô chữ<input className={input} value={title} maxLength={100} onChange={(e) => setTitle(e.target.value)} /></label>
    <label className="block font-bold">Từ khóa bí mật<input className={input} value={keyword} maxLength={80} onChange={(e) => setKeyword(e.target.value)} placeholder="Ví dụ: HOA" /></label>
    <p className="text-sm text-slate-600">Từ khóa có 2–12 chữ cái; bỏ dấu, khoảng trắng và dấu gạch nối khi xếp ô. Mỗi chữ tạo một hàng ngang. Đổi độ dài từ khóa có thể bỏ các hàng cuối khi lưu.</p>
    <GameAiGenerator kind="crossword" keyword={keyword} busy={busy} setBusy={setBusy} hasContent={rows.some((row) => row.clue.trim() || row.answer.trim() || row.image)} onApply={(data, topic) => {
      const parsed = parseCrossword({ id: "ai", title: "AI", keyword, rows: data && typeof data === "object" && "rows" in data ? data.rows : null });
      if (typeof parsed === "string") throw new Error("AI tạo ô chữ chưa hợp lệ. Hãy thử lại.");
      setRows(Array.from({ length: 12 }, (_, i) => parsed.rows[i] ?? emptyRow()));
      if (!title.trim()) setTitle(topic.slice(0, 100));
      setMessage("");
    }} />
    <label className="block font-bold">Lấy câu hỏi từ bộ có sẵn (tùy chọn)
      <select className={input} value={setId} onChange={(e) => setSetId(e.target.value)}>
        {!sets.length && <option value="">Không có bộ câu hỏi</option>}
        {sets.map((set) => <option key={set.id} value={set.id}>{set.title}</option>)}
      </select>
    </label>
    {loadError && <p role="status" className="text-amber-800">{loadError}</p>}
    {Array.from(word.slice(0, 12)).map((letter, index) => {
      const row = rows[index];
      const answer = normalizeWord(row.answer);
      return <fieldset key={index} className="space-y-3 rounded-2xl border-2 border-indigo-100 p-4">
        <legend className="px-2 font-extrabold text-indigo-700">Hàng {index + 1} · Chữ khóa {letter}</legend>
        {selectedSet && <label className="block text-sm font-bold">Sao chép câu hỏi từ kho
          <select className={input} value="" onChange={(e) => {
            const question = selectedSet.questions[Number(e.target.value)];
            if (e.target.value === "" || !question) return;
            updateRow(index, { clue: question.prompt, answer: question.answer, position: normalizeWord(question.answer).indexOf(letter), image: question.image });
          }}>
            <option value="">Chọn câu hỏi...</option>
            {selectedSet.questions.map((question, i) => <option key={`${question.id}-${i}`} value={i}>{question.prompt}</option>)}
          </select>
        </label>}
        <label className="block text-sm font-bold">Câu gợi ý<textarea className={input} value={row.clue} maxLength={1000} onChange={(e) => updateRow(index, { clue: e.target.value })} /></label>
        {row.image && <div><QuestionImage src={row.image} alt={`Hình minh họa hàng ${index + 1}`} /><button type="button" className="mt-1 text-sm font-bold text-rose-700" onClick={() => updateRow(index, { image: undefined })}>Xóa hình câu hỏi</button></div>}
        <label className="block text-sm font-bold">Đáp án chữ cái<input className={input} value={row.answer} maxLength={100} onChange={(e) => updateRow(index, { answer: e.target.value, position: -1 })} /></label>
        <label className="block text-sm font-bold">Chọn vị trí chữ {letter} trong đáp án
          <select className={input} value={row.position} onChange={(e) => updateRow(index, { position: Number(e.target.value) })}>
            <option value={-1}>Chọn vị trí...</option>
            {Array.from(answer).map((char, pos) => char === letter ? <option key={pos} value={pos}>Ô {pos + 1}: {char}</option> : null)}
          </select>
        </label>
        <p className="text-xs text-slate-600">Chỉ dùng đáp án gồm chữ cái, tối đa 20 ô; chỉnh lại đáp án từ kho nếu cần.</p>
      </fieldset>;
    })}
    {message && <p role="alert" className="rounded-xl bg-rose-50 p-3 text-rose-700">{message}</p>}
    <div className="flex flex-wrap gap-2"><button type="button" className={button} onClick={save}>Lưu ô chữ</button><button type="button" className="min-h-11 inline-flex items-center justify-center rounded-xl bg-slate-100 px-4 py-2 font-bold" onClick={onCancel}>Hủy</button></div>
    </fieldset>
  </section>;
}

function Game({ puzzle, onExit }: { puzzle: Crossword; onExit: () => void }) {
  const [opened, setOpened] = useState<number[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [guess, setGuess] = useState("");
  const [keywordGuess, setKeywordGuess] = useState("");
  const [keywordOpen, setKeywordOpen] = useState(false);
  const [message, setMessage] = useState("");
  const offset = Math.max(...puzzle.rows.map((row) => row.position));
  const selectedRow = selected === null ? null : puzzle.rows[selected];

  function openRow(index: number) {
    setOpened((current) => current.includes(index) ? current : [...current, index]);
    setMessage("");
    setGuess("");
  }

  return <section className="space-y-5 rounded-3xl bg-white p-5 shadow-sm">
    <div className="flex flex-wrap items-center justify-between gap-2"><h2 className="text-2xl font-extrabold text-indigo-800">{puzzle.title}</h2><button type="button" className="back-link" onClick={onExit}>← Danh sách ô chữ</button></div>
    <p className="text-slate-600">Chọn hàng, trả lời câu hỏi và khám phá các chữ màu vàng để tìm từ khóa!</p>
    <div className="overflow-x-auto rounded-2xl bg-indigo-50 p-3">
      <div className="w-max space-y-2">
        {puzzle.rows.map((row, index) => <div key={index} className="flex items-center gap-1">
          <button type="button" aria-label={`Chọn hàng ${index + 1}`} aria-pressed={selected === index} onClick={() => { setSelected(index); setGuess(""); setMessage(""); }} className={`mr-1 h-9 w-9 rounded-lg font-bold ${selected === index ? "bg-indigo-700 text-white" : "bg-white text-indigo-700"}`}>{index + 1}</button>
          {Array.from({ length: offset - row.position }, (_, i) => <span key={`space-${i}`} className="h-9 w-9" />)}
          {Array.from(row.answer).map((letter, i) => <span key={i} aria-hidden="true" className={`flex h-9 w-9 items-center justify-center rounded-lg border-2 text-lg font-extrabold ${i === row.position ? "border-amber-400 bg-amber-200 text-amber-900" : "border-indigo-200 bg-white text-indigo-800"}`}>{opened.includes(index) ? letter : ""}</span>)}
          <span className="sr-only">{opened.includes(index) ? `Đã mở: ${row.answer}` : `${row.answer.length} ô chưa mở`}</span>
        </div>)}
      </div>
    </div>
    {selectedRow && selected !== null && <div className="space-y-3 rounded-2xl bg-sky-50 p-4">
      <h3 className="font-extrabold text-sky-900">Hàng {selected + 1}: {selectedRow.clue}</h3>
      {selectedRow.image && <QuestionImage src={selectedRow.image} alt={`Hình minh họa hàng ${selected + 1}`} />}
      {opened.includes(selected) ? <p className="font-bold text-emerald-700">Đáp án: {selectedRow.answer}</p> : <>
        <form className="flex flex-wrap gap-2" onSubmit={(e) => { e.preventDefault(); if (normalizeWord(guess) === selectedRow.answer) openRow(selected); else setMessage("Chưa đúng rồi, thử lại nhé!"); }}>
          <label className="sr-only" htmlFor="row-guess">Đáp án hàng {selected + 1}</label><input id="row-guess" className={`${input} max-w-xs`} value={guess} onChange={(e) => setGuess(e.target.value)} placeholder="Nhập đáp án" />
          <button className={button}>Trả lời</button>
          <button type="button" className="min-h-11 inline-flex items-center justify-center rounded-xl bg-amber-200 px-4 py-2 font-bold text-amber-900" onClick={() => openRow(selected)}>Mở đáp án</button>
        </form>
      </>}
    </div>}
    {message && <p role="status" className="font-bold text-rose-700">{message}</p>}
    <div className="space-y-3 rounded-2xl bg-amber-50 p-4">
      <h3 className="font-extrabold text-amber-900">🔑 Từ khóa bí mật</h3>
      <p className="flex flex-wrap gap-1" aria-label={keywordOpen ? `Từ khóa: ${puzzle.keyword}` : "Các chữ khóa đã mở"}>{Array.from(puzzle.keyword).map((letter, i) => <span key={i} className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-200 text-xl font-extrabold text-amber-900">{keywordOpen || opened.includes(i) ? letter : "?"}</span>)}</p>
      {!keywordOpen && <form className="flex flex-wrap gap-2" onSubmit={(e) => { e.preventDefault(); if (normalizeWord(keywordGuess) === puzzle.keyword) { setKeywordOpen(true); setMessage("Giỏi lắm! Bạn đã tìm ra từ khóa!"); } else setMessage("Từ khóa chưa đúng, thử lại nhé!"); }}>
        <label className="sr-only" htmlFor="keyword-guess">Đoán từ khóa</label><input id="keyword-guess" className={`${input} max-w-xs`} value={keywordGuess} onChange={(e) => setKeywordGuess(e.target.value)} placeholder="Đoán từ khóa" />
        <button className={button}>Đoán từ khóa</button><button type="button" className="min-h-11 inline-flex items-center justify-center rounded-xl bg-amber-300 px-4 py-2 font-bold text-amber-950" onClick={() => { setKeywordOpen(true); setMessage(""); }}>Mở từ khóa</button>
      </form>}
    </div>
  </section>;
}

export default function CrosswordPage() {
  const [items, setItems] = useState<Crossword[]>([]);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState<"new" | string | null>(null);
  const [playing, setPlaying] = useState<Crossword | null>(null);

  useEffect(() => {
    let active = true;
    Promise.resolve().then(() => {
      try {
        const raw: unknown = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "[]");
        if (!Array.isArray(raw) || raw.length > 100) throw new Error();
        const parsed = raw.map(parseCrossword);
        if (parsed.some((item) => typeof item === "string")) throw new Error();
        const valid = parsed.filter((item): item is Crossword => typeof item !== "string");
        if (new Set([SAMPLE_CROSSWORD.id, ...valid.map((item) => item.id)]).size !== valid.length + 1) throw new Error();
        if (active) { setItems(valid); setReady(true); }
      } catch {
        if (active) setError("Không đọc được ô chữ đã lưu. Dữ liệu cũ được giữ nguyên; hãy kiểm tra dữ liệu và quyền lưu trữ.");
      }
    });
    return () => { active = false; };
  }, []);

  function write(next: Crossword[]) {
    try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); }
    catch { throw new Error("Không lưu được ô chữ. Hãy kiểm tra dung lượng hoặc quyền lưu trữ của trình duyệt."); }
    setItems(next);
  }

  function save(puzzle: Crossword) {
    const exists = items.some((item) => item.id === puzzle.id);
    if (!exists && items.length >= 100) throw new Error("Đã đạt giới hạn 100 ô chữ.");
    write(exists ? items.map((item) => item.id === puzzle.id ? puzzle : item) : [...items, puzzle]);
    setEditing(null);
    setError("");
  }

  function remove(puzzle: Crossword) {
    if (!window.confirm(`Xóa ô chữ "${puzzle.title}" trên trình duyệt này?`)) return;
    try { write(items.filter((item) => item.id !== puzzle.id)); setError(""); }
    catch (e) { setError(e instanceof Error ? e.message : "Không xóa được ô chữ."); }
  }

  return <main className="mx-auto w-full max-w-4xl flex-1 p-4 sm:p-6">
    <Link href="/" className="back-link">← Trang chủ</Link>
    <header className="my-5 rounded-3xl bg-gradient-to-r from-indigo-600 to-violet-600 p-6 text-white"><h1 className="text-3xl font-extrabold">🔠 Ô chữ khóa bí mật</h1><p className="mt-2">Cùng giải ô chữ và khám phá từ khóa nhé!</p></header>
    <p className="mb-4 text-sm text-slate-700">Ô chữ tự tạo chỉ lưu trên trình duyệt này, không đồng bộ giữa các thiết bị. Tiến độ chơi không được lưu.</p>
    {error && <p role="alert" className="mb-4 rounded-xl bg-rose-50 p-3 text-rose-700">{error}</p>}
    {playing ? <Game key={playing.id} puzzle={playing} onExit={() => setPlaying(null)} /> : <>
      {ready && !editing && <button type="button" className={`${button} mb-5`} onClick={() => setEditing("new")}>+ Tạo ô chữ mới</button>}
      {editing && <Editor key={editing} initial={editing === "new" ? undefined : items.find((item) => item.id === editing)} onSave={save} onCancel={() => setEditing(null)} />}
      <section aria-label="Danh sách ô chữ"><h2 className="mb-3 text-xl font-extrabold text-indigo-800">Danh sách ô chữ</h2>
        <ul className="grid gap-4 sm:grid-cols-2">{[SAMPLE_CROSSWORD, ...items].map((puzzle) => <li key={puzzle.id} className="rounded-2xl bg-white p-5 shadow-sm">
          <h3 className="text-lg font-extrabold text-slate-800">{puzzle.title}</h3><p className="my-2 text-sm text-slate-600">{puzzle.rows.length} hàng · {puzzle.id === SAMPLE_CROSSWORD.id ? "Bài mẫu" : "Tự tạo"}</p>
          <div className="flex flex-wrap gap-2"><button type="button" className={button} onClick={() => { setEditing(null); setPlaying(puzzle); }}>Chơi</button>
            {puzzle.id !== SAMPLE_CROSSWORD.id && ready && <><button type="button" className="min-h-11 inline-flex items-center justify-center rounded-xl bg-indigo-50 px-4 py-2 font-bold text-indigo-700" onClick={() => setEditing(puzzle.id)}>Sửa</button><button type="button" className="min-h-11 inline-flex items-center justify-center rounded-xl bg-rose-50 px-4 py-2 font-bold text-rose-700" onClick={() => remove(puzzle)}>Xóa</button></>}
          </div>
        </li>)}</ul>
      </section>
    </>}
  </main>;
}
