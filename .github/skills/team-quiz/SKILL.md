---
name: team-quiz
description: Kiến thức dự án Team Quiz (duonggiangbk/team-quiz) - website học tập tiếng Việt cho trẻ em với bộ câu hỏi, Ô Số Đồng Đội, giao bài, thẻ lật tiếng Anh, Ô chữ khóa bí mật, Kéo thả nối ý, Chặn Zombie, Từ ngữ biết bay và tạo nội dung bằng Gemini AI. Dùng cho MỌI công việc trong repo này - thêm/sửa trò chơi, bộ câu hỏi, giao bài, flashcard, AI, lưu trữ Redis/localStorage và mã PIN, hình ảnh, giao diện thân thiện trẻ em, test, build, commit và push.
---

# Team Quiz – kiến thức dự án

## 1. Stack & lệnh

- **Next.js 16.4.6 App Router** – có breaking changes so với kiến thức cũ. Đọc `node_modules/next/dist/docs/` trước khi viết code. Khối quy tắc trong `AGENTS.md` do `next dev` tự sinh lại – giữ nguyên.
- React 19.3, TypeScript, Tailwind CSS 4.3.3, next-auth 5 beta, `@upstash/redis`, Gemini qua `src/lib/gemini.ts`.
- Lệnh: `npm run dev`, `npm run build`, `npm run lint`, test: `node --test tests/`.
- Đăng nhập Google là **tùy chọn**, chỉ để hiển thị tên – không phải hệ thống phân quyền. Quyền ghi dựa trên `EDIT_PIN`.

## 2. Biến môi trường

| Biến | Ý nghĩa |
|---|---|
| `KV_REST_API_URL`, `KV_REST_API_TOKEN` | Redis Upstash. Thiếu thì dữ liệu chỉ nằm trong localStorage. |
| `EDIT_PIN` | Bắt buộc cho giao bài và AI; tùy chọn khi sửa bộ câu hỏi dùng chung. |
| `AUTH_URL`, `AUTH_SECRET`, `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET` | Đăng nhập Google (tùy chọn). |
| `GEMINI_API_KEY`, `GEMINI_MODEL` | Gemini; model mặc định `gemini-3.5-flash-lite`. |

## 3. Routes

- Trang: `/`, `/play`, `/edit`, `/join`, `/assignments`, `/ai`, `/auth/error`, `/flashcards`, `/crossword`, `/matching`, `/zombies`, `/flying-words`.
- API: `/api/ai`, `/api/sets`, `/api/sets/[id]`, `/api/assignments`, `/api/assignments/[code]` (+ `report`, `submit`), `/api/auth/[...nextauth]`.

## 4. Mô hình dữ liệu (`src/lib/types.ts`)

- `Question { id, prompt, answer, points, image?, options?, correctIndex? }`.
- `QuestionSet { id, title, description, questions, updatedAt, category? }`.
- `Assignment`, `Submission`, `StudentAssignment`, `Team`, `GameState`.
- `Tile` = câu hỏi hoặc powerup: `bonus`, `lose`, `double`, `steal`, `swap`, `give`.

## 5. Lưu trữ

- localStorage: `team-quiz:sets`, `team-quiz:game`, `team-quiz:seeded`, `team-quiz:hidden`, `team-quiz:migrated`, `team-quiz:pin`.
- Mỗi trò chơi tự lưu bộ riêng trong trình duyệt (tối đa 100 bộ): `team-quiz:matching-sets`, `team-quiz:crosswords`, `team-quiz:flying-words-sets`, `team-quiz:flashcard-decks`.
- Redis: hash `team-quiz:sets` (`SETS_HASH`, tối đa 500 bộ), `team-quiz:assignments`, `team-quiz:submissions:<code>`, `team-quiz:ai:minute`, `team-quiz:ai:day`.
- `fetchSets()` rơi về dữ liệu local khi không có cloud; lần đầu kết nối cloud sẽ migrate bộ tự tạo lên.
- Bộ có sẵn chỉ bị **ẩn** (`hidden`), không xóa.
- Ghi dữ liệu: `writeRequest` gửi header `x-edit-pin`, gặp 401 thì hỏi lại PIN. Lỗi đọc bằng `errorMessage(response)`.
- Server: `checkPin(request)`, `saveSetFromRequest` → `upsertSet` giới hạn 200 KB và chạy `parseSet`.
- Giao bài: hiệu lực 7 ngày, tối đa 1.000 bài nộp, chấm điểm tự động.

## 6. Mẫu parser và luật trò chơi

Mỗi trò chơi có file trong `src/lib/`, parser trả về **đối tượng hợp lệ hoặc chuỗi lỗi tiếng Việt**, dùng `isValidId`/`isValidImage` từ `validate.ts`, và export bộ mẫu `SAMPLE_*`:

| Trò chơi | File | Parser | Luật chính |
|---|---|---|---|
| Thẻ lật tiếng Anh | `flashcards.ts` | `parseFlashcardDeck`, `parseFlashcards` | Tối đa 30 thẻ (`MAX_FLASHCARDS`), có ảnh. |
| Ô chữ khóa bí mật | `crossword.ts` | `parseCrossword` | Từ khóa 2–12 chữ, đáp án ≤ 20 ký tự; `normalizeWord` bỏ dấu, khoảng trắng, gạch nối. |
| Kéo thả nối ý | `matching.ts` | `parseMatchingSet` | 2–8 cặp duy nhất; `connectPair` thay cả hai liên kết cũ. |
| Chặn Zombie | `zombies.ts` | dùng `Question` + `prepareZombieQuestions` | 30 s/câu, sai tăng tốc 50%, ≤ 3 phương án nhiễu lấy từ đáp án khác, tạm dừng khi ẩn trang. |
| Từ ngữ biết bay | `flyingWords.ts` | `parseFlyingWordsSet` | 1–10 câu, mỗi câu 2–12 từ, 30 s/câu; `isCorrectOrder`. |
| Câu hỏi AI | `ai-validation.ts` | `parseGeneratedQuestions` | Số câu phải khớp `count`. |

## 7. Danh mục trò chơi

- `src/lib/gameCatalog.ts`: `{ id, title, description, icon, status }`; status: `tile`, `flashcards`, `crossword`, `matching`, `zombies`, `flying-words`, `planned`.
- `src/components/HomeView.tsx`: `FEATURES` (tab) và `GAME_ACTIONS` (status → `{ href, label }`). Trò chơi chưa có trong `GAME_ACTIONS` hiển thị là "sắp ra mắt".

**Checklist thêm trò chơi mới**

1. Thêm/đổi status trong `gameCatalog.ts`.
2. Tạo `src/lib/<game>.ts`: kiểu dữ liệu, parser trả chuỗi lỗi tiếng Việt, `SAMPLE_*`.
3. Tạo `src/app/<game>/page.tsx` với `STORAGE_KEY` riêng (`team-quiz:<game>-sets`), tối đa 100 bộ, có chế độ tạo/sửa/chơi.
4. Thêm mục vào `GAME_ACTIONS` trong `HomeView.tsx`.
5. Gắn `GameAiGenerator` (xem mục 8).
6. Test: `tests/<game>.test.mjs` + cập nhật `tests/game-catalog.test.mjs`.
7. Cập nhật `README.md`.

## 8. AI (Gemini)

- `generateAiText(instruction, input, structured)` – `structured`: `true` (câu hỏi), `"flashcards"`, `"matching"`, `"crossword"`, `"flying-words"`. Timeout 30 s, 4096 token, safety `BLOCK_LOW_AND_ABOVE`.
- Giới hạn tần suất bằng Lua script trên Redis: 10 lượt/60 s, 100 lượt/ngày. Lỗi là `AiError(message, status)`.
- `src/app/api/ai/route.ts`: body ≤ 4000 byte; `kind` ∈ `questions | flashcards | matching | crossword | flying-words | help`; mọi kind trừ `help` cần `EDIT_PIN` + `checkPin`.
  - `topic` ≤ 300 ký tự, `level` ≤ 60 (`validAiInput`).
  - `count`: 2–8 cho matching, 2–10 cho loại khác; crossword dùng `keyword` 2–12 chữ A–Z thay cho count.
  - Kết quả luôn chạy qua parser của trò chơi; lệch số lượng → 502.
- `GameAiGenerator` props: `kind`, `keyword`, `hasContent`, `busy`, `setBusy`, `onApply(data, topic, count)`; cấp độ Mầm non / Tiểu học / THCS; hỏi xác nhận trước khi thay nội dung; tông màu violet.

**Checklist thêm chế độ AI mới**

1. Schema mới trong `gemini.ts` (`structured` mới).
2. Nhánh `kind` mới trong route, validate input, gọi parser.
3. Mở rộng union `kind` của `GameAiGenerator`.
4. Thêm nhánh vào `tests/fixtures/ai-mock.cjs` + test trong `tests/ai-integration.test.mjs`.

## 9. Hình ảnh

- Chấp nhận link HTTP(S) hoặc tải lên PNG/JPEG/GIF/WebP ≤ 80 KB, lưu dạng data URL; kiểm tra bằng `isValidImage`.
- Hiển thị bằng `src/components/QuestionImage.tsx` (`{ src, alt }`); luôn có alt tiếng Việt.

## 10. Quy ước giao diện (cho trẻ em)

- Nền gradient indigo → pink, góc `rounded-xl`/`rounded-2xl`, chữ to, màu tươi, biểu tượng emoji.
- Vùng chạm ≥ 44px: nút `min-h-11`, `.back-link`.
- Focus: outline indigo 3px qua `focus-visible`.
- Animation phải tôn trọng `prefers-reduced-motion`.
- Lỗi: `role="alert"` nền rose; thông báo: `role="status"` nền emerald.
- Toàn bộ chữ tiếng Việt, câu ngắn, thân thiện với bé.

## 11. Quy trình kiểm tra

1. `npm run build`
2. `npm run lint`
3. `git diff --check`
4. `node --test tests/` – trước đó dừng tiến trình `next` cũ **theo PID** vì `google-auth.test.mjs` dùng cổng 39974.
5. Smoke test các trang chính trả HTTP 200.

**AI mock** (`tests/fixtures/ai-mock.cjs`): chọn phản hồi theo thuộc tính `responseSchema` – `left` → matching, `sentence` → flying-words, `clue` → crossword, `english` → flashcards, có `responseMimeType` → câu hỏi, còn lại → help. Từ khóa trong input ép lỗi: `mock-quota`, `mock-blocked`, `mock-invalid`, `mock-json`, `mock-duplicate`. Redis giả: `https://mock-redis.invalid`. Test import trực tiếp file `.ts`.

## 12. Commit & Windows

- Không commit `.idea/`; chỉ stage đường dẫn liên quan.
- Tiêu đề commit tiếng Anh ("Add …", "Fix …") + trailer `Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>`.
- PowerShell: dùng `;` trước cmdlet (không `&&`), cảnh báo CRLF vô hại, dừng tiến trình bằng `Stop-Process -Id <PID>`.
