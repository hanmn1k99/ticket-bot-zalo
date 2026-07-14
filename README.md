# Zalo Ticket Bot (Phiên bản Helpdesk Tự động Toàn diện)

Bot Zalo chuyên nghiệp biến Zalo OA thành hệ thống **Tổng đài Hỗ trợ IT (Helpdesk)** với sức mạnh của Trí tuệ Nhân tạo (AI Agentic) và hệ thống Ticket Lifecycle chuẩn quốc tế.

## 🌟 Các tính năng nổi bật

### 1. Trợ lý AI có Trí nhớ (Conversation Context)
- Tích hợp AI (Sử dụng API tương thích chuẩn OpenAI, ưu tiên **Groq LLaMA 3.3** để đạt tốc độ phản hồi siêu tốc).
- Tự động trả lời các câu hỏi thường gặp dựa trên File cơ sở tri thức (`faq.txt`).
- AI có khả năng nhớ ngữ cảnh (5 lượt chat gần nhất) cho từng người dùng riêng biệt để trò chuyện tự nhiên hơn.
- Nếu người dùng báo lỗi kỹ thuật (VD: "Máy chiếu bị hỏng"), AI tự động kết thúc phiên chat, lưu lại lịch sử, gán **Mã Yêu Cầu (Ticket ID)** và chuyển tiếp cảnh báo tức thời cho Admin IT.

### 2. Quy trình Xử lý Sự Cố (Ticket Lifecycle)
- **Tự động nhận diện:** Nhận biết các lỗi thông qua file từ khóa cấu hình cứng (`ticket_keywords.txt`) với tỷ lệ chính xác 100%.
- **Chuyển tiếp báo động:** Gửi ngay thông báo `🔔 CÓ YÊU CẦU HỖ TRỢ MỚI! [Mã Yêu Cầu: #X]` cho Admin.
- **Xác nhận 1 chạm (One-tap resolve):** Admin chỉ cần dùng tính năng **"Trả lời" (Quote)** tin nhắn báo động trên Zalo và gõ "Đã sửa xong", hệ thống sẽ lập tức:
  - Đánh dấu sự cố là **Đã hoàn thành**.
  - Tự động nhắn tin Zalo báo lại cho người bị sự cố gốc để họ an tâm.
  - Cập nhật lịch sử xử lý vào Bảng báo cáo.

### 3. Báo Cáo Trực Tuyến Động (Dynamic Web Route)
- **Giao diện Web xịn xò:** Thay vì xuất file tĩnh, hệ thống cung cấp một trang Bảng tin Động tại link `/report`.
- **Bảo mật Basic Auth:** Chỉ những ai có tài khoản (`minhhan`) và mật khẩu (`Hannguyen@113`) mới vào xem được.
- **Bộ Lọc Thông Minh (Live Search):** Gõ tìm kiếm ngay trên bảng để thu hẹp kết quả trong tíc tắc.
- **Xuất PDF Khổ A4:** Chuyển đổi bảng dữ liệu thành file PDF ngay trên trình duyệt mà không cần cài thêm thư viện phức tạp.

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

# Domain public của bạn (Ví dụ dùng Cloudflare Tunnels: https://api.minhhan.net)
PUBLIC_URL=https://my-domain.com

# API Key cho AI (Dùng Groq hoặc bất kỳ hệ thống tương thích OpenAI nào)
AI_API_KEY=your_groq_or_openai_api_key
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

---
*Phát triển và thiết kế bởi Đội ngũ AI Agentic*