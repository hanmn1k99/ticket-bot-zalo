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
async function addRequest(timestamp, senderName, senderId, content) {
  const db = readDB();
  const newId = db.requests.length > 0 ? db.requests[db.requests.length - 1].id + 1 : 1;
  db.requests.push({
    id: newId,
    timestamp,
    sender_name: senderName,
    sender_id: senderId,
    content,
    status: 'Đang xử lý',
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

async function deleteAllRequests() {
  const db = readDB();
  const deletedCount = db.requests ? db.requests.length : 0;
  db.requests = [];
  writeDB(db);
  return deletedCount;
}

module.exports = {
  getSetting,
  setSetting,
  addRequest,
  updateRequest,
  getLatestPendingRequest,
  getAllRequests,
  deleteAllRequests,
  addGroup,
  removeGroup,
  getAllGroups
};
