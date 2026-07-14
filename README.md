# Zalo Ticket Bot (Phiên bản Helpdesk Tự động Toàn diện)

Bot Zalo chuyên nghiệp biến Zalo OA thành hệ thống **Tổng đài Hỗ trợ IT (Helpdesk)** với sức mạnh của Trí tuệ Nhân tạo (AI Agentic) và hệ thống Ticket Lifecycle chuẩn quốc tế.

## 🌟 Các tính năng nổi bật

### 1. Trợ lý AI có Trí nhớ (Conversation Context)
- Tích hợp AI (Sử dụng API tương thích chuẩn OpenAI, ưu tiên **Groq LLaMA 3.3** để đạt tốc độ phản hồi siêu tốc).
- Tự động trả lời các câu hỏi thường gặp dựa trên File cơ sở tri thức (`faq.txt`).
- AI có khả năng nhớ ngữ cảnh (5 lượt chat gần nhất) cho từng người dùng riêng biệt để trò chuyện tự nhiên hơn.
- Nếu người dùng báo lỗi kỹ thuật (VD: "Máy chiếu bị hỏng"), AI tự động kết thúc phiên chat, lưu lại lịch sử, gán **Mã Yêu Cầu (Ticket ID)** và chuyển tiếp cảnh báo tức thời cho Admin IT.

### 2. Quy trình Xử lý Sự Cố (Ticket Lifecycle)
- **Tự động nhận diện:** Nhận biết các lỗi thông qua file từ khóa cấu hình cứng (`ticket_keywords.txt`) và AI Prompt với tỷ lệ chính xác 100%. (Đã phân biệt rõ "Mất wifi" và "Xin pass wifi").
- **Chuyển tiếp báo động:** Gửi ngay thông báo `🔔 CÓ YÊU CẦU HỖ TRỢ MỚI! [Mã Yêu Cầu: #X]` cho Admin.
- **Xác nhận linh hoạt (4 Cách chốt sự cố):**
  1. **Nhắn trực tiếp mã:** Gõ `#ID nội dung` (VD: `#12 Đã thay mực`).
  2. **Quote (Trả lời):** Bấm Quote tin nhắn báo động trên Zalo và gõ nội dung (VD: "Đã sửa xong").
  3. **Trả lời nhanh:** Nhắn "Xong" (Bot tự động gán cho sự cố mới nhất).
  4. **Web Dashboard:** Đóng trực tiếp trên giao diện trình duyệt web.
- **Đồng bộ tự động:** Hệ thống tự động báo kết quả Zalo về cho người bị lỗi và lưu vào Bảng báo cáo.

### 3. Bảng Điều Khiển Tương Tác (Interactive Web Dashboard)
- **Giao diện Web xịn xò:** Thay vì xuất file tĩnh, hệ thống cung cấp một trang Bảng tin Động tại link `/report`, thiết kế Responsive (Dạng thẻ Card cho Mobile, tối đa 1400px cho Desktop).
- **Cập nhật Thời gian thực (Real-time):** Tự động đồng bộ dữ liệu (long-polling) mỗi 10 giây. Không cần tải lại trang (F5), mọi sự cố mới nhất sẽ tự động cập nhật lên màn hình mà vẫn giữ nguyên bộ lọc đang dùng.
- **Thao tác trực tiếp 2 chiều:** Admin có thể điền thông tin và đóng sự cố (Resolve) ngay trên Web.
- **Bảo mật bằng Form Đăng Nhập & JWT:** Thay vì dùng Basic Auth mặc định của trình duyệt, hệ thống sở hữu trang đăng nhập HTML tùy chỉnh (`/login`) với cơ chế bảo mật JWT Token lưu trong Cookie. Hỗ trợ tính năng tự động Đăng Xuất sau 30 phút treo máy không thao tác.
- **Giao diện Tối/Sáng (Dark/Light Mode):** Hỗ trợ chuyển đổi chế độ nền tối/sáng bảo vệ mắt, tự động đồng bộ trên cả trang Đăng nhập và Bảng điều khiển (lưu qua LocalStorage).
- **Xóa toàn bộ dữ liệu:** Tích hợp nút bấm dọn dẹp hệ thống 1-click trên Web. Tự động đưa bộ đếm ID sự cố (Ticket ID) về lại số #1.
- **In Báo Cáo Chuyên Nghiệp:** Sử dụng tính năng in gốc của trình duyệt (`window.print`) kết hợp bộ luật CSS `@media print` tĩnh giúp bản in dạng PDF đạt chuẩn khổ ngang (Landscape), giữ nguyên màu sắc trạng thái và tự động tàng hình các form nhập liệu dư thừa.

### 4. Hệ Thống Phát Thanh (Broadcast)
- **Quản lý Nhóm:** Bot tự động nhận diện các group chat. Hoặc Admin dùng lệnh `/addgroup`, `/removegroup`.
- **Phát Thông Báo:** Admin gõ lệnh `/thongbao <nội dung>` để phát một bản tin đồng loạt cho toàn bộ các nhóm nhà trường.

### 5. Bộ lọc Kiểm duyệt (Censorship)
- File `blacklist_keywords.txt` giúp chặn đứng các từ ngữ thô tục, nhạy cảm trước khi nó lọt vào hệ thống.

## 🚀 Triển khai trên máy chủ Ubuntu

### Bước 1: Cài đặt Node.js và PM2
```bash
sudo apt update && sudo apt install curl -y
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install nodejs -y
sudo npm install pm2 -g
```

### Bước 2: Tải mã nguồn
```bash
git clone https://github.com/hanmn1k99/ticket-bot-zalo.git
cd ticket-bot-zalo
npm install
```

### Bước 3: Cấu hình biến môi trường (.env)
Tạo file `.env` với nội dung sau:
```env
# Token của Zalo OA
BOT_TOKEN=YOUR_BOT_TOKEN_HERE

# Khóa bí mật dùng để bảo mật Webhook của Zalo
WEBHOOK_SECRET_TOKEN=ticket-bot-secret

# Cổng khởi chạy hệ thống
PORT=1092

# Tên chính xác của bot (Ví dụ: Ticket Bot) để nhận diện người gọi
BOT_NAME=Ticket Bot

# Domain public của bạn (Ví dụ dùng Cloudflare Tunnels: https://api.yourdomain.com)
PUBLIC_URL=https://my-domain.com

# API Key cho AI (Dùng Groq hoặc bất kỳ hệ thống tương thích OpenAI nào)
AI_API_KEY=your_groq_or_openai_api_key

# Tài khoản và Mật khẩu đăng nhập Web Dashboard
ADMIN_USERNAME=your-username
ADMIN_PASSWORD=your-password

# Chuỗi bí mật dùng để mã hóa Cookie bảo vệ trang Web (Nhập ngẫu nhiên một chuỗi thật dài)
JWT_SECRET=your_super_secret_jwt_key_here
```

### Bước 4: Chạy Bot bằng PM2
```bash
pm2 start index.js --name "zalo-ticket-bot"
pm2 save
pm2 startup
```

### Bước 5: Đăng ký Zalo Webhook
Sử dụng cURL để bắn URL của máy chủ lên hệ thống Zalo (thay `YOUR_BOT_TOKEN_HERE` và domain của bạn):
```bash
curl -X POST "https://bot-api.zaloplatforms.com/bot<YOUR_BOT_TOKEN_HERE>/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{"url":"https://my-domain.com/webhook","secret_token":"ticket-bot-secret"}'
```

### Bước 6: Khởi tạo Quyền Quản Trị (Admin)
1. Dùng Zalo cá nhân, chat với OA Bot lệnh: `/install`.
2. Hệ thống sẽ ghi nhận bạn là Admin. Từ giờ, mọi báo lỗi sẽ nổ về Zalo của bạn.
3. Để hủy quyền Admin: `/uninstall`.
4. Để mở Báo Cáo Web: `/report`.
5. Để xóa sạch Database thủ công: `/clean`.

### Bước 7: Thêm Logo và Favicon cho Trang Web
Hệ thống hỗ trợ thay đổi Logo và Favicon tùy chỉnh. Bạn chỉ cần:
1. Tạo thư mục tên là `assets` nằm cùng cấp với file `index.js`.
2. Upload file favicon (Tên bắt buộc: `favicon.png`, khuyên dùng 64x64px).
3. Upload file logo (Tên bắt buộc: `logo.png`, khuyên dùng hình chữ nhật ngang, cao khoảng 80-100px, nền trong suốt).
Hệ thống sẽ tự động hiển thị trên giao diện Web Dashboard mà không cần khởi động lại.

---
*Phát triển và thiết kế bởi Đội ngũ AI Agentic*
