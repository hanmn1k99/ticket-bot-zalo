require('dotenv').config();
const express = require('express');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const db = require('./database');
const setupCronJobs = require('./cronjobs');
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');

const AI_API_KEY = process.env.AI_API_KEY;
const JWT_SECRET = process.env.JWT_SECRET || 'default_secret_please_change_in_env';

// Configuration for AI Tone and Environment
const BOT_ORG_NAME = process.env.BOT_ORG_NAME || 'trường Meyschool';
const BOT_USER_ROLE = process.env.BOT_USER_ROLE || 'Giáo viên';
const BOT_PRONOUN_ME = process.env.BOT_PRONOUN_ME || 'Em';
const BOT_PRONOUN_USER_MALE = process.env.BOT_PRONOUN_USER_MALE || 'Thầy';
const BOT_PRONOUN_USER_FEMALE = process.env.BOT_PRONOUN_USER_FEMALE || 'Cô';
const BOT_PRONOUN_USER_DEFAULT = process.env.BOT_PRONOUN_USER_DEFAULT || 'Thầy/Cô';
const BOT_ENVIRONMENT = process.env.BOT_ENVIRONMENT || 'MÔI TRƯỜNG GIÁO DỤC (trường học)';

// Bộ nhớ ngữ cảnh hội thoại cho từng user (lưu trên RAM)
const userContexts = new Map();

async function analyzeWithAI(text, senderName, senderId) {
  if (!AI_API_KEY) return { type: 'TICKET' };
  
  // Đọc nội dung FAQ
  let faqContent = await db.getSetting('faq_content');
  if (!faqContent) {
    try {
      faqContent = fs.readFileSync(path.join(__dirname, 'faq.txt'), 'utf8');
      await db.setSetting('faq_content', faqContent);
    } catch (err) {
      faqContent = "- Chưa có dữ liệu FAQ.";
    }
  }

  const systemPrompt = `Bạn là Trợ lý IT Ảo (phần mềm AI) của ${BOT_ORG_NAME}. ${BOT_USER_ROLE} vừa gửi tin nhắn: "${text}"

Cơ sở dữ liệu FAQ (Đây là những thông tin bạn CÓ THỂ dùng để trả lời câu hỏi):
${faqContent}
(Lưu ý 1: Nếu FAQ ghi mạng wifi nào đó "không có mật khẩu", điều đó có nghĩa là mạng đó LÀ MẠNG MỞ, KHÔNG YÊU CẦU NHẬP PASS, chứ không phải là ${BOT_ORG_NAME} không có mạng wifi đó).
(Lưu ý 2: NẾU người dùng hỏi về Wifi, HÃY CHỦ ĐỘNG CUNG CẤP ĐẦY ĐỦ cả Tên mạng (SSID) và Mật khẩu (nếu có) để tiện cho người dùng, đừng chỉ trả lời mỗi tên mạng).

Quy tắc định vị bản thân (RẤT QUAN TRỌNG):
- Bạn LÀ MỘT TRỢ LÝ ẢO (AI), KHÔNG PHẢI CON NGƯỜI. Bạn không có cơ thể vật lý, không biết đi lại, không thể cầm nắm, ăn uống hay làm các việc ngoài đời thực (như đi mua thuốc, lấy đồ, chạy đi sửa máy).
- Mặc dù là Trợ lý IT, nhưng bạn ĐƯỢC PHÉP TRẢ LỜI MỌI CÂU HỎI kiến thức chung (toán học, lịch sử, văn học, đời sống...) như một cuốn bách khoa toàn thư để hỗ trợ ${BOT_USER_ROLE}. KHÔNG BAO GIỜ TỪ CHỐI các câu hỏi kiến thức với lý do "không liên quan đến IT".
- Nếu bị yêu cầu làm những việc vật lý phi lý, hãy TỪ CHỐI một cách khéo léo, lễ phép.
- Môi trường hoạt động của bạn là ${BOT_ENVIRONMENT}. Ngôn từ phải CHUẨN MỰC, TÔN TRỌNG, NGHIÊM TÚC nhưng thân thiện. Tuyệt đối không đùa cợt lố lăng.

Quy tắc xưng hô:
- Tên của người nhắn là: "${senderName}". BẮT BUỘC HÃY SUY ĐOÁN GIỚI TÍNH dựa vào tên này (dù là tiếng Việt hay tiếng nước ngoài).
- NẾU TRẢ LỜI TIẾNG VIỆT: Hãy gọi là "${BOT_PRONOUN_USER_MALE}" (nếu là nam) hoặc "${BOT_PRONOUN_USER_FEMALE}" (nếu là nữ). Hạn chế dùng "${BOT_PRONOUN_USER_DEFAULT}" trừ khi tên quá khó đoán. Bản thân bạn LUÔN LUÔN phải xưng là "${BOT_PRONOUN_ME}" (Tuyệt đối không xưng "Tôi", "Mình" hay "AI").
- NẾU TRẢ LỜI TIẾNG ANH: Hãy xưng là "I", và gọi người dùng là "Mr." (nếu là nam) hoặc "Ms." (nếu là nữ) kèm theo tên của họ. Không dùng "${BOT_PRONOUN_USER_DEFAULT}/${BOT_PRONOUN_ME}" trong tiếng Anh.

Quy tắc ngôn ngữ (QUAN TRỌNG NHẤT):
- BẮT BUỘC PHẢN HỒI BẰNG ĐÚNG NGÔN NGỮ MÀ NGƯỜI DÙNG SỬ DỤNG.
- NẾU NGƯỜI DÙNG NHẮN BẰNG TIẾNG ANH, BẠN PHẢI TRẢ LỜI 100% BẰNG TIẾNG ANH. KHÔNG ĐƯỢC PHÉP CHÈN BẤT KỲ TỪ TIẾNG VIỆT NÀO. Bỏ qua quy tắc xưng hô "${BOT_PRONOUN_USER_DEFAULT}/${BOT_PRONOUN_ME}".

Quy tắc phân loại (RẤT QUAN TRỌNG - KHÔNG ĐƯỢC BỎ LỠ TICKET CỦA ADMIN):
1. TICKET - Phân loại là TICKET NẾU VÀ CHỈ NẾU tin nhắn là YÊU CẦU XỬ LÝ SỰ CỐ KỸ THUẬT IT HOẶC CƠ SỞ VẬT CHẤT (máy tính, mạng wifi, máy in, camera, phần mềm, âm thanh, loa, mic, máy chiếu, tivi, điều hòa/máy lạnh, đèn, điện, nước, bàn ghế, cửa...).
- Các dấu hiệu nhận biết: "coi dùm", "xem giúp", "sửa", "kiểm tra", "hư", "lag", "chậm", "không vào được", "mất mạng", "bị đơ", "không in được", "rè", "không lên", "cháy", "rò rỉ", "gãy", "chập"...
- ĐẶC BIỆT LƯU Ý VỀ WIFI: Nếu người dùng kêu "mất wifi", "không có wifi", "wifi hỏng", "không kết nối được wifi" -> CHẮC CHẮN LÀ TICKET (Báo lỗi). CHỈ phân loại là ANSWER khi người dùng thực sự hỏi "Mật khẩu wifi là gì?", "Cho xin pass wifi".
- LƯU Ý ĐẶC BIỆT: KHÔNG TẠO TICKET đối với các nhờ vả cá nhân, sai vặt không liên quan đến sửa chữa kỹ thuật. Những câu này phân loại là ANSWER để từ chối khéo léo.
- Khi quyết định là TICKET, HÃY TRÍCH XUẤT ĐỊA ĐIỂM (vị trí) sự cố nếu có trong câu hỏi. Trả về đúng định dạng: TICKET|[Địa điểm]. Nếu không xác định được địa điểm, trả về: TICKET|Không xác định.
Ví dụ: "phòng d102 lỗi máy chiếu" -> TICKET|Phòng D102
Tuyệt đối không thêm bất cứ từ nào khác, không hứa hẹn, không an ủi.

2. ANSWER - Áp dụng cho: 
- Tin nhắn xin thông tin rõ ràng (ví dụ: "cho xin mật khẩu wifi", "pass wifi là gì", "làm sao để mượn máy chiếu").
- Nhờ vả cá nhân phi lý, mua đồ, sai vặt (hãy từ chối khéo léo).
- Tin nhắn chào hỏi xã giao, hỏi thăm sức khỏe, trò chuyện kiến thức chung.
Lúc này BẮT BUỘC bắt đầu bằng chữ: ANSWER|
- Tuyệt đối không gọi đích danh bất kỳ cá nhân nào trong phòng IT, chỉ được phép dùng từ "Bộ phận IT".
- Với câu hỏi tra cứu FAQ (xin wifi, máy in...): Lọc ĐÚNG thông tin cần thiết và trả lời CỰC KỲ NGẮN GỌN (1-2 câu). Không liệt kê các thông tin thừa mà người dùng không hỏi. (Ví dụ: Hỏi wifi khách thì chỉ nói tên và pass wifi khách).
- Với câu hỏi xã giao/nhờ vả cá nhân: Trả lời RẤT NGẮN GỌN, lịch sự từ chối hoặc trả lời đúng trọng tâm.
- Với các câu cảm thán, khen ngợi, hoặc kết thúc (ví dụ: "ok rồi", "cảm ơn", "tốt"): Hãy phản hồi VUI VẺ, NHIỆT TÌNH, có cảm xúc (ví dụ: "Dạ vâng ạ, ${BOT_PRONOUN_USER_DEFAULT} cần hỗ trợ gì thêm cứ nhắn ${BOT_PRONOUN_ME} nhé! 😊").
- Với câu hỏi kiến thức, toán học: ĐƯA RA TRỰC TIẾP ĐÁP ÁN, TUYỆT ĐỐI KHÔNG GIẢI THÍCH LAN MAN.
Ví dụ: "ANSWER| Dạ wifi dành cho khách là abc, mạng mở không cần mật khẩu ạ."
Ví dụ: "ANSWER| Dạ căn bậc 2 của 178 là khoảng 13.34 ạ."
Ví dụ (Nếu hỏi tiếng Anh): "ANSWER| The guest wifi is abc, it is an open network without a password."

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
        return { type: 'ANSWER', answer: `🙏 Xin lỗi ${BOT_PRONOUN_USER_DEFAULT}, ${BOT_PRONOUN_ME} không được phép hỗ trợ hoặc thảo luận về nội dung này ạ.` };
      }
    }
  } catch (err) { /* Bỏ qua nếu file không tồn tại */ }

  // 2. Kiểm tra Ticket Keywords
  let isForcedTicket = false;
  try {
    const ticketKeywords = fs.readFileSync(path.join(__dirname, 'ticket_keywords.txt'), 'utf8').split('\n').map(w => w.trim().toLowerCase()).filter(w => w);
    for (const word of ticketKeywords) {
      if (lowerText.includes(word)) {
        isForcedTicket = true;
        userContexts.delete(uId); // Xóa lịch sử khi tạo ticket
        break;
      }
    }
  } catch (err) { /* Bỏ qua nếu file không tồn tại */ }

  // Đẩy câu hỏi hiện tại vào lịch sử
  if (isForcedTicket) {
    history.push({ role: 'user', content: text + "\n\n[LƯU Ý CỦA HỆ THỐNG: YÊU CẦU NÀY ĐÃ ĐƯỢC XÁC ĐỊNH LÀ SỰ CỐ KỸ THUẬT. BẠN BẮT BUỘC PHẢI PHÂN LOẠI LÀ TICKET VÀ TRÍCH XUẤT ĐỊA ĐIỂM (Ví dụ: TICKET|Phòng D104), TUYỆT ĐỐI KHÔNG TRẢ VỀ ANSWER.]" });
  } else {
    history.push({ role: 'user', content: text });
  }

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
      return { type: 'TICKET', location: "Không xác định" };
    }

    const data = await response.json();
    const result = data.choices?.[0]?.message?.content?.trim() || 'TICKET';
    
    // Nếu AI trả về TICKET
    if (result.startsWith('TICKET')) {
      userContexts.delete(uId);
      const parts = result.split('|');
      return { type: 'TICKET', location: parts.length > 1 ? parts[1].trim() : "Không xác định" };
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
    return { type: 'TICKET', location: "Không xác định" };
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
app.use(cookieParser());
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

async function renderTableRows() {
  const requests = await db.getAllRequests();
  return requests.map(r => {
     const d = new Date(r.timestamp);
     const day = String(d.getDate()).padStart(2, '0');
     const month = String(d.getMonth() + 1).padStart(2, '0');
     const year = d.getFullYear();
     const time = d.toLocaleTimeString('en-US', { hour12: false });
     
     let statusBadge = '';
     if (r.status === 'Đã xong') {
       statusBadge = '<span style="background:#dcfce7; color:#166534; padding:4px 8px; border-radius:12px; font-weight:600; font-size:12px; white-space:nowrap;">🟢 Đã xong</span>';
     } else if (r.status === 'Đang xử lý') {
       statusBadge = `<span id="statusBadge_${r.id}" style="background:#fef08a; color:#854d0e; padding:4px 8px; border-radius:12px; font-weight:600; font-size:12px; white-space:nowrap;">🟡 Đang xử lý</span>`;
     } else {
       statusBadge = `<span id="statusBadge_${r.id}" style="background:#fee2e2; color:#991b1b; padding:4px 8px; border-radius:12px; font-weight:600; font-size:12px; white-space:nowrap;">🔴 Đang chờ</span>`;
     }
       
     let adminReplyCell = '';
     if (r.status === 'Đã xong') {
         adminReplyCell = r.admin_reply ? r.admin_reply : '<i style="color:#94a3b8">Không có nội dung</i>';
     } else if (r.status === 'Đang xử lý') {
         adminReplyCell = `
           <div id="actionBox_${r.id}" style="display:flex; gap:6px;">
              <input type="text" id="replyInput_${r.id}" onkeypress="if(event.key === 'Enter') resolveTicket(${r.id})" placeholder="Chi tiết khắc phục..." style="flex:1; padding:6px 10px; border:1px solid #cbd5e1; border-radius:6px; font-size:13px; outline:none;">
              <button onclick="resolveTicket(${r.id})" style="padding:6px 12px; font-size:13px; background:#16a34a; color:white; border:none; border-radius:6px; cursor:pointer; white-space:nowrap;">Gửi</button>
           </div>
         `;
     } else {
         adminReplyCell = `
           <div id="actionBox_${r.id}" style="display:flex; gap:6px;">
              <button onclick="acceptTicket(${r.id}, event)" style="padding:6px 12px; font-size:13px; background:#eab308; color:white; border:none; border-radius:6px; cursor:pointer; width:100%; white-space:nowrap;">Nhận yêu cầu</button>
           </div>
         `;
     }

     return `
      <tr>
        <td><strong>#${r.id}</strong></td>
        <td>${r.sender_name}</td>
        <td><span style="background:var(--btn-secondary-bg); padding:4px 8px; border-radius:12px; font-size:12px;">${r.chat_name || 'Cá nhân'}</span></td>
        <td>${time}<br><small style="color:var(--text-muted)">${day}/${month}/${year}</small></td>
        <td>${r.content}</td>
        <td id="statusCell_${r.id}">${statusBadge}</td>
        <td id="replyCell_${r.id}">${adminReplyCell}</td>
      </tr>`;
  }).join('');
}

// Auth Middleware
function checkAuth(req, res, next) {
  const token = req.cookies.auth_token;
  if (!token) {
    if (req.path === '/report') return res.redirect('/login');
    return res.status(401).json({ error: 'Unauthorized' });
  }
  try {
    jwt.verify(token, JWT_SECRET);
    next();
  } catch (err) {
    if (req.path === '/report') return res.redirect('/login');
    return res.status(401).json({ error: 'Unauthorized' });
  }
}

// Giao diện Đăng Nhập
app.get('/login', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="vi">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${process.env.PAGE_TITLE || 'Đăng nhập - Phần mềm quản trị'}</title>
      <script>
        if (localStorage.getItem('theme') === 'dark') {
            document.documentElement.setAttribute('data-theme', 'dark');
        }
      </script>
      <link rel="icon" type="image/png" href="/assets/favicon.png?v=\${Date.now()}">
      <style>
          :root {
              --bg-color: #f1f5f9;
              --card-bg: #ffffff;
              --text-main: #1e293b;
              --border-color: #cbd5e1;
              --input-bg: #ffffff;
          }
          [data-theme="dark"] {
              --bg-color: #0f172a;
              --card-bg: #1e293b;
              --text-main: #f8fafc;
              --border-color: #334155;
              --input-bg: #1e293b;
          }
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap');
        body { font-family: 'Inter', sans-serif; background: var(--bg-color); display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
        .login-card { background: var(--card-bg); padding: 40px; border-radius: 12px; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1); width: 100%; max-width: 400px; text-align: center; box-sizing: border-box; }
        .login-card img { max-width: 250px; margin-bottom: 20px; border-radius: 8px; }
        .login-card h2 { margin-top: 0; color: var(--text-main); font-size: 24px; }
        .input-group { margin-bottom: 20px; text-align: left; }
        .input-group label { display: block; font-size: 14px; font-weight: 500; color: var(--text-main); margin-bottom: 8px; }
        .input-group input { width: 100%; padding: 12px; border: 1px solid var(--border-color); border-radius: 8px; font-size: 16px; outline: none; box-sizing: border-box; background: var(--input-bg); color: var(--text-main); }
        .input-group input:focus { border-color: #3b82f6; box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1); }
        .btn { background: #3b82f6; color: white; border: none; padding: 12px; border-radius: 8px; width: 100%; font-size: 16px; font-weight: 600; cursor: pointer; transition: background 0.2s; }
        .btn:hover { background: #2563eb; }
        .error { color: #ef4444; font-size: 14px; margin-bottom: 16px; display: none; }
      </style>
    </head>
    <body>
      <div class="login-card">
        <img src="/assets/logo.png" alt="Logo" onerror="this.style.display='none'">
        <h2>Đăng Nhập Quản Trị</h2>
        <div class="error" id="errorMsg">Tài khoản hoặc mật khẩu không đúng!</div>
        <form id="loginForm" onsubmit="doLogin(event)">
          <div class="input-group">
            <label>Tên đăng nhập</label>
            <input type="text" id="username" required>
          </div>
          <div class="input-group">
            <label>Mật khẩu</label>
            <input type="password" id="password" required>
          </div>
          <button type="submit" class="btn">Đăng Nhập</button>
        </form>
      </div>
      <script>
        async function doLogin(e) {
          e.preventDefault();
          const btn = document.querySelector('.btn');
          btn.textContent = 'Đang đăng nhập...';
          btn.disabled = true;
          const u = document.getElementById('username').value;
          const p = document.getElementById('password').value;
          
          const res = await fetch('/login', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({username: u, password: p})
          });
          
          if (res.ok) {
            window.location.href = '/report';
          } else {
            document.getElementById('errorMsg').style.display = 'block';
            btn.textContent = 'Đăng Nhập';
            btn.disabled = false;
          }
        }
      </script>
    </body>
    </html>
  `);
});

// Xử lý Đăng nhập
app.post('/login', (req, res) => {
  const { username, password } = req.body;
  const expectedUser = process.env.ADMIN_USERNAME || 'admin';
  const expectedPass = process.env.ADMIN_PASSWORD || '123456';
  
  if (username === expectedUser && password === expectedPass) {
    const token = jwt.sign({ admin: true }, JWT_SECRET, { expiresIn: '7d' });
    res.cookie('auth_token', token, { httpOnly: true, maxAge: 7 * 24 * 60 * 60 * 1000 });
    return res.json({ success: true });
  }
  res.status(401).json({ error: 'Invalid credentials' });
});

// Xử lý Đăng xuất
app.get('/logout', (req, res) => {
  res.clearCookie('auth_token');
  res.redirect('/login');
});

// Dynamic HTML Report Route
app.get('/report', checkAuth, async (req, res) => {
  const formattedRequests = await renderTableRows();

  const monthStr = new Date().getMonth() + 1;
  let printTemplateHtml = '';
  try {
      printTemplateHtml = fs.readFileSync(path.join(__dirname, 'print_template.html'), 'utf8');
  } catch(e) {}
  
  const htmlContent = `
  <!DOCTYPE html>
  <html lang="vi">
  <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${process.env.PAGE_TITLE || 'Phần mềm quản trị hệ thống - minhhan.net'}</title>
      <script>
        if (localStorage.getItem('theme') === 'dark') {
            document.documentElement.setAttribute('data-theme', 'dark');
        }
      </script>
      <link rel="icon" type="image/png" href="/assets/favicon.png?v=${Date.now()}">
      <link rel="apple-touch-icon" href="/assets/favicon.png?v=${Date.now()}">
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
              --table-header-bg: #f1f5f9;
              --table-hover-bg: #f8fafc;
              --btn-secondary-bg: #f1f5f9;
              --btn-secondary-text: #475569;
              --btn-secondary-border: #cbd5e1;
          }
          [data-theme="dark"] {
              --bg-color: #0f172a;
              --card-bg: #1e293b;
              --text-main: #f8fafc;
              --text-muted: #94a3b8;
              --border-color: #334155;
              --table-header-bg: #334155;
              --table-hover-bg: #0f172a;
              --btn-secondary-bg: #1e293b;
              --btn-secondary-text: #cbd5e1;
              --btn-secondary-border: #475569;
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
              color: var(--text-main);
          }
          .print-title { display: none; }
          
          /* Dropdown CSS */
          .dropdown {
              position: relative;
              display: inline-block;
          }
          .dropdown-content {
              display: none;
              position: absolute;
              right: 0;
              background-color: var(--card-bg);
              min-width: 180px;
              box-shadow: 0px 8px 16px 0px rgba(0,0,0,0.2);
              z-index: 1;
              border-radius: 6px;
              border: 1px solid var(--border-color);
          }
          .dropdown-content button {
              color: var(--text-main);
              padding: 10px 16px;
              display: flex;
              align-items: center;
              gap: 8px;
              width: 100%;
              border: none;
              background: none;
              text-align: left;
              cursor: pointer;
              font-size: 14px;
          }
          .dropdown-content button:hover {
              background-color: var(--table-hover-bg);
          }
          .dropdown:hover .dropdown-content {
              display: block;
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
              background-color: var(--card-bg);
              color: var(--text-main);
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
              background-color: var(--btn-secondary-bg);
              color: var(--btn-secondary-text);
              border: 1px solid var(--btn-secondary-border);
          }
          button.btn-secondary:hover {
              background-color: var(--border-color);
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
              background-color: var(--table-header-bg); 
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
              background-color: var(--table-hover-bg); 
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
              background: var(--card-bg);
          }
          
          /* Responsive (Giao diện Mobile) */
          @media screen and (max-width: 768px) {
              .header {
                  flex-direction: column;
                  align-items: flex-start;
              }
              .controls {
                  width: 100%;
                  display: flex;
                  flex-wrap: wrap;
                  gap: 10px;
              }
              input[type="text"], select {
                  max-width: 100%;
                  width: 100%;
                  flex: 1 1 100%;
              }
              .controls button {
                  flex: 1;
                  justify-content: center;
                  padding: 12px 10px;
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
              td:nth-of-type(3)::before { content: "Nhóm"; }
              td:nth-of-type(4)::before { content: "Thời gian"; }
              td:nth-of-type(5)::before { content: "Mô tả sự cố"; }
              td:nth-of-type(6)::before { content: "Trạng thái"; }
              td:nth-of-type(7)::before { content: "Phản hồi của IT"; }

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
              :root, [data-theme="dark"], body {
                  --bg-color: #ffffff !important;
                  --card-bg: #ffffff !important;
                  --text-main: #000000 !important;
                  --text-muted: #333333 !important;
                  --border-color: #dddddd !important;
                  --table-header-bg: #f1f5f9 !important;
                  --table-hover-bg: #ffffff !important;
                  --btn-secondary-bg: #e2e8f0 !important;
                  --btn-secondary-text: #000000 !important;
              }
              * {
                  -webkit-print-color-adjust: exact !important;
                  print-color-adjust: exact !important;
              }
              .screen-title { display: none !important; }
              .print-title { display: inline !important; }
              body { background: white; padding: 0 !important; }
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
          <div class="print-header">
              ${printTemplateHtml}
          </div>
          <div class="header">
              <h2>
                  <a href="https://minhhan.net" target="_blank" style="text-decoration:none;">
                      <img src="/assets/logo.png" alt="Logo" style="height: 40px; margin-right: 15px; vertical-align: middle;" onerror="this.style.display='none'">
                  </a>
                  <span class="screen-title">${process.env.HEADER_TITLE || `BÁO CÁO AI BOT THÁNG ${monthStr}`}</span>
                  <span class="print-title">Báo cáo tháng ${monthStr}</span>
              </h2>
              <div class="controls">
                  <select id="statusFilter">
                      <option value="">-- Tất cả trạng thái --</option>
                      <option value="đã xong">🟢 Đã xong</option>
                      <option value="đang xử lý">🟡 Đang xử lý</option>
                      <option value="đang chờ">🔴 Đang chờ</option>
                  </select>
                  <select id="nameFilter">
                      <option value="">-- Tất cả người báo --</option>
                  </select>
                  <input type="text" id="searchInput" placeholder="Tìm kiếm tự do...">
                  <button class="btn-secondary" onclick="toggleDarkMode()" title="Đổi giao diện Tối/Sáng">
                      <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"></path></svg>
                  </button>
                  <button class="btn-secondary" onclick="window.location.reload()" title="Tải lại trang">
                      <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
                  </button>
                  <button onclick="window.print()" title="In báo cáo">
                      <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"></path></svg>
                  </button>
                  
                  <div class="dropdown">
                      <button class="btn-secondary" style="color:var(--text-main); display:flex; align-items:center; gap:5px;">
                          <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                          Tài khoản
                      </button>
                      <div class="dropdown-content">
                          <button onclick="window.location.href='/settings'" style="color:#2563eb;">
                              <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                              Cài đặt & AI
                          </button>
                          <button onclick="cleanData()" style="color:#ef4444;">
                              <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                              Xóa toàn bộ CSDL
                          </button>
                          <button onclick="window.location.href='/logout'" style="color:#475569;">
                              <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
                              Đăng xuất
                          </button>
                      </div>
                  </div>
              </div>
          </div>

          <div class="table-wrapper" id="pdf-content">
              <table id="reportTable">
                  <thead>
                      <tr>
                          <th width="5%">STT</th>
                          <th width="12%">Người Yêu Cầu</th>
                          <th width="13%">Nhóm</th>
                          <th width="15%">Thời gian</th>
                          <th width="20%">Mô tả sự cố</th>
                          <th width="15%">Trạng thái</th>
                          <th width="20%">Phản hồi của IT</th>
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
          function updateDynamicTime() {
              const timeEl = document.getElementById('dynamic-print-time');
              if (timeEl) {
                  const now = new Date();
                  const timeStr = now.toLocaleTimeString('vi-VN', { hour12: false, timeZone: 'Asia/Ho_Chi_Minh' });
                  const dateStr = now.toLocaleDateString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh', day: '2-digit', month: '2-digit', year: 'numeric' });
                  timeEl.textContent = \`\${timeStr}, \${dateStr}\`;
              }
          }
          setInterval(updateDynamicTime, 1000);
          updateDynamicTime();

          function toggleDarkMode() {
              const current = document.documentElement.getAttribute('data-theme');
              if (current === 'dark') {
                  document.documentElement.setAttribute('data-theme', 'light');
                  localStorage.setItem('theme', 'light');
              } else {
                  document.documentElement.setAttribute('data-theme', 'dark');
                  localStorage.setItem('theme', 'dark');
              }
          }
          // Khởi tạo các phần tử DOM
          const searchInput = document.getElementById('searchInput');
          const nameFilter = document.getElementById('nameFilter');
          const statusFilter = document.getElementById('statusFilter');
          const table = document.getElementById('reportTable');
          const emptyState = document.getElementById('emptyState');

          function getRows() {
              return table.getElementsByTagName('tbody')[0].getElementsByTagName('tr');
          }

          // Cập nhật danh sách người yêu cầu vào dropdown
          function updateNameDropdown() {
              const rows = getRows();
              const uniqueNames = new Set();
              for (let i = 0; i < rows.length; i++) {
                  const nameCell = rows[i].getElementsByTagName('td')[1];
                  if (nameCell) {
                      uniqueNames.add(nameCell.textContent.trim());
                  }
              }
              
              const currentValue = nameFilter.value;
              nameFilter.innerHTML = '<option value="">-- Tất cả người báo --</option>';
              uniqueNames.forEach(name => {
                  const option = document.createElement('option');
                  option.value = name.toLowerCase();
                  option.textContent = name;
                  if (option.value === currentValue) option.selected = true;
                  nameFilter.appendChild(option);
              });
          }

          // Hàm chạy Bộ lọc (kết hợp Tìm kiếm tự do + Chọn tên + Chọn trạng thái)
          function filterData() {
              const searchText = searchInput.value.toLowerCase();
              const selectedName = nameFilter.value;
              const selectedStatus = statusFilter.value;
              const rows = getRows();
              let visibleCount = 0;

              for (let i = 0; i < rows.length; i++) {
                  const text = rows[i].textContent || rows[i].innerText;
                  const nameCell = rows[i].getElementsByTagName('td')[1];
                  const statusCell = rows[i].getElementsByTagName('td')[4];
                  if (!nameCell || !statusCell) continue;

                  const nameCellText = nameCell.textContent.trim().toLowerCase();
                  const statusCellText = statusCell.textContent.trim().toLowerCase();
                  
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
          nameFilter.addEventListener('change', filterData);
          statusFilter.addEventListener('change', filterData);

          // Khởi tạo lần đầu
          updateNameDropdown();

          // Bộ đếm thời gian không hoạt động (Tự động đăng xuất sau 30 phút)
          let idleMinutes = 0;
          
          // Tăng biến đếm mỗi phút
          const idleInterval = setInterval(() => {
              idleMinutes++;
              if (idleMinutes >= 30) {
                  window.location.href = '/logout';
              }
          }, 60000); // 1 phút

          // Hàm reset bộ đếm khi có thao tác người dùng
          function resetIdleTimer() {
              idleMinutes = 0;
          }

          // Lắng nghe các sự kiện tương tác của người dùng
          ['mousemove', 'mousedown', 'keypress', 'touchmove', 'scroll'].forEach(evt => 
              document.addEventListener(evt, resetIdleTimer, true)
          );


          // Cơ chế đồng bộ thời gian thực (Real-time Polling)
          async function fetchAndRenderRows() {
              try {
                  const activeEl = document.activeElement;
                  if (activeEl && activeEl.tagName === 'INPUT' && activeEl.id.startsWith('replyInput_')) {
                      return;
                  }
                  
                  const res = await fetch('/api/tickets/rows');
                  if (res.ok) {
                      const data = await res.json();
                      if (data.success) {
                          table.getElementsByTagName('tbody')[0].innerHTML = data.html;
                          updateNameDropdown();
                          filterData();
                      }
                  }
              } catch (e) {}
          }
          setInterval(fetchAndRenderRows, 10000);

          // Hàm Nhận yêu cầu
          async function acceptTicket(ticketId, event) {
              const btn = event.currentTarget;
              const originalBtnText = btn.textContent;
              btn.textContent = 'Đang nhận...';
              btn.disabled = true;

              try {
                  const response = await fetch('/api/tickets/inprogress', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ id: ticketId })
                  });
                  const data = await response.json();
                  if (response.ok && data.success) {
                      fetchAndRenderRows();
                  } else {
                      alert('Lỗi: ' + (data.error || 'Không thể nhận yêu cầu.'));
                      btn.textContent = originalBtnText;
                      btn.disabled = false;
                  }
              } catch (err) {
                  alert('Lỗi kết nối tới máy chủ.');
                  btn.textContent = originalBtnText;
                  btn.disabled = false;
              }
          }

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
app.post('/api/tickets/resolve', checkAuth, async (req, res) => {
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
    const userMsg = `✅ SỰ CỐ ĐÃ ĐƯỢC KHẮC PHỤC!
------------------------------
🛠️ Sự cố (Mã số: #${id}) của Thầy/Cô ${updatedReq.sender_name} tại ${updatedReq.location || 'Không xác định'} đã được bộ phận IT xử lý hoàn tất.
💬 Phản hồi từ IT: ${replyText}
------------------------------
😊 Xin cảm ơn Thầy/Cô!`;
    await sendZaloMessage(targetChat, userMsg);
    
    // Thông báo cho Admin
    const adminId = await db.getSetting('admin_chat_id');
    if (adminId) {
      await sendZaloMessage(adminId, `✅ Sự cố #${id} đã hoàn thành qua web`);
    }

    return res.json({ success: true });
  } else {
    return res.status(500).json({ error: 'Lỗi ghi dữ liệu vào hệ thống.' });
  }
});

// ENDPOINT: Chuyển trạng thái sang Đang xử lý
app.post('/api/tickets/inprogress', checkAuth, async (req, res) => {
  const { id } = req.body;
  if (!id) return res.status(400).json({ error: 'Thiếu ID' });
  const updatedReq = await db.updateRequestStatus(id, 'Đang xử lý');
  if (updatedReq) {
    const targetChat = updatedReq.chat_id || updatedReq.sender_id;
    const userMsg = `🟡 IT ĐANG XỬ LÝ SỰ CỐ!
------------------------------
👨‍💻 Sự cố (Mã số: #${id}) của Thầy/Cô ${updatedReq.sender_name} tại ${updatedReq.location || 'Không xác định'} đã được Bộ phận IT tiếp nhận.
🔧 Kỹ thuật viên đang tiến hành kiểm tra và khắc phục.
------------------------------
😊 Sẽ có thông báo gửi đến Thầy/Cô ngay khi hoàn tất!`;
    await sendZaloMessage(targetChat, userMsg);
    return res.json({ success: true });
  }
  return res.status(400).json({ error: 'Không thể cập nhật' });
});

// ENDPOINT: API Xóa Toàn bộ dữ liệu từ Web Dashboard
app.post('/api/tickets/clean', checkAuth, async (req, res) => {
  // Chạy lệnh dọn dẹp
  const count = await db.deleteAllRequests();
  
  // Gửi thông báo cho Admin qua Zalo
  const adminId = await db.getSetting('admin_chat_id');
  if (adminId) {
    await sendZaloMessage(adminId, `🧹 [WEB DASHBOARD] Đã dọn dẹp hệ thống. Xóa thành công ${count} sự cố. Bộ đếm ID đã được reset về #1.`);
  }

  return res.json({ success: true, deletedCount: count });
});

// ENDPOINT: API Lấy dữ liệu bảng Real-time
app.get('/api/tickets/rows', checkAuth, async (req, res) => {
  const html = await renderTableRows();
  return res.json({ success: true, html: html });
});

// SETTINGS PAGE
app.get('/settings', checkAuth, async (req, res) => {
  const defaultFaq = `1. Mật khẩu mạng wifi "Meyschool - Giáo Viên" là: Mey@2024\n2. Mạng wifi "Meyschool - Guest" là mạng mở, không có mật khẩu.\n3. Liên hệ khẩn cấp Phòng IT (Phòng D102): 0909.123.456 (Mr. Nghĩa) hoặc 0988.789.123 (Mr. Nam).\n4. Nếu máy in hết mực, máy tính không lên nguồn, vui lòng tạo TICKET báo lỗi.`;
  let faqContent = await db.getSetting('faq_content');
  if (!faqContent) faqContent = defaultFaq;

  const systemPromptPreview = `Bạn là Trợ lý IT Ảo (phần mềm AI) của ${BOT_ORG_NAME}. ${BOT_USER_ROLE} vừa gửi tin nhắn: "{Nội dung tin nhắn người dùng}"

Cơ sở dữ liệu FAQ (Đây là những thông tin bạn CÓ THỂ dùng để trả lời câu hỏi):
${faqContent}
(Lưu ý 1: Nếu FAQ ghi mạng wifi nào đó "không có mật khẩu", điều đó có nghĩa là mạng đó LÀ MẠNG MỞ, KHÔNG YÊU CẦU NHẬP PASS, chứ không phải là ${BOT_ORG_NAME} không có mạng wifi đó).
(Lưu ý 2: NẾU người dùng hỏi về Wifi, HÃY CHỦ ĐỘNG CUNG CẤP ĐẦY ĐỦ cả Tên mạng (SSID) và Mật khẩu (nếu có) để tiện cho người dùng, đừng chỉ trả lời mỗi tên mạng).

Quy tắc định vị bản thân (RẤT QUAN TRỌNG):
- Bạn LÀ MỘT TRỢ LÝ ẢO (AI), KHÔNG PHẢI CON NGƯỜI. Bạn không có cơ thể vật lý, không biết đi lại, không thể cầm nắm, ăn uống hay làm các việc ngoài đời thực (như đi mua thuốc, lấy đồ, chạy đi sửa máy).
- Mặc dù là Trợ lý IT, nhưng bạn ĐƯỢC PHÉP TRẢ LỜI MỌI CÂU HỎI kiến thức chung (toán học, lịch sử, văn học, đời sống...) như một cuốn bách khoa toàn thư để hỗ trợ ${BOT_USER_ROLE}. KHÔNG BAO GIỜ TỪ CHỐI các câu hỏi kiến thức với lý do "không liên quan đến IT".
- Nếu bị yêu cầu làm những việc vật lý phi lý, hãy TỪ CHỐI một cách khéo léo, lễ phép.
- Môi trường hoạt động của bạn là ${BOT_ENVIRONMENT}. Ngôn từ phải CHUẨN MỰC, TÔN TRỌNG, NGHIÊM TÚC nhưng thân thiện. Tuyệt đối không đùa cợt lố lăng.

Quy tắc xưng hô:
- Tên của người nhắn là: "{Tên người dùng}". BẮT BUỘC HÃY SUY ĐOÁN GIỚI TÍNH dựa vào tên này (dù là tiếng Việt hay tiếng nước ngoài).
- NẾU TRẢ LỜI TIẾNG VIỆT: Hãy gọi là "${BOT_PRONOUN_USER_MALE}" (nếu là nam) hoặc "${BOT_PRONOUN_USER_FEMALE}" (nếu là nữ). Hạn chế dùng "${BOT_PRONOUN_USER_DEFAULT}" trừ khi tên quá khó đoán. Bản thân bạn LUÔN LUÔN phải xưng là "${BOT_PRONOUN_ME}" (Tuyệt đối không xưng "Tôi", "Mình" hay "AI").
- NẾU TRẢ LỜI TIẾNG ANH: Hãy xưng là "I", và gọi người dùng là "Mr." (nếu là nam) hoặc "Ms." (nếu là nữ) kèm theo tên của họ. Không dùng "${BOT_PRONOUN_USER_DEFAULT}/${BOT_PRONOUN_ME}" trong tiếng Anh.

Quy tắc ngôn ngữ (QUAN TRỌNG NHẤT):
- BẮT BUỘC PHẢN HỒI BẰNG ĐÚNG NGÔN NGỮ MÀ NGƯỜI DÙNG SỬ DỤNG.
- NẾU NGƯỜI DÙNG NHẮN BẰNG TIẾNG ANH, BẠN PHẢI TRẢ LỜI 100% BẰNG TIẾNG ANH. KHÔNG ĐƯỢC PHÉP CHÈN BẤT KỲ TỪ TIẾNG VIỆT NÀO. Bỏ qua quy tắc xưng hô "${BOT_PRONOUN_USER_DEFAULT}/${BOT_PRONOUN_ME}".

Quy tắc phân loại (RẤT QUAN TRỌNG - KHÔNG ĐƯỢC BỎ LỠ TICKET CỦA ADMIN):
1. TICKET - Phân loại là TICKET NẾU VÀ CHỈ NẾU tin nhắn là YÊU CẦU XỬ LÝ SỰ CỐ KỸ THUẬT IT HOẶC CƠ SỞ VẬT CHẤT (máy tính, mạng wifi, máy in, camera, phần mềm, âm thanh, loa, mic, máy chiếu, tivi, điều hòa/máy lạnh, đèn, điện, nước, bàn ghế, cửa...).
- Các dấu hiệu nhận biết: "coi dùm", "xem giúp", "sửa", "kiểm tra", "hư", "lag", "chậm", "không vào được", "mất mạng", "bị đơ", "không in được", "rè", "không lên", "cháy", "rò rỉ", "gãy", "chập"...
- ĐẶC BIỆT LƯU Ý VỀ WIFI: Nếu người dùng kêu "mất wifi", "không có wifi", "wifi hỏng", "không kết nối được wifi" -> CHẮC CHẮN LÀ TICKET (Báo lỗi). CHỈ phân loại là ANSWER khi người dùng thực sự hỏi "Mật khẩu wifi là gì?", "Cho xin pass wifi".
- LƯU Ý ĐẶC BIỆT: KHÔNG TẠO TICKET đối với các nhờ vả cá nhân, sai vặt không liên quan đến sửa chữa kỹ thuật. Những câu này phân loại là ANSWER để từ chối khéo léo.
- Khi quyết định là TICKET, HÃY TRÍCH XUẤT ĐỊA ĐIỂM (vị trí) sự cố nếu có trong câu hỏi. Trả về đúng định dạng: TICKET|[Địa điểm]. Nếu không xác định được địa điểm, trả về: TICKET|Không xác định.
Ví dụ: "phòng d102 lỗi máy chiếu" -> TICKET|Phòng D102
Tuyệt đối không thêm bất cứ từ nào khác, không hứa hẹn, không an ủi.

2. ANSWER - Áp dụng cho: 
- Tin nhắn xin thông tin rõ ràng (ví dụ: "cho xin mật khẩu wifi", "pass wifi là gì", "làm sao để mượn máy chiếu").
- Nhờ vả cá nhân phi lý, mua đồ, sai vặt (hãy từ chối khéo léo).
- Tin nhắn chào hỏi xã giao, hỏi thăm sức khỏe, trò chuyện kiến thức chung.
Lúc này BẮT BUỘC bắt đầu bằng chữ: ANSWER|
- Tuyệt đối không gọi đích danh bất kỳ cá nhân nào trong phòng IT, chỉ được phép dùng từ "Bộ phận IT".
- Với câu hỏi tra cứu FAQ (xin wifi, máy in...): Lọc ĐÚNG thông tin cần thiết và trả lời CỰC KỲ NGẮN GỌN (1-2 câu). Không liệt kê các thông tin thừa mà người dùng không hỏi. (Ví dụ: Hỏi wifi khách thì chỉ nói tên và pass wifi khách).
- Với câu hỏi xã giao/nhờ vả cá nhân: Trả lời RẤT NGẮN GỌN, lịch sự từ chối hoặc trả lời đúng trọng tâm.
- Với các câu cảm thán, khen ngợi, hoặc kết thúc (ví dụ: "ok rồi", "cảm ơn", "tốt"): Hãy phản hồi VUI VẺ, NHIỆT TÌNH, có cảm xúc (ví dụ: "Dạ vâng ạ, ${BOT_PRONOUN_USER_DEFAULT} cần hỗ trợ gì thêm cứ nhắn ${BOT_PRONOUN_ME} nhé! 😊").
- Với câu hỏi kiến thức, toán học: ĐƯA RA TRỰC TIẾP ĐÁP ÁN, TUYỆT ĐỐI KHÔNG GIẢI THÍCH LAN MAN.
Ví dụ: "ANSWER| Dạ wifi dành cho khách là abc, mạng mở không cần mật khẩu ạ."
Ví dụ: "ANSWER| Dạ căn bậc 2 của 178 là khoảng 13.34 ạ."
Ví dụ (Nếu hỏi tiếng Anh): "ANSWER| The guest wifi is abc, it is an open network without a password."

Lưu ý: Bạn là một AI thông minh, hãy trả lời tự nhiên, có cảm xúc.`;

  const groupNames = await db.getAllGroupNames();
  
  let groupRows = '';
  for (const [groupId, name] of Object.entries(groupNames)) {
     groupRows += `
       <tr>
         <td style="padding:10px; border-bottom:1px solid var(--border-color);">${groupId}</td>
         <td style="padding:10px; border-bottom:1px solid var(--border-color);">
            <input type="text" id="gname_${groupId}" value="${name}" style="width:100%; padding:6px; border:1px solid var(--border-color); border-radius:4px; background:var(--bg-color); color:var(--text-main);">
         </td>
         <td style="padding:10px; border-bottom:1px solid var(--border-color);">
            <button onclick="updateGroup('${groupId}')" style="background:#2563eb; color:white; border:none; padding:6px 12px; border-radius:4px; cursor:pointer;">Lưu</button>
            <button onclick="deleteGroup('${groupId}')" style="background:#ef4444; color:white; border:none; padding:6px 12px; border-radius:4px; cursor:pointer; margin-left:6px;">Xóa</button>
         </td>
       </tr>
     `;
  }
  
  const html = `
    <!DOCTYPE html>
    <html lang="vi" data-theme="light">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Cài đặt Hệ thống</title>
      <script>
        if (localStorage.getItem('theme') === 'dark') {
            document.documentElement.setAttribute('data-theme', 'dark');
        }
      </script>
      <style>
          :root {
              --bg-color: #f8fafc;
              --card-bg: #ffffff;
              --text-main: #1e293b;
              --border-color: #e2e8f0;
          }
          [data-theme="dark"] {
              --bg-color: #0f172a;
              --card-bg: #1e293b;
              --text-main: #f8fafc;
              --border-color: #334155;
          }
          body {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
              background: var(--bg-color);
              color: var(--text-main);
              padding: 20px;
              max-width: 900px;
              margin: 0 auto;
          }
          .card {
              background: var(--card-bg);
              border: 1px solid var(--border-color);
              border-radius: 8px;
              padding: 20px;
              margin-bottom: 20px;
          }
          textarea {
              width: 100%;
              height: 200px;
              padding: 10px;
              border: 1px solid var(--border-color);
              border-radius: 6px;
              background: var(--bg-color);
              color: var(--text-main);
              font-family: monospace;
          }
          button {
              padding: 10px 16px;
              border: none;
              border-radius: 6px;
              font-weight: 600;
              cursor: pointer;
          }
          .btn-primary { background: #2563eb; color: white; }
          .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
      </style>
    </head>
    <body>
      <div class="header">
        <h2>Cài đặt Hệ thống</h2>
        <button class="btn-primary" onclick="window.location.href='/report'">Quay lại Dashboard</button>
      </div>
      
      <div class="card">
        <details>
          <summary style="font-size: 1.17em; font-weight: bold; cursor: pointer; outline: none; list-style: none;">
            🔍 Xem Quy tắc Cốt lõi của AI (System Prompt)
          </summary>
          <p style="font-size:14px; opacity:0.8; margin-top: 10px;">Đây là toàn bộ quy tắc nền tảng mà AI đang sử dụng để suy luận, phân loại sự cố và xưng hô (Chế độ chỉ xem).</p>
          <textarea readonly style="background-color: var(--border-color); cursor: not-allowed; margin-top: 10px;">${systemPromptPreview}</textarea>
        </details>
      </div>

      <div class="card">
        <h3>Huấn luyện AI (Nội dung FAQ)</h3>
        <p style="font-size:14px; opacity:0.8;">Nhập các dữ liệu bạn muốn AI học. Mỗi dòng một ý.<br><i>Ví dụ: 1. Pass wifi phòng họp là 123456... AI sẽ tự đọc hiểu văn bản này.</i></p>
        <textarea id="faqContent">${faqContent}</textarea>
        <br><br>
        <button class="btn-primary" onclick="saveFaq()">Lưu FAQ</button>
      </div>

      <div class="card">
        <h3>Quản lý Nhóm</h3>
        <table style="width:100%; border-collapse:collapse; text-align:left;">
           <thead>
             <tr>
               <th style="padding:10px; border-bottom:2px solid var(--border-color);">ID Nhóm</th>
               <th style="padding:10px; border-bottom:2px solid var(--border-color);">Tên Nhóm</th>
               <th style="padding:10px; border-bottom:2px solid var(--border-color);">Thao tác</th>
             </tr>
           </thead>
           <tbody>
             ${groupRows}
           </tbody>
        </table>
      </div>

      <script>
        function showNotification(msg) {
          let old = document.getElementById('notification-toast');
          if (old) old.remove();
          const div = document.createElement('div');
          div.id = 'notification-toast';
          div.style.position = 'fixed';
          div.style.top = '20px';
          div.style.right = '20px';
          div.style.background = '#10b981';
          div.style.color = '#fff';
          div.style.padding = '12px 20px';
          div.style.borderRadius = '8px';
          div.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)';
          div.style.zIndex = '9999';
          div.style.fontWeight = 'bold';
          div.innerText = msg;
          document.body.appendChild(div);
          setTimeout(() => div.remove(), 3000);
        }

        async function saveFaq() {
          const content = document.getElementById('faqContent').value;
          const res = await fetch('/api/settings/faq', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ content })
          });
          if (res.ok) showNotification('Lưu FAQ thành công!');
          else showNotification('Lỗi khi lưu.');
        }

        async function updateGroup(groupId) {
          const name = document.getElementById('gname_' + groupId).value;
          const res = await fetch('/api/settings/group/edit', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ groupId, name })
          });
          if (res.ok) showNotification('Đổi tên thành công!');
        }

        async function deleteGroup(groupId) {
          if (!confirm('Bạn có chắc muốn gỡ hệ thống khỏi nhóm này?')) return;
          const res = await fetch('/api/settings/group/delete', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ groupId })
          });
          if (res.ok) window.location.reload();
        }
      </script>
    </body>
    </html>
  `;
  res.send(html);
});

app.post('/api/settings/faq', checkAuth, async (req, res) => {
  await db.setSetting('faq_content', req.body.content || '');
  res.json({ success: true });
});

app.post('/api/settings/group/edit', checkAuth, async (req, res) => {
  const { groupId, name } = req.body;
  if (groupId && name) await db.setGroupName(groupId, name);
  res.json({ success: true });
});

app.post('/api/settings/group/delete', checkAuth, async (req, res) => {
  const { groupId } = req.body;
  if (groupId) await db.removeGroupCompletely(groupId);
  res.json({ success: true });
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
    let cleanTextForCmd = text.replace(new RegExp(BOT_NAME, 'gi'), '').replace(/@Bot/gi, '').trim();
    cleanTextForCmd = cleanTextForCmd.replace(/^@\s*/, '').trim();
    const sender = message.from || {};
    const chat = message.chat || {};
    const senderName = sender.display_name || 'Khách';
    const senderId = sender.id;
    const chatId = chat.id || senderId; // Use chat.id for replies (per Zalo docs)
    const savedGroupName = await db.getGroupName(chatId);
    const chatName = savedGroupName || chat.title || (chatId !== senderId ? 'Nhóm (Không rõ tên)' : 'Cá nhân');
    const timestamp = parseInt(message.date) || Date.now();
    const dateObj = new Date(timestamp);

    console.log('Parsed text:', text);
    console.log('Parsed senderId:', senderId);
    console.log('Parsed chatId:', chatId);
    console.log('Parsed chatName:', chatName);

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
    if (cleanTextForCmd === '/addgroup') {
      await db.addGroup(chatId);
      await sendZaloMessage(chatId, "✅ Đã đăng ký nhóm này vào danh sách nhận thông báo (Broadcast).");
      return;
    }

    // Handle /setname
    if (cleanTextForCmd.startsWith('/setname ')) {
      const newName = cleanTextForCmd.replace('/setname ', '').trim();
      if (!newName) {
        await sendZaloMessage(chatId, "⚠️ Vui lòng nhập tên nhóm. VD: /setname Tổ Toán");
        return;
      }
      await db.setGroupName(chatId, newName);
      await sendZaloMessage(chatId, `✅ Đã lưu tên nhóm này thành: ${newName}`);
      return;
    }

    // Handle /removegroup
    if (cleanTextForCmd === '/removegroup') {
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
      await sendZaloMessage(chatId, `✅ Báo cáo trực tuyến của bạn đã sẵn sàng tại:\n${reportLink}`);
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

    // Handle /groups command
    if (cleanTextForCmd === '/groups' || cleanTextForCmd === '/group') {
      const adminId = await db.getSetting('admin_chat_id') || process.env.ADMIN_CHAT_ID;
      if (senderId !== adminId) {
        await sendZaloMessage(chatId, "❌ Bạn không có quyền thực hiện lệnh này.");
        return;
      }
      
      const groups = await db.getAllGroups();
      if (groups.length === 0) {
        await sendZaloMessage(chatId, "📋 Hiện chưa có nhóm nào được kết nối.");
        return;
      }

      let msg = "📋 DANH SÁCH NHÓM ĐANG KẾT NỐI:\n";
      for (let i = 0; i < groups.length; i++) {
        const name = await db.getGroupName(groups[i]) || 'Chưa đặt tên';
        msg += `${i + 1}. ${name} (ID: ${groups[i]})\n`;
      }
      msg += "\n💡 Dùng lệnh /remove <Tên> để gỡ nhóm khỏi hệ thống.";
      await sendZaloMessage(chatId, msg);
      return;
    }

    // Handle /remove command
    if (cleanTextForCmd.startsWith('/remove ')) {
      const adminId = await db.getSetting('admin_chat_id') || process.env.ADMIN_CHAT_ID;
      if (senderId !== adminId) {
        await sendZaloMessage(chatId, "❌ Bạn không có quyền thực hiện lệnh này.");
        return;
      }

      const nameToRemove = cleanTextForCmd.replace('/remove ', '').trim().toLowerCase();
      const groups = await db.getAllGroups();
      let foundId = null;

      for (const gid of groups) {
        const name = await db.getGroupName(gid);
        if (name && name.toLowerCase() === nameToRemove) {
          foundId = gid;
          break;
        }
      }

      if (foundId) {
        await db.removeGroup(foundId);
        // Delete alias
        const dbJson = JSON.parse(fs.readFileSync(path.join(__dirname, 'database.json'), 'utf8'));
        if (dbJson.groupNames && dbJson.groupNames[foundId]) {
          delete dbJson.groupNames[foundId];
          fs.writeFileSync(path.join(__dirname, 'database.json'), JSON.stringify(dbJson, null, 2));
        }
        await sendZaloMessage(chatId, `✅ Đã gỡ nhóm "${nameToRemove}" khỏi hệ thống.`);
      } else {
        await sendZaloMessage(chatId, `❌ Không tìm thấy nhóm nào có tên "${nameToRemove}". Vui lòng dùng lệnh /groups để xem danh sách.`);
      }
      return;
    }

    // Xử lý tin nhắn từ Admin (Reply ticket)
    const adminIdForReply = await db.getSetting('admin_chat_id') || process.env.ADMIN_CHAT_ID;
    const isBotMentioned = text.includes(BOT_NAME) || text.includes('@Bot');
    const quoteText = message?.quote?.text || '';
    const isExplicitQuoteReply = /\\[#(\d+)\\]|Mã Yêu Cầu: #(\d+)/.test(quoteText);
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
         const match = quoteText.match(/\\[#(\d+)\\]|Mã Yêu Cầu: #(\d+)/);
         if (match) targetTicketId = parseInt(match[1] || match[2]);
      } 
      // Không hợp lệ: Yêu cầu nhập rõ mã ID
      else {
         await sendZaloMessage(chatId, "⚠️ Vui lòng gõ mã sự cố (VD: #12 Xong) hoặc Reply (Trả lời) tin nhắn báo lỗi để hoàn thành.");
         return;
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

         if (existingReq.status === 'Đang chờ') {
             await db.updateRequestStatus(targetTicketId, 'Đang xử lý');
             await sendZaloMessage(chatId, `🟡 Hệ thống đã ghi nhận bạn đang xử lý sự cố #${targetTicketId}. (Nhắn/Reply lần nữa để hoàn thành)`);
         } else if (existingReq.status === 'Đang xử lý') {
             const updatedReq = await db.updateRequest(targetTicketId, cleanText, Date.now());
             if (updatedReq) {
                await sendZaloMessage(chatId, `✅ Sự cố #${targetTicketId} đã hoàn thành.`);
                // Thông báo cho người dùng gốc (Nhắn vào chat gốc: nhóm hoặc cá nhân)
                const targetChat = updatedReq.chat_id || updatedReq.sender_id;
                const userMsg = `✅ SỰ CỐ ĐÃ ĐƯỢC KHẮC PHỤC!
------------------------------
🛠️ Sự cố (Mã số: #${targetTicketId}) của Thầy/Cô ${updatedReq.sender_name} tại ${updatedReq.location || 'Không xác định'} đã được bộ phận IT xử lý hoàn tất.
💬 Phản hồi từ IT: ${cleanText}
------------------------------
😊 Xin cảm ơn Thầy/Cô!`;
                await sendZaloMessage(targetChat, userMsg);
             }
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
      const location = aiResult.location || 'Không xác định';
      const newId = await db.addRequest(timestamp, senderName, senderId, chatId, chatName, requestContent, location);

      // Format the message to send to Admin
      const adminMessage = `🔔 YÊU CẦU HỖ TRỢ MỚI! [#${newId}]
------------------------------
👤 Giáo viên: ${senderName}
🏫 Nhóm: ${chatName}
📍 Vị trí: ${location}
🕒 Thời gian: ${timeStr} - ${dateStr}
📌 Chi tiết sự cố:
${requestContent}
------------------------------
👨‍💻 Đội ngũ IT vui lòng tiếp nhận!`;
      
      console.log('--- NHẬN YÊU CẦU MỚI ---');
      console.log(adminMessage);

      const adminId = await db.getSetting('admin_chat_id') || process.env.ADMIN_CHAT_ID;
      if (adminId) {
        const userMessage = `✅ ĐÃ GỬI YÊU CẦU THÀNH CÔNG!
------------------------------
🛠️ Sự cố của ${BOT_PRONOUN_USER_DEFAULT} ${senderName} (Mã số: #${newId}) đã được hệ thống ghi nhận và chuyển đến bộ phận IT.
👨‍💻 Các kỹ thuật viên sẽ nhanh chóng kiểm tra và xử lý trong thời gian sớm nhất.
------------------------------
😊 Xin cảm ơn ${BOT_PRONOUN_USER_DEFAULT}!`;
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
