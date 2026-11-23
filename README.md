# Ô Số Đồng Đội

Trò chơi đố vui chia đội cho lớp học: chọn bộ câu hỏi, chia đội, lật ô số và cộng điểm. Có sẵn nhiều bộ câu hỏi tiếng Việt, và bạn có thể tự tạo bộ câu hỏi riêng.

Có các bộ hỗ trợ giáo viên dạy tiếng Anh cho trẻ, thuộc hai chủ đề "Anh văn mầm non" và "Anh văn tiểu học".

## Câu hỏi có hình

Trong trang tạo hoặc sửa bộ câu hỏi, thêm hình cho từng câu bằng liên kết HTTP(S) hoặc chọn ảnh PNG, JPEG, GIF, WebP từ máy (tối đa 80 KB mỗi ảnh). Có thể xem trước và xóa hình trước khi lưu. Bộ câu hỏi tối đa 200 KB; dùng liên kết nếu cần nhiều hình. Ảnh tải lên được lưu cùng bộ câu hỏi, còn liên kết cần truy cập được trên thiết bị chơi. Bộ mẫu **Bé vui cùng hình ảnh** có sẵn các hình minh họa.

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

## Giao bài trắc nghiệm và báo cáo

Tính năng này cần Upstash và **bắt buộc** đặt `EDIT_PIN`. Trong trang soạn câu hỏi, bật “Câu trắc nghiệm để giao bài”, nhập 2–4 lựa chọn khác nhau và chọn một đáp án đúng. Trong **Giao bài & báo cáo**, chọn bộ câu hỏi rồi tạo mã; chỉ các câu trắc nghiệm được đưa vào bài. Gửi mã hoặc sao chép liên kết cho học sinh. Các bé cũng có thể chọn **Nhập mã làm bài** ở trang chủ.

Bài giao là bản sao của các câu hỏi tại thời điểm tạo, có hạn nộp 7 ngày. Mỗi bài được tự động chấm theo điểm từng câu, tối đa 1.000 lượt nộp. Giáo viên dùng PIN chung để xem điểm và xóa bài giao cùng kết quả. Dữ liệu không tự xóa khi hết hạn: hãy xóa bài giao khi không còn cần lưu kết quả.

Học sinh tự nhập tên, không cần tài khoản và có thể nộp nhiều lần; tên không được xác minh. Bất kỳ ai có liên kết hoặc mã đều có thể làm bài khi còn hạn. Mã PIN chung được lưu trên thiết bị giáo viên sau khi nhập đúng; tính năng không cung cấp quản lý tài khoản hoặc giới hạn tốc độ truy cập, vì vậy không nên đưa thông tin nhạy cảm vào bài hoặc tên học sinh.
