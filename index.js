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
       ? '<span style="background:#dcfce7; color:#166534; padding:4px 8px; border-radius:12px; font-weight:600; font-size:12px;">🟢 Đã xong</span>'
       : '<span style="background:#fee2e2; color:#991b1b; padding:4px 8px; border-radius:12px; font-weight:600; font-size:12px;">🔴 Đang chờ</span>';
       
     return `
      <tr>
        <td>${r.sender_name}</td>
        <td>${time}<br><small style="color:var(--text-muted)">${day}/${month}/${year}</small></td>
        <td>${r.content}</td>
        <td>${statusBadge}</td>
        <td>${r.admin_reply ? r.admin_reply : '<i style="color:#94a3b8">Chưa xử lý</i>'}</td>
      </tr>`;
  }).join('');

  const monthStr = new Date().getMonth() + 1;
  
  const htmlContent = `
  <!DOCTYPE html>
  <html lang="vi">
  <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Báo Cáo AI BOT Tháng ${monthStr}</title>
      <!-- Nhúng thư viện html2pdf từ CDN -->
      <script src="https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js"></script>
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
              max-width: 1000px;
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
              flex-wrap: wrap;
          }
          input[type="text"] {
              padding: 10px 16px;
              border: 1px solid var(--border-color);
              border-radius: 8px;
              width: 250px;
              font-size: 14px;
              outline: none;
              transition: border-color 0.2s;
          }
          input[type="text"]:focus {
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
          }
          button:hover {
              background-color: var(--primary-hover);
          }
          .table-wrapper {
              background: var(--card-bg);
              border-radius: 12px;
              box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.05);
              overflow: hidden;
          }
          table { 
              width: 100%; 
              border-collapse: collapse; 
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
      </style>
  </head>
  <body>
      <div class="container">
          <div class="header">
              <h2>📊 BÁO CÁO AI BOT THÁNG ${monthStr}</h2>
              <div class="controls">
                  <input type="text" id="searchInput" placeholder="Tìm kiếm theo tên, nội dung...">
                  <button onclick="downloadPDF()">
                      <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                      Xuất PDF (A4)
                  </button>
              </div>
          </div>

          <div class="table-wrapper" id="pdf-content">
              <table id="reportTable">
                  <thead>
                      <tr>
                          <th width="15%">Tên Zalo</th>
                          <th width="15%">Thời gian</th>
                          <th width="30%">Nội dung lỗi</th>
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
          // Chức năng Lọc Dữ Liệu
          const searchInput = document.getElementById('searchInput');
          const table = document.getElementById('reportTable');
          const rows = table.getElementsByTagName('tbody')[0].getElementsByTagName('tr');
          const emptyState = document.getElementById('emptyState');

          searchInput.addEventListener('keyup', function() {
              const filter = searchInput.value.toLowerCase();
              let visibleCount = 0;

              for (let i = 0; i < rows.length; i++) {
                  const text = rows[i].textContent || rows[i].innerText;
                  if (text.toLowerCase().indexOf(filter) > -1) {
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
          });

          // Chức năng Xuất PDF khổ A4
          function downloadPDF() {
              const element = document.getElementById('pdf-content');
              const dateStr = new Date().toLocaleDateString('vi-VN').replace(/\\//g, '-');
              const opt = {
                  margin:       10,
                  filename:     'BaoCao_IT_' + dateStr + '.pdf',
                  image:        { type: 'jpeg', quality: 0.98 },
                  html2canvas:  { scale: 2, useCORS: true },
                  jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
              };
              html2pdf().set(opt).from(element).save();
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

    // Là Reply nếu: Gửi từ Admin, KHÔNG phải lệnh, VÀ (Có Quote hợp lệ HOẶC không có nhắc đến @Bot)
    if (senderId === adminIdForReply && !text.startsWith('/') && (isExplicitQuoteReply || !isBotMentioned)) {
      let targetTicketId = null;
      
      // Thử tìm Mã Yêu Cầu trong Quote
      const match = quoteText.match(/Mã Yêu Cầu: #(\d+)/);
      if (match) {
         targetTicketId = parseInt(match[1]);
      } else {
         // Nếu không có quote, lấy ticket mới nhất đang chờ
         const latestPending = await db.getLatestPendingRequest();
         if (latestPending) {
           targetTicketId = latestPending.id;
         }
      }

      if (targetTicketId) {
         const updatedReq = await db.updateRequest(targetTicketId, text, Date.now());
         if (updatedReq) {
            await sendZaloMessage(chatId, `✅ Sự cố #${targetTicketId} đã hoàn thành.`);
            // Thông báo cho người dùng gốc (Nhắn vào chat gốc: nhóm hoặc cá nhân)
            const targetChat = updatedReq.chat_id || updatedReq.sender_id;
            const userMsg = `✅ SỰ CỐ ĐÃ ĐƯỢC XỬ LÝ XONG!\n------------------------------\nMã Sự Cố: #${targetTicketId}\nNội dung Thầy/Cô báo: ${updatedReq.content}\n\n💬 Phản hồi từ IT: ${text}\n------------------------------\nCảm ơn Thầy/Cô đã phản hồi!`;
            await sendZaloMessage(targetChat, userMsg);
         } else {
            await sendZaloMessage(chatId, `❌ Không tìm thấy yêu cầu #${targetTicketId} để cập nhật.`);
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
        await sendZaloMessage(chatId, `🤖 AI Trợ lý IT:\n\n@${senderName}\n${aiResult.answer}`);
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
