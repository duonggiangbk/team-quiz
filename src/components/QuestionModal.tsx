"use client";

import { useState } from "react";
import QuestionImage from "@/components/QuestionImage";
import { POWER_UPS } from "@/lib/game";
import type { Team, Tile } from "@/lib/types";

interface Props {
  tile: Tile;
  teams: Team[];
  current: number;
  onAnswer: (correct: boolean) => void;
  onPowerUp: (targetIndex?: number) => void;
  onClose: () => void;
}

export default function QuestionModal({ tile, teams, current, onAnswer, onPowerUp, onClose }: Props) {
  const [revealed, setRevealed] = useState(false);
  const team = teams[current];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-indigo-950/70 p-3 sm:p-4">
      <div role="dialog" aria-modal="true" aria-label={tile.kind === "question" ? `Câu hỏi ô số ${tile.number}` : `Ô đặc biệt ${tile.number}`} className="max-h-full w-full max-w-2xl overflow-y-auto rounded-3xl border-4 border-amber-200 bg-white p-5 shadow-2xl sm:p-8">
        <div className="mb-4 flex items-center justify-between">
          <span className="rounded-full px-3 py-1 text-sm font-bold text-white" style={{ backgroundColor: team.color }}>
            {team.name}
          </span>
          <span className="text-sm font-semibold text-slate-500">Ô số {tile.number}</span>
        </div>

        {tile.kind === "question" ? (
          <>
            <p className="mb-2 text-sm font-semibold text-indigo-500">{tile.question.points} điểm</p>
            <h2 className="mb-4 whitespace-pre-wrap text-2xl font-extrabold text-indigo-950 sm:text-3xl">{tile.question.prompt}</h2>
            {tile.question.image && (
              <div className="mb-5">
                <QuestionImage src={tile.question.image} alt="Hình minh họa cho câu hỏi" />
              </div>
            )}
            {revealed ? (
              <div className="mb-6 rounded-2xl bg-emerald-50 p-4 text-xl font-semibold text-emerald-800">
                Đáp án: {tile.question.answer || "(không có)"}
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setRevealed(true)}
                className="mb-6 rounded-xl bg-slate-100 px-4 py-2 font-semibold text-slate-700 hover:bg-slate-200"
              >
                👁 Xem đáp án
              </button>
            )}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => onAnswer(true)}
                className="flex-1 rounded-xl bg-emerald-500 py-3 text-lg font-bold text-white hover:bg-emerald-600"
              >
                ✔ Đúng
              </button>
              <button
                type="button"
                onClick={() => onAnswer(false)}
                className="flex-1 rounded-xl bg-rose-500 py-3 text-lg font-bold text-white hover:bg-rose-600"
              >
                ✘ Sai
              </button>
            </div>
            <button type="button" onClick={onClose} className="mt-4 w-full text-sm text-slate-500 hover:underline">
              Đóng (chưa trả lời)
            </button>
          </>
        ) : (
          <PowerUpBody tile={tile} teams={teams} current={current} onPowerUp={onPowerUp} />
        )}
      </div>
    </div>
  );
}

function PowerUpBody({
  tile,
  teams,
  current,
  onPowerUp,
}: {
  tile: Extract<Tile, { kind: "powerup" }>;
  teams: Team[];
  current: number;
  onPowerUp: (targetIndex?: number) => void;
}) {
  const info = POWER_UPS[tile.powerUp];
  return (
    <div className="text-center">
      <div className="mb-2 text-7xl">{info.icon}</div>
      <h2 className="mb-2 text-3xl font-extrabold text-slate-800">{info.title}</h2>
      <p className="mb-6 text-lg text-slate-600">{info.describe(tile.amount)}</p>
      {info.needsTarget ? (
        <div className="flex flex-wrap justify-center gap-3">
          {teams.map((t, i) =>
            i === current ? null : (
              <button
                key={t.id}
                type="button"
                onClick={() => onPowerUp(i)}
                className="rounded-xl px-5 py-3 font-bold text-white shadow hover:opacity-90"
                style={{ backgroundColor: t.color }}
              >
                {t.name} ({t.score})
              </button>
            ),
          )}
        </div>
      ) : (
        <button
          type="button"
          onClick={() => onPowerUp()}
          className="rounded-xl bg-indigo-600 px-8 py-3 text-lg font-bold text-white hover:bg-indigo-700"
        >
          OK
        </button>
      )}
    </div>
  );
}
