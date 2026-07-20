const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, 'database.json');

// Helper to read DB
function readDB() {
  if (!fs.existsSync(dbPath)) {
    return { settings: {}, requests: [] };
  }
  try {
    const data = fs.readFileSync(dbPath, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    console.error("Error reading database:", err);
    return { settings: {}, requests: [] };
  }
}

// Helper to write DB
function writeDB(data) {
  fs.writeFileSync(dbPath, JSON.stringify(data, null, 2), 'utf8');
}

// Settings API
async function getSetting(key) {
  const db = readDB();
  return db.settings[key] || null;
}

async function setSetting(key, value) {
  const db = readDB();
  db.settings[key] = value;
  writeDB(db);
}

// Requests API
async function addRequest(timestamp, senderName, senderId, chatId, chatName, content, location) {
  const db = readDB();
  const newId = db.requests.length > 0 ? db.requests[db.requests.length - 1].id + 1 : 1;
  db.requests.push({
    id: newId,
    timestamp,
    sender_name: senderName,
    sender_id: senderId,
    chat_id: chatId,
    chat_name: chatName,
    content,
    location: location || "Không xác định",
    status: 'Đang chờ',
    admin_reply: null,
    completed_at: null
  });
  writeDB(db);
  return newId;
}

async function updateRequest(id, adminReply, completedAt) {
  const db = readDB();
  const index = db.requests.findIndex(r => r.id === id);
  if (index !== -1) {
    db.requests[index].status = 'Đã xong';
    db.requests[index].admin_reply = adminReply;
    db.requests[index].completed_at = completedAt;
    writeDB(db);
    return db.requests[index];
  }
  return null;
}

async function rejectRequest(id, adminReply, completedAt) {
  const db = readDB();
  const index = db.requests.findIndex(r => r.id === id);
  if (index !== -1) {
    db.requests[index].status = 'Từ chối';
    db.requests[index].admin_reply = adminReply;
    db.requests[index].completed_at = completedAt;
    writeDB(db);
    return db.requests[index];
  }
  return null;
}

async function updateRequestStatus(id, newStatus) {
  const db = readDB();
  const index = db.requests.findIndex(r => r.id === id);
  if (index !== -1) {
    db.requests[index].status = newStatus;
    writeDB(db);
    return db.requests[index];
  }
  return null;
}

async function getRequest(id) {
  const db = readDB();
  return db.requests.find(r => r.id === id) || null;
}

async function getLatestPendingRequest() {
  const db = readDB();
  const pendingRequests = db.requests.filter(r => r.status === 'Đang xử lý');
  if (pendingRequests.length > 0) {
    return pendingRequests[pendingRequests.length - 1]; // Lấy phần tử cuối (mới nhất)
  }
  return null;
}

async function getAllRequests() {
  const db = readDB();
  return db.requests.sort((a, b) => a.timestamp - b.timestamp);
}

// Delete requests older than specific timestamp
async function deleteRequestsOlderThan(timestamp) {
  const db = readDB();
  const initialCount = db.requests.length;
  db.requests = db.requests.filter(req => req.timestamp >= timestamp);
  const deletedCount = initialCount - db.requests.length;
  writeDB(db);
  return deletedCount;
}

// Groups API
async function addGroup(groupId) {
  const db = readDB();
  if (!db.groups) db.groups = [];
  if (!db.groups.includes(groupId)) {
    db.groups.push(groupId);
    if (!db.groupNames) db.groupNames = {};
    if (!db.groupNames[groupId]) {
      const count = Object.keys(db.groupNames).length + 1;
      db.groupNames[groupId] = `Gr${String(count).padStart(2, '0')}`;
    }
    writeDB(db);
    return true;
  }
  return false;
}

async function removeGroup(groupId) {
  const db = readDB();
  if (!db.groups) return false;
  const initialLength = db.groups.length;
  db.groups = db.groups.filter(id => id !== groupId);
  writeDB(db);
  return initialLength !== db.groups.length;
}

async function getAllGroups() {
  const db = readDB();
  return db.groups || [];
}

async function deleteRequest(id) {
  const db = readDB();
  const initialLength = db.requests ? db.requests.length : 0;
  if (db.requests) {
    db.requests = db.requests.filter(r => r.id !== id);
    writeDB(db);
    return initialLength !== db.requests.length;
  }
  return false;
}

async function deleteAllRequests() {
  const db = readDB();
  const deletedCount = db.requests ? db.requests.length : 0;
  db.requests = [];
  writeDB(db);
  return deletedCount;
}

async function deleteRequestsOlderThan(timestamp) {
  const db = readDB();
  if (!db.requests) return 0;
  const initialLength = db.requests.length;
  db.requests = db.requests.filter(r => r.timestamp >= timestamp);
  writeDB(db);
  return initialLength - db.requests.length;
}

async function setGroupName(groupId, name) {
  const db = readDB();
  if (!db.groupNames) db.groupNames = {};
  db.groupNames[groupId] = name;
  writeDB(db);
}

async function getGroupName(groupId) {
  const db = readDB();
  if (!db.groupNames) return null;
  return db.groupNames[groupId] || null;
}

async function getAllGroupNames() {
  const db = readDB();
  return db.groupNames || {};
}

async function removeGroupCompletely(groupId) {
  const db = readDB();
  let changed = false;
  if (db.groups && db.groups.includes(groupId)) {
    db.groups = db.groups.filter(id => id !== groupId);
    changed = true;
  }
  if (db.groupNames && db.groupNames[groupId]) {
    delete db.groupNames[groupId];
    changed = true;
  }
  if (changed) writeDB(db);
  return changed;
}

// Admins API
async function getAdmins() {
  const db = readDB();
  
  // Migration từ admin_chat_id cũ (nếu có)
  if (db.settings.admin_chat_id) {
    if (!db.settings.admins) db.settings.admins = [];
    if (!db.settings.admins.find(a => a.id === db.settings.admin_chat_id)) {
      db.settings.admins.push({ 
        id: db.settings.admin_chat_id, 
        name: 'Admin Zalo (Từ bản cũ)', 
        timestamp: Date.now() 
      });
    }
    // Xóa trường cũ để không bị lặp lại việc migrate
    delete db.settings.admin_chat_id;
    writeDB(db);
  }

  return db.settings.admins || [];
}

async function getPendingAdmins() {
  const db = readDB();
  return db.settings.pending_admins || [];
}

async function addPendingAdmin(id, name) {
  const db = readDB();
  if (!db.settings.pending_admins) db.settings.pending_admins = [];
  if (!db.settings.pending_admins.find(a => a.id === id)) {
    db.settings.pending_admins.push({ id, name, timestamp: Date.now() });
    writeDB(db);
    return true;
  }
  return false;
}

async function approveAdmin(id) {
  const db = readDB();
  if (!db.settings.pending_admins) return false;
  const pendingIndex = db.settings.pending_admins.findIndex(a => a.id === id);
  if (pendingIndex !== -1) {
    const adminData = db.settings.pending_admins[pendingIndex];
    db.settings.pending_admins.splice(pendingIndex, 1);
    if (!db.settings.admins) db.settings.admins = [];
    if (!db.settings.admins.find(a => a.id === id)) {
      db.settings.admins.push(adminData);
    }
    writeDB(db);
    return true;
  }
  return false;
}

async function rejectAdmin(id) {
  const db = readDB();
  if (!db.settings.pending_admins) return false;
  const initialLength = db.settings.pending_admins.length;
  db.settings.pending_admins = db.settings.pending_admins.filter(a => a.id !== id);
  if (db.settings.pending_admins.length !== initialLength) {
    writeDB(db);
    return true;
  }
  return false;
}

async function removeAdmin(id) {
  const db = readDB();
  if (!db.settings.admins) return false;
  const initialLength = db.settings.admins.length;
  db.settings.admins = db.settings.admins.filter(a => a.id !== id);
  if (db.settings.admins.length !== initialLength) {
    writeDB(db);
    return true;
  }
  return false;
}

// --- Web Users API ---
async function getUsers() {
  const db = readDB();
  const users = db.settings.users || [];
  // Migrate existing users to SUPER_ADMIN if they don't have a role
  let modified = false;
  users.forEach(u => {
    if (!u.role) {
      u.role = 'SUPER_ADMIN';
      u.displayName = 'Quản trị viên';
      u.zaloId = '';
      modified = true;
    }
  });
  if (modified) writeDB(db);
  return users;
}

async function getUserByUsername(username) {
  const users = await getUsers();
  return users.find(u => u.username === username);
}

async function createUser(username, passwordHash, recoveryKeyHash, role = 'SUPER_ADMIN', displayName = '', zaloId = '') {
  const db = readDB();
  if (!db.settings.users) db.settings.users = [];
  if (db.settings.users.find(u => u.username === username)) return false;
  
  db.settings.users.push({
    username,
    passwordHash,
    recoveryKeyHash,
    role,
    displayName,
    zaloId,
    createdAt: Date.now()
  });
  writeDB(db);
  return true;
}

async function deleteUser(username) {
  const db = readDB();
  if (!db.settings.users) return false;
  const initialLength = db.settings.users.length;
  db.settings.users = db.settings.users.filter(u => u.username !== username);
  if (db.settings.users.length !== initialLength) {
    writeDB(db);
    return true;
  }
  return false;
}

async function updateUserPassword(username, newPasswordHash) {
  const db = readDB();
  if (!db.settings.users) return false;
  const user = db.settings.users.find(u => u.username === username);
  if (user) {
    user.passwordHash = newPasswordHash;
    writeDB(db);
    return true;
  }
  return false;
}

async function updateUser(username, updateData) {
  const db = readDB();
  if (!db.settings.users) return false;
  const user = db.settings.users.find(u => u.username === username);
  if (user) {
    if (updateData.passwordHash) user.passwordHash = updateData.passwordHash;
    if (updateData.role) user.role = updateData.role;
    if (updateData.displayName) user.displayName = updateData.displayName;
    if (updateData.zaloId !== undefined) user.zaloId = updateData.zaloId;
    writeDB(db);
    return true;
  }
  return false;
}

module.exports = {
  getSetting,
  setSetting,
  addRequest,
  getRequest,
  updateRequest,
  rejectRequest,
  updateRequestStatus,
  getLatestPendingRequest,
  getAllRequests,
  deleteRequest,
  deleteAllRequests,
  deleteRequestsOlderThan,
  addGroup,
  removeGroup,
  removeGroupCompletely,
  getAllGroups,
  setGroupName,
  getGroupName,
  getAllGroupNames,
  getAdmins,
  getPendingAdmins,
  addPendingAdmin,
  approveAdmin,
  rejectAdmin,
  removeAdmin,
  getUsers,
  getUserByUsername,
  createUser,
  deleteUser,
  updateUserPassword,
  updateUser
};
