"use client";

import type { Team } from "@/lib/types";

export default function Scoreboard({ teams, current }: { teams: Team[]; current: number }) {
  return (
    <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${teams.length}, minmax(0, 1fr))` }}>
      {teams.map((team, i) => (
        <div
          key={team.id}
          className={
            "rounded-2xl p-3 text-white shadow transition " +
            (i === current ? "ring-4 ring-offset-2 ring-indigo-900 scale-105" : "opacity-80")
          }
          style={{ backgroundColor: team.color }}
        >
          <div className="flex items-center justify-between text-sm font-semibold">
            <span className="truncate">{team.name}</span>
            {team.doubleNext && <span title="Lần đúng tiếp theo được nhân đôi">⚡x2</span>}
          </div>
          <div className="text-3xl font-extrabold">{team.score}</div>
          {i === current && <div className="text-xs font-medium">Đến lượt!</div>}
        </div>
      ))}
    </div>
  );
}
