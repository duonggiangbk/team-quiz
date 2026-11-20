# Ô Số Đồng Đội

Trò chơi đố vui chia đội cho lớp học: chọn bộ câu hỏi, chia đội, lật ô số và cộng điểm. Có sẵn nhiều bộ câu hỏi tiếng Việt, và bạn có thể tự tạo bộ câu hỏi riêng.

## Chạy trên máy

```bash
npm install
npm run dev
```

Mở http://localhost:3000.

## Cơ sở dữ liệu miễn phí (Upstash Redis)

Không có cơ sở dữ liệu, bộ câu hỏi tự tạo chỉ được lưu trong trình duyệt (localStorage). Khi kết nối Upstash Redis, bộ câu hỏi được chia sẻ giữa mọi thiết bị.

1. Vercel → dự án `team-quiz` → **Storage** → **Create Database** → **Upstash for Redis** (gói Free).
2. **Connect** với tất cả môi trường (Production, Preview, Development).
3. **Deployments** → **Redeploy**.

Vercel tự thêm `KV_REST_API_URL` và `KV_REST_API_TOKEN`. Khi chạy trên máy, chép `.env.example` thành `.env.local` rồi điền hai giá trị này (hoặc chạy `vercel env pull .env.local`).

Bộ câu hỏi đã lưu trên trình duyệt sẽ được tự động tải lên lần đầu khi có cơ sở dữ liệu.

### Mã PIN chỉnh sửa (tùy chọn)

Mặc định ai mở trang cũng có thể thêm, sửa, xóa bộ câu hỏi dùng chung. Để giới hạn, đặt biến môi trường `EDIT_PIN` trên Vercel rồi Redeploy. Khi lưu hoặc xóa, trang sẽ hỏi mã PIN một lần và ghi nhớ trên thiết bị đó.

Giới hạn: tối đa 500 bộ câu hỏi dùng chung.
