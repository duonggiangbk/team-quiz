"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { CATEGORIES } from "@/lib/builtinSets";
import { deleteSet, fetchSets, loadGame, saveGame } from "@/lib/storage";
import type { GameState, QuestionSet } from "@/lib/types";

const ALL = "Tất cả";
const MINE = "Của tôi";

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
    <main className="mx-auto w-full max-w-4xl flex-1 p-6">
      <header className="mb-8 rounded-3xl border-4 border-white bg-gradient-to-r from-sky-100 via-indigo-100 to-pink-100 p-6 text-center shadow-sm">
        <p className="mb-2 text-3xl" aria-hidden="true">🌟 🎈 🧩</p>
        <h1 className="text-4xl font-extrabold text-indigo-800 sm:text-5xl">Ô Số Đồng Đội</h1>
        <p className="mt-2 text-lg font-semibold text-indigo-700">Cùng chọn ô, khám phá và ghi điểm nhé!</p>
      </header>
      <nav aria-label="Công cụ học tập" className="mb-6 flex flex-wrap gap-3">
        <Link href="/assignments" className="rounded-2xl bg-indigo-600 px-5 py-3 font-bold text-white hover:bg-indigo-700">📋 Giao bài &amp; báo cáo</Link>
        <Link href="/join" className="rounded-2xl bg-emerald-600 px-5 py-3 font-bold text-white hover:bg-emerald-700">🎒 Nhập mã làm bài</Link>
      </nav>

      {game && (
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-amber-100 p-4">
          <span className="font-semibold text-amber-900">
            Có ván đang chơi dở: <b>{game.setTitle}</b> ({game.tiles.filter((t) => t.used).length}/{game.tiles.length} ô)
          </span>
          <div className="flex gap-2">
            <Link
              href={`/play?set=${encodeURIComponent(game.setId)}&resume=1`}
              className="rounded-xl bg-amber-500 px-4 py-2 font-bold text-white hover:bg-amber-600"
            >
              Tiếp tục
            </Link>
            <button
              type="button"
              onClick={() => {
                saveGame(null);
                setGame(null);
              }}
              className="rounded-xl bg-white px-4 py-2 font-semibold text-amber-900 hover:bg-amber-50"
            >
              Bỏ ván
            </button>
          </div>
        </div>
      )}

      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-2xl font-bold">
          Bộ câu hỏi <span className="text-base font-semibold text-slate-500">({shown.length}/{sets.length})</span>
        </h2>
        <Link href="/edit" className="rounded-xl bg-indigo-600 px-4 py-2 font-bold text-white hover:bg-indigo-700">
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
        className="mb-3 w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-lg outline-none focus:border-indigo-400"
      />
      <div className="mb-5 flex flex-wrap gap-2">
        {[ALL, ...CATEGORIES, MINE].map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setCategory(c)}
            className={`rounded-full px-3 py-1 text-sm font-semibold ${
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
                  className="flex-1 rounded-xl bg-emerald-500 py-2 text-center font-bold text-white hover:bg-emerald-600"
                >
                  ▶ Chơi
                </Link>
                <Link
                  href={`/edit?id=${encodeURIComponent(set.id)}`}
                  className="rounded-xl bg-slate-100 px-4 py-2 font-semibold text-slate-700 hover:bg-slate-200"
                >
                  Sửa
                </Link>
                <button
                  type="button"
                  onClick={() => remove(set.id)}
                  className="rounded-xl bg-rose-50 px-4 py-2 font-semibold text-rose-600 hover:bg-rose-100"
                >
                  Xóa
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
