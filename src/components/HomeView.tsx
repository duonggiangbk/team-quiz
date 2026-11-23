"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { CATEGORIES } from "@/lib/builtinSets";
import { GAME_CATALOG } from "@/lib/gameCatalog";
import { deleteSet, fetchSets, loadGame, saveGame } from "@/lib/storage";
import type { GameState, QuestionSet } from "@/lib/types";

const ALL = "Tất cả";
const MINE = "Của tôi";

const FEATURES = [
  { id: "games", label: "Trò chơi", icon: "🎮" },
  { id: "questions", label: "Kho câu hỏi", icon: "📚" },
  { id: "assignments", label: "Bài đã giao", icon: "📋" },
  { id: "ai", label: "Công cụ AI", icon: "✨" },
  { id: "flashcards", label: "Flashcard tiếng Anh", icon: "🃏" },
  { id: "community", label: "Cộng đồng", icon: "🤝" },
  { id: "utilities", label: "Tiện ích dạy học", icon: "🧰" },
  { id: "simulations", label: "Mô phỏng bài học", icon: "🎨" },
  { id: "courses", label: "Khóa học", icon: "🎓" },
] as const;
type Feature = (typeof FEATURES)[number]["id"];
const UPCOMING_FEATURES = new Set<Feature>(["community", "utilities", "simulations", "courses"]);

const GAME_ACTIONS: Record<string, { href: string; label: string }> = {
  tile: { href: "", label: "Chọn bộ câu hỏi" },
  zombies: { href: "/zombies", label: "Chơi chặn zombie" },
  "flying-words": { href: "/flying-words", label: "Chơi ghép câu" },
  matching: { href: "/matching", label: "Chơi nối ý" },
  crossword: { href: "/crossword", label: "Chơi ô chữ" },
  flashcards: { href: "/flashcards", label: "Bắt đầu học" },
};
const PLAYABLE_GAMES = GAME_CATALOG.filter((item) => item.status in GAME_ACTIONS);
const UPCOMING_GAMES = GAME_CATALOG.filter((item) => !(item.status in GAME_ACTIONS));

function normalize(text: string) {
  return text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/gi, "d").toLowerCase();
}

export default function HomeView() {
  const [sets, setSets] = useState<QuestionSet[]>([]);
  const [sharedIds, setSharedIds] = useState<Set<string>>(() => new Set());
  const [cloud, setCloud] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [game, setGame] = useState<GameState | null>(() => loadGame());
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState(ALL);
  const [feature, setFeature] = useState<Feature>("games");
  const [gameSelected, setGameSelected] = useState(false);

  const shown = useMemo(() => {
    const q = normalize(query.trim());
    return sets.filter((s) => {
      if (category === MINE ? s.category : category !== ALL && s.category !== category) return false;
      return !q || normalize(`${s.title} ${s.description}`).includes(q);
    });
  }, [sets, query, category]);

  useEffect(() => {
    let cancelled = false;
    fetchSets().then((result) => {
      if (cancelled) return;
      setSets(result.sets);
      setSharedIds(result.sharedIds);
      setCloud(result.cloud);
      setError(result.error ?? "");
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  async function remove(id: string) {
    const set = sets.find((s) => s.id === id);
    if (!set) return;
    const warning = sharedIds.has(id) ? " Bộ này sẽ bị xóa cho mọi người." : "";
    if (!window.confirm(`Xóa bộ câu hỏi "${set.title}"?${warning}`)) return;
    try {
      await deleteSet(id, sharedIds.has(id));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Không xóa được bộ câu hỏi.");
      return;
    }
    setError("");
    setSets((prev) => prev.filter((s) => s.id !== id));
    if (game?.setId === id) {
      saveGame(null);
      setGame(null);
    }
  }

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 p-4 sm:p-6">
      <header className="mb-8 rounded-3xl border-4 border-white bg-gradient-to-r from-sky-100 via-indigo-100 to-pink-100 p-6 text-center shadow-sm">
        <p className="mb-2 text-3xl" aria-hidden="true">🌟 🎈 🧩</p>
        <h1 className="text-4xl font-extrabold text-indigo-800 sm:text-5xl">Team Quiz – Vui học mỗi ngày</h1>
        <p className="mt-2 text-lg font-semibold text-indigo-700">Cùng khám phá trò chơi, thẻ học và những điều mới nhé!</p>
      </header>
      <nav aria-label="Nhóm tính năng" className="mb-6 flex flex-wrap gap-2 rounded-2xl bg-white p-3 shadow-sm">
        {FEATURES.map((item) => (
          <button key={item.id} type="button" aria-pressed={feature === item.id} onClick={() => { setFeature(item.id); setGameSelected(false); }}
            className={`rounded-xl px-4 py-3 text-left text-sm font-bold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 ${
              feature === item.id ? "bg-indigo-600 text-white" : "text-slate-700 hover:bg-indigo-50"
            }`}>
            <span aria-hidden="true">{item.icon} </span>{item.label}
            {UPCOMING_FEATURES.has(item.id) && <span className={`ml-1 rounded-full px-1.5 py-0.5 text-[10px] font-bold ${feature === item.id ? "bg-white/25" : "bg-slate-100 text-slate-500"}`}>Sắp có</span>}
          </button>
        ))}
      </nav>

      {feature === "games" && !gameSelected && <section aria-label="Danh sách trò chơi">
        <div className="mb-4">
          <h2 className="text-2xl font-extrabold text-indigo-800">🎮 Trò chơi học tập</h2>
          <p className="mt-1 text-slate-600">Chọn một trò chơi để cả lớp cùng học và ghi điểm nhé!</p>
        </div>
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {PLAYABLE_GAMES.map((item) => {
            const action = GAME_ACTIONS[item.status];
            const className = "mt-4 inline-flex min-h-11 items-center self-start rounded-xl bg-indigo-600 px-5 font-bold text-white shadow-sm transition hover:bg-indigo-700 active:scale-95";
            return (
              <li key={item.id} className="flex flex-col rounded-3xl border-2 border-indigo-100 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-indigo-300 hover:shadow-md">
                <span className="mb-3 text-5xl" aria-hidden="true">{item.icon}</span>
                <h3 className="text-xl font-extrabold text-slate-800">{item.title}</h3>
                <p className="mt-1 flex-1 text-slate-600">{item.description}</p>
                {item.status === "tile" ? (
                  <button type="button" onClick={() => setGameSelected(true)} className={className}>{action.label} →</button>
                ) : (
                  <Link href={action.href} className={className}>{action.label} →</Link>
                )}
              </li>
            );
          })}
        </ul>
        {UPCOMING_GAMES.length > 0 && <>
          <h3 className="mb-3 mt-10 text-xl font-extrabold text-slate-700">🚧 Sắp ra mắt</h3>
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {UPCOMING_GAMES.map((item) => (
              <li key={item.id} className="flex items-start gap-3 rounded-2xl bg-white/70 p-4 text-slate-500">
                <span className="text-3xl opacity-70" aria-hidden="true">{item.icon}</span>
                <div className="min-w-0">
                  <p className="font-bold text-slate-700">{item.title}</p>
                  <span className="mt-1 inline-block rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold">Sắp có</span>
                </div>
              </li>
            ))}
          </ul>
        </>}
      </section>}

      {(feature === "questions" || (feature === "games" && gameSelected)) && <section aria-label={feature === "games" ? "Chọn bộ câu hỏi cho Ô Số Đồng Đội" : "Kho câu hỏi"}>
      {feature === "games" && <div className="mb-5">
        <button type="button" onClick={() => setGameSelected(false)} className="back-link">← Danh sách trò chơi</button>
        <h2 className="mt-3 text-2xl font-extrabold text-indigo-800">🧩 Ô Số Đồng Đội</h2>
        <p className="mt-1 text-slate-600">Chọn bộ câu hỏi để bắt đầu chơi cùng các đội.</p>
      </div>}
      {game && (
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-amber-100 p-4">
          <span className="font-semibold text-amber-900">
            Có ván đang chơi dở: <b>{game.setTitle}</b> ({game.tiles.filter((t) => t.used).length}/{game.tiles.length} ô)
          </span>
          <div className="flex gap-2">
            <Link
              href={`/play?set=${encodeURIComponent(game.setId)}&resume=1`}
              className="inline-flex min-h-11 items-center rounded-xl bg-amber-500 px-4 font-bold text-white hover:bg-amber-600"
            >
              Tiếp tục
            </Link>
            <button
              type="button"
              onClick={() => {
                saveGame(null);
                setGame(null);
              }}
              className="min-h-11 rounded-xl bg-white px-4 font-semibold text-amber-900 hover:bg-amber-50"
            >
              Bỏ ván
            </button>
          </div>
        </div>
      )}

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-2xl font-bold">
          Bộ câu hỏi <span className="text-base font-semibold text-slate-500">({shown.length}/{sets.length})</span>
        </h2>
        <Link href="/edit" className="inline-flex min-h-11 items-center rounded-xl bg-indigo-600 px-4 font-bold text-white hover:bg-indigo-700">
          + Tạo bộ mới
        </Link>
      </div>
      {!loading && (
        <p className="-mt-2 mb-3 text-sm text-slate-500">
          {cloud ? "☁️ Đang dùng cơ sở dữ liệu chung – bộ bạn tạo hiện trên mọi máy." : "💾 Lưu trên trình duyệt này."}
        </p>
      )}
      {error && <p className="mb-3 rounded-xl bg-rose-50 p-3 text-sm font-semibold text-rose-700">{error}</p>}

      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="🔍 Tìm bộ câu hỏi…"
        aria-label="Tìm bộ câu hỏi"
        className="mb-3 w-full rounded-xl border-2 border-slate-200 bg-white px-4 py-3 text-lg focus:border-indigo-400"
      />
      <div className="mb-5 flex flex-wrap gap-2">
        {[ALL, ...CATEGORIES, MINE].map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setCategory(c)}
            aria-pressed={category === c}
            className={`min-h-10 rounded-full px-4 text-sm font-semibold ${
              category === c ? "bg-indigo-600 text-white" : "bg-white text-indigo-700 hover:bg-indigo-50"
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      {shown.length === 0 ? (
        <p className="rounded-2xl bg-white p-6 text-center text-slate-500">
          {loading ? "Đang tải…" : sets.length === 0 ? "Chưa có bộ câu hỏi nào. Hãy tạo bộ mới!" : "Không tìm thấy bộ câu hỏi phù hợp."}
        </p>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2">
          {shown.map((set) => (
            <li key={set.id} className="flex flex-col rounded-2xl bg-white p-5 shadow">
              {(set.category || sharedIds.has(set.id)) && (
                <div className="mb-1 flex flex-wrap gap-1">
                  {set.category && (
                    <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-semibold text-indigo-600">
                      {set.category}
                    </span>
                  )}
                  {sharedIds.has(set.id) && (
                    <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700">
                      ☁️ Chia sẻ
                    </span>
                  )}
                </div>
              )}
              <h3 className="text-xl font-bold text-slate-800">{set.title || "(Chưa đặt tên)"}</h3>
              {set.description && <p className="mt-1 text-sm text-slate-500">{set.description}</p>}
              <p className="mt-auto pt-2 text-sm font-semibold text-indigo-500">
                {set.questions.filter((q) => q.prompt.trim()).length} câu hỏi
                {set.questions.some((q) => q.image) && " · 🖼️ Có hình ảnh"}
              </p>
              <div className="mt-4 flex gap-2">
                <Link
                  href={`/play?set=${encodeURIComponent(set.id)}`}
                  className="inline-flex min-h-11 flex-1 items-center justify-center rounded-xl bg-emerald-500 font-bold text-white hover:bg-emerald-600"
                >
                  ▶ Chơi
                </Link>
                <Link
                  href={`/edit?id=${encodeURIComponent(set.id)}`}
                  className="inline-flex min-h-11 items-center rounded-xl bg-slate-100 px-4 font-semibold text-slate-700 hover:bg-slate-200"
                >
                  Sửa
                </Link>
                <button
                  type="button"
                  onClick={() => remove(set.id)}
                  className="min-h-11 rounded-xl bg-rose-50 px-4 font-semibold text-rose-600 hover:bg-rose-100"
                >
                  Xóa
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
      </section>}

      {feature === "assignments" && <section className="rounded-3xl bg-white p-6 shadow-sm">
        <p className="text-sm font-bold uppercase tracking-wide text-indigo-600">Dành cho lớp học</p>
        <h2 className="mt-2 text-2xl font-extrabold">📋 Bài đã giao &amp; báo cáo</h2>
        <p className="mt-2 text-slate-600">Giáo viên giao bài bằng mã hoặc liên kết, xem điểm và kết quả của các bé.</p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link href="/assignments" className="min-h-11 inline-flex items-center justify-center rounded-xl bg-indigo-600 px-5 py-3 font-bold text-white hover:bg-indigo-700">Giao bài &amp; xem báo cáo</Link>
          <Link href="/join" className="min-h-11 inline-flex items-center justify-center rounded-xl bg-emerald-600 px-5 py-3 font-bold text-white hover:bg-emerald-700">Nhập mã làm bài</Link>
        </div>
      </section>}

      {feature === "ai" && <section className="rounded-3xl bg-white p-6 shadow-sm">
        <p className="text-sm font-bold uppercase tracking-wide text-violet-600">Cùng AI khám phá</p>
        <h2 className="mt-2 text-2xl font-extrabold">✨ Công cụ AI</h2>
        <p className="mt-2 text-slate-600">Tạo câu hỏi theo chủ đề hoặc nhận gợi ý học tập. Giáo viên cần kiểm tra nội dung do AI tạo.</p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link href="/edit" className="min-h-11 inline-flex items-center justify-center rounded-xl bg-violet-600 px-5 py-3 font-bold text-white hover:bg-violet-700">Tạo câu hỏi bằng AI</Link>
          <Link href="/ai" className="min-h-11 inline-flex items-center justify-center rounded-xl bg-emerald-600 px-5 py-3 font-bold text-white hover:bg-emerald-700">Trợ lý học tập</Link>
        </div>
      </section>}

      {feature === "flashcards" && <section className="rounded-3xl bg-white p-6 shadow-sm">
        <p className="text-sm font-bold uppercase tracking-wide text-indigo-600">Học mà chơi</p>
        <h2 className="mt-2 text-2xl font-extrabold">🃏 Flashcard tiếng Anh</h2>
        <p className="mt-2 text-slate-600">Khám phá từ vựng theo chủ đề, nghe phát âm và lật thẻ xem nghĩa tiếng Việt.</p>
        <Link href="/flashcards" className="min-h-11 inline-flex items-center justify-center mt-5 rounded-xl bg-indigo-600 px-5 py-3 font-bold text-white hover:bg-indigo-700">Bắt đầu học</Link>
      </section>}

      {feature !== "games" && feature !== "questions" && feature !== "assignments" && feature !== "ai" && feature !== "flashcards" && (() => {
        const selected = FEATURES.find((item) => item.id === feature);
        return <section className="rounded-3xl bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-extrabold"><span aria-hidden="true">{selected?.icon} </span>{selected?.label}</h2>
          <p className="mt-3 rounded-2xl bg-amber-50 p-4 text-amber-900">🚧 Tính năng này sắp ra mắt. Trong lúc chờ, cả lớp hãy cùng chơi các trò chơi học tập nhé!</p>
          <div className="mt-4 flex flex-wrap gap-3">
            <button type="button" onClick={() => setFeature("games")} className="min-h-11 rounded-xl bg-indigo-600 px-5 font-bold text-white hover:bg-indigo-700">🎮 Xem trò chơi</button>
            <button type="button" onClick={() => setFeature("questions")} className="min-h-11 rounded-xl bg-slate-100 px-5 font-bold text-slate-700 hover:bg-slate-200">📚 Kho câu hỏi</button>
          </div>
        </section>;
      })()}
    </main>
  );
}
