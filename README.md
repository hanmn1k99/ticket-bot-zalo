# Zalo Ticket Bot - IT Helpdesk AI Agentic System

Bot Zalo chuyên nghiệp biến **Zalo Official Account (OA)** thành hệ thống **Tổng đài Hỗ trợ IT (Helpdesk)** với Trí tuệ Nhân tạo (AI Agentic) và quy trình quản lý sự cố (Ticket Lifecycle) chuẩn quốc tế.

---

## 🌟 Các Tính Năng Nổi Bật

### 1. 🤖 Trợ lý AI có Trí nhớ (Conversation Context)
- **Tích hợp LLM**: Hỗ trợ Groq LLaMA 3.3 / OpenAI compatible API cho tốc độ phản hồi siêu tốc.
- **Cơ sở tri thức (FAQ)**: Tự động tra cứu và trả lời các thắc mắc thường gặp dựa trên file [`faq.txt`](faq.txt) hoặc cấu hình trên Web.
- **Quản lý ngữ cảnh**: Nhớ tối đa 5 lượt hội thoại gần nhất cho từng người dùng để giao tiếp tự nhiên.
- **Phân loại tự động**: Tự động nhận diện tin nhắn là câu hỏi tra cứu (ANSWER) hay báo lỗi sự cố (TICKET). Khi phát hiện lỗi kỹ thuật, AI tự động chốt phiên chat, trích xuất địa điểm, sinh **Mã Yêu Cầu (Ticket ID)** và gửi cảnh báo ngay cho IT Admin.

### 2. 🎫 Quy trình Xử lý Sự cố (Ticket Lifecycle)
- **Tự động nhận diện & Cảnh báo**: Nhận dạng từ khóa sự cố (`ticket_keywords.txt`) và gửi ngay thông báo đến Zalo IT Admin:
  ```text
  🔔 CÓ YÊU CẦU HỖ TRỢ MỚI! [#ID]
  ```
- **4 Phương thức chốt sự cố linh hoạt**:
  1. **Cú pháp trực tiếp**: `#ID [nội dung xử lý]` (Ví dụ: `#12 Đã thay mực máy in`).
  2. **Quote (Trả lời)**: Bấm Quote tin nhắn báo lỗi trên Zalo kèm nội dung xử lý.
  3. **Lệnh Bot**: `/nhan [ID]`, `/xong [ID] [nội dung]`, `/tuchoi [ID] [lý do]`.
  4. **Web Dashboard**: Tiếp nhận, từ chối hoặc hoàn thành sự cố trực tiếp trên giao diện trình duyệt.
- **Tự động phản hồi**: Tự động thông báo kết quả xử lý qua Zalo về cho người yêu cầu.

### 3. 🖥️ Bảng Điều Khiển Web (Interactive Web Dashboard)
- **Giao diện Responsive**: Trang Bảng tin tại `/report` (Dạng thẻ Card cho Mobile, dạng bảng chuẩn cho Desktop).
- **Đồng bộ Thời gian thực (Real-time)**: Tự động cập nhật dữ liệu (long-polling 10s) không cần tải lại trang.
- **Quản lý Cài đặt (`/settings`)**: Chỉnh sửa trực tiếp cơ sở tri thức FAQ và quản lý danh sách Nhóm.
- **Phân quyền & Bảo mật**: Xác thực JWT token lưu trong HttpOnly Cookie. Phân quyền chặt chẽ giữa `SUPER_ADMIN` và `ADMIN`.
- **Chế độ Sáng/Tối (Light/Dark Mode)**: Tự động lưu cấu hình giao diện ưa thích qua LocalStorage.
- **In Báo Cáo Chuyên Nghiệp**: Hỗ trợ in báo cáo xuất sắc chuẩn khổ ngang (Landscape) qua `@media print`.

### 4. 📢 Hệ thống Thông báo (Broadcast) & Bộ lọc
- **Broadcast tin nhắn**: Phát thông báo đồng loạt đến các nhóm đăng ký bằng lệnh `/thongbao [nội dung]`.
- **Bộ lọc từ khóa cấm (`blacklist_keywords.txt`)**: Loại bỏ các tin nhắn không hợp lệ hoặc từ ngữ nhạy cảm.

---

## 🏗️ Cấu Trúc Dự Án (Modular Architecture)

Mã nguồn được tổ chức theo kiến trúc Modular sạch sẽ, dễ bảo trì và mở rộng:

```text
ticket-bot-zalo/
├── config/
│   └── constants.js          # Cấu hình hằng số & biến môi trường
├── services/
│   ├── aiService.js          # Phân loại AI, bộ nhớ hội thoại & từ khóa
│   └── zaloService.js        # Giao tiếp API Zalo OA & gửi thông báo
├── middleware/
│   └── authMiddleware.js     # Middleware xác thực JWT token
├── views/
│   ├── authViews.js          # Render HTML Login, Setup, Forgot Password
│   ├── dashboardView.js      # Render HTML & bảng dữ liệu Dashboard (/report)
│   └── settingsView.js       # Render HTML trang Cài đặt (/settings)
├── routes/
│   ├── authRoutes.js         # API Đăng nhập, Khởi tạo, Quên mật khẩu
│   ├── ticketRoutes.js       # API Thao tác Ticket sự cố
│   ├── adminRoutes.js        # API Phân quyền & Quản lý Admin Zalo
│   ├── userRoutes.js         # API Quản lý tài khoản Web Admin
│   ├── settingRoutes.js      # API Cài đặt FAQ & Nhóm
│   └── webhookRoutes.js      # Webhook Zalo OA & Lệnh Bot
├── database.js               # Lớp truy xuất dữ liệu
├── cronjobs.js               # Tác vụ định kỳ (Báo cáo & dọn dẹp hàng tháng)
├── reset.js                  # Script reset tài khoản quản trị
├── faq.txt                   # Dữ liệu FAQ mặc định
├── ticket_keywords.txt       # Từ khóa nhận diện sự cố
├── blacklist_keywords.txt    # Từ khóa cấm
└── index.js                  # Entrypoint chính của ứng dụng
```

---

## 🚀 Hướng Dẫn Cài Đặt & Triển Khai

### 1. Yêu cầu Hệ thống
- **Node.js**: v18.0.0 trở lên.
- **Zalo Official Account (OA)** đã đăng ký Bot API.
- **Groq API Key** (hoặc API Key tương thích OpenAI / Gemini).

### 2. Cài Đặt Mã Nguồn

```bash
git clone https://github.com/hanmn1k99/ticket-bot-zalo.git
cd ticket-bot-zalo
npm install
```

### 3. Cấu Hình Biến Môi Trường (`.env`)

Tạo file `.env` tại thư mục gốc của dự án:

```env
# Zalo OA Bot Configuration
BOT_TOKEN=your_zalo_bot_token_here
WEBHOOK_SECRET_TOKEN=ticket-bot-secret
BOT_NAME=Ticket Bot
PORT=3000
PUBLIC_URL=https://your-domain.com

# AI API Configuration
AI_API_KEY=your_groq_or_openai_api_key

# Security Configuration
JWT_SECRET=your_super_secret_jwt_key_here

# Tone & Environment Settings
BOT_ORG_NAME=trường Meyschool
BOT_USER_ROLE=Giáo viên
BOT_ENVIRONMENT=MÔI TRƯỜNG GIÁO DỤC (trường học)
BOT_PRONOUN_ME=Em
BOT_PRONOUN_USER_MALE=Thầy
BOT_PRONOUN_USER_FEMALE=Cô
BOT_PRONOUN_USER_DEFAULT=Thầy/Cô
```

### 4. Chạy Ứng Dụng

Chạy trực tiếp với Node.js:
```bash
npm start
```

Hoặc quản lý bằng **PM2**:
```bash
npm install -g pm2
pm2 start index.js --name "zalo-ticket-bot"
pm2 save
pm2 startup
```

### 5. Thiết Lập Ban Đầu (Initial Setup)

1. **Khởi tạo Web Admin**: Truy cập `http://localhost:3000/setup` (hoặc URL public) để tạo tài khoản `SUPER_ADMIN` đầu tiên và lưu **Recovery Key**.
2. **Cấu hình Zalo Webhook**: Thiết lập Webhook URL trên Zalo Developer Platform trỏ về `https://your-domain.com/webhook` với secret token tương ứng.
3. **Cấp Quyền Admin Zalo**: Chat lệnh `/install` trực tiếp với Bot trên Zalo để gửi yêu cầu cấp quyền Admin.

---

## 🛠️ Danh Sách Lệnh Bot Zalo

| Lệnh | Quyền hạn | Mô tả |
| :--- | :--- | :--- |
| `/install` | Tất cả | Gửi yêu cầu cấp quyền Zalo Admin |
| `/uninstall` | Admin | Hủy quyền Zalo Admin của bản thân |
| `/report` | Admin | Lấy đường dẫn truy cập Web Dashboard |
| `/nhan [ID]` | Admin | Tiếp nhận xử lý sự cố |
| `/xong [ID] [Nội dung]` | Admin | Đánh dấu sự cố đã xử lý thành công |
| `/tuchoi [ID] [Lý do]` | Admin | Từ chối tiếp nhận sự cố |
| `/admin` | Super Admin | Xem danh sách Quản trị viên Zalo |
| `/addgroup` | Super Admin | Thêm nhóm hiện tại vào danh sách nhận thông báo |
| `/removegroup` | Super Admin | Gỡ nhóm hiện tại khỏi danh sách |
| `/setname [Tên]` | Super Admin | Đặt tên gợi nhớ cho nhóm |
| `/thongbao [Nội dung]`| Super Admin | Phát thông báo đồng loạt tới tất cả các nhóm |
| `/clean` | Super Admin | Xóa toàn bộ dữ liệu sự cố và reset ID về #1 |
| `/test` | Super Admin | Tạo sự cố thử nghiệm tự xóa sau 1 phút |

---

## 📄 Giấy Phép & Tác Giả

Dự án được phát triển dưới giấy phép **GPL-3.0 License**.
