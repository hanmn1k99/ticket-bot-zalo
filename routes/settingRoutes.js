const express = require('express');
const fs = require('fs');
const path = require('path');
const router = express.Router();
const db = require('../database');
const { checkAuth } = require('../middleware/authMiddleware');
const { getSettingsHtml } = require('../views/settingsView');

// GET /settings
router.get('/settings', checkAuth, async (req, res) => {
  if (req.user.role !== 'SUPER_ADMIN') return res.redirect('/report');
  const html = await getSettingsHtml(req.user);
  if (!html) return res.redirect('/report');
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
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

// POST /api/settings/upload-image
router.post('/api/settings/upload-image', checkAuth, async (req, res) => {
  if (req.user.role !== 'SUPER_ADMIN') return res.status(403).json({ error: 'KhÃ´ng cÃ³ quyá»n' });
  
  // Need to handle potentially large payload since we are accepting base64 images
  // Ensure that express.json({limit: '10mb'}) is configured in index.js, 
  // otherwise large images will throw 413 Payload Too Large.
  const { type, imageBase64 } = req.body;
  
  if (!['logo', 'favicon'].includes(type) || !imageBase64) {
    return res.status(400).json({ error: 'Dá»¯ liá»‡u khÃ´ng há»£p lá»‡' });
  }

  const matches = imageBase64.match(new RegExp('^data:image/([A-Za-z-+/]+);base64,(.+)'));
  if (!matches || matches.length !== 3) {
    return res.status(400).json({ error: 'Äá»‹nh dáº¡ng áº£nh khÃ´ng há»£p lá»‡' });
  }
  
  const imageBuffer = Buffer.from(matches[2], 'base64');
  const assetsDir = path.join(__dirname, '..', 'assets');
  const targetPath = path.join(assetsDir, `${type}.png`);
  
  try {
    if (!fs.existsSync(assetsDir)) {
       fs.mkdirSync(assetsDir);
    }
    fs.writeFileSync(targetPath, imageBuffer);
    res.json({ success: true });
  } catch(e) {
    console.error('Error writing image:', e);
    res.status(500).json({ error: 'Lá»—i khi lÆ°u file' });
  }
});

module.exports = router;
