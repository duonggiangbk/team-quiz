# Ô Số Đồng Đội

Trò chơi đố vui chia đội cho lớp học: chọn bộ câu hỏi, chia đội, lật ô số và cộng điểm. Có sẵn nhiều bộ câu hỏi tiếng Việt, và bạn có thể tự tạo bộ câu hỏi riêng.

Có các bộ hỗ trợ giáo viên dạy tiếng Anh cho trẻ, thuộc hai chủ đề "Anh văn mầm non" và "Anh văn tiểu học".

Trang chủ có danh mục trò chơi, kho câu hỏi, bài đã giao, công cụ AI và flashcard. Chọn **Trò chơi → Ô Số Đồng Đội → Chọn bộ câu hỏi** để xem danh sách bộ câu hỏi hiện có và chơi; danh sách này cũng có trong **Kho câu hỏi** để quản lý. Thẻ lật tiếng Anh cũng sử dụng được từ danh mục trò chơi; các trò khác trong danh mục được ghi rõ là chưa triển khai. Các mục cộng đồng, tiện ích dạy học, mô phỏng bài học và khóa học hiện chỉ là mục giới thiệu, chưa có chức năng.

## Flashcard tiếng Anh

Chọn **Flashcard tiếng Anh** ở trang chủ để học từ vựng theo các chủ đề con vật, trái cây, màu sắc và số đếm. Chạm thẻ để xem nghĩa, dùng nút trước/sau để đổi thẻ và nghe phát âm bằng giọng đọc của trình duyệt. Tính năng phát âm phụ thuộc trình duyệt và giọng tiếng Anh trên thiết bị; vị trí thẻ không được lưu khi rời trang.

Chọn **Tạo bộ thẻ mới** để tự nhập tiếng Anh, tiếng Việt và emoji, hoặc nhập chủ đề, độ tuổi và số thẻ để AI tạo bản nháp. Kiểm tra, chỉnh sửa rồi lưu; có thể sửa hoặc xóa các bộ tự tạo. Mỗi bộ tối đa 30 thẻ, tối đa 100 bộ. Các bộ tự tạo chỉ lưu trên trình duyệt hiện tại, không đồng bộ qua tài khoản hay thiết bị khác và có thể mất khi xóa dữ liệu trình duyệt. Tạo bằng AI cần `GEMINI_API_KEY`, Upstash và `EDIT_PIN` như phần Trợ lý AI; chủ đề được gửi đến Google nên không nhập thông tin cá nhân.

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

## Đăng nhập bằng Google (tùy chọn)

Học sinh và giáo viên vẫn có thể sử dụng website mà không đăng nhập. Đăng nhập chỉ hiển thị tên tài khoản; không thay thế PIN giáo viên, không tạo quyền giáo viên và không tách dữ liệu theo tài khoản. Không lưu hồ sơ tài khoản trong cơ sở dữ liệu của ứng dụng.

Để bật tính năng:

1. Vào [Google Cloud Console](https://console.cloud.google.com/), tạo hoặc chọn dự án. Trong **Google Auth Platform**, thiết lập màn hình đồng ý OAuth; nếu ứng dụng đang ở chế độ thử nghiệm, thêm tài khoản sử dụng vào danh sách người kiểm thử.
2. Tạo **OAuth client ID** loại **Web application**. Thêm địa chỉ chuyển hướng chính xác: `https://ten-mien-cua-ban/api/auth/callback/google`. Để chạy trên máy, thêm `http://localhost:3000/api/auth/callback/google`.
3. Trong Vercel → dự án → **Settings → Environment Variables**, đặt `AUTH_GOOGLE_ID` và `AUTH_GOOGLE_SECRET` theo thông tin OAuth của Google, `AUTH_URL` là địa chỉ gốc website (ví dụ `https://ten-mien-cua-ban`, không có dấu `/` cuối), và `AUTH_SECRET` là chuỗi ngẫu nhiên bí mật dài ít nhất 32 ký tự. Có thể tạo chuỗi này bằng `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"`.
4. Triển khai lại. Khi chạy trên máy, điền các biến tương ứng vào `.env.local` và dùng `AUTH_URL=http://localhost:3000`.

Không chia sẻ hoặc đưa client secret và `AUTH_SECRET` vào mã nguồn. Dùng cấu hình và địa chỉ OAuth riêng cho mỗi môi trường hoặc tên miền; không dùng chung `AUTH_URL` production cho các bản preview.

## Giao bài trắc nghiệm và báo cáo

Tính năng này cần Upstash và **bắt buộc** đặt `EDIT_PIN`. Trong trang soạn câu hỏi, bật “Câu trắc nghiệm để giao bài”, nhập 2–4 lựa chọn khác nhau và chọn một đáp án đúng. Trong **Giao bài & báo cáo**, chọn bộ câu hỏi rồi tạo mã; chỉ các câu trắc nghiệm được đưa vào bài. Gửi mã hoặc sao chép liên kết cho học sinh. Các bé cũng có thể chọn **Nhập mã làm bài** ở trang chủ.

Bài giao là bản sao của các câu hỏi tại thời điểm tạo, có hạn nộp 7 ngày. Mỗi bài được tự động chấm theo điểm từng câu, tối đa 1.000 lượt nộp. Giáo viên dùng PIN chung để xem điểm và xóa bài giao cùng kết quả. Dữ liệu không tự xóa khi hết hạn: hãy xóa bài giao khi không còn cần lưu kết quả.

Học sinh tự nhập tên, không cần tài khoản và có thể nộp nhiều lần; tên không được xác minh. Bất kỳ ai có liên kết hoặc mã đều có thể làm bài khi còn hạn. Mã PIN chung được lưu trên thiết bị giáo viên sau khi nhập đúng; tính năng không cung cấp quản lý tài khoản hoặc giới hạn tốc độ truy cập, vì vậy không nên đưa thông tin nhạy cảm vào bài hoặc tên học sinh.

## Trợ lý AI

Thêm `GEMINI_API_KEY` vào Environment Variables trên Vercel và triển khai lại. Khi chạy trên máy, đặt biến trong `.env.local`; không đưa khóa vào mã nguồn hoặc trình duyệt. AI yêu cầu cấu hình Upstash để giới hạn chung 10 lượt trong khoảng 60 giây và 100 lượt trong khoảng 24 giờ, tính từ lượt đầu tiên của mỗi khoảng. Tạo câu hỏi bằng AI còn yêu cầu `EDIT_PIN`. Mặc định dùng `gemini-3.5-flash-lite`; có thể đặt `GEMINI_MODEL` nếu tài khoản không hỗ trợ model này. Hạn mức thực tế phụ thuộc tài khoản và model.

Trong **Soạn bộ câu hỏi**, nhập chủ đề, chọn độ tuổi và số câu để tạo câu trắc nghiệm; câu mới được thêm vào cuối, cần giáo viên kiểm tra trước khi lưu. **Trợ lý học tập** ở trang chủ trả lời từng câu hỏi độc lập, không lưu lịch sử. Nội dung được gửi đến Google và gói miễn phí có thể dùng dữ liệu để cải thiện sản phẩm: không nhập dữ liệu cá nhân. AI có thể sai hoặc đưa ra nội dung không phù hợp dù có bộ lọc; trẻ cần dùng dưới sự giám sát của giáo viên hoặc phụ huynh. Nếu bật thanh toán, việc sử dụng API có thể phát sinh phí.
