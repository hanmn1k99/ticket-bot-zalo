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

// POST /api/settings/bot-config
router.post('/api/settings/bot-config', checkAuth, async (req, res) => {
  if (req.user.role !== 'SUPER_ADMIN') return res.status(403).json({ error: 'Permission denied' });
  const {
    bot_org_name,
    bot_user_role,
    bot_pronoun_me,
    bot_pronoun_user_male,
    bot_pronoun_user_female,
    bot_pronoun_user_default,
    bot_environment
  } = req.body;

  if (bot_org_name !== undefined) await db.setSetting('bot_org_name', bot_org_name.trim());
  if (bot_user_role !== undefined) await db.setSetting('bot_user_role', bot_user_role.trim());
  if (bot_pronoun_me !== undefined) await db.setSetting('bot_pronoun_me', bot_pronoun_me.trim());
  if (bot_pronoun_user_male !== undefined) await db.setSetting('bot_pronoun_user_male', bot_pronoun_user_male.trim());
  if (bot_pronoun_user_female !== undefined) await db.setSetting('bot_pronoun_user_female', bot_pronoun_user_female.trim());
  if (bot_pronoun_user_default !== undefined) await db.setSetting('bot_pronoun_user_default', bot_pronoun_user_default.trim());
  if (bot_environment !== undefined) await db.setSetting('bot_environment', bot_environment.trim());

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
