require('dotenv').config();
const express = require('express');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const db = require('./database');
const setupCronJobs = require('./cronjobs');

// Create public folder for downloads
const publicDir = path.join(__dirname, 'public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir);
}

const app = express();

process.on('uncaughtException', (err) => {
  console.error('CRASH Uncaught Exception:', err);
});
process.on('unhandledRejection', (err) => {
  console.error('CRASH Unhandled Rejection:', err);
});

app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] Nhận Request: ${req.method} ${req.url}`);
  next();
});

app.use(express.json());
app.use('/download', express.static(publicDir));

const PORT = process.env.PORT || 3000;
const WEBHOOK_SECRET_TOKEN = process.env.WEBHOOK_SECRET_TOKEN;
const BOT_TOKEN = process.env.BOT_TOKEN;
const BOT_NAME = process.env.BOT_NAME || '@Bot';
const PUBLIC_URL = process.env.PUBLIC_URL || `http://localhost:${PORT}`;

// Helper to send message via Zalo API
async function sendZaloMessage(chatId, text) {
  try {
    const response = await fetch(`https://bot-api.zaloplatforms.com/bot${BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: text
      })
    });
    const data = await response.json();
    if (!data.ok) {
      console.error('Failed to send message:', data);
    }
    return data;
  } catch (error) {
    console.error('Error sending message:', error);
  }
}

// Init cron jobs
setupCronJobs(sendZaloMessage);

// Default route
app.get('/', (req, res) => {
  res.send('Zalo Ticket Bot is running!');
});

// Zalo webhook verification (GET)
app.get('/webhook', (req, res) => {
  console.log('Zalo verification GET request received:', req.query);
  res.status(200).json({ status: 'ok' });
});

// Webhook endpoint
app.post('/webhook', async (req, res) => {
  const secretToken = req.headers["x-bot-api-secret-token"];
  
  // Log everything for debugging
  console.log('=== WEBHOOK RECEIVED ===');
  console.log('Headers:', JSON.stringify(req.headers, null, 2));
  console.log('Body:', JSON.stringify(req.body, null, 2));
  console.log('Secret Token Header:', secretToken);
  console.log('Expected Token:', WEBHOOK_SECRET_TOKEN);
  console.log('Token Match:', secretToken === WEBHOOK_SECRET_TOKEN);
  console.log('========================');

  if (secretToken !== WEBHOOK_SECRET_TOKEN) {
    console.warn("Unauthorized webhook attempt - token mismatch");
    return res.status(403).json({ message: "Unauthorized" });
  }

  const payload = req.body;
  // Send 200 OK early to acknowledge receipt
  res.json({ message: "Success" });

  // Zalo webhook structure can vary:
  // Sometimes: { ok: true, result: { message: {...} } }
  // Sometimes: { message: { from: {...}, chat: {...}, text: "..." } }
  const result = payload?.result;
  const eventName = result?.event_name || payload?.event_name;
  const message = result?.message || payload?.message;

  console.log('Event name:', eventName);

  if (message) {
    const text = message.text || '';
    const sender = message.from || {};
    const chat = message.chat || {};
    const senderName = sender.display_name || 'Khách';
    const senderId = sender.id;
    const chatId = chat.id || senderId; // Use chat.id for replies (per Zalo docs)
    const timestamp = parseInt(message.date) || Date.now();
    const dateObj = new Date(timestamp);

    console.log('Parsed text:', text);
    console.log('Parsed senderId:', senderId);
    console.log('Parsed chatId:', chatId);

    // Format date and time
    const timeStr = dateObj.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    const dateStr = dateObj.toLocaleDateString('vi-VN');


    // Handle /install command
    if (text.trim() === '/install') {
      await db.setSetting('admin_chat_id', senderId);
      await sendZaloMessage(chatId, "✅ Thiết lập thành công! Bạn đã được gán làm Admin. Các yêu cầu từ người dùng sẽ được chuyển tiếp tới đây.");
      return;
    }

    // Handle /uninstall command
    if (text.trim() === '/uninstall') {
      await db.setSetting('admin_chat_id', null);
      await sendZaloMessage(chatId, "⚠️ Đã gỡ bỏ quyền Admin của bạn. Hệ thống sẽ không chuyển tiếp tin nhắn tới đây nữa.");
      return;
    }

    // Handle /report command
    if (text.trim() === '/report') {
      const adminId = await db.getSetting('admin_chat_id') || process.env.ADMIN_CHAT_ID;
      if (senderId !== adminId) {
        await sendZaloMessage(chatId, "Bạn không có quyền thực hiện lệnh này.");
        return;
      }
      
      const requests = await db.getAllRequests();
      if (requests.length === 0) {
        await sendZaloMessage(chatId, "Chưa có dữ liệu yêu cầu nào.");
        return;
      }

      const { Parser } = require('json2csv');
      const parser = new Parser({ fields: ['id', 'timestamp', 'date', 'sender_name', 'sender_id', 'content'] });
      const formattedRequests = requests.map(r => ({
         ...r,
         date: new Date(r.timestamp).toLocaleString('vi-VN')
      }));
      const csv = parser.parse(formattedRequests);
      
      const fileName = `report_${crypto.randomBytes(4).toString('hex')}.csv`;
      const filePath = path.join(publicDir, fileName);
      // Add BOM for Excel UTF-8 compatibility
      fs.writeFileSync(filePath, "\uFEFF" + csv, 'utf8');

      const downloadLink = `${PUBLIC_URL}/download/${fileName}`;
      await sendZaloMessage(chatId, `Báo cáo của bạn đã sẵn sàng. Nhấn vào link để tải về: ${downloadLink}`);
      
      // Auto delete file after 24 hours
      setTimeout(() => {
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      }, 24 * 60 * 60 * 1000);
      return;
    }

    // Handle bot mention (Ticket request)
    if (text.includes(BOT_NAME) || text.includes('@Bot')) {
      // Remove bot name from text
      let requestContent = text.replace(new RegExp(BOT_NAME, 'gi'), '').replace(/@Bot/gi, '').trim();
      // Remove trailing or leading @ symbol left behind
      requestContent = requestContent.replace(/^@\s*/, '').trim();
      if (!requestContent) requestContent = "(Không có nội dung)";

      // Save to Database
      await db.addRequest(timestamp, senderName, senderId, requestContent);

      // Format the message to send to Admin
      const adminMessage = `🔔 CÓ YÊU CẦU HỖ TRỢ MỚI!\n------------------------------\n👤 Người gửi: ${senderName}\n🕒 Thời gian: ${timeStr} - ${dateStr}\n📌 Nội dung:\n${requestContent}\n------------------------------\n🛠️ IT Meyschool vui lòng tiếp nhận!`;
      
      console.log('--- NHẬN YÊU CẦU MỚI ---');
      console.log(adminMessage);

      const adminId = await db.getSetting('admin_chat_id') || process.env.ADMIN_CHAT_ID;
      if (adminId) {
        await sendZaloMessage(adminId, adminMessage);
        await sendZaloMessage(chatId, `✅ Yêu cầu của Thầy/Cô đã được tiếp nhận, bộ phận IT sẽ tiến hành kiểm tra và sửa chữa.\n\nCảm ơn Thầy/Cô ${senderName} đã gửi yêu cầu! 😊 🛠️`);
      } else {
        console.warn('ADMIN_CHAT_ID is not configured. Cannot forward message.');
        await sendZaloMessage(chatId, "Yêu cầu đã được nhận nhưng hệ thống chưa được cấu hình người nhận.");
      }
    }
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is listening on port ${PORT} (0.0.0.0)`);
});
