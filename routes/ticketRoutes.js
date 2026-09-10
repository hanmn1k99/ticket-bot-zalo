const express = require('express');
const router = express.Router();
const db = require('../database');
const { checkAuth } = require('../middleware/authMiddleware');
const { sendZaloMessage, sendToAdmins } = require('../services/zaloService');
const { renderTableRows } = require('../views/dashboardView');
const { getBotConfig } = require('../services/botConfigService');

// ENDPOINT: Lấy danh sách nhóm Zalo đã kết nối
router.get('/api/groups', checkAuth, async (req, res) => {
  try {
    const groupIds = await db.getAllGroups();
    const groups = await Promise.all(groupIds.map(async id => ({
      id,
      name: await db.getGroupName(id) || id
    })));
    return res.json({ groups });
  } catch(e) {
    return res.json({ groups: [] });
  }
});

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
    await sendToAdmins(`✅ IT ${itName} đã hoàn thành sự cố #${id}`);

    return res.json({ success: true });
  } else {
    return res.status(500).json({ error: 'Lỗi ghi dữ liệu vào hệ thống.' });
  }
});

// ENDPOINT: Từ chối sự cố
router.post('/api/tickets/reject', checkAuth, async (req, res) => {
  let { id, replyText } = req.body;
  if (!id) {
    return res.status(400).json({ error: 'Thiếu ID sự cố.' });
  }
  if (!replyText) {
    if (req.user && req.user.role === 'SUPER_ADMIN') {
      replyText = 'Không có lý do cụ thể';
    } else {
      return res.status(400).json({ error: 'Bắt buộc phải nhập lý do khi thay đổi trạng thái sự cố.' });
    }
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
    await sendToAdmins(`⛔ IT ${itName} đã thay đổi trạng thái sự cố #${id}`);

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

    // Notify all admins
    await sendToAdmins(`🔔 IT ${itName} đã tiếp nhận sự cố #${id}`);

    return res.json({ success: true });
  }
  return res.status(400).json({ error: 'Không thể cập nhật' });
});

// ENDPOINT: API Xóa 1 Ticket thủ công
router.delete('/api/tickets/:id', checkAuth, async (req, res) => {
  const id = parseInt(req.params.id);
  if (!id) return res.status(400).json({ error: 'Thiếu ID' });
  
  const deleted = await db.deleteRequest(id);
  if (deleted) {
      return res.json({ success: true });
  }
  return res.status(400).json({ error: 'Không tìm thấy sự cố hoặc lỗi khi xóa' });
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


// ENDPOINT: Tạo Ticket thủ công từ IT
router.post('/api/tickets/create', checkAuth, async (req, res) => {
  const { senderName, content, location, groupId } = req.body;
  if (!senderName || !content) {
    return res.status(400).json({ error: 'Thiếu thông tin: Tên người báo và Nội dung sự cố là bắt buộc.' });
  }

  const { BOT_PRONOUN_USER_DEFAULT } = await getBotConfig();
  const itName = (req.user && req.user.displayName && req.user.displayName.trim()) ? req.user.displayName.trim() : 'Bộ phận IT';
  const timestamp = Date.now();

  const d = new Date(timestamp);
  const timeStr = d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Asia/Ho_Chi_Minh' });
  const dateStr = d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'Asia/Ho_Chi_Minh' });

  // Lấy tên nhóm được chọn (nếu có)
  let groupName = 'Tạo thủ công';
  if (groupId) {
    groupName = await db.getGroupName(groupId) || groupId;
  }

  const newId = await db.addRequest(
    timestamp,
    senderName,
    'manual_' + timestamp,
    groupId || ('manual_' + timestamp),
    groupName,
    content,
    location || 'Không xác định'
  );

  const adminMessage = `🔔 YÊU CẦU HỖ TRỢ MỚI! [#${newId}]
------------------------------
👤 ${BOT_PRONOUN_USER_DEFAULT}: ${senderName}
🏫 Nguồn: Tạo thủ công bởi ${itName}
📍 Vị trí: ${location || 'Không xác định'}
🕒 Thời gian: ${timeStr} - ${dateStr}
📌 Chi tiết sự cố:
${content}
------------------------------
👨‍💻 Đội ngũ IT vui lòng tiếp nhận!`;

  // Gửi cho tất cả Admin
  const admins = await db.getAdmins();
  for (const admin of admins) {
    await sendZaloMessage(admin.id, adminMessage);
  }

  // Gửi thêm vào nhóm được chọn (nếu có và nhóm đó chưa được gửi qua admin)
  if (groupId) {
    await sendZaloMessage(groupId, adminMessage);
  }

  const rows = await renderTableRows();
  return res.json({ success: true, id: newId, rows });
});

module.exports = router;
