const express = require('express');
const router = express.Router();
const db = require('../database');
const { checkAuth } = require('../middleware/authMiddleware');
const { sendZaloMessage, sendToAdmins } = require('../services/zaloService');
const { renderTableRows } = require('../views/dashboardView');
const { getBotConfig } = require('../services/botConfigService');

function scheduleTestDeletion(ticketId, content) {
  if (content && content.startsWith('[TEST]')) {
    setTimeout(() => {
      db.deleteRequest(ticketId);
    }, 60000);
  }
}

// ENDPOINT: API Đóng Ticket từ Web Dashboard
router.post('/api/tickets/resolve', checkAuth, async (req, res) => {
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

  const userId = req.user.zaloId || req.user.username;
  const itName = (req.user && req.user.displayName && req.user.displayName.trim()) ? req.user.displayName.trim() : 'Bộ phận IT';
  const { BOT_PRONOUN_USER_DEFAULT } = await getBotConfig();

  if (existingReq.assignee_id && existingReq.assignee_id !== userId) {
    if (req.user.role !== 'SUPER_ADMIN') {
      return res.status(403).json({ error: `Sự cố này đang được xử lý bởi IT ${existingReq.assignee_name || 'khác'}, bạn không thể thao tác.` });
    }
  }

  const updatedReq = await db.updateRequest(id, replyText, Date.now());
  if (updatedReq) {
    // Thông báo về nhóm/người dùng gốc
    const targetChat = updatedReq.chat_id || updatedReq.sender_id;
    const userMsg = `✅ SỰ CỐ ĐÃ ĐƯỢC KHẮC PHỤC! [#${id}]
------------------------------
👤 ${BOT_PRONOUN_USER_DEFAULT}: ${updatedReq.sender_name}
📍 Vị trí: ${updatedReq.location || 'Không xác định'}
👨‍💻 Phụ trách: ${itName}
💬 Phản hồi: ${replyText}
------------------------------
😊 Xin cảm ơn ${BOT_PRONOUN_USER_DEFAULT}!`;
    await sendZaloMessage(targetChat, userMsg);
    scheduleTestDeletion(id, updatedReq.content);
    
    // Thông báo cho tất cả Admin
    const admins = await db.getAdmins();
    for (const a of admins) {
      if (a.id !== userId) {
        await sendZaloMessage(a.id, `✅ IT ${itName} đã hoàn thành sự cố #${id}`);
      }
    }

    return res.json({ success: true });
  } else {
    return res.status(500).json({ error: 'Lỗi ghi dữ liệu vào hệ thống.' });
  }
});

// ENDPOINT: Từ chối sự cố
router.post('/api/tickets/reject', checkAuth, async (req, res) => {
  const { id, replyText } = req.body;
  if (!id || !replyText) {
    return res.status(400).json({ error: 'Thiếu thông tin (ID hoặc Lý do từ chối).' });
  }

  const existingReq = await db.getRequest(id);
  if (!existingReq) {
    return res.status(404).json({ error: `Không tìm thấy sự cố #${id}.` });
  }
  if (existingReq.status !== 'Đang chờ' && existingReq.status !== 'Đang xử lý') {
    return res.status(400).json({ error: `Chỉ có thể từ chối sự cố ở trạng thái Đang chờ hoặc Đang xử lý.` });
  }

  const userId = req.user.zaloId || req.user.username;
  const itName = (req.user && req.user.displayName && req.user.displayName.trim()) ? req.user.displayName.trim() : 'Bộ phận IT';
  const { BOT_PRONOUN_USER_DEFAULT } = await getBotConfig();

  if (existingReq.assignee_id && existingReq.assignee_id !== userId) {
    if (req.user.role !== 'SUPER_ADMIN') {
      return res.status(403).json({ error: `Sự cố này đang được xử lý bởi IT ${existingReq.assignee_name || 'khác'}, bạn không thể thao tác.` });
    }
  }

  const updatedReq = await db.rejectRequest(id, replyText, Date.now(), userId, itName);
  if (updatedReq) {
    const targetChat = updatedReq.chat_id || updatedReq.sender_id;
    let userMsg = '';
    if (existingReq.status === 'Đang chờ') {
      userMsg = `⛔ THAY ĐỔI TRẠNG THÁI YÊU CẦU [#${id}]
------------------------------
👤 ${BOT_PRONOUN_USER_DEFAULT}: ${updatedReq.sender_name}
📍 Vị trí: ${updatedReq.location || 'Không xác định'}
👨‍💻 Cập nhật bởi: ${itName}
💬 Lý do: ${replyText}
------------------------------
😊 Mong ${BOT_PRONOUN_USER_DEFAULT} thông cảm!`;
    } else {
      userMsg = `⛔ CẬP NHẬT: THAY ĐỔI TRẠNG THÁI SỰ CỐ [#${id}]
------------------------------
👤 ${BOT_PRONOUN_USER_DEFAULT}: ${updatedReq.sender_name}
📍 Vị trí: ${updatedReq.location || 'Không xác định'}
👨‍💻 Cập nhật bởi: ${itName}
💬 Lý do: ${replyText}
------------------------------
😊 Mong ${BOT_PRONOUN_USER_DEFAULT} thông cảm!`;
    }
    await sendZaloMessage(targetChat, userMsg);
    scheduleTestDeletion(id, updatedReq.content);
    
    // Thông báo cho tất cả Admin
    const admins = await db.getAdmins();
    for (const a of admins) {
      if (a.id !== userId) {
        await sendZaloMessage(a.id, `⛔ IT ${itName} đã thay đổi trạng thái sự cố #${id}`);
      }
    }

    return res.json({ success: true });
  } else {
    return res.status(500).json({ error: 'Lỗi ghi dữ liệu vào hệ thống.' });
  }
});

// ENDPOINT: Chuyển trạng thái sang Đang xử lý
router.post('/api/tickets/inprogress', checkAuth, async (req, res) => {
  const { id } = req.body;
  if (!id) return res.status(400).json({ error: 'Thiếu ID' });
  const itName = (req.user && req.user.displayName && req.user.displayName.trim()) ? req.user.displayName.trim() : 'Bộ phận IT';
  const assigneeId = (req.user && req.user.zaloId) ? req.user.zaloId : ((req.user && req.user.username) ? req.user.username : null);
  const { BOT_PRONOUN_USER_DEFAULT } = await getBotConfig();

  const updatedReq = await db.updateRequestStatus(id, 'Đang xử lý', assigneeId, itName);
  if (updatedReq) {
    const targetChat = updatedReq.chat_id || updatedReq.sender_id;
    const userMsg = `🟡 IT ĐANG XỬ LÝ SỰ CỐ! [#${id}]
------------------------------
👤 ${BOT_PRONOUN_USER_DEFAULT}: ${updatedReq.sender_name}
📍 Vị trí: ${updatedReq.location || 'Không xác định'}
👨‍💻 Phụ trách: ${itName}
------------------------------
😊 Xin cảm ơn ${BOT_PRONOUN_USER_DEFAULT}!`;
    await sendZaloMessage(targetChat, userMsg);

    // Notify all admins (excluding the one who clicked)
    const admins = await db.getAdmins();
    for (const a of admins) {
      if (a.id !== assigneeId) {
        await sendZaloMessage(a.id, `🔔 IT ${itName} đã tiếp nhận sự cố #${id}`);
      }
    }

    return res.json({ success: true });
  }
  return res.status(400).json({ error: 'Không thể cập nhật' });
});

// ENDPOINT: API Xóa Toàn bộ dữ liệu từ Web Dashboard
router.post('/api/tickets/clean', checkAuth, async (req, res) => {
  if (req.user.role !== 'SUPER_ADMIN') return res.status(403).json({ error: 'Permission denied' });
  const count = await db.deleteAllRequests();
  await sendToAdmins(`🧹 [WEB DASHBOARD] Đã dọn dẹp hệ thống. Xóa thành công ${count} sự cố. Bộ đếm ID đã được reset về #1.`);
  return res.json({ success: true, deletedCount: count });
});

// ENDPOINT: API Lấy dữ liệu bảng Real-time
router.get('/api/tickets/rows', checkAuth, async (req, res) => {
  const html = await renderTableRows();
  return res.json({ success: true, html: html });
});

module.exports = router;
