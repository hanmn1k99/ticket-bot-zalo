const fs = require('fs');
const path = require('path');
const db = require('../database');
const { AI_API_KEY } = require('../config/constants');
const { getBotConfig } = require('./botConfigService');

// Bộ nhớ ngữ cảnh hội thoại cho từng user (lưu trên RAM)
const userContexts = new Map();


function extractLocationFallback(text) {
  const lowerText = text.toLowerCase();
  
  // 1. Quét chuỗi dạng 1m3, 10m2, 12m5 (thêm chữ Lớp vào nếu chưa có)
  const match1 = lowerText.match(/\b\d{1,2}m\d{1,2}\b/i);
  if (match1) {
    const before = lowerText.substring(0, lowerText.indexOf(match1[0])).trim();
    const hasPrefix = /(lớp|phòng)\s*$/.test(before);
    return hasPrefix ? (before.match(/(lớp|phòng)\s*$/)[0].trim() + ' ' + match1[0]) : ('Lớp ' + match1[0].toUpperCase());
  }
  
  // 2. Quét "tầng xxx", "khu xxx"
  const match3 = lowerText.match(/(?:tầng|khu)\s+([a-z0-9]+)/i);
  if (match3) {
      const idx = lowerText.indexOf(match3[0]);
      const before = lowerText.substring(0, idx).trim();
      const prefixes = ['nhà vệ sinh', 'wc', 'toilet', 'hành lang', 'cầu thang', 'sảnh', 'sân'];
      for (const p of prefixes) {
          if (before.endsWith(p)) {
              return p + ' ' + match3[0];
          }
      }
      return match3[0];
  }
  
  // 3. Các phòng đặc biệt khác
  const match4 = lowerText.match(/(thư viện|hội trường|nhà xe|phòng y tế|sân trường|nhà đa năng|phòng lab|căn tin|bảo vệ|nhà vệ sinh|wc|toilet)/i);
  if (match4) return match4[0];
  
  return null;
}


let activeGroqModel = null;

async function getGroqModel() {
  if (activeGroqModel) return activeGroqModel;
  try {
    const response = await fetch('https://api.groq.com/openai/v1/models', {
      headers: { 'Authorization': 'Bearer ' + AI_API_KEY }
    });
    if (response.ok) {
      const data = await response.json();
      const models = data.data.map(m => m.id);
      // Prefer some common models, fallback to the first one available
      const preferred = ['llama-3.1-70b-versatile', 'llama-3.1-8b-instant', 'mixtral-8x7b-32768', 'gemma2-9b-it'];
      for (const p of preferred) {
        if (models.includes(p)) {
          activeGroqModel = p;
          return p;
        }
      }
      activeGroqModel = models[0];
      return models[0];
    }
  } catch (err) {
    console.error('Failed to fetch models list from Groq', err);
  }
  return 'mixtral-8x7b-32768'; // Ultimate fallback
}

async function analyzeWithAI(text, senderName, senderId) {
  if (!AI_API_KEY) return { type: 'TICKET', location: extractLocationFallback(text) || "Không xác định" };
  
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

  const systemPrompt = `
Bạn là Trợ lý IT ảo (phần mềm AI) của ${BOT_ORG_NAME}. ${BOT_USER_ROLE} vừa gửi tin nhắn: "{Nội dung tin nhắn người dùng}"

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
- Tên của người nhận là: "{Tên người dùng}". BẮT BUỘC HÃY SUY ĐOÁN GIỚI TÍNH dựa vào tên này (dù là tiếng Việt hay tiếng nước ngoài).
- NẾU TRẢ LỜI TIẾNG VIỆT: Hãy gọi là "${BOT_PRONOUN_USER_MALE}" (nếu là nam) hoặc "${BOT_PRONOUN_USER_FEMALE}" (nếu là nữ). Hạn chế dùng "${BOT_PRONOUN_USER_DEFAULT}" trừ khi tên quá khó đoán. Bản thân bạn LUÔN LUÔN phải xưng là "${BOT_PRONOUN_ME}" (Tuyệt đối không xưng "Tôi", "Mình" hay "AI").
- NẾU TRẢ LỜI TIẾNG ANH: Hãy xưng là "I", và gọi người dùng là "Mr." (nếu là nam) hoặc "Ms." (nếu là nữ) kèm theo tên của họ. Không dùng "${BOT_PRONOUN_USER_DEFAULT}/${BOT_PRONOUN_ME}" trong tiếng Anh.

Quy tắc ngôn ngữ (QUAN TRỌNG NHẤT):
- BẮT BUỘC PHẢN HỒI BẰNG ĐÚNG NGÔN NGỮ MÀ NGƯỜI DÙNG SỬ DỤNG.
- NẾU NGƯỜI DÙNG NHẮN BẰNG TIẾNG ANH, BẠN PHẢI TRẢ LỜI 100% BẰNG TIẾNG ANH. KHÔNG ĐƯỢC PHÉP CHÈN BẤT KỲ TỪ TIẾNG VIỆT NÀO. Bỏ qua quy tắc xưng hô "${BOT_PRONOUN_USER_DEFAULT}/${BOT_PRONOUN_ME}".

Quy tắc phân loại (RẤT QUAN TRỌNG - KHÔNG ĐƯỢC BỎ LỠ TICKET CỦA ADMIN):
1. TICKET - Phân loại là TICKET NẾU VÀ CHỈ NẾU tin nhắn là YÊU CẦU XỬ LÝ SỰ CỐ KỸ THUẬT IT, TÀI KHOẢN EMAIL/M365 HOẶC CƠ SỞ VẬT CHẤT (máy tính, mạng wifi, máy in, camera, phần mềm, âm thanh, loa, mic, máy chiếu, tivi, điều hòa/máy lạnh, đèn, điện, nước, bàn ghế, cửa...).
- TẤT CẢ VẤN ĐỀ EMAIL / M365: Quên mật khẩu email, mất tài khoản, mất 2FA / xác minh 2 lớp, không gửi/nhận được email, lỗi Outlook/Microsoft 365... BẮT BUỘC LÀ TICKET (vì M365 do IT trực tiếp quản lý).
- Các dấu hiệu nhận biết: "coi giùm", "xem giúp", "sửa", "kiểm tra", "hư", "lag", "chậm", "không vào được", "mất mạng", "bị đơ", "không in được", "rè", "không lên", "cháy", "rò rỉ", "gãy", "chập", "quên mk", "mất 2fa"...
- ĐẶC BIỆT LƯU Ý VỀ WIFI: Nếu người dùng kêu "mất wifi", "không có wifi", "wifi hỏng", "không kết nối được wifi" -> CHẮC CHẮN LÀ TICKET (Báo lỗi). CHỈ phân loại là ANSWER khi người dùng thực sự hỏi "Mật khẩu wifi là gì?", "Cho xin pass wifi".
- LƯU Ý ĐẶC BIỆT: KHÔNG TẠO TICKET đối với các nhờ vả cá nhân, sai vặt không liên quan đến sửa chữa kỹ thuật. Những câu này phân loại là ANSWER để từ chối khéo léo.
- Khi quyết định là TICKET, HÃY TRÍCH XUẤT ĐỊA ĐIỂM (vị trí) sự cố nếu có trong câu hỏi. Trả về đúng định dạng: TICKET|[Địa điểm]. Nếu không xác định được địa điểm, trả về: TICKET|Không xác định.

2. ANSWER - Phân loại là ANSWER nếu tin nhắn là:
- Câu hỏi tìm kiếm thông tin có sẵn trong FAQ (wifi, máy in...).
- Tin nhắn xin thông tin rõ ràng (ví dụ: "cho xin mật khẩu wifi", "pass wifi là gì", "làm sao để mượn máy chiếu").
- Nhờ vả cá nhân phi lý, mua đồ, sai vặt (hãy từ chối khéo léo).
- Tin nhắn chào hỏi xã giao, hỏi thăm sức khỏe, trò chuyện kiến thức chung.
Lúc này BẮT BUỘC bắt đầu bằng chữ: ANSWER|
- Tuyệt đối không gọi đích danh bất kỳ cá nhân nào trong phòng IT, chỉ được phép dùng từ "Bộ phận IT".
- Với câu hỏi tra cứu FAQ (xin wifi, máy in...): Lọc ĐÚNG thông tin cần thiết và trả lời CỰC KỲ NGẮN GỌN (1-2 câu). Không liệt kê các thông tin thừa mà người dùng không hỏi. (Ví dụ: Hỏi wifi khách thì chỉ nói tên và pass wifi khách).
- Với câu hỏi xã giao/nhờ vả cá nhân: Trả lời RẤT NGẮN GỌN, lịch sự từ chối hoặc trả lời đúng trọng tâm.
- Với các câu cảm thán, khen ngợi, hoặc kết thúc (ví dụ: "ok rồi", "cảm ơn", "tốt"): Hãy phản hồi VUI VẺ, NHIỆT TÌNH, có cảm xúc (ví dụ: "Dạ vâng ạ, ${BOT_PRONOUN_USER_DEFAULT} cần hỗ trợ gì thêm cứ nhắn ${BOT_PRONOUN_ME} nhé! ☺️").
- Với câu hỏi kiến thức, toán học: ĐƯA RA TRỰC TIẾP ĐÁP ÁN, TUYỆT ĐỐI KHÔNG GIẢI THÍCH LAN MAN.
Ví dụ: "ANSWER| Dạ wifi dành cho khách là abc, mạng mở không cần mật khẩu ạ."
Ví dụ: "ANSWER| Dạ căn bậc 2 của 178 là khoảng 13.34 ạ."
Ví dụ (Nếu hỏi tiếng Anh): "ANSWER| The guest wifi is abc, it is an open network without a password."

Lưu ý: Bạn là một AI thông minh, hãy trả lời tự nhiên, có cảm xúc.`;


  // Lấy lịch sử hội thoại của user này
  const uId = senderId || 'default';
  let history = userContexts.get(uId) || [];
  
  // 1. Kiểm tra Blacklist (Từ chối khéo)
  const lowerText = text.toLowerCase();
  try {
    const blacklist = fs.readFileSync(path.join(__dirname, '..', 'blacklist_keywords.txt'), 'utf8').split('\n').map(w => w.trim().toLowerCase()).filter(w => w);
    for (const word of blacklist) {
      if (lowerText.includes(word)) {
        return { type: 'ANSWER', answer: 'Xin lỗi, tôi không được phép hỗ trợ hoặc thảo luận về nội dung này ạ.' };
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
        'Authorization': 'Bearer ' + AI_API_KEY
      },
      body: JSON.stringify({
        model: await getGroqModel(),
        messages: messages,
        max_tokens: 256,
        temperature: 0.2
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('AI API Error HTTP', response.status, ':', errText);
      userContexts.delete(uId);
      return { type: 'TICKET', location: extractLocationFallback(text) || "Không xác định" };
    }

    const data = await response.json();
    let result = data.choices?.[0]?.message?.content?.trim() || 'TICKET';
    
    // Nếu AI trả về hoặc chứa TICKET| trong văn bản
    if (result.includes('TICKET|') || result.startsWith('TICKET')) {
      userContexts.delete(uId);
      const ticketIndex = result.indexOf('TICKET|');
      const ticketStr = ticketIndex !== -1 ? result.substring(ticketIndex) : result;
      const parts = ticketStr.split('|');
      
        let loc = parts.length > 1 ? parts[1].trim().split('\n')[0] : "";
        
        // NẾU AI TRẢ VỀ RỖNG HOẶC "KHÔNG XÁC ĐỊNH", TA MỚI DÙNG REGEX ĐỂ CỨU VÃN
        // Tuyệt đối không ghi đè nếu AI đã nhận diện đúng vị trí (như "Phòng Hiệu trưởng")
        if (!loc || loc.toLowerCase().includes('không') || loc.toLowerCase().includes('chưa') || loc === 'TICKET') {
            const fallback = extractLocationFallback(text);
            if (fallback) {
                loc = fallback;
            } else {
                loc = "Không xác định";
            }
        }
        
        return { type: 'TICKET', location: loc };

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
    return { type: 'TICKET', location: extractLocationFallback(text) || "Không xác định" };
  }
}

module.exports = {
  userContexts,
  analyzeWithAI
};
