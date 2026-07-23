const express = require('express');
const router = express.Router();
const db = require('../database');
const { WEBHOOK_SECRET_TOKEN, BOT_NAME, PUBLIC_URL } = require('../config/constants');
const { sendZaloMessage, isAdmin, isSuperAdmin, getWebDisplayNameForZalo } = require('../services/zaloService');
const { analyzeWithAI } = require('../services/aiService');
const { getBotConfig } = require('../services/botConfigService');

function scheduleTestDeletion(ticketId, content) {
  if (content && content.startsWith('[TEST]')) {
    setTimeout(() => {
      db.deleteRequest(ticketId);
    }, 60000);
  }
}

// Zalo webhook verification (GET)
router.get('/webhook', (req, res) => {
  console.log('Zalo verification GET request received:', req.query);
  res.status(200).json({ status: 'ok' });
});

// Webhook endpoint (POST)
router.post('/webhook', async (req, res) => {
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

  const result = payload?.result;
  const eventName = result?.event_name || payload?.event_name;
  const message = result?.message || payload?.message;

  console.log('Event name:', eventName);

  if (message) {
    const { BOT_PRONOUN_USER_DEFAULT } = await getBotConfig();
    const text = message.text || '';
    let cleanTextForCmd = text.replace(new RegExp(`@?${BOT_NAME}`, 'gi'), '').replace(/@?Bot/gi, '').trim();
    cleanTextForCmd = cleanTextForCmd.replace(/^@\s*/, '').replace(/@\s*$/, '').trim();
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

    // --- KIỂM TRA QUYỀN ADMIN ZALO ---
    const activeAdmins = await db.getAdmins();
    const isAdminUser = activeAdmins.some(a => a.id === senderId);
    const isPrivateChat = (chatId === senderId && eventName !== 'group_send_text');

    let botRole = null;
    if (isAdminUser) {
      const allWebUsers = await db.getUsers();
      const linkedUser = allWebUsers.find(u => u.zaloId === senderId);
      botRole = linkedUser ? linkedUser.role : 'ADMIN';
    }

    if (isPrivateChat && !isAdminUser) {
      if (cleanTextForCmd === '/install') {
        const added = await db.addPendingAdmin(senderId, senderName);
        if (added) {
          await sendZaloMessage(chatId, `✅ Đã gửi yêu cầu cấp quyền Zalo Admin cho tài khoản của bạn (${senderName}). Vui lòng báo Super Admin phê duyệt.`);
        } else {
          await sendZaloMessage(chatId, `⚠️ Yêu cầu của bạn đang chờ duyệt. Vui lòng không gửi lại.`);
        }
      } else {
        await sendZaloMessage(chatId, "⚠️ Bạn chưa có quyền thao tác trên hệ thống. Vui lòng gõ lệnh /install để yêu cầu cấp quyền và chờ Super Admin phê duyệt.");
      }
      return; // Dừng xử lý tất cả các lệnh khác nếu không phải Admin trong CHAT RIÊNG
    }

    // XỬ LÝ LỆNH /install NẾU KHÔNG PHẢI TRƯỜNG HỢP TRÊN
    if (cleanTextForCmd === '/install') {
      if (isAdminUser) {
        await sendZaloMessage(chatId, "✅ Bạn đã là Admin Zalo của hệ thống rồi.");
      } else {
        await sendZaloMessage(chatId, "⚠️ Lệnh /install chỉ hỗ trợ trong Chat Riêng với Bot.");
      }
      return;
    }

    // Handle /addgroup
    if (cleanTextForCmd === '/addgroup') {
      if (botRole !== 'SUPER_ADMIN') { await sendZaloMessage(chatId, "❌ Bạn không có quyền thực hiện lệnh này."); return; }
      await db.addGroup(chatId);
      await sendZaloMessage(chatId, "✅ Đã đăng ký nhóm này vào danh sách nhận thông báo (Broadcast).");
      return;
    }

    // Handle /setname
    if (cleanTextForCmd.startsWith('/setname ')) {
      if (botRole !== 'SUPER_ADMIN') { await sendZaloMessage(chatId, "❌ Bạn không có quyền thực hiện lệnh này."); return; }
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
      if (botRole !== 'SUPER_ADMIN') { await sendZaloMessage(chatId, "❌ Bạn không có quyền thực hiện lệnh này."); return; }
      await db.removeGroup(chatId);
      await sendZaloMessage(chatId, "⚠️ Đã gỡ nhóm này khỏi danh sách nhận thông báo.");
      return;
    }

    // Handle /thongbao
    if (text.startsWith('/thongbao ')) {
      if (botRole !== 'SUPER_ADMIN') {
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

    // Handle /nhan command
    if (text.startsWith('/nhan ')) {
      if (!(await isAdmin(senderId))) {
        await sendZaloMessage(chatId, "❌ Bạn không có quyền thực hiện lệnh này.");
        return;
      }
      
      const ticketId = parseInt(text.replace('/nhan ', '').trim().replace('#', ''), 10);
      if (isNaN(ticketId)) {
        await sendZaloMessage(chatId, "⚠️ Cú pháp sai. Vui lòng nhập: /nhan [Mã sự cố]");
        return;
      }
      
      const reqTicket = await db.getRequest(ticketId);
      if (!reqTicket) {
        await sendZaloMessage(chatId, `❌ Không tìm thấy sự cố #${ticketId}`);
        return;
      }
      if (reqTicket.status !== 'Đang chờ') {
        await sendZaloMessage(chatId, `⚠️ Sự cố #${ticketId} không ở trạng thái Đang chờ (hiện tại: ${reqTicket.status}).`);
        return;
      }
      
      const itName = await getWebDisplayNameForZalo(senderId, senderName);
      const updated = await db.updateRequestStatus(ticketId, 'Đang xử lý', senderId, itName);
      if (updated) {
        await sendZaloMessage(chatId, `✅ Đã tiếp nhận sự cố #${ticketId}. Đang xử lý...`);
        const targetChat = updated.chat_id || updated.sender_id;
        await sendZaloMessage(targetChat, `🟡 IT ĐANG XỬ LÝ SỰ CỐ! [#${ticketId}]
------------------------------
👤 Thầy/Cô: ${updated.sender_name}
📍 Vị trí: ${updated.location || 'Không xác định'}
👨‍💻 Phụ trách: ${itName}
------------------------------
😊 Xin cảm ơn Thầy/Cô!`);

        // Notify all admins
        const admins = await db.getAdmins();
        for (const a of admins) {
          if (a.id !== senderId) {
            await sendZaloMessage(a.id, `🔔 IT ${itName} đã tiếp nhận sự cố #${ticketId}`);
          }
        }
      }
      return;
    }

    // Handle /xong command
    if (text.startsWith('/xong ')) {
      if (!(await isAdmin(senderId))) {
        await sendZaloMessage(chatId, "❌ Bạn không có quyền thực hiện lệnh này.");
        return;
      }
      
      const params = text.replace('/xong ', '').trim();
      const firstSpace = params.indexOf(' ');
      
      let ticketId, replyText;
      if (firstSpace === -1) {
        ticketId = parseInt(params.replace('#', ''), 10);
        replyText = 'Đã xử lý xong';
      } else {
        ticketId = parseInt(params.substring(0, firstSpace).replace('#', ''), 10);
        replyText = params.substring(firstSpace + 1).trim();
      }
      
      if (isNaN(ticketId)) {
        await sendZaloMessage(chatId, "⚠️ Cú pháp sai. Vui lòng nhập: /xong [Mã sự cố] [Cách khắc phục]");
        return;
      }
      
      const reqTicket = await db.getRequest(ticketId);
      if (!reqTicket) {
        await sendZaloMessage(chatId, `❌ Không tìm thấy sự cố #${ticketId}`);
        return;
      }
      if (reqTicket.status === 'Đã xong') {
        await sendZaloMessage(chatId, `⚠️ Sự cố #${ticketId} đã được báo hoàn thành từ trước.`);
        return;
      }

      if (reqTicket.assignee_id && reqTicket.assignee_id !== senderId) {
        if (!(await isSuperAdmin(senderId))) {
          await sendZaloMessage(chatId, `⚠️ Sự cố này đang được xử lý bởi IT ${reqTicket.assignee_name || 'khác'}, bạn không thể thao tác.`);
          return;
        }
      }
      
      const updated = await db.updateRequest(ticketId, replyText, Date.now());
      if (updated) {
        const itName = await getWebDisplayNameForZalo(senderId, senderName);
        await sendZaloMessage(chatId, `✅ Đã đánh dấu hoàn thành sự cố #${ticketId}.`);
        const targetChat = updated.chat_id || updated.sender_id;
        await sendZaloMessage(targetChat, `✅ SỰ CỐ ĐÃ ĐƯỢC KHẮC PHỤC! [#${ticketId}]
------------------------------
👤 Thầy/Cô: ${updated.sender_name}
📍 Vị trí: ${updated.location || 'Không xác định'}
👨‍💻 Phụ trách: ${itName}
💬 Phản hồi: ${replyText}
------------------------------
😊 Xin cảm ơn Thầy/Cô!`);
        scheduleTestDeletion(ticketId, updated.content);

        // Notify all admins
        const admins = await db.getAdmins();
        for (const a of admins) {
          if (a.id !== senderId) {
            await sendZaloMessage(a.id, `✅ IT ${itName} đã hoàn thành sự cố #${ticketId}`);
          }
        }
      }
      return;
    }

    // Handle /tuchoi command
    if (text.startsWith('/tuchoi ')) {
      if (!(await isAdmin(senderId))) {
        await sendZaloMessage(chatId, "❌ Bạn không có quyền thực hiện lệnh này.");
        return;
      }
      
      const params = text.replace('/tuchoi ', '').trim();
      const firstSpace = params.indexOf(' ');
      
      let ticketId, replyText;
      if (firstSpace === -1) {
        ticketId = parseInt(params.replace('#', ''), 10);
        replyText = 'Lý do không được cung cấp';
      } else {
        ticketId = parseInt(params.substring(0, firstSpace).replace('#', ''), 10);
        replyText = params.substring(firstSpace + 1).trim();
      }
      
      if (isNaN(ticketId)) {
        await sendZaloMessage(chatId, "⚠️ Cú pháp sai. Vui lòng nhập: /tuchoi [Mã sự cố] [Lý do]");
        return;
      }
      
      const reqTicket = await db.getRequest(ticketId);
      if (!reqTicket) {
        await sendZaloMessage(chatId, `❌ Không tìm thấy sự cố #${ticketId}`);
        return;
      }
      if (reqTicket.status !== 'Đang chờ' && reqTicket.status !== 'Đang xử lý') {
        await sendZaloMessage(chatId, `⚠️ Không thể từ chối sự cố #${ticketId} (trạng thái hiện tại: ${reqTicket.status}).`);
        return;
      }
      
      if (reqTicket.assignee_id && reqTicket.assignee_id !== senderId) {
        if (!(await isSuperAdmin(senderId))) {
          await sendZaloMessage(chatId, `⚠️ Sự cố này đang được xử lý bởi IT ${reqTicket.assignee_name || 'khác'}, bạn không thể thao tác.`);
          return;
        }
      }

      const itName = await getWebDisplayNameForZalo(senderId, senderName);
      const updated = await db.rejectRequest(ticketId, replyText, Date.now(), senderId, itName);
      if (updated) {
        await sendZaloMessage(chatId, `✅ Đã từ chối sự cố #${ticketId}.`);
        const targetChat = updated.chat_id || updated.sender_id;
        let userMsg = '';
        if (reqTicket.status === 'Đang chờ') {
          userMsg = `⛔ TỪ CHỐI TIẾP NHẬN YÊU CẦU [#${ticketId}]
------------------------------
👤 ${BOT_PRONOUN_USER_DEFAULT}: ${updated.sender_name}
📍 Vị trí: ${updated.location || 'Không xác định'}
👨‍💻 Người từ chối: ${itName}
💬 Lý do: ${replyText}
------------------------------
😊 Mong ${BOT_PRONOUN_USER_DEFAULT} thông cảm!`;
        } else {
          userMsg = `⛔ CẬP NHẬT: TỪ CHỐI SỰ CỐ [#${ticketId}]
------------------------------
👤 ${BOT_PRONOUN_USER_DEFAULT}: ${updated.sender_name}
📍 Vị trí: ${updated.location || 'Không xác định'}
👨‍💻 Người từ chối: ${itName}
💬 Lý do: ${replyText}
------------------------------
😊 Mong ${BOT_PRONOUN_USER_DEFAULT} thông cảm!`;
        }
        await sendZaloMessage(targetChat, userMsg);
        scheduleTestDeletion(ticketId, updated.content);

        // Notify all admins
        const admins = await db.getAdmins();
        for (const a of admins) {
          if (a.id !== senderId) {
            await sendZaloMessage(a.id, `⛔ IT ${itName} đã từ chối sự cố #${ticketId}`);
          }
        }
      }
      return;
    }

    // Handle /test command
    if (text.trim() === '/test' || text.startsWith('/test ')) {
      if (botRole !== 'SUPER_ADMIN') {
        await sendZaloMessage(chatId, "❌ Bạn không có quyền thực hiện lệnh này.");
        return;
      }
      let content = text.replace('/test', '').trim();
      if (!content) {
        content = 'Kiểm tra hệ thống';
      }
      const ticketId = await db.addRequest(Date.now(), senderName, senderId, chatId, chatName, `[TEST] ${content}`, "[TEST]");
      await sendZaloMessage(chatId, `✅ Đã tạo sự cố TEST (Mã số: #${ticketId}). Sẽ tự động xóa sau 1 phút kể từ khi thao tác xong (Đóng/Từ chối).`);
      return;
    }

    // Handle /ask command (Help)
    if (text.trim() === '/ask' || text.trim() === '/help') {
      if (botRole === 'SUPER_ADMIN') {
        const helpMsgSuperAdmin = `🤖 DANH SÁCH LỆNH CỦA BOT HỖ TRỢ IT 🤖
------------------------------
🔹 Quản lý hệ thống:
1. /install 👉 Đăng ký quyền Quản trị viên.
2. /admin 👉 Xem danh sách Quản trị viên.
3. /uninstall 👉 Hủy quyền Quản trị viên của bạn.
4. /report 👉 Lấy link Trang quản trị Web.
5. /clean 👉 (Nguy hiểm) Xóa toàn bộ dữ liệu.
6. /test 👉 Tạo sự cố thử nghiệm tự xóa sau 1p.

🔹 Thông báo (Broadcast):
7. /addgroup 👉 Đăng ký nhóm nhận thông báo.
8. /removegroup 👉 Hủy đăng ký nhóm.
9. /setname [Tên] 👉 Đổi tên nhóm. (VD: /setname IT)
10. /thongbao [ND] 👉 Gửi thông báo. (VD: /thongbao Lỗi mạng)

🔹 Xử lý sự cố:
11. /nhan [Mã] 👉 Nhận xử lý. (VD: /nhan 15)
12. /xong [Mã] [ND] 👉 Đóng sự cố. (VD: /xong 15 Đã sửa)
13. /tuchoi [Mã] [Lý do] 👉 Từ chối. (VD: /tuchoi 15 Hỏng nặng)

💡 Mẹo: Nên dùng Trang quản trị Web để thao tác trực quan hơn.`;
        await sendZaloMessage(chatId, helpMsgSuperAdmin);
      } else {
        const helpMsgAdmin = `🤖 DANH SÁCH LỆNH CỦA BOT HỖ TRỢ IT 🤖
------------------------------
🔹 Quản lý cá nhân & Hệ thống:
1. /install 👉 Đăng ký quyền Quản trị viên.
2. /uninstall 👉 Hủy quyền Quản trị viên của bạn.
3. /report 👉 Lấy link Trang quản trị Web.

🔹 Xử lý sự cố:
4. /nhan [Mã] 👉 Nhận xử lý. (VD: /nhan 15)
5. /xong [Mã] [ND] 👉 Đóng sự cố. (VD: /xong 15 Đã sửa)
6. /tuchoi [Mã] [Lý do] 👉 Từ chối. (VD: /tuchoi 15 Hỏng nặng)

💡 Mẹo: Nên dùng Trang quản trị Web để thao tác trực quan hơn.`;
        await sendZaloMessage(chatId, helpMsgAdmin);
      }
      return;
    }

    // Handle /admin command
    if (text.trim() === '/admin') {
      if (botRole !== 'SUPER_ADMIN') {
        await sendZaloMessage(chatId, "❌ Bạn không có quyền thực hiện lệnh này.");
        return;
      }
      const admins = await db.getAdmins();
      if (admins.length === 0) {
        await sendZaloMessage(chatId, "Danh sách Zalo Admin hiện đang trống.");
      } else {
        let msg = "👥 DANH SÁCH ZALO ADMIN:\n------------------------------\n";
        admins.forEach((a, idx) => {
          msg += `${idx + 1}. ${a.name}\n`;
        });
        await sendZaloMessage(chatId, msg);
      }
      return;
    }

    // Handle /uninstall command
    if (text.trim() === '/uninstall') {
       const removed = await db.removeAdmin(senderId);
       if (removed) {
         await sendZaloMessage(chatId, "✅ Đã tự động rời khỏi vị trí Admin. Bạn sẽ không nhận được thông báo nữa.");
       } else {
         await sendZaloMessage(chatId, "⚠️ Bạn không phải là Admin.");
       }
       return;
    }

    // Handle /report command
    if (text.trim() === '/report') {
      if (!(await isAdmin(senderId))) {
        await sendZaloMessage(chatId, "❌ Bạn không có quyền thực hiện lệnh này.");
        return;
      }
      
      const reportLink = `${PUBLIC_URL}/report`;
      await sendZaloMessage(chatId, `✅ Báo cáo trực tuyến của bạn đã sẵn sàng tại:\n${reportLink}`);
      return;
    }

    // Handle /clean command
    if (text.trim() === '/clean') {
      if (botRole !== 'SUPER_ADMIN') {
        await sendZaloMessage(chatId, "❌ Bạn không có quyền thực hiện lệnh này.");
        return;
      }
      
      const deletedCount = await db.deleteAllRequests();
      await sendZaloMessage(chatId, `✅ Đã dọn dẹp thành công! ${deletedCount} dữ liệu báo lỗi đã được xóa khỏi hệ thống.`);
      return;
    }

    // Handle /groups command
    if (cleanTextForCmd === '/groups' || cleanTextForCmd === '/group') {
      if (botRole !== 'SUPER_ADMIN') {
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
      if (!(await isAdmin(senderId))) {
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
        await db.removeGroupCompletely(foundId);
        await sendZaloMessage(chatId, `✅ Đã gỡ nhóm "${nameToRemove}" khỏi hệ thống.`);
      } else {
        await sendZaloMessage(chatId, `❌ Không tìm thấy nhóm nào có tên "${nameToRemove}". Vui lòng dùng lệnh /groups để xem danh sách.`);
      }
      return;
    }

    // Xử lý tin nhắn từ Admin (Reply ticket)
    const isSenderAdmin = await isAdmin(senderId);
    const isBotMentioned = text.includes(BOT_NAME) || text.includes('@Bot');
    const quoteText = message?.quote?.text || '';
    const isExplicitQuoteReply = /\[#(\d+)\]|Mã Yêu Cầu: #(\d+)/.test(quoteText);
    const textTicketMatch = text.match(/#(\d+)/);
    const hasTextTicketId = textTicketMatch !== null;

    // Là Reply nếu: Gửi từ Admin, KHÔNG phải lệnh, VÀ (Có Quote hợp lệ HOẶC có gõ #ID HOẶC không có nhắc đến @Bot)
    if (isSenderAdmin && !text.startsWith('/') && (isExplicitQuoteReply || hasTextTicketId || !isBotMentioned)) {
      let targetTicketId = null;
      
      // Ưu tiên 1: Gõ trực tiếp #ID trong tin nhắn
      if (hasTextTicketId) {
        targetTicketId = parseInt(textTicketMatch[1]);
      } 
      // Ưu tiên 2: Tìm Mã Yêu Cầu trong Quote
      else if (isExplicitQuoteReply) {
        const match = quoteText.match(/\[#(\d+)\]|Mã Yêu Cầu: #(\d+)/);
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

        const itName = await getWebDisplayNameForZalo(senderId, senderName);

        const isReject = cleanText.toLowerCase().startsWith('từ chối') || cleanText.toLowerCase().startsWith('tu choi') || cleanText.toLowerCase().startsWith('reject') || cleanText.toLowerCase().startsWith('thay đổi') || cleanText.toLowerCase().startsWith('thay doi');
        
        if (isReject) {
          const reason = cleanText.replace(/^(từ chối|tu choi|reject|thay đổi|thay doi)\s*/i, '').trim() || 'Không có lý do cụ thể';
          await db.updateRequestStatus(targetTicketId, 'Đã thay đổi', senderId, itName);
          await db.updateRequest(targetTicketId, reason, Date.now());
          
          await sendZaloMessage(chatId, `⛔ Đã thay đổi trạng thái sự cố #${targetTicketId}.`);
          const targetChat = existingReq.chat_id || existingReq.sender_id;
          let userMsg = '';
          if (existingReq.status === 'Đang chờ') {
            userMsg = `⛔ THAY ĐỔI TRẠNG THÁI YÊU CẦU [#${targetTicketId}]
------------------------------
👤 ${BOT_PRONOUN_USER_DEFAULT}: ${existingReq.sender_name}
📍 Vị trí: ${existingReq.location || 'Không xác định'}
👨‍💻 Cập nhật bởi: ${itName}
💬 Lý do: ${reason}
------------------------------
😊 Mong ${BOT_PRONOUN_USER_DEFAULT} thông cảm!`;
          } else {
            userMsg = `⛔ CẬP NHẬT: THAY ĐỔI TRẠNG THÁI SỰ CỐ [#${targetTicketId}]
------------------------------
👤 ${BOT_PRONOUN_USER_DEFAULT}: ${existingReq.sender_name}
📍 Vị trí: ${existingReq.location || 'Không xác định'}
👨‍💻 Cập nhật bởi: ${itName}
💬 Lý do: ${reason}
------------------------------
😊 Mong ${BOT_PRONOUN_USER_DEFAULT} thông cảm!`;
          }
          await sendZaloMessage(targetChat, userMsg);
          return;
        }

        if (existingReq.status === 'Đang chờ') {
          await db.updateRequestStatus(targetTicketId, 'Đang xử lý', senderId, itName);
          
          // Gửi thông báo đang xử lý cho nhóm IT
          await sendZaloMessage(chatId, `🟡 Hệ thống đã ghi nhận IT ${itName} đang xử lý sự cố #${targetTicketId}. (Nhắn/Reply lần nữa để hoàn thành)`);
          
          // Gửi thông báo đang xử lý cho User
          const targetChat = existingReq.chat_id || existingReq.sender_id;
          const userMsg = `🟡 IT ĐANG XỬ LÝ SỰ CỐ! [#${targetTicketId}]
------------------------------
👤 ${BOT_PRONOUN_USER_DEFAULT}: ${existingReq.sender_name}
📍 Vị trí: ${existingReq.location || 'Không xác định'}
👨‍💻 Phụ trách: ${itName}
------------------------------
😊 Xin cảm ơn ${BOT_PRONOUN_USER_DEFAULT}!`;
          await sendZaloMessage(targetChat, userMsg);
          
        } else if (existingReq.status === 'Đang xử lý') {
          const updatedReq = await db.updateRequest(targetTicketId, cleanText, Date.now());
          if (updatedReq) {
            await db.updateRequestStatus(targetTicketId, 'Đã xong', senderId, itName);
            await sendZaloMessage(chatId, `✅ Sự cố #${targetTicketId} đã hoàn thành bởi IT ${itName}.`);
            // Thông báo cho người dùng gốc
            const targetChat = updatedReq.chat_id || updatedReq.sender_id;
            const userMsg = `✅ SỰ CỐ ĐÃ ĐƯỢC KHẮC PHỤC! [#${targetTicketId}]
------------------------------
👤 ${BOT_PRONOUN_USER_DEFAULT}: ${updatedReq.sender_name}
📍 Vị trí: ${updatedReq.location || 'Không xác định'}
👨‍💻 Phụ trách: ${itName}
💬 Phản hồi: ${cleanText}
------------------------------
😊 Xin cảm ơn ${BOT_PRONOUN_USER_DEFAULT}!`;
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
      let requestContent = text.replace(new RegExp(`@?${BOT_NAME}`, 'gi'), '').replace(/@?Bot/gi, '').trim();
      // Remove trailing or leading @ symbol left behind
      requestContent = requestContent.replace(/^@\s*/, '').replace(/@\s*$/, '').trim();
      if (!requestContent) requestContent = "(Không có nội dung)";

      // Analyze with AI
      const aiResult = await analyzeWithAI(requestContent, senderName, senderId);

      if (aiResult.type === 'ANSWER') {
        // Reply to user directly
        await sendZaloMessage(chatId, aiResult.answer);
        return; // Dừng, không tạo ticket
      }

      // Save to Database (Nếu là TICKET)
      const location = aiResult.location || 'Không xác định';
      const newId = await db.addRequest(timestamp, senderName, senderId, chatId, chatName, requestContent, location);

      // Format the message to send to Admin
      const adminMessage = `🔔 YÊU CẦU HỖ TRỢ MỚI! [#${newId}]
------------------------------
👤 ${BOT_PRONOUN_USER_DEFAULT}: ${senderName}
🏫 Nhóm: ${chatName}
📍 Vị trí: ${location}
🕒 Thời gian: ${timeStr} - ${dateStr}
📌 Chi tiết sự cố:
${requestContent}
------------------------------
👨‍💻 Đội ngũ IT vui lòng tiếp nhận!`;
      
      console.log('--- NHẬN YÊU CẦU MỚI ---');
      console.log(adminMessage);

      const admins = await db.getAdmins();
      
      if (admins.length > 0) {
        const userMessage = `✅ ĐÃ GỬI YÊU CẦU THÀNH CÔNG! [#${newId}]
------------------------------
👤 ${BOT_PRONOUN_USER_DEFAULT}: ${senderName}
📍 Vị trí: ${location}
------------------------------
👨‍💻 Sự cố đã được tiếp nhận, Xin cảm ơn ${BOT_PRONOUN_USER_DEFAULT} 😊`;
        
        // Forward to all active admins
        for (const admin of admins) {
          await sendZaloMessage(admin.id, adminMessage);
        }
        await sendZaloMessage(chatId, userMessage);
      } else {
        console.warn('No active admins configured. Cannot forward message.');
        await sendZaloMessage(chatId, `✅ Yêu cầu đã được nhận nhưng hiện tại hệ thống chưa có nhân sự IT nào trực ban. Xin Thầy/Cô thông cảm nhé 😊`);
      }
    }
  }
});

module.exports = router;
