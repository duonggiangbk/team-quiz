import assert from "node:assert/strict";
import { test } from "node:test";
import { FLASHCARD_DECKS, parseFlashcardDeck, parseFlashcards } from "../src/lib/flashcards.ts";

test("flashcard topics contain unique, complete and usable cards", () => {
  assert.ok(FLASHCARD_DECKS.length >= 4);
  assert.equal(new Set(FLASHCARD_DECKS.map((deck) => deck.id)).size, FLASHCARD_DECKS.length);
  for (const deck of FLASHCARD_DECKS) {
    assert.ok(deck.title && deck.icon && deck.cards.length > 0);
    assert.equal(new Set(deck.cards.map((card) => card.english.toLowerCase())).size, deck.cards.length);
    for (const card of deck.cards) assert.ok(card.english.trim() && card.vietnamese.trim() && card.picture.trim());
  }
});

test("validates manual and AI flashcards without accepting incomplete decks", () => {
  const cards = [{ english: " cat ", vietnamese: " mèo ", picture: "" }];
  assert.deepEqual(parseFlashcards(cards, 1), [{ english: "cat", vietnamese: "mèo", picture: "📚" }]);
  assert.equal(typeof parseFlashcards(cards, 2), "string");
  assert.equal(typeof parseFlashcards([{ english: "", vietnamese: "mèo", picture: "🐱" }]), "string");
  assert.equal(typeof parseFlashcards(Array(31).fill(cards[0])), "string");
  assert.equal(typeof parseFlashcards([{ ...cards[0], picture: "x".repeat(17) }]), "string");
  assert.equal(typeof parseFlashcardDeck({ id: "x", title: "", icon: "🃏", cards }), "string");
  assert.deepEqual(parseFlashcardDeck({ id: "x", title: " Animals ", icon: "🃏", cards }), {
    id: "x", title: "Animals", icon: "🃏", cards: parseFlashcards(cards),
  });
});
