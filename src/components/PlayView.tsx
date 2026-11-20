"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import QuestionModal from "@/components/QuestionModal";
import Scoreboard from "@/components/Scoreboard";
import TileGrid from "@/components/TileGrid";
import WinnerScreen from "@/components/WinnerScreen";
import { DEFAULT_TEAM_NAMES, TEAM_COLORS, createGame, isFinished, resolvePowerUp, resolveQuestion } from "@/lib/game";
import { loadGame, loadSets, saveGame } from "@/lib/storage";
import type { GameState, PowerUpFrequency, QuestionSet } from "@/lib/types";

export default function PlayView() {
  const params = useSearchParams();
  const setId = params.get("set");
  const [set] = useState<QuestionSet | undefined>(() => loadSets().find((s) => s.id === setId));
  const [game, setGame] = useState<GameState | null>(() => {
    if (params.get("resume") !== "1") return null;
    const saved = loadGame();
    return saved && saved.setId === setId ? saved : null;
  });
  const [openTile, setOpenTile] = useState<string | null>(null);

  function update(next: GameState | null) {
    setGame(next);
    saveGame(next);
  }

  if (!set) {
    return (
      <main className="mx-auto max-w-xl flex-1 p-6 text-center">
        <p className="mb-4 text-lg">Không tìm thấy bộ câu hỏi.</p>
        <Link href="/" className="font-bold text-indigo-600 hover:underline">
          ← Về trang chủ
        </Link>
      </main>
    );
  }

  if (!game) return <Setup set={set} onStart={(teams, freq) => update(createGame(set, teams, freq))} />;

  const tile = game.tiles.find((t) => t.id === openTile);
  const finished = isFinished(game);

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 p-6">
      <div className="mb-4 flex items-center justify-between gap-3">
        <Link href="/" className="font-semibold text-indigo-600 hover:underline">
          ← Trang chủ
        </Link>
        <h1 className="truncate text-xl font-extrabold text-indigo-800">{game.setTitle}</h1>
        <span className="text-sm font-semibold text-slate-500">
          {game.tiles.filter((t) => t.used).length}/{game.tiles.length} ô
        </span>
      </div>

      {finished ? (
        <WinnerScreen
          teams={game.teams}
          onReplay={() =>
            update(createGame(set, game.teams, game.tiles.some((t) => t.kind === "powerup") ? "some" : "none"))
          }
        />
      ) : (
        <>
          <div className="mb-6">
            <Scoreboard teams={game.teams} current={game.currentTeam} />
          </div>
          <TileGrid tiles={game.tiles} onPick={(t) => setOpenTile(t.id)} />
        </>
      )}

      {tile && !tile.used && (
        <QuestionModal
          key={tile.id}
          tile={tile}
          teams={game.teams}
          current={game.currentTeam}
          onClose={() => setOpenTile(null)}
          onAnswer={(correct) => {
            update(resolveQuestion(game, tile.id, correct));
            setOpenTile(null);
          }}
          onPowerUp={(target) => {
            update(resolvePowerUp(game, tile.id, target));
            setOpenTile(null);
          }}
        />
      )}
    </main>
  );
}

function Setup({
  set,
  onStart,
}: {
  set: QuestionSet;
  onStart: (teams: { name: string; color: string }[], freq: PowerUpFrequency) => void;
}) {
  const [count, setCount] = useState(2);
  const [names, setNames] = useState(DEFAULT_TEAM_NAMES);
  const [freq, setFreq] = useState<PowerUpFrequency>("some");

  const freqOptions: { value: PowerUpFrequency; label: string }[] = [
    { value: "none", label: "Không có" },
    { value: "some", label: "Vừa phải" },
    { value: "many", label: "Nhiều" },
  ];

  return (
    <main className="mx-auto w-full max-w-xl flex-1 p-6">
      <Link href="/" className="font-semibold text-indigo-600 hover:underline">
        ← Trang chủ
      </Link>
      <div className="mt-4 rounded-3xl bg-white p-6 shadow">
        <h1 className="text-2xl font-extrabold text-indigo-800">{set.title}</h1>
        <p className="mb-6 text-slate-500">{set.questions.length} câu hỏi</p>

        <h2 className="mb-2 font-bold">Số đội</h2>
        <div className="mb-4 flex gap-2">
          {[2, 3, 4].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setCount(n)}
              className={
                "flex-1 rounded-xl py-2 font-bold " +
                (count === n ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200")
              }
            >
              {n} đội
            </button>
          ))}
        </div>

        <div className="mb-6 space-y-2">
          {names.slice(0, count).map((name, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="h-8 w-8 shrink-0 rounded-full" style={{ backgroundColor: TEAM_COLORS[i] }} />
              <input
                value={name}
                onChange={(e) => setNames(names.map((n, j) => (j === i ? e.target.value : n)))}
                className="flex-1 rounded-xl border border-slate-300 px-3 py-2"
                aria-label={`Tên đội ${i + 1}`}
              />
            </div>
          ))}
        </div>

        <h2 className="mb-2 font-bold">Ô đặc biệt (power-up)</h2>
        <div className="mb-6 flex gap-2">
          {freqOptions.map((o) => (
            <button
              key={o.value}
              type="button"
              onClick={() => setFreq(o.value)}
              className={
                "flex-1 rounded-xl py-2 font-bold " +
                (freq === o.value ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200")
              }
            >
              {o.label}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={() =>
            onStart(
              names.slice(0, count).map((n, i) => ({ name: n.trim() || DEFAULT_TEAM_NAMES[i], color: TEAM_COLORS[i] })),
              freq,
            )
          }
          className="w-full rounded-xl bg-emerald-500 py-3 text-lg font-bold text-white hover:bg-emerald-600"
        >
          Bắt đầu chơi ▶
        </button>
      </div>
    </main>
  );
}
