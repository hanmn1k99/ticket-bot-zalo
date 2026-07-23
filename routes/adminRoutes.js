const express = require('express');
const router = express.Router();
const db = require('../database');
const { checkAuth } = require('../middleware/authMiddleware');
const { sendZaloMessage } = require('../services/zaloService');

router.get('/api/admins', checkAuth, async (req, res) => {
  const admins = await db.getAdmins();
  const pending = await db.getPendingAdmins();
  res.json({ success: true, admins, pending });
});

router.post('/api/admins/approve', checkAuth, async (req, res) => {
  const { id } = req.body;
  if (!id) return res.status(400).json({ error: 'Thiếu ID' });
  const success = await db.approveAdmin(id);
  if (success) {
    await sendZaloMessage(id, "✅ Yêu cầu cấp quyền Zalo Admin của bạn đã được CHẤP THUẬN! Bạn sẽ bắt đầu nhận được thông báo sự cố từ bây giờ.");
    return res.json({ success: true });
  }
  return res.status(400).json({ error: 'Không tìm thấy yêu cầu' });
});

router.post('/api/admins/reject', checkAuth, async (req, res) => {
  const { id } = req.body;
  if (!id) return res.status(400).json({ error: 'Thiếu ID' });
  const success = await db.rejectAdmin(id);
  if (success) {
    await sendZaloMessage(id, "❌ Yêu cầu cấp quyền Admin Zalo của bạn đã bị TỪ CHỐI.");
    return res.json({ success: true });
  }
  return res.status(400).json({ error: 'Không tìm thấy yêu cầu' });
});

router.post('/api/admins/remove', checkAuth, async (req, res) => {
  const { id } = req.body;
  if (!id) return res.status(400).json({ error: 'Thiếu ID' });
  const success = await db.removeAdmin(id);
  if (success) {
    // Delete associated web account if it exists
    const users = await db.getUsers();
    const targetUser = users.find(u => u.zaloId === id);
    if (targetUser) {
      if (targetUser.username !== req.user.username) {
        if (targetUser.role !== 'SUPER_ADMIN' || users.filter(u => u.role === 'SUPER_ADMIN').length > 1) {
          await db.deleteUser(targetUser.username);
        }
      }
    }
    
    await sendZaloMessage(id, "⚠️ Quyền Zalo Admin của bạn đã bị THU HỒI. Tài khoản Web Admin tương ứng (nếu có) cũng đã bị xóa.");
    return res.json({ success: true });
  }
  return res.status(400).json({ error: 'Không tìm thấy admin' });
});

module.exports = router;
