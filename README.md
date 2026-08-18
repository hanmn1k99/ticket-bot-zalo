<h1 align="center">🤖 Zalo IT Support Bot v2.0</h1>

<p align="center">
  <img src="https://img.shields.io/badge/VERSION-2.0.0-007EC6?style=for-the-badge&logo=github" alt="Version">
  <img src="https://img.shields.io/badge/NODE-%3E%3D_18.0.0-42b826?style=for-the-badge&logo=nodedotjs" alt="Node">
  <img src="https://img.shields.io/badge/ZALO_API-V2.0-0068FF?style=for-the-badge&logo=zalo" alt="Zalo API">
  <img src="https://img.shields.io/badge/LICENSE-MIT-7CBA00?style=for-the-badge" alt="License">
</p>
<p align="center">
  <img src="https://img.shields.io/badge/AUTHOR-NGUY%E1%BB%84N_MINH_H%C3%82N-black?style=for-the-badge&logo=github" alt="Author">
</p>

<p align="center">
  <b>Hệ thống Bot Trợ giúp IT tích hợp AI trên nền tảng Zalo với Web Dashboard quản trị toàn diện.</b>
</p>

---

## 🌟 Giới thiệu Phiên bản 2.0 (The "Modular & Web-First" Update)

Zalo Ticket Bot v2.0 đánh dấu một bước nhảy vọt từ một script chat bot đơn giản thành một **Hệ thống Helpdesk hoàn chỉnh**. Phiên bản mới loại bỏ hoàn toàn việc phụ thuộc vào cấu hình file .env thủ công cho các tác vụ quản trị, thay vào đó là một **Web Dashboard (Bảng điều khiển Web)** hiện đại, bảo mật cao và dễ dàng tùy biến AI.

Mọi thứ từ việc thay đổi văn phong AI, thiết lập FAQ, đến quản lý quyền Admin đều được thực hiện trực tiếp trên trình duyệt bằng vài cú click chuột!

## ✨ Tính năng Nổi bật (Features)

### 🧠 1. AI-Powered Helpdesk (Sức mạnh Trí tuệ Nhân tạo)
- **Tự động hóa Giải đáp (FAQ):** AI tích hợp model siêu tốc độ (Groq Llama-3) để tự động trả lời các câu hỏi thường gặp của nhân viên, giảm tải công việc cho IT.
- **Tùy biến Văn phong (Persona):** Admin có thể tùy chỉnh tính cách, cách xưng hô của Bot trực tiếp trên Web Dashboard mà không cần chạm vào code.
- **Bảo vệ hệ thống:** Tích hợp bộ lọc từ khóa cấm, tự động từ chối các yêu cầu vi phạm hoặc ngôn từ không phù hợp.

### 💻 2. Advanced Web Dashboard (Quản trị Web Thông minh)
- **Real-time Tracking:** Bảng tin sự cố tự động đồng bộ theo thời gian thực (Real-time long-polling), không cần tải lại trang.
- **Thao tác 1-Click:** Nhận, chuyển, hoàn thành hoặc từ chối sự cố ngay trên Web. Tích hợp tính năng **Xóa sự cố thủ công** chuyên nghiệp.
- **Tùy chỉnh linh hoạt:** Giao diện hỗ trợ Dark/Light mode tự động, tương thích hoàn hảo trên Mobile & Desktop. In báo cáo sự cố định dạng chuẩn (Landscape print).

### 💬 3. Seamless Zalo Integration (Tích hợp Zalo mượt mà)
- **Phản hồi đa kênh:** Bot tự động thông báo qua Zalo khi có trạng thái mới (Đã nhận, Đã xong, Từ chối), thông báo cho người dùng và các Admin khác.
- **Điều khiển qua lệnh (Commands):** Hỗ trợ đầy đủ các lệnh như /nhan, /xong, /tuchoi ngay trên màn hình chat Zalo.
- **Broadcast:** Gửi thông báo kỹ thuật đồng loạt đến toàn bộ các nhóm chat đã đăng ký (/thongbao).

---

## 🏗 Cấu trúc Hệ thống (Architecture)

Hệ thống được thiết kế theo mô hình **Modular**, phân tách rõ ràng các chức năng để dễ dàng bảo trì và mở rộng:

```bash
ticket-bot-zalo/
├── config/             # Cấu hình hằng số (constants)
├── database/           # Dữ liệu JSON (database.json)
├── middleware/         # Xác thực bảo mật JWT, phân quyền Auth
├── routes/             # Định tuyến API
│   ├── authRoutes.js     # Xác thực tài khoản Web
│   ├── ticketRoutes.js   # API quản lý vòng đời sự cố (Tickets)
│   ├── adminRoutes.js    # Quản lý quyền Zalo Admin
│   ├── settingRoutes.js  # Cấu hình tính năng & FAQ
│   └── webhookRoutes.js  # Cổng tiếp nhận sự kiện Zalo OA
├── services/           # Xử lý Logic cốt lõi
│   ├── aiService.js      # Giao tiếp API Llama / AI Prompt
│   ├── zaloService.js    # Gửi tin nhắn & API Zalo OA
│   └── botConfigService.js # Nạp cấu hình tự động
├── views/              # Render HTML cho Frontend
│   ├── dashboardView.js  # Giao diện Bảng tin
│   └── settingsView.js   # Giao diện Cài đặt
├── cronjobs.js         # Các tác vụ chạy ngầm định kỳ
└── index.js            # Entry point khởi chạy máy chủ
```

---

## 🚀 Hướng dẫn Cài đặt & Cấu hình (Setup Guide)

### Yêu cầu tiên quyết:
- **Node.js** v18.0.0 hoặc mới hơn.
- Tài khoản **Zalo Official Account (OA)** đã đăng ký ứng dụng & cấp quyền webhook.
- **API Key** từ Groq, OpenAI hoặc tương đương (Hệ thống tối ưu nhất với llama-3.3-70b-versatile).

### Bước 1: Clone và Cài đặt thư viện
```bash
git clone https://github.com/hanmn1k99/ticket-bot-zalo.git
cd ticket-bot-zalo
npm install
```

### Bước 2: Khởi tạo biến môi trường (.env)
Tạo file .env tại thư mục gốc và điền các thông số cơ bản nhất:

```env
# Thông tin cấu hình cơ sở (Server)
PORT=3000
PUBLIC_URL=https://your-domain.com

# Thông tin Zalo OA
BOT_TOKEN=your_zalo_bot_token_here
WEBHOOK_SECRET_TOKEN=your_zalo_webhook_secret

# AI API Configuration
AI_API_KEY=your_groq_or_openai_api_key

# Cấu hình Bảo mật Web
JWT_SECRET=super_secret_jwt_key_here
```
*(Lưu ý: Không cấu hình tài khoản Admin trong file .env nữa, tất cả đã được chuyển lên Web Dashboard).*

### Bước 3: Khởi chạy Máy chủ
Có thể sử dụng Node trực tiếp:
```bash
npm start
```
Hoặc (Khuyến nghị) chạy nền bằng PM2:
```bash
npm install -g pm2
pm2 start index.js --name "zalo-ticket-bot"
pm2 save
pm2 startup
```

### Bước 4: Thiết lập lần đầu (Initial Setup)
Quá trình thiết lập v2.0 cực kỳ đơn giản:

1. **Khởi tạo Super Admin:** Truy cập http://your-domain.com/setup (hoặc localhost) trên trình duyệt để tạo tài khoản Super Admin đầu tiên và lưu lại Mã Khôi Phục (Recovery Key).
2. **Cấu hình Zalo Webhook:** Điền https://your-domain.com/webhook vào trang quản lý Webhook của Zalo OA.
3. **Phân quyền Admin Zalo:** 
   - Dùng Zalo cá nhân, chat với Zalo OA của Bot lệnh: /install
   - Truy cập Web Dashboard -> **Cài đặt** -> **Quản trị viên Zalo** -> Duyệt cấp quyền cho tài khoản Zalo của bạn.

---

## 🛠 Danh sách Lệnh Bot Zalo (Command Reference)

| Lệnh / Cú pháp | Quyền Hạn | Chức Năng |
| :--- | :--- | :--- |
| /install | Mọi người | Đăng ký cấp quyền Quản trị viên Zalo |
| /uninstall | Admin Zalo | Hủy bỏ quyền Admin Zalo của bản thân |
| /report | Admin Zalo | Nhận liên kết siêu tốc truy cập Web Dashboard |
| /nhan [ID] | Admin Zalo | Tiếp nhận xử lý sự cố qua chat |
| /xong [ID] [Lý do] | Admin Zalo | Đóng sự cố, đính kèm kết quả xử lý |
| /tuchoi [ID] [Lý do]| Admin Zalo | Từ chối sự cố không hợp lệ |
| /admin | Super Admin | Xem danh sách các Admin Zalo hiện hành |
| /addgroup | Super Admin | Thêm nhóm chat Zalo hiện tại vào danh sách nhận thông báo |
| /removegroup| Super Admin | Xóa nhóm chat Zalo hiện tại khỏi danh sách |
| /setname [Tên]| Super Admin | Gắn định danh cho nhóm chat dễ quản lý |
| /thongbao [ND]| Super Admin | Phát (Broadcast) thông báo khẩn cấp đến toàn bộ nhóm chat |
| /clean | Super Admin | Xóa sạch toàn bộ CSDL Sự cố (Reset về #1) |
| /test | Super Admin | Tạo một sự cố giả lập (Tự hủy sau 1 phút) để kiểm tra |

---

## 📜 Giấy phép (License)
Dự án được phân phối dưới giấy phép **MIT License**. Mọi sao chép, chỉnh sửa và phân phối đều được phép với điều kiện giữ nguyên thông tin bản quyền của tác giả.
