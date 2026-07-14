require('dotenv').config();
const express = require('express');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const db = require('./database');
const setupCronJobs = require('./cronjobs');

const AI_API_KEY = process.env.AI_API_KEY;

// Bộ nhớ ngữ cảnh hội thoại cho từng user (lưu trên RAM)
const userContexts = new Map();

async function analyzeWithAI(text, senderName, senderId) {
  if (!AI_API_KEY) return { type: 'TICKET' };
  
  // Đọc nội dung file faq.txt
  let faqContent = "";
  try {
    faqContent = fs.readFileSync(path.join(__dirname, 'faq.txt'), 'utf8');
  } catch (err) {
    faqContent = "- Chưa có dữ liệu FAQ.";
  }

  const systemPrompt = `Bạn là Trợ lý IT Ảo (phần mềm AI) của trường Meyschool. Giáo viên vừa gửi tin nhắn: "${text}"

Cơ sở dữ liệu FAQ (Đây là những thông tin bạn CÓ THỂ dùng để trả lời câu hỏi):
${faqContent}
(Lưu ý 1: Nếu FAQ ghi mạng wifi nào đó "không có mật khẩu", điều đó có nghĩa là mạng đó LÀ MẠNG MỞ, KHÔNG YÊU CẦU NHẬP PASS, chứ không phải là nhà trường không có mạng wifi đó).
(Lưu ý 2: NẾU người dùng hỏi về Wifi, HÃY CHỦ ĐỘNG CUNG CẤP ĐẦY ĐỦ cả Tên mạng (SSID) và Mật khẩu (nếu có) để tiện cho người dùng, đừng chỉ trả lời mỗi tên mạng).

Quy tắc định vị bản thân (RẤT QUAN TRỌNG):
- Bạn LÀ MỘT TRỢ LÝ ẢO (AI), KHÔNG PHẢI CON NGƯỜI. Bạn không có cơ thể vật lý, không biết đi lại, không thể cầm nắm, ăn uống hay làm các việc ngoài đời thực (như đi mua thuốc, lấy đồ, chạy đi sửa máy).
- Mặc dù là Trợ lý IT, nhưng bạn ĐƯỢC PHÉP TRẢ LỜI MỌI CÂU HỎI kiến thức chung (toán học, lịch sử, văn học, đời sống...) như một cuốn bách khoa toàn thư để hỗ trợ giáo viên. KHÔNG BAO GIỜ TỪ CHỐI các câu hỏi kiến thức với lý do "không liên quan đến IT".
- Nếu bị yêu cầu làm những việc vật lý phi lý, hãy TỪ CHỐI một cách khéo léo, lễ phép.
- Môi trường hoạt động của bạn là MÔI TRƯỜNG GIÁO DỤC (trường học). Ngôn từ phải CHUẨN MỰC, TÔN TRỌNG, NGHIÊM TÚC nhưng thân thiện. Tuyệt đối không đùa cợt lố lăng.

Quy tắc xưng hô:
- Tên của người nhắn là: "${senderName}". BẮT BUỘC HÃY SUY ĐOÁN GIỚI TÍNH dựa vào tên này (dù là tiếng Việt hay tiếng nước ngoài).
- NẾU TRẢ LỜI TIẾNG VIỆT: Hãy gọi là "Thầy" (nếu là nam) hoặc "Cô" (nếu là nữ). Hạn chế dùng "Thầy/Cô" trừ khi tên quá khó đoán. Bản thân bạn LUÔN LUÔN phải xưng là "Em" (Tuyệt đối không xưng "Tôi", "Mình" hay "AI").
- NẾU TRẢ LỜI TIẾNG ANH: Hãy xưng là "I", và gọi người dùng là "Mr." (nếu là nam) hoặc "Ms." (nếu là nữ) kèm theo tên của họ. Không dùng "Thầy/Cô/Em" trong tiếng Anh.

Quy tắc ngôn ngữ:
- HÃY PHẢN HỒI BẰNG ĐÚNG NGÔN NGỮ MÀ NGƯỜI DÙNG SỬ DỤNG.
- Nếu người dùng hỏi bằng tiếng Anh, hãy trả lời hoàn toàn bằng tiếng Anh và bỏ qua quy tắc xưng hô "Thầy/Cô/Em".

Quy tắc phân loại (RẤT QUAN TRỌNG - KHÔNG ĐƯỢC BỎ LỠ TICKET CỦA ADMIN):
1. TICKET - Phân loại là TICKET NẾU VÀ CHỈ NẾU tin nhắn là YÊU CẦU XỬ LÝ SỰ CỐ KỸ THUẬT IT (máy tính, mạng wifi, phần cứng, máy in, camera, phần mềm...).
- Các dấu hiệu nhận biết: "coi dùm máy", "xem giúp mạng", "sửa", "kiểm tra", "hư", "lag", "chậm", "không vào được", "mất mạng", "bị đơ", "không in được"...
- LƯU Ý ĐẶC BIỆT: KHÔNG TẠO TICKET đối với các nhờ vả cá nhân, sai vặt không liên quan đến sửa chữa kỹ thuật (ví dụ: "mua dùm cây thước", "lấy dùm ly nước", "gọi thầy Thái"). Những câu này phân loại là ANSWER để từ chối khéo léo.
- Khi quyết định là TICKET, CHỈ TRẢ VỀ DUY NHẤT 1 CHỮ LÀ "TICKET". Tuyệt đối không thêm bất cứ từ nào khác, không hứa hẹn, không an ủi.

2. ANSWER - Áp dụng cho: 
- Tin nhắn xin thông tin rõ ràng (ví dụ: "cho xin mật khẩu wifi", "pass wifi là gì", "làm sao để mượn máy chiếu").
- Nhờ vả cá nhân phi lý, mua đồ, sai vặt (hãy từ chối khéo léo).
- Tin nhắn chào hỏi xã giao, hỏi thăm sức khỏe, trò chuyện kiến thức chung.
Lúc này BẮT BUỘC bắt đầu bằng chữ: ANSWER|
- Tuyệt đối không gọi đích danh bất kỳ cá nhân nào trong phòng IT, chỉ được phép dùng từ "Bộ phận IT".
- Với câu hỏi xã giao/nhờ vả cá nhân: Trả lời RẤT NGẮN GỌN (1-2 câu), lịch sự từ chối hoặc trả lời đúng trọng tâm.
- Với các câu cảm thán, khen ngợi, hoặc kết thúc (ví dụ: "ok rồi", "cảm ơn", "tốt"): Hãy phản hồi VUI VẺ, NHIỆT TÌNH, có cảm xúc (ví dụ: "Dạ vâng ạ, Thầy/Cô cần hỗ trợ gì thêm cứ nhắn em nhé! 😊").
- Với câu hỏi kiến thức, toán học, tra cứu: ĐƯA RA TRỰC TIẾP ĐÁP ÁN, TUYỆT ĐỐI KHÔNG GIẢI THÍCH LAN MAN, KHÔNG DÀI DÒNG.
Ví dụ: "ANSWER| Dạ Thầy Nghĩa cần em hỗ trợ lỗi máy tính gì ạ? 😊"
Ví dụ: "ANSWER| Dạ căn bậc 2 của 178 là khoảng 13.34 ạ."

Lưu ý: Bạn là một AI thông minh, hãy trả lời tự nhiên, có cảm xúc.`;

  // Lấy lịch sử hội thoại của user này
  const uId = senderId || 'default';
  let history = userContexts.get(uId) || [];
  
  // KIỂM TRA BỘ LỌC TỪ KHÓA CỨNG (HARDCODE FILTER)
  const lowerText = text.toLowerCase();
  
  // 1. Kiểm tra Blacklist
  try {
    const blacklist = fs.readFileSync(path.join(__dirname, 'blacklist_keywords.txt'), 'utf8').split('\n').map(w => w.trim().toLowerCase()).filter(w => w);
    for (const word of blacklist) {
      if (lowerText.includes(word)) {
        return { type: 'ANSWER', answer: '🙏 Xin lỗi Thầy/Cô, em không được phép hỗ trợ hoặc thảo luận về nội dung này ạ.' };
      }
    }
  } catch (err) { /* Bỏ qua nếu file không tồn tại */ }

  // 2. Kiểm tra Ticket Keywords
  try {
    const ticketKeywords = fs.readFileSync(path.join(__dirname, 'ticket_keywords.txt'), 'utf8').split('\n').map(w => w.trim().toLowerCase()).filter(w => w);
    for (const word of ticketKeywords) {
      if (lowerText.includes(word)) {
        userContexts.delete(uId); // Xóa lịch sử khi tạo ticket
        return { type: 'TICKET' };
      }
    }
  } catch (err) { /* Bỏ qua nếu file không tồn tại */ }

  // Đẩy câu hỏi hiện tại vào lịch sử
  history.push({ role: 'user', content: text });

  // Xây dựng mảng messages gửi cho Groq
  const messages = [
    { role: 'system', content: systemPrompt },
    ...history
  ];

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${AI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: messages,
        max_tokens: 256,
        temperature: 0.3
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('DeepSeek API Error HTTP', response.status, ':', errText);
      userContexts.delete(uId);
      return { type: 'TICKET' };
    }

    const data = await response.json();
    const result = data.choices?.[0]?.message?.content?.trim() || 'TICKET';
    
    // Nếu AI trả về TICKET
    if (result === 'TICKET' || result.includes('TICKET')) {
      userContexts.delete(uId);
      return { type: 'TICKET' };
    }
    
    // Còn lại mặc định là ANSWER (kể cả khi AI quên ghi chữ ANSWER|)
    let answerText = result;
    if (result.startsWith('ANSWER|')) {
      answerText = result.replace('ANSWER|', '').trim();
    }
    
    // Lưu lại câu trả lời vào lịch sử
    history.push({ role: 'assistant', content: answerText });
    // Giữ tối đa 10 tin nhắn gần nhất (5 lượt)
    if (history.length > 10) history = history.slice(history.length - 10);
    userContexts.set(uId, history);

    return { type: 'ANSWER', answer: answerText };
  } catch (error) {
    console.error('Lỗi gọi AI API (Network):', error);
    userContexts.delete(uId);
    return { type: 'TICKET' };
  }
}

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

    // Format date and time (12h format and dd/mm/yyyy)
    const timeStr = dateObj.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    const day = String(dateObj.getDate()).padStart(2, '0');
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const year = dateObj.getFullYear();
    const dateStr = `${day}/${month}/${year}`;


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

      // Analyze with AI
      const aiResult = await analyzeWithAI(requestContent, senderName, senderId);

      if (aiResult.type === 'ANSWER') {
        // Reply to user directly
        await sendZaloMessage(chatId, `🤖 AI Trợ lý IT:\n\n${aiResult.answer}`);
        return; // Dừng, không tạo ticket
      }

      // Save to Database (Nếu là TICKET)
      await db.addRequest(timestamp, senderName, senderId, requestContent);

      // Format the message to send to Admin
      const adminMessage = `🔔 CÓ YÊU CẦU HỖ TRỢ MỚI!\n------------------------------\n👤 Người gửi: ${senderName}\n🕒 Thời gian: ${timeStr} - ${dateStr}\n📌 Nội dung:\n${requestContent}\n------------------------------\n🛠️ IT Meyschool vui lòng tiếp nhận!`;
      
      console.log('--- NHẬN YÊU CẦU MỚI ---');
      console.log(adminMessage);

      const adminId = await db.getSetting('admin_chat_id') || process.env.ADMIN_CHAT_ID;
      if (adminId) {
        const userMessage = `✅ YÊU CẦU ĐÃ ĐƯỢC TIẾP NHẬN!\n------------------------------\n👤 Người gửi: Thầy/Cô ${senderName}\n🕒 Thời gian: ${timeStr} - ${dateStr}\n📌 Nội dung:\n${requestContent}\n------------------------------\n🛠️ Bộ phận IT sẽ tiến hành kiểm tra và sửa chữa.\n😊 Xin cảm ơn Thầy/Cô!`;
        await sendZaloMessage(adminId, adminMessage);
        await sendZaloMessage(chatId, userMessage);
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
