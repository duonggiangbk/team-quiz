"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { FLASHCARD_DECKS } from "@/lib/flashcards";

export default function FlashcardsPage() {
  const [deckIndex, setDeckIndex] = useState(0);
  const [cardIndex, setCardIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [speechError, setSpeechError] = useState("");
  const deck = FLASHCARD_DECKS[deckIndex];
  const card = deck.cards[cardIndex];

  useEffect(() => () => {
    if ("speechSynthesis" in window) window.speechSynthesis.cancel();
  }, []);

  function stopSpeech() {
    if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    setSpeechError("");
  }

  function selectDeck(index: number) {
    stopSpeech();
    setDeckIndex(index);
    setCardIndex(0);
    setFlipped(false);
  }

  function moveCard(index: number) {
    stopSpeech();
    setCardIndex(index);
    setFlipped(false);
  }

  function speak() {
    if (!("speechSynthesis" in window) || !("SpeechSynthesisUtterance" in window)) {
      setSpeechError("Trình duyệt này không hỗ trợ phát âm. Bé hãy thử trình duyệt khác nhé.");
      return;
    }
    window.speechSynthesis.cancel();
    setSpeechError("");
    const utterance = new SpeechSynthesisUtterance(card.english);
    utterance.lang = "en-US";
    utterance.rate = 0.85;
    utterance.onerror = (event) => {
      if (event.error !== "interrupted" && event.error !== "canceled") {
        setSpeechError("Không phát được âm thanh. Hãy kiểm tra âm lượng hoặc thử lại nhé.");
      }
    };
    window.speechSynthesis.speak(utterance);
  }

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 p-4 sm:p-6">
      <Link href="/" className="font-bold text-indigo-700">← Về trang chủ</Link>
      <header className="my-5 rounded-3xl bg-gradient-to-r from-indigo-600 to-violet-600 p-6 text-white">
        <h1 className="text-3xl font-extrabold">🃏 Flashcard tiếng Anh</h1>
        <p className="mt-2">Chọn chủ đề, nghe từ và lật thẻ để khám phá nghĩa nhé!</p>
      </header>

      <section aria-label="Chọn chủ đề" className="mb-5">
        <h2 className="mb-3 text-lg font-bold">Chọn chủ đề</h2>
        <div className="flex flex-wrap gap-2">
          {FLASHCARD_DECKS.map((item, index) => (
            <button key={item.id} type="button" onClick={() => selectDeck(index)} aria-pressed={index === deckIndex}
              className={`rounded-full px-4 py-2 font-bold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 ${index === deckIndex ? "bg-indigo-600 text-white" : "bg-white text-indigo-700 hover:bg-indigo-50"}`}>
              <span aria-hidden="true">{item.icon} </span>{item.title}
            </button>
          ))}
        </div>
      </section>

      <section aria-label={`Thẻ học ${deck.title}`} className="rounded-3xl bg-white p-4 shadow sm:p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-xl font-extrabold text-indigo-800">{deck.icon} {deck.title}</h2>
          <p className="font-bold text-slate-600" aria-live="polite">Thẻ {cardIndex + 1} / {deck.cards.length}</p>
        </div>
        <button type="button" onClick={() => setFlipped(!flipped)}
          aria-label={flipped ? `Nghĩa: ${card.vietnamese}. Lật về tiếng Anh` : `Từ tiếng Anh: ${card.english}. Lật xem nghĩa`}
          className="flex min-h-64 w-full flex-col items-center justify-center gap-4 rounded-3xl border-4 border-indigo-100 bg-gradient-to-br from-sky-50 to-pink-50 p-6 text-center hover:border-indigo-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600">
          <span className="text-7xl" aria-hidden="true">{card.picture}</span>
          <span className="text-sm font-bold text-indigo-600">{flipped ? "Tiếng Việt" : "Tiếng Anh"}</span>
          <span lang={flipped ? "vi" : "en"} className="text-4xl font-extrabold text-indigo-900">{flipped ? card.vietnamese : card.english}</span>
          <span className="text-sm text-slate-600">{flipped ? "Chạm để xem từ tiếng Anh" : "Chạm để xem nghĩa"}</span>
        </button>
        <div className="mt-5 flex flex-wrap justify-center gap-3">
          <button type="button" onClick={() => moveCard(cardIndex - 1)} disabled={cardIndex === 0} className="rounded-xl bg-slate-100 px-4 py-3 font-bold text-slate-700 hover:bg-slate-200 disabled:opacity-40">← Thẻ trước</button>
          <button type="button" onClick={speak} className="rounded-xl bg-violet-600 px-4 py-3 font-bold text-white hover:bg-violet-700">🔊 Nghe phát âm</button>
          <button type="button" onClick={() => moveCard(cardIndex + 1)} disabled={cardIndex === deck.cards.length - 1} className="rounded-xl bg-indigo-600 px-4 py-3 font-bold text-white hover:bg-indigo-700 disabled:opacity-40">Thẻ tiếp →</button>
        </div>
        {speechError && <p role="alert" className="mt-4 rounded-xl bg-amber-50 p-3 text-center text-amber-900">{speechError}</p>}
        {cardIndex === deck.cards.length - 1 && <p className="mt-4 text-center font-semibold text-emerald-700">🌟 Bé đã xem đến thẻ cuối! Hãy chọn chủ đề khác hoặc xem lại nhé.</p>}
      </section>
    </main>
  );
}
