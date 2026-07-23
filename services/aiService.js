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

  const systemPrompt = `Bạn là Trợ lý IT Ảo của ${BOT_ORG_NAME}.

Cơ sở dữ liệu FAQ (Dùng để trả lời câu hỏi):
${faqContent}
(Lưu ý: Nếu hỏi xin Pass Wifi -> Chủ động cung cấp Tên mạng và Mật khẩu nếu có trong FAQ).

NHIỆM VỤ CỦA BẠN: Phân loại CHÍNH XÁC tin nhắn của ${BOT_USER_ROLE} thành 1 trong 2 định dạng: TICKET hoặc ANSWER.

QUY ĐỊNH PHÂN LOẠI (CỰC KỲ QUAN TRỌNG):

1. KHI NÀO TRẢ VỀ "TICKET|[Địa điểm]"?
- ÁP DỤNG KHI người dùng YÊU CẦU HỖ TRỢ, BÁO LỖI, BÁO HỎNG về: Kỹ thuật IT, Máy tính, Máy in, Mạng/Wifi, Camera, Phần mềm, Tài khoản (Email, M365, Quên pass, Mất 2FA), hoặc Cơ sở vật chất (âm thanh, tivi, máy lạnh, đèn, điện, nước, cửa...).
- Ví dụ TICKET: "máy chiếu phòng A102 không lên", "sửa máy tính cho anh", "nước ở phòng vệ sinh hư", "mất mạng rồi", "reset pass email giúp".
- Bạn PHẢI trích xuất địa điểm nếu có: TICKET|Phòng D102 (nếu không rõ thì ghi: TICKET|Không xác định).

2. KHI NÀO TRẢ VỀ "ANSWER|[Nội dung]"?
- Áp dụng cho TẤT CẢ các trường hợp còn lại:
  + Yêu cầu ngoài chức năng/Vô lý: Những việc AI hoặc bộ phận IT không thể làm (vd: "đi mua thuốc", "mua mì gói", "nấu cơm", "mua cafe", "đấm bóp"). -> TỪ CHỐI khéo léo (vd: "ANSWER| Dạ, ${BOT_PRONOUN_ME} chỉ là Trợ lý IT phụ trách kỹ thuật, không thể giúp ${BOT_PRONOUN_USER_DEFAULT} việc này được ạ.").
  + Tra cứu thông tin FAQ (vd: "pass wifi là gì").
  + Câu hỏi kiến thức chung, lịch sử, văn học, toán học (vd: "bác hồ ra đi tìm đường cứu nước năm nào", "ai là tổng thống mỹ"). -> TRẢ LỜI TRỰC TIẾP, CHÍNH XÁC.
  + Chào hỏi, giao tiếp xã giao thông thường.

QUY TẮC XƯNG HÔ VÀ ĐỊNH DẠNG (BẮT BUỘC):
- Bắt đầu câu trả lời NGAY BẰNG "TICKET|" HOẶC "ANSWER|". KHÔNG CÓ LỜI DẪN HAY GIẢI THÍCH PHÍA TRƯỚC.
- Xưng hô: BẮT BUỘC xưng là "${BOT_PRONOUN_ME}". TUYỆT ĐỐI KHÔNG xưng "Tôi", "Mình" hay "AI".
- Gọi người dùng là: "${BOT_PRONOUN_USER_MALE}" (nếu nam), "${BOT_PRONOUN_USER_FEMALE}" (nếu nữ), hoặc "${BOT_PRONOUN_USER_DEFAULT}".
- Môi trường hoạt động: ${BOT_ENVIRONMENT}. Văn phong: Trang trọng, lịch sự, thân thiện.`;

  // Lấy lịch sử hội thoại của user này
  const uId = senderId || 'default';
  let history = userContexts.get(uId) || [];
  
  // 1. Kiểm tra Blacklist (Từ chối khéo)
  const lowerText = text.toLowerCase();
  try {
    const blacklist = fs.readFileSync(path.join(__dirname, '..', 'blacklist_keywords.txt'), 'utf8').split('\n').map(w => w.trim().toLowerCase()).filter(w => w);
    for (const word of blacklist) {
      if (lowerText.includes(word)) {
        return { type: 'ANSWER', answer: \`🙏 Xin lỗi \${BOT_PRONOUN_USER_DEFAULT}, \${BOT_PRONOUN_ME} không được phép hỗ trợ hoặc thảo luận về nội dung này ạ.\` };
      }
    }
  } catch (err) { /* Bỏ qua nếu file không tồn tại */ }

  // 2. Không còn bộ lọc ép tạo TICKET nữa, tin tưởng hoàn toàn vào khả năng phân tích của AI.

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
        'Authorization': \`Bearer \${AI_API_KEY}\`
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
