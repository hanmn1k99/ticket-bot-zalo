const jwt = require('jsonwebtoken');
const db = require('../database');
const { JWT_SECRET } = require('../config/constants');

async function checkAuth(req, res, next) {
  const users = await db.getUsers();
  if (users.length === 0) {
    if (req.path === '/setup' || req.path === '/api/auth/setup') return next();
    if (req.path.startsWith('/api/')) return res.status(403).json({ error: 'System not setup' });
    return res.redirect('/setup');
  }

  const token = req.cookies.auth_token;
  if (!token) {
    if (req.path === '/report' || req.path === '/settings') return res.redirect('/login');
    return res.status(401).json({ error: 'Unauthorized' });
  }
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    if (!req.user.role) {
      req.user.role = 'SUPER_ADMIN';
    }
    next();
  } catch (err) {
    if (req.path === '/report' || req.path === '/settings') return res.redirect('/login');
    return res.status(401).json({ error: 'Unauthorized' });
  }
}

module.exports = {
  checkAuth
};
