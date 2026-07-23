const express = require('express');
const router = express.Router();
const db = require('../database');
const { checkAuth } = require('../middleware/authMiddleware');
const { getSettingsHtml } = require('../views/settingsView');

// GET /settings
router.get('/settings', checkAuth, async (req, res) => {
  if (req.user.role !== 'SUPER_ADMIN') return res.redirect('/report');
  const html = await getSettingsHtml(req.user);
  if (!html) return res.redirect('/report');
  res.send(html);
});

// POST /api/settings/faq
router.post('/api/settings/faq', checkAuth, async (req, res) => {
  await db.setSetting('faq_content', req.body.content || '');
  res.json({ success: true });
});

// POST /api/settings/group/edit
router.post('/api/settings/group/edit', checkAuth, async (req, res) => {
  const { groupId, name } = req.body;
  if (groupId && name) await db.setGroupName(groupId, name);
  res.json({ success: true });
});

// POST /api/settings/group/delete
router.post('/api/settings/group/delete', checkAuth, async (req, res) => {
  const { groupId } = req.body;
  if (groupId) await db.removeGroupCompletely(groupId);
  res.json({ success: true });
});

module.exports = router;
