require('dotenv').config();
const express = require('express');

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;
const WEBHOOK_SECRET_TOKEN = process.env.WEBHOOK_SECRET_TOKEN;
const BOT_TOKEN = process.env.BOT_TOKEN;
const ADMIN_CHAT_ID = process.env.ADMIN_CHAT_ID;

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

// Default route
app.get('/', (req, res) => {
  res.send('Zalo Ticket Bot is running!');
});

// Webhook endpoint
app.post('/webhook', async (req, res) => {
  const secretToken = req.headers["x-bot-api-secret-token"];
  
  if (secretToken !== WEBHOOK_SECRET_TOKEN) {
    console.warn("Unauthorized webhook attempt");
    return res.status(403).json({ message: "Unauthorized" });
  }

  const payload = req.body;
  // Send 200 OK early to acknowledge receipt
  res.json({ message: "Success" });

  if (payload.event_name === 'message.text.received' && payload.result && payload.result.message) {
    const message = payload.result.message;
    const text = message.text || '';
    const sender = message.from || {};
    const senderName = sender.display_name || 'Khách';
    const senderId = sender.id;
    const dateObj = new Date(parseInt(message.date) || Date.now());
    
    // Format date and time
    const timeStr = dateObj.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    const dateStr = dateObj.toLocaleDateString('vi-VN');

    // Handle /getid command
    if (text.trim() === '/getid') {
      await sendZaloMessage(senderId, `ID của bạn là: ${senderId}\nHãy copy ID này và thêm vào file .env (ADMIN_CHAT_ID) trên server.`);
      return;
    }

    // Handle @Bot command (Ticket request)
    if (text.includes('@Bot')) {
      // Remove @Bot from the text
      let requestContent = text.replace(/@Bot/g, '').trim();
      if (!requestContent) requestContent = "(Không có nội dung)";

      // Format the message
      const adminMessage = `Giờ: ${timeStr}\nNgày: ${dateStr}\nTên người yêu cầu: ${senderName}\nYêu cầu: ${requestContent}`;
      
      console.log('--- NHẬN YÊU CẦU MỚI ---');
      console.log(adminMessage);
      console.log('------------------------');

      if (ADMIN_CHAT_ID) {
        await sendZaloMessage(ADMIN_CHAT_ID, adminMessage);
        await sendZaloMessage(senderId, "Yêu cầu của bạn đã được ghi nhận và gửi đến Admin.");
      } else {
        console.warn('ADMIN_CHAT_ID is not configured. Cannot forward message.');
        await sendZaloMessage(senderId, "Yêu cầu đã được nhận nhưng Admin chưa cấu hình ID nhận tin nhắn.");
      }
    }
  }
});

app.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}`);
});
