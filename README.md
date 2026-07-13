# Zalo Ticket Bot

Bot nhận yêu cầu hỗ trợ qua Zalo và tự động chuyển tiếp về Zalo cá nhân của Admin.

## Tính năng

- Nhận diện khi người dùng gọi `@Bot` kèm theo yêu cầu.
- Lấy thông tin người yêu cầu (Tên Zalo), giờ, ngày gửi.
- Chuyển tiếp tự động về Zalo cá nhân của Admin theo định dạng chuẩn.
- Hỗ trợ lệnh `/getid` để người dùng lấy ID Zalo cá nhân (dùng để cấu hình Admin).

## Triển khai trên máy chủ Ubuntu

Dưới đây là hướng dẫn các bước triển khai Bot lên máy chủ Ubuntu sử dụng Node.js và PM2 (để giữ cho Bot luôn chạy ngầm).

### Bước 1: Cài đặt Node.js và PM2

Nếu máy chủ của bạn chưa có Node.js và PM2, hãy chạy các lệnh sau:

```bash
# Cập nhật hệ thống
sudo apt update
sudo apt install curl -y

# Cài đặt Node.js (Ví dụ bản 20.x)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install nodejs -y

# Cài đặt công cụ PM2 toàn cục
sudo npm install pm2 -g
```

### Bước 2: Tải mã nguồn và Cài đặt

```bash
# Clone repository của bạn
git clone https://github.com/hanmn1k99/ticket-bot-zalo.git
cd ticket-bot-zalo

# Cài đặt các thư viện cần thiết
npm install
```

### Bước 3: Cấu hình biến môi trường (.env)

Đổi tên file `.env.example` thành `.env` (hoặc tạo mới file `.env`) và cấu hình các thông số:

```bash
nano .env
```

Nội dung file `.env` cần có:
```env
BOT_TOKEN=YOUR_BOT_TOKEN_HERE
WEBHOOK_SECRET_TOKEN=ticket-bot-secret
PORT=3000
ADMIN_CHAT_ID=
```
*Lưu ý: Để trống `ADMIN_CHAT_ID` ở lần chạy đầu tiên.*

### Bước 4: Khởi động Bot bằng PM2

```bash
# Khởi động ứng dụng
pm2 start index.js --name "zalo-ticket-bot"

# Lưu cấu hình PM2 để tự khởi động cùng hệ thống khi khởi động lại máy chủ
pm2 save
pm2 startup
```

### Bước 5: Cấu hình Webhook URL trên Zalo

Để Zalo có thể gửi tin nhắn đến máy chủ của bạn, máy chủ cần một Domain HTTPS. Bạn có 2 cách:
1. **Sử dụng Nginx + SSL (Khuyên dùng cho production):** Trỏ domain về IP máy chủ của bạn và cấu hình Reverse Proxy về port `3000`.
2. **Sử dụng ngrok / localtunnel (Dùng tạm thời/Test):**
   ```bash
   npx localtunnel --port 3000
   ```
   Lấy URL sinh ra (ví dụ `https://my-domain.loca.lt`) và thêm `/webhook` vào cuối, điền vào Zalo Bot Manager.

### Bước 6: Lấy và Cấu hình ADMIN_CHAT_ID

1. Sau khi Webhook hoạt động, hãy dùng Zalo cá nhân của bạn nhắn tin cho Bot với nội dung: `/getid`
2. Bot sẽ phản hồi lại ID của bạn (ví dụ: `849123456789`).
3. Mở file `.env` trên máy chủ và thêm ID này vào:
   ```env
   ADMIN_CHAT_ID=849123456789
   ```
4. Khởi động lại Bot để nhận cấu hình mới:
   ```bash
   pm2 restart zalo-ticket-bot
   ```

Xong! Bây giờ khi có người nhắn `@Bot Cần hỗ trợ`, thông báo sẽ được đẩy thẳng về Zalo cá nhân của bạn.