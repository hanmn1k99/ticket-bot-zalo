const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const db = require('../database');
const { checkAuth } = require('../middleware/authMiddleware');
const { sendZaloMessage } = require('../services/zaloService');
const { PUBLIC_URL } = require('../config/constants');

// --- WEB USERS API ---
router.get('/api/users', checkAuth, async (req, res) => {
  if (req.user.role !== 'SUPER_ADMIN') return res.status(403).json({ error: 'Permission denied' });
  const users = await db.getUsers();
  // Filter out sensitive data
  const safeUsers = users.map(u => ({ username: u.username, role: u.role, displayName: u.displayName, zaloId: u.zaloId, createdAt: u.createdAt }));
  res.json({ success: true, users: safeUsers });
});

router.post('/api/users/create', checkAuth, async (req, res) => {
  if (req.user.role !== 'SUPER_ADMIN') return res.status(403).json({ error: 'Permission denied' });
  const { username, password, role, displayName, zaloId } = req.body;
  if (!username || !password || !role) return res.status(400).json({ error: 'Thiếu thông tin' });
  const rawRecoveryKey = 'TICKET-' + crypto.randomBytes(4).toString('hex').toUpperCase();
  const passwordHash = await bcrypt.hash(password, 10);
  const recoveryKeyHash = await bcrypt.hash(rawRecoveryKey, 10);
  const created = await db.createUser(username, passwordHash, recoveryKeyHash, role, displayName, zaloId || '');
  if (created) {
    if (zaloId) {
      const loginMsg = `🎉 TÀI KHOẢN ADMIN ĐÃ ĐƯỢC KHỞI TẠO!
------------------------------
👤 Tên hiển thị: ${displayName || 'Bộ phận IT'}
🔑 Tên đăng nhập: ${username}
🔒 Mật khẩu: ${password}
🌐 Link đăng nhập: ${PUBLIC_URL}
------------------------------
Vui lòng đăng nhập vào Web Admin bằng tài khoản trên để quản lý sự cố.
(⚠️ Lời khuyên: Đổi mật khẩu sau khi đăng nhập thành công)`;
      sendZaloMessage(zaloId, loginMsg).catch(err => console.error("Error sending Zalo message:", err));
    }
    res.json({ success: true, recoveryKey: rawRecoveryKey });
  } else {
    res.status(400).json({ error: 'Tên đăng nhập đã tồn tại' });
  }
});

router.post('/api/users/delete', checkAuth, async (req, res) => {
  if (req.user.role !== 'SUPER_ADMIN') return res.status(403).json({ error: 'Permission denied' });
  const { username } = req.body;
  if (username === req.user.username) return res.status(400).json({ error: 'Không thể tự xóa bản thân' });
  
  const users = await db.getUsers();
  const targetUser = users.find(u => u.username === username);
  if (targetUser && targetUser.role === 'SUPER_ADMIN') {
    const superAdmins = users.filter(u => u.role === 'SUPER_ADMIN');
    if (superAdmins.length <= 1) {
      return res.status(400).json({ error: 'Không thể xóa SUPER_ADMIN duy nhất còn lại của hệ thống!' });
    }
  }
  
  const success = await db.deleteUser(username);
  if (success) res.json({ success: true });
  else res.status(400).json({ error: 'Tài khoản không tồn tại' });
});

router.post('/api/users/edit', checkAuth, async (req, res) => {
  if (req.user.role !== 'SUPER_ADMIN') return res.status(403).json({ error: 'Permission denied' });
  const { username, password, role, displayName, zaloId } = req.body;
  if (!username) return res.status(400).json({ error: 'Thiếu username' });
  
  const users = await db.getUsers();
  const targetUser = users.find(u => u.username === username);
  if (!targetUser) return res.status(400).json({ error: 'Tài khoản không tồn tại' });
  
  // Prevent changing the role of the last SUPER_ADMIN
  if (targetUser.role === 'SUPER_ADMIN' && role !== 'SUPER_ADMIN') {
    const superAdmins = users.filter(u => u.role === 'SUPER_ADMIN');
    if (superAdmins.length <= 1) {
      return res.status(400).json({ error: 'Không thể hạ quyền SUPER_ADMIN duy nhất còn lại!' });
    }
  }

  const updateData = {};
  if (password) updateData.passwordHash = await bcrypt.hash(password, 10);
  if (role) updateData.role = role;
  if (displayName) updateData.displayName = displayName;
  if (zaloId !== undefined) updateData.zaloId = zaloId;

  const success = await db.updateUser(username, updateData);
  if (success) res.json({ success: true });
  else res.status(400).json({ error: 'Lỗi khi cập nhật' });
});

module.exports = router;
