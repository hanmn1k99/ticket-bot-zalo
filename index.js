require('dotenv').config();
const express = require('express');
const path = require('path');
const fs = require('fs');
const cookieParser = require('cookie-parser');
const setupCronJobs = require('./cronjobs');
const { PORT } = require('./config/constants');
const { sendToAdmins } = require('./services/zaloService');
const { checkAuth } = require('./middleware/authMiddleware');
const { getDashboardHtml } = require('./views/dashboardView');

// Import routes
const authRoutes = require('./routes/authRoutes');
const ticketRoutes = require('./routes/ticketRoutes');
const adminRoutes = require('./routes/adminRoutes');
const userRoutes = require('./routes/userRoutes');
const settingRoutes = require('./routes/settingRoutes');
const webhookRoutes = require('./routes/webhookRoutes');

const app = express();

// Global Process Exception Handlers
process.on('uncaughtException', (err) => {
  console.error('CRASH Uncaught Exception:', err);
});
process.on('unhandledRejection', (err) => {
  console.error('CRASH Unhandled Rejection:', err);
});

// Middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] Nhận Request: ${req.method} ${req.url}`);
  next();
});

app.use(express.json());
app.use(cookieParser());

// Static Directories
const publicDir = path.join(__dirname, 'public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir);
}
app.use('/download', express.static(publicDir));
app.use('/assets', express.static(path.join(__dirname, 'assets')));

// Init Cron Jobs
setupCronJobs(sendToAdmins);

// Root & PWA Routes
app.get('/', (req, res) => {
  res.redirect('/report');
});
app.get('/manifest.json', (req, res) => res.sendFile(path.join(__dirname, 'manifest.json')));
app.get('/sw.js', (req, res) => res.sendFile(path.join(__dirname, 'sw.js')));

// Dashboard Route
app.get('/report', checkAuth, async (req, res) => {
  const html = await getDashboardHtml(req.user);
  res.send(html);
});

// Mount Routes
app.use(authRoutes);
app.use(ticketRoutes);
app.use(adminRoutes);
app.use(userRoutes);
app.use(settingRoutes);
app.use(webhookRoutes);

// Start Server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is listening on port ${PORT} (0.0.0.0)`);
});
