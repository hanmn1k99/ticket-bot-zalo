# Zalo Ticket Bot

Bot nhận yêu cầu hỗ trợ qua Zalo và tự động chuyển tiếp về Zalo cá nhân của Admin.

## Các tính năng chính

- Nhận diện khi người dùng gọi tên Bot (hoặc `@Bot`) kèm yêu cầu.
- **Tích hợp AI thông minh**: Tự động trả lời các câu hỏi thường gặp (Mật khẩu Wifi, hướng dẫn cơ bản) bằng Google Gemini AI, giúp giảm tải cho IT. Các yêu cầu phức tạp (sửa chữa) vẫn được tự động forward thành Ticket.
- Lệnh `/install`: Gõ lệnh này trong Zalo riêng với bot để thiết lập bản thân làm Admin. Bot tự động lưu ID của bạn vào cơ sở dữ liệu JSON.
- Lệnh `/uninstall`: Hủy quyền Admin, dừng nhận thông báo từ bot.
- Lệnh `/report`: Admin gõ lệnh này, bot sẽ kết xuất dữ liệu yêu cầu ra file `.csv` và gửi đường dẫn tải về (tự hủy sau 24h).
- Tự động nhắc nhở xuất dữ liệu vào 10:00 sáng ngày cuối cùng của tháng.
- Tự động xóa dữ liệu yêu cầu cũ vào ngày mùng 1 hàng tháng (chỉ giữ lại dữ liệu của tháng trước theo quy định 1 tháng quay vòng).

## Triển khai trên máy chủ Ubuntu

Dưới đây là hướng dẫn các bước triển khai Bot lên máy chủ Ubuntu.

### Bước 1: Cài đặt Node.js và PM2

```bash
# Cập nhật hệ thống
sudo apt update
sudo apt install curl -y

# Cài đặt Node.js
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install nodejs -y

# Cài đặt PM2
sudo npm install pm2 -g
```

### Bước 2: Tải mã nguồn

```bash
git clone https://github.com/hanmn1k99/ticket-bot-zalo.git
cd ticket-bot-zalo
npm install
```

### Bước 3: Cấu hình biến môi trường (.env)

Tạo file `.env`:
```bash
nano .env
```

Nội dung file `.env` cần có:
```env
BOT_TOKEN=YOUR_BOT_TOKEN_HERE
WEBHOOK_SECRET_TOKEN=ticket-bot-secret
PORT=1092
# BOT_NAME là tên chính xác của bot trên Zalo (ví dụ: Ticket Bot)
BOT_NAME=Ticket Bot
# PUBLIC_URL là domain public của bạn, dùng để tạo link tải file CSV
PUBLIC_URL=https://my-domain.com
# GEMINI_API_KEY (Tuỳ chọn) dùng để kích hoạt tính năng AI trả lời tự động. Nhận tại: https://aistudio.google.com/
GEMINI_API_KEY=your_gemini_api_key
```

### Bước 4: Chạy Bot bằng PM2

```bash
pm2 start index.js --name "zalo-ticket-bot"
pm2 save
pm2 startup
```

### Bước 5: Cấu hình Webhook cho Zalo Bot

Để Zalo gửi sự kiện về server của bạn, bạn cần đăng ký Webhook URL thông qua API của Zalo. Nếu bạn sử dụng **Cloudflare Tunnel** (ví dụ domain `api.minhhan.net`) kết nối thẳng vào cổng `1092` của server nội bộ mà không cần mở port mạng:

Bạn chạy lệnh sau trên terminal (thay thế token, domain và secret_token tương ứng với cấu hình của bạn):

```bash
curl -X POST "https://bot-api.zaloplatforms.com/bot<YOUR_BOT_TOKEN_HERE>/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{"url":"https://my-domain.com/webhook","secret_token":"ticket-bot-secret"}'
```

Đảm bảo giá trị `secret_token` khớp hoàn toàn với biến `WEBHOOK_SECRET_TOKEN` trong file `.env` của bạn. Nếu đăng ký thành công, Zalo sẽ trả về `{"ok":true...}`.

### Bước 6: Khởi tạo quyền Admin

1. Vào Zalo cá nhân, tìm và mở hộp thoại nhắn tin riêng với Bot của bạn.
2. Gõ lệnh `/install`. Bot sẽ phản hồi xác nhận bạn đã được gán làm Admin nhận thông báo hệ thống.
3. Gõ thử một yêu cầu (có gọi tên Bot), ví dụ: `Ticket Bot Cần hỗ trợ reset tài khoản`. Bạn sẽ thấy tin nhắn yêu cầu được hệ thống tự động forward thẳng về máy bạn.
4. Bất cứ lúc nào cần gỡ quyền, gõ lệnh `/uninstall`. Bất cứ lúc nào cần lấy báo cáo, gõ lệnh `/report`.

## Quản trị hệ thống
Hệ thống sử dụng cơ sở dữ liệu nội bộ JSON thuần, file dữ liệu sẽ được sinh ra tại `database.json`. Khi sao lưu server, bạn chỉ cần copy thư mục mã nguồn và file `database.json` này.