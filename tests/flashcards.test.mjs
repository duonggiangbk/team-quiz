import assert from "node:assert/strict";
import { test } from "node:test";
import { FLASHCARD_DECKS } from "../src/lib/flashcards.ts";

test("flashcard topics contain unique, complete and usable cards", () => {
  assert.ok(FLASHCARD_DECKS.length >= 4);
  assert.equal(new Set(FLASHCARD_DECKS.map((deck) => deck.id)).size, FLASHCARD_DECKS.length);
  for (const deck of FLASHCARD_DECKS) {
    assert.ok(deck.title && deck.icon && deck.cards.length > 0);
    assert.equal(new Set(deck.cards.map((card) => card.english.toLowerCase())).size, deck.cards.length);
    for (const card of deck.cards) assert.ok(card.english.trim() && card.vietnamese.trim() && card.picture.trim());
  }
});
