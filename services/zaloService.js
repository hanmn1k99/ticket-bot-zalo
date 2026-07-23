const db = require('../database');
const { BOT_TOKEN } = require('../config/constants');

// Helper to send message via Zalo API
async function sendZaloMessage(chatId, text) {
  try {
    const response = await fetch(`https://bot-api.zaloplatforms.com/bot${BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: text
      })
    });
    const data = await response.json();
    if (!data.ok) {
      console.error('Failed to send message:', data);
    }
    return data;
  } catch (error) {
    console.error('Error sending message:', error);
  }
}

async function sendToAdmins(text) {
  const admins = await db.getAdmins();
  for (const admin of admins) {
    await sendZaloMessage(admin.id, text);
  }
}

async function isAdmin(senderId) {
  const admins = await db.getAdmins();
  return admins.some(a => a.id === senderId);
}

async function isSuperAdmin(senderId) {
  const users = await db.getUsers();
  const linkedUser = users.find(u => u.zaloId === senderId);
  return linkedUser && linkedUser.role === 'SUPER_ADMIN';
}

async function getWebDisplayNameForZalo(senderId, fallbackName) {
  const users = await db.getUsers();
  const linkedUser = users.find(u => u.zaloId === senderId);
  if (linkedUser) {
    return linkedUser.displayName || fallbackName;
  }
  return fallbackName;
}

module.exports = {
  sendZaloMessage,
  sendToAdmins,
  isAdmin,
  isSuperAdmin,
  getWebDisplayNameForZalo
};
