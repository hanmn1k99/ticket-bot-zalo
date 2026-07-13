const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const dbPath = path.join(__dirname, 'data.sqlite');
const db = new sqlite3.Database(dbPath);

// Initialize DB
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS requests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    timestamp INTEGER,
    sender_name TEXT,
    sender_id TEXT,
    content TEXT
  )`);
});

// Settings API
function getSetting(key) {
  return new Promise((resolve, reject) => {
    db.get('SELECT value FROM settings WHERE key = ?', [key], (err, row) => {
      if (err) return reject(err);
      resolve(row ? row.value : null);
    });
  });
}

function setSetting(key, value) {
  return new Promise((resolve, reject) => {
    db.run(
      'INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value=excluded.value',
      [key, value],
      function (err) {
        if (err) return reject(err);
        resolve(this.changes);
      }
    );
  });
}

// Requests API
function addRequest(timestamp, senderName, senderId, content) {
  return new Promise((resolve, reject) => {
    db.run(
      'INSERT INTO requests (timestamp, sender_name, sender_id, content) VALUES (?, ?, ?, ?)',
      [timestamp, senderName, senderId, content],
      function (err) {
        if (err) return reject(err);
        resolve(this.lastID);
      }
    );
  });
}

function getAllRequests() {
  return new Promise((resolve, reject) => {
    db.all('SELECT * FROM requests ORDER BY timestamp ASC', [], (err, rows) => {
      if (err) return reject(err);
      resolve(rows);
    });
  });
}

// Delete requests older than specific timestamp
function deleteRequestsOlderThan(timestamp) {
  return new Promise((resolve, reject) => {
    db.run('DELETE FROM requests WHERE timestamp < ?', [timestamp], function (err) {
      if (err) return reject(err);
      resolve(this.changes);
    });
  });
}

module.exports = {
  getSetting,
  setSetting,
  addRequest,
  getAllRequests,
  deleteRequestsOlderThan
};
