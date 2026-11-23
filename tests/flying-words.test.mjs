import assert from "node:assert/strict";
import { test } from "node:test";
import { isCorrectOrder, parseFlyingWordsSet, SAMPLE_FLYING_WORDS, shuffledWords, words } from "../src/lib/flyingWords.ts";

test("validates sample and teacher-created sets with explicit bounds", () => {
  assert.equal(typeof parseFlyingWordsSet(SAMPLE_FLYING_WORDS), "object");
  assert.deepEqual(words("  Mặt   trời mọc  "), ["Mặt", "trời", "mọc"]);
  const set = { id: "test", title: "Luyện câu", rounds: [{ clue: "", sentence: " Bé  học vui " }] };
  assert.equal(parseFlyingWordsSet(set).rounds[0].sentence, "Bé học vui");
  for (const sentence of ["", "một", Array(13).fill("từ").join(" "), `${"a".repeat(31)} từ`]) {
    assert.equal(typeof parseFlyingWordsSet({ ...set, rounds: [{ clue: "", sentence }] }), "string");
  }
  assert.equal(typeof parseFlyingWordsSet({ ...set, rounds: [] }), "string");
  assert.equal(typeof parseFlyingWordsSet({ ...set, rounds: Array(11).fill(set.rounds[0]) }), "string");
});

test("scores complete orders including repeated words without reusing a tile", () => {
  assert.equal(isCorrectOrder("Bé yêu bé", [0, 1, 2]), true);
  assert.equal(isCorrectOrder("Bé yêu bé", [2, 1, 0]), true);
  assert.equal(isCorrectOrder("Bé yêu bé", [0, 0, 2]), false);
  assert.equal(isCorrectOrder("Bé yêu bé", [0, 2, 1]), false);
  assert.equal(isCorrectOrder("Bé yêu bé", [0, 1]), false);
  assert.deepEqual([...shuffledWords("Bé yêu bé", () => 0)].sort(), [0, 1, 2]);
});
