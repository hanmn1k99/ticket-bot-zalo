const fs = require('fs');
let w = fs.readFileSync('routes/webhookRoutes.js', 'utf8');

// 1. Broaden the pending requests filter
w = w.replace(
  "const pendingReqs = allReqsContext.filter(r => r.sender_id === senderId && (r.status === 'Đang chờ' || r.status === 'Đang xử lý'));",
  "const pendingReqs = allReqsContext.filter(r => r.sender_id === senderId && r.status !== 'Đã xong' && r.status !== 'Từ chối' && r.status !== 'Hủy');"
);

// 2. Add NFC normalization
w = w.replace(
  "const lowerReq = requestContent.toLowerCase();",
  "const lowerReq = requestContent.toLowerCase().normalize('NFC');"
);

// 3. Add huỷ spelling variant
w = w.replace(
  "const cancelKeywords = ['hủy', 'huy', 'xong rồi', 'đã xử lý', 'không cần', 'bỏ qua'];",
  "const cancelKeywords = ['hủy', 'huỷ', 'huy', 'xong rồi', 'đã xử lý', 'không cần', 'bỏ qua'];"
);

// 4. Bypass AI completely
const oldAI = `      if (isCancelIntent && pendingReqs.length > 0) {
          aiResult.type = 'CANCEL';
          aiResult.answer = 'Cảm ơn bạn! Yêu cầu của bạn đã được hủy thành công.';
      } else {
          aiResult = await analyzeWithAI(requestContent, senderName, senderId, openTicketsContext);
      }`;
const newAI = `      if (isCancelIntent) {
          aiResult.type = 'CANCEL';
          aiResult.answer = pendingReqs.length > 0 
              ? 'Cảm ơn bạn! Yêu cầu của bạn đã được hủy thành công.'
              : 'Cảm ơn bạn! Hiện tại bạn không có yêu cầu nào đang chờ xử lý.';
      } else {
          aiResult = await analyzeWithAI(requestContent, senderName, senderId, openTicketsContext);
      }`;
w = w.replace(oldAI, newAI);

// 5. Update robust filter inside the CANCEL block
const oldExec = `      if (aiResult.type === 'CANCEL') {
        const allReqs = await db.getAllRequests();
        const pendingReq = [...allReqs].reverse().find(r => r.sender_id === senderId && r.chat_id === chatId && r.status === 'Đang chờ');`;
const newExec = `      if (aiResult.type === 'CANCEL') {
        const allReqs = await db.getAllRequests();
        const pendingReq = [...allReqs].reverse().find(r => r.sender_id === senderId && r.chat_id === chatId && r.status !== 'Đã xong' && r.status !== 'Từ chối' && r.status !== 'Hủy');`;
w = w.replace(oldExec, newExec);

fs.writeFileSync('routes/webhookRoutes.js', w, 'utf8');
