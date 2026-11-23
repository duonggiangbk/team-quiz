"use client";

import { useState } from "react";
import QuestionImage from "@/components/QuestionImage";
import { MAX_FLASHCARDS, parseFlashcardDeck, parseFlashcards, type Flashcard, type FlashcardDeck } from "@/lib/flashcards";
import { errorMessage, newId, writeRequest } from "@/lib/storage";
import { isValidImage, MAX_IMAGE_FILE_BYTES } from "@/lib/validate";

const blankCard = (): Flashcard => ({ english: "", vietnamese: "", picture: "" });
const inputClass = "mt-1 block w-full rounded-xl border border-slate-300 p-2 font-normal";

export default function FlashcardEditor({ initial, onSave, onCancel }: {
  initial?: FlashcardDeck;
  onSave: (deck: FlashcardDeck) => void;
  onCancel: () => void;
}) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [cards, setCards] = useState<Flashcard[]>(initial?.cards ?? [blankCard()]);
  const [topic, setTopic] = useState("");
  const [level, setLevel] = useState("Tiểu học");
  const [count, setCount] = useState(8);
  const [busy, setBusy] = useState(false);
  const [imagesLoading, setImagesLoading] = useState(0);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  function updateCard(index: number, patch: Partial<Flashcard>) {
    setCards((current) => current.map((card, i) => i === index ? { ...card, ...patch } : card));
  }

  async function generate() {
    if (!topic.trim()) { setError("Hãy nhập chủ đề để AI tạo thẻ."); return; }
    if (cards.some((card) => card.english.trim() || card.vietnamese.trim() || card.picture.trim() || card.image) &&
        !window.confirm("Tạo bằng AI sẽ thay thế các thẻ đang soạn. Tiếp tục?")) return;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const response = await writeRequest("/api/ai", {
        method: "POST",
        body: JSON.stringify({ kind: "flashcards", topic, level, count }),
      });
      if (!response.ok) throw new Error(await errorMessage(response));
      const data: unknown = await response.json();
      const generated = parseFlashcards(data && typeof data === "object" && "cards" in data ? data.cards : null, count);
      if (typeof generated === "string") throw new Error("AI tạo thẻ chưa hợp lệ. Hãy thử lại.");
      setCards(generated);
      if (!title.trim()) setTitle(topic.trim());
      setNotice("Đã tạo thẻ. Giáo viên hãy kiểm tra và chỉnh sửa trước khi lưu.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Không tạo được thẻ bằng AI.");
    } finally { setBusy(false); }
  }

  function uploadImage(index: number, file: File | undefined) {
    if (!file) return;
    if (!["image/png", "image/jpeg", "image/gif", "image/webp"].includes(file.type)) {
      setError("Hãy chọn ảnh PNG, JPEG, GIF hoặc WebP.");
      return;
    }
    if (file.size > MAX_IMAGE_FILE_BYTES) {
      setError("Ảnh tải lên phải không quá 80 KB. Bạn cũng có thể dùng liên kết ảnh.");
      return;
    }
    const reader = new FileReader();
    setImagesLoading((count) => count + 1);
    reader.onload = () => {
      if (typeof reader.result !== "string" || !isValidImage(reader.result)) {
        setError("Không đọc được hình ảnh. Hãy chọn một ảnh khác.");
        return;
      }
      updateCard(index, { image: reader.result });
      setError("");
    };
    reader.onerror = () => setError("Không đọc được hình ảnh. Hãy thử lại.");
    reader.onloadend = () => setImagesLoading((count) => count - 1);
    reader.readAsDataURL(file);
  }

  function save() {
    const parsed = parseFlashcardDeck({ id: initial?.id ?? newId(), title, icon: initial?.icon ?? "🃏", cards });
    if (typeof parsed === "string") { setError(parsed); return; }
    try { onSave(parsed); } catch (e) { setError(e instanceof Error ? e.message : "Không lưu được bộ thẻ."); }
  }

  return <section aria-label="Soạn bộ thẻ" className="mb-5 space-y-4 rounded-3xl bg-white p-5 shadow">
    <h2 className="text-xl font-extrabold text-indigo-800">{initial ? "✏️ Sửa bộ thẻ" : "✨ Tạo bộ thẻ mới"}</h2>
    <fieldset disabled={busy || imagesLoading > 0} className="space-y-4 disabled:opacity-60">
      <label className="block font-bold">Tên bộ thẻ
        <input className={inputClass} value={title} onChange={(e) => setTitle(e.target.value)} maxLength={100} placeholder="Ví dụ: Đồ dùng học tập" />
      </label>
      <div className="space-y-3 rounded-2xl bg-violet-50 p-4">
        <h3 className="font-bold text-violet-900">Tạo nhanh bằng AI</h3>
        <p className="text-sm text-violet-900">Chủ đề được gửi đến Google. Không nhập thông tin cá nhân; AI có thể sai, hãy kiểm tra trước khi lưu. Cần mã PIN giáo viên.</p>
        <label className="block font-bold">Chủ đề
          <input className={inputClass} value={topic} onChange={(e) => setTopic(e.target.value)} maxLength={300} placeholder="Ví dụ: đồ dùng trong lớp học" />
        </label>
        <div className="flex flex-wrap gap-3">
          <label className="font-bold">Độ tuổi
            <select className={inputClass} value={level} onChange={(e) => setLevel(e.target.value)}>
              <option>Mầm non</option><option>Tiểu học</option><option>Trung học cơ sở</option>
            </select>
          </label>
          <label className="font-bold">Số thẻ
            <select className={inputClass} value={count} onChange={(e) => setCount(Number(e.target.value))}>
              {Array.from({ length: 9 }, (_, i) => i + 2).map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
          </label>
        </div>
        <button type="button" onClick={generate} className="min-h-11 inline-flex items-center justify-center rounded-xl bg-violet-600 px-4 py-2 font-bold text-white">{busy ? "Đang tạo…" : "✨ Tạo thẻ bằng AI"}</button>
      </div>
      <h3 className="font-bold">Nội dung thẻ ({cards.length}/{MAX_FLASHCARDS})</h3>
      {cards.map((card, index) => <div key={index} className="space-y-2 rounded-2xl border border-indigo-100 p-3">
        <div className="flex items-center justify-between"><strong>Thẻ {index + 1}</strong>
          <button type="button" onClick={() => setCards(cards.filter((_, i) => i !== index))} disabled={cards.length === 1} className="font-bold text-rose-700 disabled:opacity-40">Xóa thẻ</button>
        </div>
        <label className="block font-semibold">Tiếng Anh<input className={inputClass} value={card.english} maxLength={100} onChange={(e) => updateCard(index, { english: e.target.value })} /></label>
        <label className="block font-semibold">Tiếng Việt<input className={inputClass} value={card.vietnamese} maxLength={100} onChange={(e) => updateCard(index, { vietnamese: e.target.value })} /></label>
        <label className="block font-semibold">Emoji minh họa (không bắt buộc)<input className={inputClass} value={card.picture} maxLength={16} onChange={(e) => updateCard(index, { picture: e.target.value })} placeholder="📚" /></label>
        <div className="space-y-3 rounded-xl bg-sky-50 p-3">
          <label className="block font-semibold">Liên kết hình ảnh thẻ {index + 1}
            <input type="url" className={inputClass} value={card.image?.startsWith("data:") ? "" : card.image ?? ""} onChange={(e) => updateCard(index, { image: e.target.value || undefined })} placeholder="https://..." />
          </label>
          <label className="block text-sm font-semibold">Hoặc chọn ảnh từ máy (PNG, JPEG, GIF, WebP; tối đa 80 KB)
            <input type="file" accept="image/png,image/jpeg,image/gif,image/webp" className="mt-2 block w-full text-sm" aria-label={`Chọn hình ảnh thẻ ${index + 1}`} onChange={(e) => { uploadImage(index, e.target.files?.[0]); e.target.value = ""; }} />
          </label>
          {card.image && isValidImage(card.image) && <>
            <QuestionImage src={card.image} alt={`Hình minh họa thẻ ${index + 1}`} />
            <button type="button" onClick={() => updateCard(index, { image: undefined })} className="font-semibold text-rose-700">Xóa hình</button>
          </>}
          {card.image && !isValidImage(card.image) && <p className="text-sm font-semibold text-rose-700">Liên kết hình ảnh chưa hợp lệ.</p>}
        </div>
      </div>)}
      <div className="flex flex-wrap gap-3">
        <button type="button" onClick={() => setCards([...cards, blankCard()])} disabled={cards.length >= MAX_FLASHCARDS} className="rounded-xl bg-indigo-100 px-4 py-2 font-bold text-indigo-800 disabled:opacity-40">+ Thêm thẻ</button>
        <button type="button" onClick={save} className="min-h-11 inline-flex items-center justify-center rounded-xl bg-emerald-600 px-4 py-2 font-bold text-white">Lưu bộ thẻ</button>
        <button type="button" onClick={onCancel} className="min-h-11 inline-flex items-center justify-center rounded-xl bg-slate-100 px-4 py-2 font-bold text-slate-700">Hủy</button>
      </div>
    </fieldset>
    {busy && <p role="status">Đang tạo thẻ, vui lòng đợi…</p>}
    {imagesLoading > 0 && <p role="status">Đang tải hình ảnh…</p>}
    {error && <p role="alert" className="rounded-xl bg-rose-50 p-3 text-rose-700">{error}</p>}
    {notice && <p role="status" className="rounded-xl bg-emerald-50 p-3 text-emerald-800">{notice}</p>}
  </section>;
}
