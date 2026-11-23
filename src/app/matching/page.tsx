"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import QuestionImage from "@/components/QuestionImage";
import { connectPair, countCorrect, parseMatchingSet, SAMPLE_MATCHING, shuffleIndexes, type Connections, type MatchingPair, type MatchingSet } from "@/lib/matching";
import { fetchSets, newId } from "@/lib/storage";
import type { QuestionSet } from "@/lib/types";

const STORAGE_KEY = "team-quiz:matching-sets";
const button = "rounded-xl bg-indigo-600 px-4 py-2 font-bold text-white hover:bg-indigo-700 disabled:opacity-50";
const input = "w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900";
const colors = ["#2563eb", "#db2777", "#d97706", "#7c3aed", "#059669", "#e11d48", "#0891b2", "#9333ea"];
const emptyPair = (): MatchingPair => ({ left: "", right: "" });

function Editor({ initial, onSave, onCancel }: { initial?: MatchingSet; onSave: (value: MatchingSet) => void; onCancel: () => void }) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [pairs, setPairs] = useState<MatchingPair[]>(initial?.pairs ?? [emptyPair(), emptyPair()]);
  const [sets, setSets] = useState<QuestionSet[]>([]);
  const [setId, setSetId] = useState("");
  const [loadError, setLoadError] = useState("");
  const [message, setMessage] = useState("");
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

  function update(index: number, patch: Partial<MatchingPair>) {
    setPairs((current) => current.map((pair, i) => i === index ? { ...pair, ...patch } : pair));
  }

  function save() {
    const parsed = parseMatchingSet({ id: initial?.id ?? newId(), title, pairs });
    if (typeof parsed === "string") { setMessage(parsed); return; }
    try { onSave(parsed); } catch (error) { setMessage(error instanceof Error ? error.message : "Không lưu được bộ nối ý."); }
  }

  return <section aria-label="Soạn bộ nối ý" className="mb-6 space-y-4 rounded-3xl bg-white p-5 shadow-sm">
    <h2 className="text-xl font-extrabold text-indigo-800">{initial ? "✏️ Sửa bộ nối ý" : "✨ Tạo bộ nối ý"}</h2>
    <label className="block font-bold">Tên bộ nối ý<input className={input} value={title} maxLength={100} onChange={(e) => setTitle(e.target.value)} /></label>
    <label className="block font-bold">Chọn kho câu hỏi (tùy chọn)
      <select className={input} value={setId} onChange={(e) => setSetId(e.target.value)}>
        {!sets.length && <option value="">Không có bộ câu hỏi</option>}
        {sets.map((set) => <option key={set.id} value={set.id}>{set.title}</option>)}
      </select>
    </label>
    {loadError && <p role="status" className="text-amber-800">{loadError}</p>}
    <p className="text-sm text-slate-600">Nhập 2–8 cặp đúng. Mỗi ý trong cùng một cột phải khác nhau. Câu hỏi từ kho được sao chép và có thể chỉnh sửa.</p>
    {pairs.map((pair, index) => <fieldset key={index} className="space-y-3 rounded-2xl border-2 border-indigo-100 p-4">
      <legend className="px-2 font-extrabold text-indigo-700">Cặp {index + 1}</legend>
      {selectedSet && <label className="block text-sm font-bold">Sao chép câu hỏi từ kho
        <select className={input} value="" onChange={(e) => {
          if (!e.target.value) return;
          const question = selectedSet.questions[Number(e.target.value)];
          if (question) update(index, { left: question.prompt, right: question.answer, image: question.image });
        }}>
          <option value="">Chọn câu hỏi...</option>
          {selectedSet.questions.map((question, i) => <option key={`${question.id}-${i}`} value={i}>{question.prompt}</option>)}
        </select>
      </label>}
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block text-sm font-bold">Ý bên trái<textarea className={input} maxLength={1000} value={pair.left} onChange={(e) => update(index, { left: e.target.value })} /></label>
        <label className="block text-sm font-bold">Ý tương ứng bên phải<textarea className={input} maxLength={1000} value={pair.right} onChange={(e) => update(index, { right: e.target.value })} /></label>
      </div>
      {pair.image && <div><QuestionImage src={pair.image} alt={`Hình minh họa cặp ${index + 1}`} /><button type="button" className="mt-1 text-sm font-bold text-rose-700" onClick={() => update(index, { image: undefined })}>Xóa hình câu hỏi</button></div>}
      {pairs.length > 2 && <button type="button" className="font-bold text-rose-700" onClick={() => setPairs((current) => current.filter((_, i) => i !== index))}>Xóa cặp {index + 1}</button>}
    </fieldset>)}
    <button type="button" className="rounded-xl bg-indigo-50 px-4 py-2 font-bold text-indigo-700 disabled:opacity-50" disabled={pairs.length >= 8} onClick={() => setPairs((current) => [...current, emptyPair()])}>+ Thêm cặp</button>
    {message && <p role="alert" className="rounded-xl bg-rose-50 p-3 text-rose-700">{message}</p>}
    <div className="flex flex-wrap gap-2"><button type="button" className={button} onClick={save}>Lưu bộ nối ý</button><button type="button" className="rounded-xl bg-slate-100 px-4 py-2 font-bold" onClick={onCancel}>Hủy</button></div>
  </section>;
}

interface Line { left: number; x1: number; y1: number; x2: number; y2: number }

function Game({ game, onExit }: { game: MatchingSet; onExit: () => void }) {
  const [rightOrder, setRightOrder] = useState(() => shuffleIndexes(game.pairs.length));
  const [selected, setSelected] = useState<number | null>(null);
  const [connections, setConnections] = useState<Connections>({});
  const [checked, setChecked] = useState(false);
  const [lines, setLines] = useState<Line[]>([]);
  const board = useRef<HTMLDivElement>(null);
  const leftButtons = useRef<(HTMLButtonElement | null)[]>([]);
  const rightButtons = useRef<(HTMLButtonElement | null)[]>([]);
  const count = Object.keys(connections).length;

  useEffect(() => {
    const container = board.current;
    if (!container) return;
    let frame = 0;
    function measure() {
      if (!container) return;
      const bounds = container.getBoundingClientRect();
      const next: Line[] = [];
      for (const [left, right] of Object.entries(connections)) {
        const a = leftButtons.current[Number(left)]?.getBoundingClientRect();
        const b = rightButtons.current[right]?.getBoundingClientRect();
        if (a && b) next.push({ left: Number(left), x1: a.right - bounds.left, y1: a.top + a.height / 2 - bounds.top, x2: b.left - bounds.left, y2: b.top + b.height / 2 - bounds.top });
      }
      setLines(next);
    }
    const schedule = () => { cancelAnimationFrame(frame); frame = requestAnimationFrame(measure); };
    const observer = new ResizeObserver(schedule);
    observer.observe(container);
    for (const item of [...leftButtons.current, ...rightButtons.current]) if (item) observer.observe(item);
    window.addEventListener("resize", schedule);
    schedule();
    return () => { cancelAnimationFrame(frame); observer.disconnect(); window.removeEventListener("resize", schedule); };
  }, [connections, rightOrder, game]);

  function connect(left: number, right: number) {
    setConnections((current) => connectPair(current, left, right));
    setSelected(null);
    setChecked(false);
  }

  function reset() {
    setConnections({});
    setSelected(null);
    setChecked(false);
    setRightOrder(shuffleIndexes(game.pairs.length));
  }

  return <section className="space-y-4 rounded-3xl bg-white p-4 shadow-sm sm:p-6">
    <div className="flex flex-wrap items-center justify-between gap-2"><h2 className="text-2xl font-extrabold text-indigo-800">{game.title}</h2><button type="button" className="font-bold text-indigo-700" onClick={onExit}>← Danh sách bộ nối ý</button></div>
    <p className="text-slate-700">Kéo ý bên trái sang ý bên phải, hoặc chạm lần lượt hai ý để nối. Chọn lại để đổi cặp.</p>
    <p aria-live="polite" className="font-bold text-indigo-800">{count}/{game.pairs.length} cặp đã nối{selected !== null ? ` · Đã chọn ý trái ${selected + 1}` : ""}</p>
    <div ref={board} className="relative grid grid-cols-2 gap-10 sm:gap-16">
      <svg aria-hidden="true" className="pointer-events-none absolute inset-0 h-full w-full overflow-visible">
        {lines.map((line) => <line key={line.left} x1={line.x1} y1={line.y1} x2={line.x2} y2={line.y2} stroke={colors[line.left]} strokeWidth="3" />)}
      </svg>
      <div className="relative flex flex-col gap-3">
        {game.pairs.map((pair, index) => <div key={index} className="space-y-1">
          <button ref={(el) => { leftButtons.current[index] = el; }} type="button" draggable onDragStart={(e) => { e.dataTransfer.setData("text/x-team-quiz-matching", String(index)); e.dataTransfer.effectAllowed = "link"; setSelected(index); }}
            aria-pressed={selected === index} onClick={() => setSelected(selected === index ? null : index)}
            className={`min-h-16 w-full break-words rounded-xl border-2 p-3 text-left font-bold text-slate-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-700 ${selected === index ? "border-indigo-600 bg-indigo-100" : "border-sky-300 bg-sky-50"}`}>
            <span className="mr-2 inline-flex h-7 w-7 items-center justify-center rounded-full text-sm text-white" style={{ backgroundColor: colors[index] }}>{index + 1}</span>{pair.left}
            {connections[index] !== undefined && <span className="block text-xs font-normal">Đã nối với: {game.pairs[connections[index]].right}{checked ? (connections[index] === index ? " · Đúng" : " · Chưa đúng") : ""}</span>}
          </button>
          {pair.image && <QuestionImage src={pair.image} alt={`Hình minh họa ${pair.left}`} />}
        </div>)}
      </div>
      <div className="relative flex flex-col gap-3">
        {rightOrder.map((index) => {
          const owner = Object.entries(connections).find(([, right]) => right === index)?.[0];
          return <button key={index} ref={(el) => { rightButtons.current[index] = el; }} type="button"
            onDragOver={(e) => { if (e.dataTransfer.types.includes("text/x-team-quiz-matching")) { e.preventDefault(); e.dataTransfer.dropEffect = "link"; } }}
            onDrop={(e) => { e.preventDefault(); const raw = e.dataTransfer.getData("text/x-team-quiz-matching"); const left = Number(raw); if (raw !== "" && Number.isInteger(left) && left >= 0 && left < game.pairs.length) connect(left, index); }}
            onClick={() => { if (selected !== null) connect(selected, index); }}
            className="min-h-16 w-full break-words rounded-xl border-2 border-violet-300 bg-violet-50 p-3 text-left font-bold text-slate-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-700">
            {owner !== undefined && <span className="mr-2 inline-flex h-7 w-7 items-center justify-center rounded-full text-sm text-white" style={{ backgroundColor: colors[Number(owner)] }}>{Number(owner) + 1}</span>}
            {game.pairs[index].right}{owner !== undefined && <span className="block text-xs font-normal">Đã nối với ý trái {Number(owner) + 1}</span>}
          </button>;
        })}
      </div>
    </div>
    <div className="flex flex-wrap gap-2">
      <button type="button" className={button} disabled={count === 0} onClick={() => { setSelected(null); setChecked(true); }}>Kiểm tra</button>
      <button type="button" className="rounded-xl bg-slate-100 px-4 py-2 font-bold text-slate-700" onClick={reset}>Chơi lại</button>
      <button type="button" className="rounded-xl bg-rose-50 px-4 py-2 font-bold text-rose-700 disabled:opacity-50" disabled={selected === null || connections[selected] === undefined} onClick={() => {
        if (selected === null) return;
        setConnections((current) => { const next = { ...current }; delete next[selected]; return next; });
        setSelected(null);
        setChecked(false);
      }}>Bỏ nối ý đã chọn</button>
    </div>
    {checked && <p role="status" className="rounded-xl bg-amber-50 p-4 font-bold text-amber-900">🌟 Đúng {countCorrect(connections)}/{game.pairs.length} cặp. {count < game.pairs.length ? `Còn ${game.pairs.length - count} cặp chưa nối.` : countCorrect(connections) === game.pairs.length ? "Tuyệt vời!" : "Hãy đổi các cặp chưa đúng rồi kiểm tra lại nhé!"}</p>}
  </section>;
}

export default function MatchingPage() {
  const [items, setItems] = useState<MatchingSet[]>([]);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState<"new" | string | null>(null);
  const [playing, setPlaying] = useState<MatchingSet | null>(null);

  useEffect(() => {
    let active = true;
    Promise.resolve().then(() => {
      try {
        const raw: unknown = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "[]");
        if (!Array.isArray(raw) || raw.length > 100) throw new Error();
        const parsed = raw.map(parseMatchingSet);
        if (parsed.some((item) => typeof item === "string")) throw new Error();
        const valid = parsed.filter((item): item is MatchingSet => typeof item !== "string");
        if (new Set([SAMPLE_MATCHING.id, ...valid.map((item) => item.id)]).size !== valid.length + 1) throw new Error();
        if (active) { setItems(valid); setReady(true); }
      } catch {
        if (active) setError("Không đọc được bộ nối ý đã lưu. Dữ liệu cũ được giữ nguyên; hãy kiểm tra dữ liệu và quyền lưu trữ.");
      }
    });
    return () => { active = false; };
  }, []);

  function write(next: MatchingSet[]) {
    try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); }
    catch { throw new Error("Không lưu được bộ nối ý. Hãy kiểm tra dung lượng hoặc quyền lưu trữ của trình duyệt."); }
    setItems(next);
  }
  function save(value: MatchingSet) {
    const exists = items.some((item) => item.id === value.id);
    if (!exists && items.length >= 100) throw new Error("Đã đạt giới hạn 100 bộ nối ý.");
    write(exists ? items.map((item) => item.id === value.id ? value : item) : [...items, value]);
    setEditing(null);
    setError("");
  }
  function remove(value: MatchingSet) {
    if (!window.confirm(`Xóa bộ nối ý "${value.title}" trên trình duyệt này?`)) return;
    try { write(items.filter((item) => item.id !== value.id)); setError(""); }
    catch (e) { setError(e instanceof Error ? e.message : "Không xóa được bộ nối ý."); }
  }

  return <main className="mx-auto w-full max-w-4xl flex-1 p-4 sm:p-6">
    <Link href="/" className="font-bold text-indigo-700">← Về trang chủ</Link>
    <header className="my-5 rounded-3xl bg-gradient-to-r from-indigo-600 to-violet-600 p-6 text-white"><h1 className="text-3xl font-extrabold">🧷 Kéo thả nối ý</h1><p className="mt-2">Tìm những ý phù hợp và nối chúng lại với nhau nhé!</p></header>
    <p className="mb-4 text-sm text-slate-700">Bộ tự tạo chỉ lưu trên trình duyệt này, không đồng bộ giữa các thiết bị. Tiến độ chơi không được lưu.</p>
    {error && <p role="alert" className="mb-4 rounded-xl bg-rose-50 p-3 text-rose-700">{error}</p>}
    {playing ? <Game key={playing.id} game={playing} onExit={() => setPlaying(null)} /> : <>
      {ready && !editing && <button type="button" className={`${button} mb-5`} onClick={() => setEditing("new")}>+ Tạo bộ nối ý</button>}
      {editing && <Editor key={editing} initial={editing === "new" ? undefined : items.find((item) => item.id === editing)} onSave={save} onCancel={() => setEditing(null)} />}
      <section aria-label="Danh sách bộ nối ý"><h2 className="mb-3 text-xl font-extrabold text-indigo-800">Danh sách bộ nối ý</h2>
        <ul className="grid gap-4 sm:grid-cols-2">{[SAMPLE_MATCHING, ...items].map((item) => <li key={item.id} className="rounded-2xl bg-white p-5 shadow-sm">
          <h3 className="text-lg font-extrabold text-slate-800">{item.title}</h3><p className="my-2 text-sm text-slate-600">{item.pairs.length} cặp · {item.id === SAMPLE_MATCHING.id ? "Bài mẫu" : "Tự tạo"}</p>
          <div className="flex flex-wrap gap-2"><button type="button" className={button} onClick={() => { setEditing(null); setPlaying(item); }}>Chơi</button>
            {item.id !== SAMPLE_MATCHING.id && ready && <><button type="button" className="rounded-xl bg-indigo-50 px-4 py-2 font-bold text-indigo-700" onClick={() => setEditing(item.id)}>Sửa</button><button type="button" className="rounded-xl bg-rose-50 px-4 py-2 font-bold text-rose-700" onClick={() => remove(item)}>Xóa</button></>}
          </div>
        </li>)}</ul>
      </section>
    </>}
  </main>;
}
