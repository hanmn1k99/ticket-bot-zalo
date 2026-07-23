const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const db = require('../database');
const { JWT_SECRET } = require('../config/constants');
const { getLoginHtml, getSetupHtml, getForgotPasswordHtml } = require('../views/authViews');

// GET /login HTML
router.get('/login', (req, res) => {
  res.send(getLoginHtml());
});

// POST /login
router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  const user = await db.getUserByUsername(username);
  if (!user) return res.status(401).json({ error: 'Sai tài khoản hoặc mật khẩu' });

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (valid) {
    const token = jwt.sign({ 
      admin: true, 
      username,
      role: user.role,
      displayName: user.displayName,
      zaloId: user.zaloId
    }, JWT_SECRET, { expiresIn: '7d' });
    res.cookie('auth_token', token, { httpOnly: true, maxAge: 7 * 24 * 60 * 60 * 1000 });
    return res.json({ success: true });
  }
  res.status(401).json({ error: 'Sai tài khoản hoặc mật khẩu' });
});

// GET /setup HTML
router.get('/setup', async (req, res) => {
  const users = await db.getUsers();
  if (users.length > 0) return res.redirect('/login');
  res.send(getSetupHtml());
});

// POST /api/auth/setup
router.post('/api/auth/setup', async (req, res) => {
  const users = await db.getUsers();
  if (users.length > 0) return res.status(403).json({ error: 'System is already setup' });

  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'Missing fields' });

  const rawRecoveryKey = 'TICKET-' + crypto.randomBytes(4).toString('hex').toUpperCase() + '-' + crypto.randomBytes(4).toString('hex').toUpperCase();
  const passwordHash = await bcrypt.hash(password, 10);
  const recoveryKeyHash = await bcrypt.hash(rawRecoveryKey, 10);

  const created = await db.createUser(username, passwordHash, recoveryKeyHash, 'SUPER_ADMIN', 'Quản trị viên', '');
  if (created) {
    return res.status(201).json({ success: true, recoveryKey: rawRecoveryKey });
  }
  res.status(500).json({ error: 'Failed to create user' });
});

// GET /forgot-password
router.get('/forgot-password', (req, res) => {
  res.send(getForgotPasswordHtml());
});

// POST /api/auth/forgot-password
router.post('/api/auth/forgot-password', async (req, res) => {
  const { username, recoveryKey, newPassword } = req.body;
  if (!username || !recoveryKey || !newPassword) return res.status(400).json({ error: 'Missing fields' });

  const user = await db.getUserByUsername(username);
  if (!user || !user.recoveryKeyHash) return res.status(404).json({ error: 'Tài khoản không tồn tại' });

  const valid = await bcrypt.compare(recoveryKey, user.recoveryKeyHash);
  if (!valid) return res.status(401).json({ error: 'Mã khôi phục không đúng' });

  const hashed = await bcrypt.hash(newPassword, 10);
  const success = await db.updateUserPassword(username, hashed);
  if (success) {
    res.json({ success: true, message: 'Password reset successfully' });
  } else {
    res.status(500).json({ error: 'Lỗi hệ thống' });
  }
});

// GET /logout
router.get('/logout', (req, res) => {
  res.clearCookie('auth_token');
  res.redirect('/login');
});

module.exports = router;
