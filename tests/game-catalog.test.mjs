import assert from "node:assert/strict";
import { test } from "node:test";
import { GAME_CATALOG } from "../src/lib/gameCatalog.ts";

test("game catalog distinguishes playable games from planned features", () => {
  assert.equal(new Set(GAME_CATALOG.map((game) => game.id)).size, GAME_CATALOG.length);
  assert.deepEqual(GAME_CATALOG.filter((game) => game.status !== "planned").map((game) => game.status), ["tile", "flashcards"]);
  for (const game of GAME_CATALOG) {
    assert.ok(game.title && game.description && game.icon);
    assert.ok(["tile", "flashcards", "planned"].includes(game.status));
  }
});
