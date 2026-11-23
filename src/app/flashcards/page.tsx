"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import FlashcardEditor from "@/components/FlashcardEditor";
import { FLASHCARD_DECKS, parseFlashcardDeck, type FlashcardDeck } from "@/lib/flashcards";

const STORAGE_KEY = "team-quiz:flashcard-decks";
export default function FlashcardsPage() {
  const [customDecks, setCustomDecks] = useState<FlashcardDeck[]>([]);
  const [selectedId, setSelectedId] = useState(FLASHCARD_DECKS[0].id);
  const [editor, setEditor] = useState<"new" | string | null>(null);
  const [storageReady, setStorageReady] = useState(false);
  const [storageError, setStorageError] = useState("");
  const [cardIndex, setCardIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [speechError, setSpeechError] = useState("");
  const [failedImage, setFailedImage] = useState("");
  const decks = [...FLASHCARD_DECKS, ...customDecks];
  const deck = decks.find((item) => item.id === selectedId) ?? FLASHCARD_DECKS[0];
  const card = deck.cards[cardIndex];

  useEffect(() => {
    let active = true;
    Promise.resolve().then(() => {
      try {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        const parsed: unknown = raw ? JSON.parse(raw) : [];
        if (!Array.isArray(parsed) || parsed.length > 100) throw new Error();
        const loaded = parsed.map(parseFlashcardDeck);
        if (loaded.some((item) => typeof item === "string")) throw new Error();
        const valid = loaded.filter((item): item is FlashcardDeck => typeof item !== "string");
        if (new Set([...FLASHCARD_DECKS, ...valid].map((item) => item.id)).size !== FLASHCARD_DECKS.length + valid.length) throw new Error();
        if (active) { setCustomDecks(valid); setStorageReady(true); }
      } catch {
        if (active) setStorageError("Không đọc được bộ thẻ đã lưu trên trình duyệt. Dữ liệu cũ được giữ nguyên; hãy kiểm tra quyền lưu trữ.");
      }
    });
    return () => { active = false; };
  }, []);

  useEffect(() => () => {
    if ("speechSynthesis" in window) window.speechSynthesis.cancel();
  }, []);

  function stopSpeech() {
    if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    setSpeechError("");
  }

  function selectDeck(id: string) {
    stopSpeech();
    setSelectedId(id);
    setCardIndex(0);
    setFlipped(false);
  }

  function saveDeck(value: FlashcardDeck) {
    const exists = customDecks.some((item) => item.id === value.id);
    if (!exists && customDecks.length >= 100) throw new Error("Đã đạt giới hạn 100 bộ thẻ.");
    const next = exists ? customDecks.map((item) => item.id === value.id ? value : item) : [...customDecks, value];
    try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); }
    catch { throw new Error("Không lưu được bộ thẻ trên trình duyệt. Hãy kiểm tra dung lượng hoặc quyền lưu trữ."); }
    setCustomDecks(next);
    selectDeck(value.id);
    setEditor(null);
  }

  function deleteDeck() {
    if (!window.confirm(`Xóa bộ thẻ "${deck.title}" trên trình duyệt này?`)) return;
    const next = customDecks.filter((item) => item.id !== deck.id);
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      setCustomDecks(next);
      selectDeck(FLASHCARD_DECKS[0].id);
      setStorageError("");
    } catch {
      setStorageError("Không xóa được bộ thẻ trên trình duyệt. Hãy kiểm tra quyền lưu trữ.");
    }
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

      <p className="mb-3 text-sm text-slate-700">Bộ thẻ tự tạo chỉ lưu trên trình duyệt này, không tự đồng bộ giữa các thiết bị.</p>
      {storageError && <p role="alert" className="mb-4 rounded-xl bg-rose-50 p-3 text-rose-700">{storageError}</p>}
      {storageReady && !editor && <button type="button" onClick={() => setEditor("new")} className="mb-5 rounded-xl bg-violet-600 px-4 py-3 font-bold text-white">+ Tạo bộ thẻ mới</button>}
      {editor && <FlashcardEditor key={editor} initial={editor === "new" ? undefined : customDecks.find((item) => item.id === editor)} onSave={saveDeck} onCancel={() => setEditor(null)} />}

      <section aria-label="Chọn chủ đề" className="mb-5">
        <h2 className="mb-3 text-lg font-bold">Chọn chủ đề</h2>
        <div className="flex flex-wrap gap-2">
          {decks.map((item) => (
            <button key={item.id} type="button" onClick={() => selectDeck(item.id)} aria-pressed={item.id === deck.id}
              className={`rounded-full px-4 py-2 font-bold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 ${item.id === deck.id ? "bg-indigo-600 text-white" : "bg-white text-indigo-700 hover:bg-indigo-50"}`}>
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
        {storageReady && !editor && customDecks.some((item) => item.id === deck.id) && <div className="mb-4 flex gap-3">
          <button type="button" onClick={() => setEditor(deck.id)} className="font-bold text-indigo-700">✏️ Sửa bộ thẻ</button>
          <button type="button" onClick={deleteDeck} className="font-bold text-rose-700">🗑 Xóa bộ thẻ</button>
        </div>}
        <button type="button" onClick={() => setFlipped(!flipped)}
          aria-label={flipped ? `Nghĩa: ${card.vietnamese}. Lật về tiếng Anh` : `Từ tiếng Anh: ${card.english}. Lật xem nghĩa`}
          className="flex min-h-64 w-full flex-col items-center justify-center gap-4 rounded-3xl border-4 border-indigo-100 bg-gradient-to-br from-sky-50 to-pink-50 p-6 text-center hover:border-indigo-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600">
          {card.image && card.image !== failedImage
            ? <Image src={card.image} alt="" width={320} height={200} unoptimized className="max-h-48 w-auto max-w-full rounded-xl object-contain" onError={() => setFailedImage(card.image ?? "")} />
            : <span className="text-7xl" aria-hidden="true">{card.picture}</span>}
          <span className="text-sm font-bold text-indigo-600">{flipped ? "Tiếng Việt" : "Tiếng Anh"}</span>
          <span lang={flipped ? "vi" : "en"} className="text-4xl font-extrabold text-indigo-900">{flipped ? card.vietnamese : card.english}</span>
          <span className="text-sm text-slate-600">{flipped ? "Chạm để xem từ tiếng Anh" : "Chạm để xem nghĩa"}</span>
        </button>
        {card.image && card.image === failedImage && <p role="status" className="mt-2 text-center text-sm text-amber-800">Không tải được hình ảnh. Hãy kiểm tra lại liên kết.</p>}
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
