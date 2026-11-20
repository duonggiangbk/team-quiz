"use client";

import Link from "next/link";
import type { Team } from "@/lib/types";

const MEDALS = ["🥇", "🥈", "🥉", "🎖"];

export default function WinnerScreen({ teams, onReplay }: { teams: Team[]; onReplay: () => void }) {
  const ranked = [...teams].sort((a, b) => b.score - a.score);
  const top = ranked[0].score;
  const winners = ranked.filter((t) => t.score === top);

  return (
    <div className="mx-auto max-w-xl rounded-3xl bg-white p-8 text-center shadow-xl">
      <div className="text-7xl">🏆</div>
      <h2 className="my-4 text-3xl font-extrabold text-indigo-800">
        {winners.length > 1 ? "Hòa! " + winners.map((w) => w.name).join(", ") : `${winners[0].name} chiến thắng!`}
      </h2>
      <ol className="mb-6 space-y-2">
        {ranked.map((t, i) => (
          <li
            key={t.id}
            className="flex items-center justify-between rounded-xl px-4 py-2 text-lg font-bold text-white"
            style={{ backgroundColor: t.color }}
          >
            <span>
              {MEDALS[i]} {t.name}
            </span>
            <span>{t.score}</span>
          </li>
        ))}
      </ol>
      <div className="flex gap-3">
        <button
          type="button"
          onClick={onReplay}
          className="flex-1 rounded-xl bg-indigo-600 py-3 font-bold text-white hover:bg-indigo-700"
        >
          Chơi lại
        </button>
        <Link href="/" className="flex-1 rounded-xl bg-slate-100 py-3 font-bold text-slate-700 hover:bg-slate-200">
          Về trang chủ
        </Link>
      </div>
    </div>
  );
}
