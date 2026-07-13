# Zalo Ticket Bot

Bot nhận yêu cầu hỗ trợ qua Zalo và tự động chuyển tiếp về Zalo cá nhân của Admin.

## Các tính năng chính

- Nhận diện khi người dùng gọi tên Bot (hoặc `@Bot`) kèm yêu cầu.
- Lệnh `/setup`: Gõ lệnh này trong Zalo riêng với bot để thiết lập bản thân làm Admin. Bot tự động lưu ID của bạn vào cơ sở dữ liệu SQLite.
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
PORT=3000
# BOT_NAME là tên chính xác của bot trên Zalo (ví dụ: Ticket Bot)
BOT_NAME=Ticket Bot
# PUBLIC_URL là domain public của bạn, dùng để tạo link tải file CSV
PUBLIC_URL=https://my-domain.com
```

### Bước 4: Chạy Bot bằng PM2

```bash
pm2 start index.js --name "zalo-ticket-bot"
pm2 save
pm2 startup
```

### Bước 5: Cấu hình Webhook và Admin

1. Thiết lập Nginx (hoặc công cụ như ngrok/localtunnel cho quá trình test) để public port `3000` ra ngoài Internet, gắn vào Webhook trên Zalo Bot Manager (kèm `WEBHOOK_SECRET_TOKEN`).
2. Vào Zalo cá nhân, mở hộp thoại nhắn tin với Bot.
3. Gõ lệnh `/setup`. Bot sẽ phản hồi xác nhận bạn là Admin.
4. Gõ thử yêu cầu: `Ticket Bot Cần hỗ trợ tài khoản`. Bạn sẽ thấy tin nhắn được forward thẳng về máy bạn.
5. Gõ lệnh `/report` để lấy file CSV các yêu cầu.

## Quản trị hệ thống
Hệ thống sử dụng cơ sở dữ liệu nội bộ SQLite, file dữ liệu sẽ được sinh ra tại `data.sqlite`. Khi sao lưu server, bạn chỉ cần copy thư mục mã nguồn và file `data.sqlite` này.