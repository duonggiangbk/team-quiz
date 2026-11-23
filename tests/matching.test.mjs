import assert from "node:assert/strict";
import { test } from "node:test";
import { connectPair, countCorrect, parseMatchingSet, SAMPLE_MATCHING, shuffleIndexes } from "../src/lib/matching.ts";

test("sample and imported question images are valid", () => {
  assert.deepEqual(parseMatchingSet(SAMPLE_MATCHING), SAMPLE_MATCHING);
  const withImage = structuredClone(SAMPLE_MATCHING);
  withImage.pairs[0].image = "https://example.com/image.png";
  assert.equal(parseMatchingSet(withImage).pairs[0].image, withImage.pairs[0].image);
  withImage.pairs[0].image = "javascript:alert(1)";
  assert.equal(typeof parseMatchingSet(withImage), "string");
});

test("rejects incomplete, ambiguous or oversized sets", () => {
  assert.equal(typeof parseMatchingSet({ ...SAMPLE_MATCHING, pairs: SAMPLE_MATCHING.pairs.slice(0, 1) }), "string");
  assert.equal(typeof parseMatchingSet({ ...SAMPLE_MATCHING, pairs: Array(9).fill(SAMPLE_MATCHING.pairs[0]) }), "string");
  assert.equal(typeof parseMatchingSet({ ...SAMPLE_MATCHING, pairs: [{ left: "", right: "B" }, { left: "C", right: "D" }] }), "string");
  assert.equal(typeof parseMatchingSet({ ...SAMPLE_MATCHING, pairs: [{ left: "A", right: "B" }, { left: " a ", right: "C" }] }), "string");
  assert.equal(typeof parseMatchingSet({ ...SAMPLE_MATCHING, pairs: [{ left: "A", right: "B" }, { left: "C", right: " b " }] }), "string");
});

test("reconnecting replaces both previous links and counts correct pairs", () => {
  let links = connectPair({}, 0, 1);
  links = connectPair(links, 1, 0);
  assert.equal(countCorrect(links), 0);
  links = connectPair(links, 0, 0);
  assert.deepEqual(links, { 0: 0 });
  links = connectPair(links, 1, 1);
  assert.equal(countCorrect(links), 2);
  links = connectPair(links, 1, 0);
  assert.deepEqual(links, { 1: 0 });
});

test("shuffle preserves every index", () => {
  assert.deepEqual(shuffleIndexes(4, () => 0), [1, 2, 3, 0]);
  assert.deepEqual(shuffleIndexes(8).sort((a, b) => a - b), [0, 1, 2, 3, 4, 5, 6, 7]);
});
