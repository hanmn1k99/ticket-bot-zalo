const fs = require('fs');
const path = require('path');
const db = require('../database');
const { AI_API_KEY } = require('../config/constants');
const { getBotConfig } = require('./botConfigService');

// Bộ nhớ ngữ cảnh hội thoại cho từng user (lưu trên RAM)
const userContexts = new Map();

async function analyzeWithAI(text, senderName, senderId) {
  if (!AI_API_KEY) return { type: 'TICKET' };
  
  const botConfig = await getBotConfig();
  const {
    BOT_ORG_NAME,
    BOT_USER_ROLE,
    BOT_PRONOUN_ME,
    BOT_PRONOUN_USER_MALE,
    BOT_PRONOUN_USER_FEMALE,
    BOT_PRONOUN_USER_DEFAULT,
    BOT_ENVIRONMENT
  } = botConfig;

  // Đọc nội dung FAQ
  let faqContent = await db.getSetting('faq_content');
  if (!faqContent) {
    try {
      faqContent = fs.readFileSync(path.join(__dirname, '..', 'faq.txt'), 'utf8');
      await db.setSetting('faq_content', faqContent);
    } catch (err) {
      faqContent = "- Chưa có dữ liệu FAQ.";
    }
  }

  const systemPrompt = `Bạn là Trợ lý IT Ảo (phần mềm AI) của ${BOT_ORG_NAME}.

Cơ sở dữ liệu FAQ (Đây là những thông tin bạn CÓ THỂ dùng để trả lời câu hỏi):
${faqContent}
(Lưu ý 1: Nếu FAQ ghi mạng wifi nào đó "không có mật khẩu", điều đó có nghĩa là mạng đó LÀ MẠNG MỞ, KHÔNG YÊU CẦU NHẬP PASS).
(Lưu ý 2: NẾU người dùng hỏi về Wifi, HÃY CHỦ ĐỘNG CUNG CẤP ĐẦY ĐỦ cả Tên mạng (SSID) và Mật khẩu (nếu có)).

NHIỆM VỤ CỦA BẠN: Phân loại tin nhắn của ${BOT_USER_ROLE} thành đúng 1 trong 2 định dạng:

1. TICKET|[Địa điểm] -> Áp dụng cho: BÁO SỰ CỐ KỸ THUẬT IT, TÀI KHOẢN EMAIL/M365 HOẶC CƠ SỞ VẬT CHẤT (máy tính, email, M365, wifi, máy in, camera (cam), phần mềm, âm thanh, loa, mic, máy chiếu, tivi, điều hòa/máy lạnh, đèn, điện, nước, bàn ghế, cửa...).
- TẤT CẢ VẤN ĐỀ LIÊN QUAN ĐẾN EMAIL / M365 (quên mật khẩu email, quên mk, mất tài khoản, mất 2FA / xác minh 2 lớp, không gửi/nhận được email, lỗi Outlook/Microsoft 365,...) BẮT BUỘC KHÔNG TRẢ VỀ ANSWER MÀ PHẢI LÀ TICKET (vì tài khoản M365 do IT trực tiếp quản lý và hỗ trợ).
- CHỈ CẦN BÁO LỖI HOẶC YÊU CẦN HỖ TRỢ TÀI KHOẢN/KỸ THUẬT (như "bảo vệ mất cam rồi", "máy chiếu không lên", "hư đèn", "mất mạng", "quên mật khẩu email", "mất 2FA"), ĐÓ CŨNG LÀ TICKET.
- Từ "cam" 100% là "camera an ninh", tuyệt đối không hiểu là quả cam.
- "mất wifi", "wifi hỏng" -> TICKET. Hỏi "Pass wifi là gì?" -> ANSWER.
- TUYỆT ĐỐI KHÔNG TẠO TICKET cho câu hỏi kiến thức chung, lịch sử, toán học, địa lý (Ví dụ: "Hồ chủ tịch ra đi năm nào", "1+1 bằng mấy"). Những câu này BẮT BUỘC là ANSWER.
- Trích xuất địa điểm nếu có. Định dạng chuẩn: TICKET|Phòng D102 hoặc TICKET|Bảo vệ hoặc TICKET|Không xác định.

2. ANSWER|[Nội dung trả lời] -> Áp dụng cho: CÂU HỎI TRA CỨU THÔNG TIN, FAQ, CÂU HỎI KIẾN THỨC CHUNG (LỊCH SỬ, TO├üN, VĂN...), CHÀO HỎI, XÃ GIAO.
- Với câu hỏi kiến thức chung/lịch sử/toán học (Ví dụ: "Hồ chủ tịch ra đi tìm đường cứu nước năm nào..."): TRẢ LỜI TRỰC TIẾP NỘI DUNG CHÍNH XÁC, NGẮN GỌN. KHÔNG ĐƯỢC TỪ CHỐI, KHÔNG ĐƯỢC GIẢI THÍCH LAN MAN HAY TRANH LUẬN VỀ QUY TẮC.
  Ví dụ: "ANSWER| Dạ Bác Hồ ra đi tìm đường cứu nước vào ngày 5/6/1911 tại bến cảng Nhà Rồng (Sài Gòn) trên con tàu Amiral Latouche-Tréville với tên gọi Văn Ba ạ."
- Với câu hỏi FAQ (wifi, máy in...): Trả lời ngắn gọn 1-2 câu đúng trọng tâm.
- Với chào hỏi/xã giao: Trả lời vui vẻ, lịch sự.

QUY TẮC XƯNG HÔ VÀ ĐỊNH DẠNG (BẮT BUỘC):
- Phản hồi của bạn PHẢI BẮT ĐẦU NGAY BẰNG "TICKET|" HOẶC "ANSWER|". TUYỆT ĐỐI KHÔNG VIẾT BẤT KỲ CÂU LỜI DẪN, TRANH LUẬN HAY GIẢI THÍCH NÀO TRƯỚC ĐÓ.
- Xưng hô: Bản thân bạn BẮT BUỘC LUÔN LUÔN xưng là "${BOT_PRONOUN_ME}". TUYỆT ĐỐI KHÔNG xưng "Tôi", "Mình" hay "AI".
- Gọi người dùng: Gọi là "${BOT_PRONOUN_USER_MALE}" (nếu nam) hoặc "${BOT_PRONOUN_USER_FEMALE}" (nếu nữ), hoặc "${BOT_PRONOUN_USER_DEFAULT}".
- Nếu người dùng nhắn tiếng Anh: Trả lời 100% bằng tiếng Anh, xưng "I" và gọi "Mr./Ms.".

QUY TẮC VĂN PHONG VÀ NGỮ PHÁP (CỰC KỲ QUAN TRỌNG):
- Môi trường hoạt động: ${BOT_ENVIRONMENT}.
- Văn phong: TRANG TRỌNG, LỊCH SỰ, CHUẨN CHÍNH TẢ VÀ CHUẨN CẤU TRÚC NGỮ PHÁP TIẾNG VIỆT.
- Tuyệt đối KHÔNG viết câu lủng củng, KHÔNG dùng từ nói ngọng/khẩu ngữ thiếu từ.
- Ví dụ câu văn chuẩn: "ANSWER| Dạ thưa ${BOT_PRONOUN_USER_DEFAULT}, trước khi lấy tên Văn Ba để lên tàu Amiral Latouche-Tréville, Bác Hồ dùng tên Nguyễn Tất Thành ạ."`;

  // Lấy lịch sử hội thoại của user này
  const uId = senderId || 'default';
  let history = userContexts.get(uId) || [];
  
  // KIỂM TRA BỘ LỌC TỪ KHÓA CỨNG (HARDCODE FILTER)
  const lowerText = text.toLowerCase();
  
  // 1. Kiểm tra Blacklist
  try {
    const blacklist = fs.readFileSync(path.join(__dirname, '..', 'blacklist_keywords.txt'), 'utf8').split('\n').map(w => w.trim().toLowerCase()).filter(w => w);
    for (const word of blacklist) {
      if (lowerText.includes(word)) {
        return { type: 'ANSWER', answer: `🙏 Xin lỗi ${BOT_PRONOUN_USER_DEFAULT}, ${BOT_PRONOUN_ME} không được phép hỗ trợ hoặc thảo luận về nội dung này ạ.` };
      }
    }
  } catch (err) { /* Bỏ qua nếu file không tồn tại */ }

  // 2. Kiểm tra Ticket Keywords
  let isForcedTicket = false;
  // Cụm từ hỏi kiến thức chung, lịch sử, toán học, tra cứu KHÔNG bao giờ ép tạo ticket cứng
  const generalKnowledgeExclusions = [
    'cứu nước', 'tìm đường cứu nước', 'ra đi năm nào', 'thành lập năm nào',
    'bao nhiêu', 'năm nào', 'là ai', 'tại sao', 'ở đâu', 'như thế nào',
    'hồ chủ tịch', 'bác hồ', 'bác ra đi', 'lịch sử', 'địa lý', 'toán học',
    'là gì', 'mật khẩu wifi', 'pass wifi'
  ];
  const isGeneralQuery = generalKnowledgeExclusions.some(k => lowerText.includes(k));

  if (!isGeneralQuery) {
    try {
      const ticketKeywords = fs.readFileSync(path.join(__dirname, '..', 'ticket_keywords.txt'), 'utf8').split('\n').map(w => w.trim().toLowerCase()).filter(w => w);
      for (const word of ticketKeywords) {
        if (lowerText.includes(word)) {
          isForcedTicket = true;
          userContexts.delete(uId); // Xóa lịch sử khi tạo ticket
          break;
        }
      }
    } catch (err) { /* Bỏ qua nếu file không tồn tại */ }
  }

  // Đẩy câu hỏi hiện tại vào lịch sử
  history.push({ role: 'user', content: text });

  // Xây dựng mảng messages gửi cho Groq
  const currentMessages = [...history];
  if (isForcedTicket) {
    currentMessages[currentMessages.length - 1] = {
      role: 'user',
      content: text + "\n\n[LƯU Ý CỦA HỆ THỐNG: YÊU CẦU NÀY ĐÃ ĐƯỢC XÁC ĐỊNH LÀ SỰ CỐ KỸ THUẬT. BẠN BẮT BUỘC PHẢI PHÂN LOẠI LÀ TICKET VÀ TRÍCH XUẤT ĐỊA ĐIỂM (Ví dụ: TICKET|Phòng D104), TUYỆT ĐỐI KHÔNG TRẢ VỀ ANSWER.]"
    };
  }

  const messages = [
    { role: 'system', content: systemPrompt },
    ...currentMessages
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
        temperature: 0.2
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('AI API Error HTTP', response.status, ':', errText);
      userContexts.delete(uId);
      return { type: 'TICKET', location: "Không xác định" };
    }

    const data = await response.json();
    let result = data.choices?.[0]?.message?.content?.trim() || 'TICKET';
    
    // Nếu AI trả về hoặc chứa TICKET| trong văn bản
    if (result.includes('TICKET|') || result.startsWith('TICKET')) {
      userContexts.delete(uId);
      const ticketIndex = result.indexOf('TICKET|');
      const ticketStr = ticketIndex !== -1 ? result.substring(ticketIndex) : result;
      const parts = ticketStr.split('|');
      return { type: 'TICKET', location: parts.length > 1 ? parts[1].trim().split('\n')[0] : "Không xác định" };
    }
    
    // Còn lại là ANSWER
    let answerText = result;
    if (answerText.includes('ANSWER|')) {
      answerText = answerText.substring(answerText.indexOf('ANSWER|') + 7).trim();
    }
    
    // Bộ lọc làm sạch văn bản AI:
    answerText = answerText.replace(/^(Tuy nhiên|Để tuân thủ|Theo quy định hệ thống)[^.\n]*[.\n]/gi, '').trim();
    answerText = answerText.replace(/\b(Tôi|tôi)\b/g, BOT_PRONOUN_ME);
    
    // Lưu lại câu trả lời vào lịch sử
    history.push({ role: 'assistant', content: answerText });
    if (history.length > 10) history = history.slice(history.length - 10);
    userContexts.set(uId, history);

    return { type: 'ANSWER', answer: answerText };
  } catch (error) {
    console.error('Lỗi gọi AI API (Network):', error);
    userContexts.delete(uId);
    return { type: 'TICKET', location: "Không xác định" };
  }
}

module.exports = {
  userContexts,
  analyzeWithAI
};
