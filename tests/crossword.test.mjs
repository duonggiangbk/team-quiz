import assert from "node:assert/strict";
import { test } from "node:test";
import { normalizeWord, parseCrossword, SAMPLE_CROSSWORD } from "../src/lib/crossword.ts";

test("sample crossword has a valid intersecting letter for each row", () => {
  assert.deepEqual(parseCrossword(SAMPLE_CROSSWORD), SAMPLE_CROSSWORD);
});

test("normalizes Vietnamese accents and spaces consistently for answers", () => {
  assert.equal(normalizeWord("Đèn - đỏ"), "DENDO");
  const parsed = parseCrossword({
    id: "1", title: " Bài mẫu ", keyword: "đỏ",
    rows: [
      { clue: "ánh sáng", answer: "đèn", position: 0 },
      { clue: "màu", answer: "đỏ", position: 1 },
    ],
  });
  assert.equal(typeof parsed, "object");
  assert.equal(parsed.keyword, "DO");
  assert.equal(parsed.rows[0].answer, "DEN");
});

test("rejects incomplete or invalid puzzles and retains valid images", () => {
  const valid = structuredClone(SAMPLE_CROSSWORD);
  valid.rows[0].image = "https://example.com/image.png";
  assert.equal(parseCrossword(valid).rows[0].image, valid.rows[0].image);
  assert.equal(typeof parseCrossword({ ...valid, rows: valid.rows.slice(1) }), "string");
  assert.equal(typeof parseCrossword({ ...valid, keyword: "H0A" }), "string");
  assert.equal(typeof parseCrossword({ ...valid, rows: [{ ...valid.rows[0], position: 0 }, ...valid.rows.slice(1)] }), "string");
  assert.equal(typeof parseCrossword({ ...valid, rows: [{ ...valid.rows[0], answer: "123" }, ...valid.rows.slice(1)] }), "string");
  assert.equal(typeof parseCrossword({ ...valid, rows: [{ ...valid.rows[0], image: "javascript:alert(1)" }, ...valid.rows.slice(1)] }), "string");
});
