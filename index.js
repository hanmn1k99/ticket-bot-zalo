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
- Các dấu hiệu nhận biết: "coi dùm máy", "xem giúp mạng", "sửa", "kiểm tra", "hư", "lag", "chậm", "không vào được", "mất mạng", "mất wifi", "bị đơ", "không in được"...
- ĐẶC BIỆT LƯU Ý VỀ WIFI: Nếu người dùng kêu "mất wifi", "không có wifi", "wifi hỏng", "không kết nối được wifi" -> CHẮC CHẮN LÀ TICKET (Báo lỗi). CHỈ phân loại là ANSWER khi người dùng thực sự hỏi "Mật khẩu wifi là gì?", "Cho xin pass wifi".
- LƯU Ý ĐẶC BIỆT: KHÔNG TẠO TICKET đối với các nhờ vả cá nhân, sai vặt không liên quan đến sửa chữa kỹ thuật (ví dụ: "mua dùm cây thước", "lấy dùm ly nước", "gọi thầy Thái"). Những câu này phân loại là ANSWER để từ chối khéo léo.
- Khi quyết định là TICKET, CHỈ TRẢ VỀ DUY NHẤT 1 CHỮ LÀ "TICKET". Tuyệt đối không thêm bất cứ từ nào khác, không hứa hẹn, không an ủi.

2. ANSWER - Áp dụng cho: 
- Tin nhắn xin thông tin rõ ràng (ví dụ: "cho xin mật khẩu wifi", "pass wifi là gì", "làm sao để mượn máy chiếu").
- Nhờ vả cá nhân phi lý, mua đồ, sai vặt (hãy từ chối khéo léo).
- Tin nhắn chào hỏi xã giao, hỏi thăm sức khỏe, trò chuyện kiến thức chung.
Lúc này BẮT BUỘC bắt đầu bằng chữ: ANSWER|
- Tuyệt đối không gọi đích danh bất kỳ cá nhân nào trong phòng IT, chỉ được phép dùng từ "Bộ phận IT".
- Với câu hỏi tra cứu FAQ (xin wifi, máy in...): Lọc ĐÚNG thông tin cần thiết và trả lời CỰC KỲ NGẮN GỌN (1-2 câu). Không liệt kê các thông tin thừa mà người dùng không hỏi. (Ví dụ: Hỏi wifi khách thì chỉ nói tên và pass wifi khách, không kể lể wifi giáo viên).
- Với câu hỏi xã giao/nhờ vả cá nhân: Trả lời RẤT NGẮN GỌN, lịch sự từ chối hoặc trả lời đúng trọng tâm.
- Với các câu cảm thán, khen ngợi, hoặc kết thúc (ví dụ: "ok rồi", "cảm ơn", "tốt"): Hãy phản hồi VUI VẺ, NHIỆT TÌNH, có cảm xúc (ví dụ: "Dạ vâng ạ, Thầy/Cô cần hỗ trợ gì thêm cứ nhắn em nhé! 😊").
- Với câu hỏi kiến thức, toán học: ĐƯA RA TRỰC TIẾP ĐÁP ÁN, TUYỆT ĐỐI KHÔNG GIẢI THÍCH LAN MAN.
Ví dụ: "ANSWER| Dạ wifi dành cho khách là meyschool_guest, mạng mở không cần mật khẩu ạ."
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
app.use('/assets', express.static(path.join(__dirname, 'assets')));

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

// Dynamic HTML Report Route
app.get('/report', async (req, res) => {
  // Basic Auth
  const b64auth = (req.headers.authorization || '').split(' ')[1] || '';
  const [login, password] = Buffer.from(b64auth, 'base64').toString().split(':');

  if (login !== 'minhhan' || password !== 'Hannguyen@113') {
    res.set('WWW-Authenticate', 'Basic realm="401"');
    return res.status(401).send('Yêu cầu đăng nhập. Username: minhhan');
  }

  const requests = await db.getAllRequests();
  
  const formattedRequests = requests.map(r => {
     const d = new Date(r.timestamp);
     const day = String(d.getDate()).padStart(2, '0');
     const month = String(d.getMonth() + 1).padStart(2, '0');
     const year = d.getFullYear();
     const time = d.toLocaleTimeString('en-US', { hour12: false });
     
     const statusBadge = r.status === 'Đã xong' 
       ? '<span style="background:#dcfce7; color:#166534; padding:4px 8px; border-radius:12px; font-weight:600; font-size:12px; white-space:nowrap;">🟢 Đã xong</span>'
       : `<span id="statusBadge_${r.id}" style="background:#fee2e2; color:#991b1b; padding:4px 8px; border-radius:12px; font-weight:600; font-size:12px; white-space:nowrap;">🔴 Đang chờ</span>`;
       
     let adminReplyCell = '';
     if (r.status === 'Đã xong') {
         adminReplyCell = r.admin_reply ? r.admin_reply : '<i style="color:#94a3b8">Không có nội dung</i>';
     } else {
         adminReplyCell = `
           <div id="actionBox_${r.id}" style="display:flex; gap:6px;">
              <input type="text" id="replyInput_${r.id}" onkeypress="if(event.key === 'Enter') resolveTicket(${r.id})" placeholder="Chi tiết khắc phục..." style="flex:1; padding:6px 10px; border:1px solid #cbd5e1; border-radius:6px; font-size:13px; outline:none;">
              <button onclick="resolveTicket(${r.id})" style="padding:6px 12px; font-size:13px; background:#16a34a; color:white; border:none; border-radius:6px; cursor:pointer; white-space:nowrap;">Gửi</button>
           </div>
         `;
     }

     return `
      <tr>
        <td><strong>#${r.id}</strong></td>
        <td>${r.sender_name}</td>
        <td>${time}<br><small style="color:var(--text-muted)">${day}/${month}/${year}</small></td>
        <td>${r.content}</td>
        <td id="statusCell_${r.id}">${statusBadge}</td>
        <td id="replyCell_${r.id}">${adminReplyCell}</td>
      </tr>`;
  }).join('');

  const monthStr = new Date().getMonth() + 1;
  
  const htmlContent = `
  <!DOCTYPE html>
  <html lang="vi">
  <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Phần mềm quản trị hệ thống - minhhan.net</title>
      <link rel="icon" href="/assets/favicon.png">
      <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
          :root {
              --primary: #2563eb;
              --primary-hover: #1d4ed8;
              --bg-color: #f8fafc;
              --card-bg: #ffffff;
              --text-main: #1e293b;
              --text-muted: #64748b;
              --border-color: #e2e8f0;
          }
          body { 
              font-family: 'Inter', sans-serif; 
              padding: 30px; 
              background-color: var(--bg-color);
              color: var(--text-main);
              margin: 0;
          }
          .container {
              max-width: 1400px;
              margin: 0 auto;
          }
          .header {
              display: flex;
              justify-content: space-between;
              align-items: center;
              margin-bottom: 25px;
              flex-wrap: wrap;
              gap: 15px;
          }
          h2 { 
              margin: 0; 
              font-size: 24px;
              font-weight: 700;
              color: #0f172a;
              text-transform: uppercase;
          }
          .controls {
              display: flex;
              gap: 15px;
              align-items: center;
              flex-wrap: nowrap;
          }
          input[type="text"], select {
              padding: 10px 16px;
              border: 1px solid var(--border-color);
              border-radius: 8px;
              width: 100%;
              max-width: 200px;
              font-size: 14px;
              outline: none;
              transition: border-color 0.2s;
              background-color: white;
          }
          input[type="text"]:focus, select:focus {
              border-color: var(--primary);
              box-shadow: 0 0 0 3px rgba(37,99,235,0.1);
          }
          button {
              background-color: var(--primary);
              color: white;
              border: none;
              padding: 10px 20px;
              border-radius: 8px;
              font-weight: 600;
              font-size: 14px;
              cursor: pointer;
              transition: background-color 0.2s;
              display: flex;
              align-items: center;
              gap: 8px;
              white-space: nowrap;
          }
          button.btn-secondary {
              background-color: #f1f5f9;
              color: #475569;
              border: 1px solid #cbd5e1;
          }
          button.btn-secondary:hover {
              background-color: #e2e8f0;
          }
          .table-wrapper {
              background: var(--card-bg);
              border-radius: 12px;
              box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.05);
              overflow-x: auto;
              -webkit-overflow-scrolling: touch;
          }
          table { 
              width: 100%; 
              border-collapse: collapse; 
              min-width: 800px;
          }
          th, td { 
              padding: 16px; 
              text-align: left; 
              border-bottom: 1px solid var(--border-color); 
          }
          th { 
              background-color: #f1f5f9; 
              color: var(--text-muted);
              font-weight: 600;
              font-size: 13px;
              text-transform: uppercase;
              letter-spacing: 0.05em;
          }
          td {
              font-size: 14px;
          }
          tr:last-child td {
              border-bottom: none;
          }
          tr:hover td { 
              background-color: #f8fafc; 
          }
          .empty-state {
              text-align: center;
              padding: 40px;
              color: var(--text-muted);
              display: none;
          }
          /* Chỉ định vùng để in PDF */
          #pdf-content {
              padding: 20px;
              background: white;
          }
          
          /* Responsive (Giao diện Mobile) */
          @media screen and (max-width: 768px) {
              .header {
                  flex-direction: column;
                  align-items: flex-start;
              }
              .controls {
                  width: 100%;
                  display: grid;
                  grid-template-columns: 1fr;
                  gap: 10px;
              }
              input[type="text"], select {
                  max-width: 100%;
                  width: 100%;
              }
              #pdf-content {
                  padding: 5px;
                  background: transparent;
              }
              .table-wrapper {
                  box-shadow: none;
                  background: transparent;
                  overflow-x: hidden;
              }
              table { min-width: 100%; }
              table, thead, tbody, th, td, tr { 
                  display: block; 
              }
              thead tr { 
                  display: none; 
              }
              tr { 
                  background: var(--card-bg);
                  margin-bottom: 15px; 
                  border-radius: 12px; 
                  padding: 10px; 
                  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                  border: 1px solid var(--border-color);
              }
              td { 
                  border: none;
                  border-bottom: 1px solid #f1f5f9; 
                  position: relative;
                  padding: 12px 10px 12px 130px; 
                  text-align: right;
              }
              td:last-child { border-bottom: 0; }
              td::before { 
                  position: absolute;
                  top: 12px;
                  left: 10px;
                  width: 110px; 
                  white-space: nowrap;
                  font-weight: 600;
                  color: var(--text-muted);
                  text-transform: uppercase;
                  font-size: 11px;
                  text-align: left;
              }
              td:nth-of-type(1)::before { content: "STT"; }
              td:nth-of-type(2)::before { content: "Người Yêu Cầu"; }
              td:nth-of-type(3)::before { content: "Thời gian"; }
              td:nth-of-type(4)::before { content: "Nội dung lỗi"; }
              td:nth-of-type(5)::before { content: "Trạng thái"; }
              td:nth-of-type(6)::before { content: "Phản hồi"; }

              /* Input Box for Action */
              td div[id^="actionBox_"] { 
                  flex-direction: column; 
                  gap: 10px;
              }
              td div[id^="actionBox_"] input { 
                  width: 100%; 
                  max-width: 100%;
              }
              td div[id^="actionBox_"] button {
                  width: 100%;
                  justify-content: center;
              }
          }

          /* Định dạng khi in (Print) */
          @media print {
              * {
                  -webkit-print-color-adjust: exact !important;
                  print-color-adjust: exact !important;
              }
              body { background: white; padding: 0; }
              .container { max-width: 100%; width: 100%; margin: 0; }
              .controls { display: none !important; }
              .table-wrapper { 
                  box-shadow: none; 
                  border: none;
                  overflow: visible !important;
              }
              table { width: 100%; min-width: auto; }
              th, td { padding: 8px; font-size: 11px; }
              
              /* Ẩn bớt các form nhập liệu khi in */
              td div[id^="actionBox_"] { display: none !important; }
          }
      </style>
  </head>
  <body>
      <div class="container">
          <div class="header">
              <h2>
                  <img src="/assets/logo.png" alt="Logo" style="height: 40px; margin-right: 15px; vertical-align: middle;" onerror="this.style.display='none'">
                  📊 BÁO CÁO AI BOT THÁNG ${monthStr}
              </h2>
              <div class="controls">
                  <select id="statusFilter">
                      <option value="">-- Tất cả trạng thái --</option>
                      <option value="đã xong">🟢 Đã xong</option>
                      <option value="đang chờ">🔴 Đang chờ</option>
                  </select>
                  <select id="nameFilter">
                      <option value="">-- Tất cả người báo --</option>
                  </select>
                  <input type="text" id="searchInput" placeholder="Tìm kiếm tự do...">
                  <button class="btn-secondary" onclick="window.location.reload()" title="Tải lại trang">
                      <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
                  </button>
                  <button class="btn-secondary" onclick="cleanData()" title="Xóa toàn bộ báo cáo" style="color:#ef4444;">
                      <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                  </button>
                  <button onclick="window.print()">
                      <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"></path></svg>
                      Xuất Báo Cáo
                  </button>
              </div>
          </div>

          <div class="table-wrapper" id="pdf-content">
              <table id="reportTable">
                  <thead>
                      <tr>
                          <th width="5%">STT</th>
                          <th width="15%">Người Yêu Cầu</th>
                          <th width="15%">Thời gian</th>
                          <th width="25%">Nội dung lỗi</th>
                          <th width="15%">Trạng thái</th>
                          <th width="25%">Phản hồi của IT</th>
                      </tr>
                  </thead>
                  <tbody>
                      ${formattedRequests}
                  </tbody>
              </table>
              <div id="emptyState" class="empty-state">Không tìm thấy kết quả nào phù hợp.</div>
          </div>
      </div>

      <script>
          // Khởi tạo các phần tử DOM
          const searchInput = document.getElementById('searchInput');
          const nameFilter = document.getElementById('nameFilter');
          const statusFilter = document.getElementById('statusFilter');
          const table = document.getElementById('reportTable');
          const rows = table.getElementsByTagName('tbody')[0].getElementsByTagName('tr');
          const emptyState = document.getElementById('emptyState');

          // Tự động lấy danh sách tên Zalo (Cột số 2 -> index 1) để đưa vào Select Dropdown
          const uniqueNames = new Set();
          for (let i = 0; i < rows.length; i++) {
              const nameCell = rows[i].getElementsByTagName('td')[1];
              if (nameCell) {
                  uniqueNames.add(nameCell.textContent.trim());
              }
          }
          uniqueNames.forEach(name => {
              const option = document.createElement('option');
              option.value = name.toLowerCase();
              option.textContent = name;
              nameFilter.appendChild(option);
          });

          // Hàm chạy Bộ lọc (kết hợp Tìm kiếm tự do + Chọn tên + Chọn trạng thái)
          function filterData() {
              const searchText = searchInput.value.toLowerCase();
              const selectedName = nameFilter.value;
              const selectedStatus = statusFilter.value;
              let visibleCount = 0;

              for (let i = 0; i < rows.length; i++) {
                  const text = rows[i].textContent || rows[i].innerText;
                  const nameCellText = rows[i].getElementsByTagName('td')[1].textContent.trim().toLowerCase();
                  const statusCellText = rows[i].getElementsByTagName('td')[4].textContent.trim().toLowerCase();
                  
                  const matchesSearch = text.toLowerCase().indexOf(searchText) > -1;
                  const matchesName = selectedName === "" || nameCellText === selectedName;
                  const matchesStatus = selectedStatus === "" || statusCellText.includes(selectedStatus);

                  if (matchesSearch && matchesName && matchesStatus) {
                      rows[i].style.display = '';
                      visibleCount++;
                  } else {
                      rows[i].style.display = 'none';
                  }
              }

              if (visibleCount === 0) {
                  table.style.display = 'none';
                  emptyState.style.display = 'block';
              } else {
                  table.style.display = 'table';
                  emptyState.style.display = 'none';
              }
          }

          searchInput.addEventListener('keyup', filterData);
          searchInput.addEventListener('keyup', filterData);
          nameFilter.addEventListener('change', filterData);
          statusFilter.addEventListener('change', filterData);

          // Hàm Xử lý Đóng Ticket Trực Tiếp Từ Web
          async function resolveTicket(ticketId) {
              const input = document.getElementById('replyInput_' + ticketId);
              const replyText = input.value.trim();
              if (!replyText) {
                  alert('Vui lòng nhập nội dung phản hồi trước khi Đóng sự cố!');
                  input.focus();
                  return;
              }

              const btn = input.nextElementSibling;
              const originalBtnText = btn.textContent;
              btn.textContent = 'Đang xử lý...';
              btn.disabled = true;
              input.disabled = true;

              try {
                  const response = await fetch('/api/tickets/resolve', {
                      method: 'POST',
                      headers: {
                          'Content-Type': 'application/json'
                      },
                      body: JSON.stringify({ id: ticketId, replyText: replyText })
                  });

                  const data = await response.json();
                  if (response.ok && data.success) {
                      // Cập nhật giao diện mà không cần tải trang
                      document.getElementById('statusCell_' + ticketId).innerHTML = '<span style="background:#dcfce7; color:#166534; padding:4px 8px; border-radius:12px; font-weight:600; font-size:12px;">🟢 Đã xong</span>';
                      document.getElementById('replyCell_' + ticketId).innerHTML = replyText;
                  } else {
                      alert('Lỗi: ' + (data.error || 'Không thể đóng sự cố.'));
                      btn.textContent = originalBtnText;
                      btn.disabled = false;
                      input.disabled = false;
                  }
              } catch (err) {
                  alert('Lỗi kết nối tới máy chủ.');
                  btn.textContent = originalBtnText;
                  btn.disabled = false;
                  input.disabled = false;
              }
          }

          // Hàm Xóa Toàn Bộ Dữ Liệu
          async function cleanData() {
              if (!confirm('Cảnh báo nguy hiểm: Hành động này sẽ xóa TOÀN BỘ dữ liệu báo cáo hiện tại và reset lại bộ đếm ID sự cố về #1.\\n\\nBạn có chắc chắn muốn xóa sạch hệ thống không?')) return;
              
              const btn = event.currentTarget;
              const originalHTML = btn.innerHTML;
              btn.innerHTML = '...';
              btn.disabled = true;

              try {
                  const response = await fetch('/api/tickets/clean', { method: 'POST' });
                  if (response.ok) {
                      alert('✅ Đã dọn dẹp sạch sẽ toàn bộ dữ liệu!');
                      window.location.reload();
                  } else {
                      alert('❌ Lỗi: Không thể xóa dữ liệu (Thiếu quyền).');
                      btn.innerHTML = originalHTML;
                      btn.disabled = false;
                  }
              } catch (err) {
                  alert('❌ Lỗi kết nối máy chủ.');
                  btn.innerHTML = originalHTML;
                  btn.disabled = false;
              }
          }
      </script>
  </body>
  </html>`;
  
  res.send(htmlContent);
});

// Zalo webhook verification (GET)
app.get('/webhook', (req, res) => {
  console.log('Zalo verification GET request received:', req.query);
  res.status(200).json({ status: 'ok' });
});

// ENDPOINT: API Đóng Ticket từ Web Dashboard
app.post('/api/tickets/resolve', async (req, res) => {
  // Basic Auth
  const authheader = req.headers.authorization;
  if (!authheader) {
    res.setHeader('WWW-Authenticate', 'Basic');
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const auth = new Buffer.from(authheader.split(' ')[1], 'base64').toString().split(':');
  const user = auth[0];
  const pass = auth[1];

  if (user !== 'minhhan' || pass !== 'Hannguyen@113') {
    res.setHeader('WWW-Authenticate', 'Basic');
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { id, replyText } = req.body;
  if (!id || !replyText) {
    return res.status(400).json({ error: 'Thiếu thông tin (ID hoặc Nội dung phản hồi).' });
  }

  const existingReq = await db.getRequest(id);
  if (!existingReq) {
    return res.status(404).json({ error: `Không tìm thấy sự cố #${id}.` });
  }
  if (existingReq.status === 'Đã xong') {
    return res.status(400).json({ error: `Sự cố #${id} đã được đánh dấu hoàn thành trước đó.` });
  }

  const updatedReq = await db.updateRequest(id, replyText, Date.now());
  if (updatedReq) {
    // Thông báo về nhóm/người dùng gốc
    const targetChat = updatedReq.chat_id || updatedReq.sender_id;
    const userMsg = `✅ SỰ CỐ ĐÃ ĐƯỢC XỬ LÝ XONG!\n------------------------------\nMã Sự Cố: #${id}\nNội dung Thầy/Cô báo: ${updatedReq.content}\n\n💬 Phản hồi từ IT: ${replyText}\n------------------------------\nCảm ơn Thầy/Cô đã phản hồi!`;
    await sendZaloMessage(targetChat, userMsg);
    
    // Thông báo cho Admin (Tuỳ chọn để Admin biết Webhook đã chạy)
    const adminId = await db.getSetting('admin_chat_id');
    if (adminId) {
      await sendZaloMessage(adminId, `🌐 Hệ thống vừa ghi nhận sự cố #${id} đã được đóng trực tiếp qua Web Dashboard.`);
    }

    return res.json({ success: true });
  } else {
    return res.status(500).json({ error: 'Lỗi ghi dữ liệu vào hệ thống.' });
  }
});

// ENDPOINT: API Xóa Toàn bộ dữ liệu từ Web Dashboard
app.post('/api/tickets/clean', async (req, res) => {
  // Basic Auth
  const authheader = req.headers.authorization;
  if (!authheader) {
    res.setHeader('WWW-Authenticate', 'Basic');
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const auth = new Buffer.from(authheader.split(' ')[1], 'base64').toString().split(':');
  const user = auth[0];
  const pass = auth[1];

  if (user !== 'minhhan' || pass !== 'Hannguyen@113') {
    res.setHeader('WWW-Authenticate', 'Basic');
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // Chạy lệnh dọn dẹp
  const count = await db.deleteAllRequests();
  
  // Gửi thông báo cho Admin qua Zalo
  const adminId = await db.getSetting('admin_chat_id');
  if (adminId) {
    await sendZaloMessage(adminId, `🧹 [WEB DASHBOARD] Đã dọn dẹp hệ thống. Xóa thành công ${count} sự cố. Bộ đếm ID đã được reset về #1.`);
  }

  return res.json({ success: true, deletedCount: count });
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

    // Tự động nhận diện Group (nếu chat.id khác sender.id hoặc có event là group)
    if (chatId !== senderId || eventName === 'group_send_text') {
      await db.addGroup(chatId);
    }

    // Handle /addgroup
    if (text.trim() === '/addgroup') {
      await db.addGroup(chatId);
      await sendZaloMessage(chatId, "✅ Đã đăng ký nhóm này vào danh sách nhận thông báo (Broadcast).");
      return;
    }

    // Handle /removegroup
    if (text.trim() === '/removegroup') {
      await db.removeGroup(chatId);
      await sendZaloMessage(chatId, "⚠️ Đã gỡ nhóm này khỏi danh sách nhận thông báo.");
      return;
    }

    // Handle /thongbao
    if (text.startsWith('/thongbao ')) {
      const adminId = await db.getSetting('admin_chat_id') || process.env.ADMIN_CHAT_ID;
      if (senderId !== adminId) {
        await sendZaloMessage(chatId, "❌ Bạn không có quyền thực hiện lệnh này.");
        return;
      }

      const broadcastMsg = text.replace('/thongbao ', '').trim();
      if (!broadcastMsg) {
        await sendZaloMessage(chatId, "⚠️ Vui lòng nhập nội dung thông báo. VD: /thongbao Hôm nay bảo trì mạng");
        return;
      }

      const groups = await db.getAllGroups();
      if (groups.length === 0) {
        await sendZaloMessage(chatId, "⚠️ Không có nhóm nào trong danh sách để gửi thông báo.");
        return;
      }

      let successCount = 0;
      for (const groupId of groups) {
        const res = await sendZaloMessage(groupId, "📢 THÔNG BÁO TỪ IT:\n\n" + broadcastMsg);
        if (res && res.error === 0) successCount++;
      }

      await sendZaloMessage(chatId, `✅ Đã gửi thông báo đến ${successCount}/${groups.length} nhóm.`);
      return;
    }

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
        await sendZaloMessage(chatId, "❌ Bạn không có quyền thực hiện lệnh này.");
        return;
      }
      
      const reportLink = `${PUBLIC_URL}/report`;
      await sendZaloMessage(chatId, `✅ Báo cáo trực tuyến của bạn đã sẵn sàng tại:\n${reportLink}\n\n(Tài khoản: minhhan / Mật khẩu: Hannguyen@113)`);
      return;
    }

    // Handle /clean command
    if (text.trim() === '/clean') {
      const adminId = await db.getSetting('admin_chat_id') || process.env.ADMIN_CHAT_ID;
      if (senderId !== adminId) {
        await sendZaloMessage(chatId, "❌ Bạn không có quyền thực hiện lệnh này.");
        return;
      }
      
      const deletedCount = await db.deleteAllRequests();
      await sendZaloMessage(chatId, `✅ Đã dọn dẹp thành công! ${deletedCount} dữ liệu báo lỗi đã được xóa khỏi hệ thống.`);
      return;
    }

    // Xử lý tin nhắn từ Admin (Reply ticket)
    const adminIdForReply = await db.getSetting('admin_chat_id') || process.env.ADMIN_CHAT_ID;
    const isBotMentioned = text.includes(BOT_NAME) || text.includes('@Bot');
    const quoteText = message?.quote?.text || '';
    const isExplicitQuoteReply = /Mã Yêu Cầu: #(\d+)/.test(quoteText);
    const textTicketMatch = text.match(/#(\d+)/);
    const hasTextTicketId = textTicketMatch !== null;

    // Là Reply nếu: Gửi từ Admin, KHÔNG phải lệnh, VÀ (Có Quote hợp lệ HOẶC có gõ #ID HOẶC không có nhắc đến @Bot)
    if (senderId === adminIdForReply && !text.startsWith('/') && (isExplicitQuoteReply || hasTextTicketId || !isBotMentioned)) {
      let targetTicketId = null;
      
      // Ưu tiên 1: Gõ trực tiếp #ID trong tin nhắn
      if (hasTextTicketId) {
         targetTicketId = parseInt(textTicketMatch[1]);
      } 
      // Ưu tiên 2: Tìm Mã Yêu Cầu trong Quote
      else if (isExplicitQuoteReply) {
         const match = quoteText.match(/Mã Yêu Cầu: #(\d+)/);
         if (match) targetTicketId = parseInt(match[1]);
      } 
      // Ưu tiên 3: Lấy ticket mới nhất đang chờ
      else {
         // Nếu không có quote, lấy ticket mới nhất đang chờ
         const latestPending = await db.getLatestPendingRequest();
         if (latestPending) {
           targetTicketId = latestPending.id;
         }
      }

      if (targetTicketId) {
         // Kiểm tra trạng thái trước
         const existingReq = await db.getRequest(targetTicketId);
         if (!existingReq) {
            await sendZaloMessage(chatId, `❌ Không tìm thấy yêu cầu #${targetTicketId}.`);
            return;
         }
         
         if (existingReq.status === 'Đã xong') {
            await sendZaloMessage(chatId, `⚠️ CẢNH BÁO: Sự cố #${targetTicketId} đã được đánh dấu hoàn thành trước đó rồi. Thao tác bị hủy bỏ.`);
            return;
         }

         // Xóa mã #ID khỏi nội dung trả lời nếu Admin có gõ vào
         const cleanText = text.replace(/#\d+\s*/g, '').trim() || 'Hoàn thành';

         const updatedReq = await db.updateRequest(targetTicketId, cleanText, Date.now());
         if (updatedReq) {
            await sendZaloMessage(chatId, `✅ Sự cố #${targetTicketId} đã hoàn thành.`);
            // Thông báo cho người dùng gốc (Nhắn vào chat gốc: nhóm hoặc cá nhân)
            const targetChat = updatedReq.chat_id || updatedReq.sender_id;
            const userMsg = `✅ SỰ CỐ ĐÃ ĐƯỢC XỬ LÝ XONG!\n------------------------------\nMã Sự Cố: #${targetTicketId}\nNội dung Thầy/Cô báo: ${updatedReq.content}\n\n💬 Phản hồi từ IT: ${cleanText}\n------------------------------\nCảm ơn Thầy/Cô đã phản hồi!`;
            await sendZaloMessage(targetChat, userMsg);
         }
      } else {
         await sendZaloMessage(chatId, `⚠️ Không có yêu cầu nào đang chờ xử lý, hoặc hệ thống không nhận diện được bạn đang trả lời cho sự cố nào.`);
      }
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
      const newId = await db.addRequest(timestamp, senderName, senderId, chatId, requestContent);

      // Format the message to send to Admin
      const adminMessage = `🔔 CÓ YÊU CẦU HỖ TRỢ MỚI! [Mã Yêu Cầu: #${newId}]\n------------------------------\n👤 Người gửi: ${senderName}\n🕒 Thời gian: ${timeStr} - ${dateStr}\n📌 Nội dung:\n${requestContent}\n------------------------------\n🛠️ IT Meyschool vui lòng tiếp nhận!`;
      
      console.log('--- NHẬN YÊU CẦU MỚI ---');
      console.log(adminMessage);

      const adminId = await db.getSetting('admin_chat_id') || process.env.ADMIN_CHAT_ID;
      if (adminId) {
        const userMessage = `✅ YÊU CẦU ĐÃ ĐƯỢC TIẾP NHẬN!\n------------------------------\nMã Sự Cố: #${newId}\n👤 Người gửi: Thầy/Cô ${senderName}\n🕒 Thời gian: ${timeStr} - ${dateStr}\n📌 Nội dung:\n${requestContent}\n------------------------------\n🛠️ Bộ phận IT sẽ tiến hành kiểm tra và sửa chữa.\n😊 Xin cảm ơn Thầy/Cô!`;
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
