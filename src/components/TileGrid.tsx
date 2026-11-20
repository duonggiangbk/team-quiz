"use client";

import type { Tile } from "@/lib/types";

export default function TileGrid({ tiles, onPick }: { tiles: Tile[]; onPick: (tile: Tile) => void }) {
  return (
    <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-3">
      {tiles.map((tile) => (
        <button
          key={tile.id}
          type="button"
          disabled={tile.used}
          onClick={() => onPick(tile)}
          className={
            "aspect-square rounded-2xl text-3xl font-extrabold shadow transition " +
            (tile.used
              ? "bg-slate-200 text-slate-400 cursor-not-allowed"
              : "bg-white text-indigo-700 hover:scale-105 hover:bg-indigo-50 active:scale-95")
          }
          aria-label={tile.used ? `Ô ${tile.number} đã dùng` : `Mở ô ${tile.number}`}
        >
          {tile.used ? "✓" : tile.number}
        </button>
      ))}
    </div>
  );
}
