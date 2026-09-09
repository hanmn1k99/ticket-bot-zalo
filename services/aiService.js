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
      if (before.endsWith(p)) return p + ' ' + match3[0];
    }
    return match3[0];
  }

  // 3. Các phòng đặc biệt khác
  const match4 = lowerText.match(/(thư viện|hội trường|nhà xe|phòng y tế|sân trường|nhà đa năng|phòng lab|căn tin|bảo vệ|nhà vệ sinh|wc|toilet)/i);
  if (match4) return match4[0];

  return null;
}

// Tự động dò model Groq khả dụng — chỉ gọi API 1 lần, cache lại
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
      const chatModels = models.filter(m => !m.includes('whisper') && !m.includes('orpheus') && !m.includes('safety'));
      const preferred = [
        'openai/gpt-oss-20b',
        'openai/gpt-oss-120b',
        'qwen/qwen3.8-27b',
        'qwen/qwen3.6-27b',
        'qwen3-32b',
        'llama-3.3-70b-versatile',
        'llama-3.1-70b-versatile',
        'gemma2-9b-it',
        'mixtral-8x7b-32768',
      ];
      for (const p of preferred) {
        if (chatModels.includes(p)) {
          activeGroqModel = p;
          console.log('[AI] Model duoc chon:', p);
          return p;
        }
      }
      activeGroqModel = chatModels[0] || 'openai/gpt-oss-20b';
      console.log('[AI] Model fallback:', activeGroqModel);
      return activeGroqModel;
    }
  } catch (err) {
    console.error('[AI] Loi khi do model Groq:', err.message);
  }
  return 'openai/gpt-oss-20b';
}

async function analyzeWithAI(text, senderName, senderId) {
  if (!AI_API_KEY) return { type: 'TICKET', location: extractLocationFallback(text) || 'Không xác định' };

  const botConfig = await getBotConfig();
  const {
    BOT_ORG_NAME,
    BOT_PRONOUN_ME,
    BOT_PRONOUN_USER_DEFAULT,
  } = botConfig;

  // Đọc nội dung FAQ
  let faqContent = await db.getSetting('faq_content');
  if (!faqContent) {
    try {
      faqContent = fs.readFileSync(path.join(__dirname, '..', 'faq.txt'), 'utf8');
      await db.setSetting('faq_content', faqContent);
    } catch (err) {
      faqContent = '- Chưa có dữ liệu FAQ.';
    }
  }

  const systemPrompt = `You are an IT support bot for ${BOT_ORG_NAME}. The user's name is: ${senderName}.

FAQ DATA (use this to answer information requests):
${faqContent}

LANGUAGE RULE (MOST IMPORTANT):
- If the user writes in ENGLISH -> you MUST reply 100% in English. Use "I" for yourself, "you" for the user.
- If the user writes in Vietnamese -> reply in Vietnamese. Use "${BOT_PRONOUN_ME}" for yourself, "${BOT_PRONOUN_USER_DEFAULT}" for the user.

MESSAGE CLASSIFICATION (only 2 types):

TYPE 1 - TICKET (report a technical issue):
Use ONLY when the message CLEARLY reports a broken/malfunctioning item or requests a repair for: computer, printer, wifi/network down, camera, projector, TV, air conditioner, lights, electricity, water, door, email/Microsoft 365 account, software crash.
Signs: "broken", "not working", "lagging", "lost wifi", "fix this", "can't print", "forgot email password", "lost 2FA"...
Required format: TICKET|[location name if mentioned, otherwise leave blank]
Example: TICKET|Room 10A1

TYPE 2 - ANSWER (default for everything else):
Use for ALL other cases:
- Information questions (asking for wifi password, info from FAQ)
- General knowledge questions (math, history, literature, English...)
- Greetings, thanks, compliments, small talk
- Short or vague messages that are NOT clearly a technical issue
- Requests for personal favors (politely decline)
DEFAULT TO ANSWER WHEN IN DOUBT.
Required format: ANSWER|[your reply content]

MANDATORY RULES:
- ALWAYS start your response with either "TICKET|" or "ANSWER|". No preamble.
- For ANSWER: be concise and on-point. No unnecessary info.
- Never mention any individual's name in the IT department. Use "IT Department" only.
- CRITICAL - NO HALLUCINATION: Only use information explicitly found in the FAQ data above. If the information is NOT in the FAQ, do NOT make it up. Say you don't have that info instead.
- When someone asks "where we are", "where is this place", "what is this school", "chúng ta là ai", "chúng ta ở đâu", "đây là trường nào", or similar identity/location questions about the organization → answer using the organization identity info from the FAQ. Do NOT invent an address.`;

  // Kiểm tra blacklist
  const lowerText = text.toLowerCase();
  try {
    const blacklist = fs.readFileSync(path.join(__dirname, '..', 'blacklist_keywords.txt'), 'utf8').split('\n').map(w => w.trim().toLowerCase()).filter(w => w);
    for (const word of blacklist) {
      if (lowerText.includes(word)) {
        return { type: 'ANSWER', answer: 'Xin lỗi, tôi không được phép hỗ trợ nội dung này ạ.' };
      }
    }
  } catch (err) { /* Bo qua neu file khong ton tai */ }

  const uId = senderId || 'default';
  let history = userContexts.get(uId) || [];
  history.push({ role: 'user', content: text });

  const messages = [
    { role: 'system', content: systemPrompt },
    ...history
  ];

  try {
    const model = await getGroqModel();
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + AI_API_KEY
      },
      body: JSON.stringify({
        model: model,
        messages: messages,
        max_tokens: 300,
        temperature: 0.0
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('AI API Error HTTP', response.status, ':', errText);
      activeGroqModel = null; // Reset để lần sau thử model khác
      userContexts.delete(uId);
      return { type: 'TICKET', location: extractLocationFallback(text) || 'Không xác định' };
    }

    const data = await response.json();
    let result = (data.choices?.[0]?.message?.content || '').trim();
    console.log('--- AI RAW RESPONSE ---');
    console.log(result);
    console.log('-----------------------');

    if (!result) {
      return { type: 'ANSWER', answer: 'Xin lỗi, tôi chưa có thông tin để trả lời câu hỏi này ạ.' };
    }

    if (result.includes('TICKET|') || result.startsWith('TICKET')) {
      userContexts.delete(uId);
      const ticketIndex = result.indexOf('TICKET|');
      const ticketStr = ticketIndex !== -1 ? result.substring(ticketIndex) : result;
      const parts = ticketStr.split('|');

      let loc = parts.length > 1 ? parts[1].trim().split('\n')[0] : '';
      if (!loc || loc.toLowerCase().includes('not specified') || loc.toLowerCase() === 'unknown' || loc === 'TICKET') {
        const fallback = extractLocationFallback(text);
        loc = fallback || 'Không xác định';
      }
      return { type: 'TICKET', location: loc };
    }

    // ANSWER
    let answerText = result;
    if (answerText.includes('ANSWER|')) {
      answerText = answerText.substring(answerText.indexOf('ANSWER|') + 7).trim();
    }

    history.push({ role: 'assistant', content: answerText });
    if (history.length > 10) history = history.slice(history.length - 10);
    userContexts.set(uId, history);

    return { type: 'ANSWER', answer: answerText };

  } catch (error) {
    console.error('Loi goi AI API (Network):', error);
    userContexts.delete(uId);
    return { type: 'TICKET', location: extractLocationFallback(text) || 'Không xác định' };
  }
}

module.exports = {
  userContexts,
  analyzeWithAI
};
