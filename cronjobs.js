const cron = require('node-cron');
const db = require('./database');

function setupCronJobs(sendToAdmins) {
  // 1. Notify Admin on the last day of the month at 10:00 AM
  cron.schedule('0 10 28-31 * *', async () => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // If tomorrow is the 1st, then today is the last day of the month
    if (tomorrow.getDate() === 1) {
      console.log('Sending end-of-month report reminder...');
      await sendToAdmins("Hôm nay là ngày cuối tháng. Hãy gõ /report để xuất báo cáo dữ liệu yêu cầu trong tháng trước khi hệ thống dọn dẹp vào ngày mai nhé!");
    }
  });

  // 2. Clean up old data on the 1st day of every month at 00:01 AM
  cron.schedule('1 0 1 * *', async () => {
    console.log('Running monthly data cleanup...');
    const cutoffDate = new Date();
    // Set to the 1st day of the previous month
    cutoffDate.setMonth(cutoffDate.getMonth() - 1);
    cutoffDate.setDate(1);
    cutoffDate.setHours(0, 0, 0, 0);

    try {
      const deletedCount = await db.deleteRequestsOlderThan(cutoffDate.getTime());
      console.log(`Deleted ${deletedCount} old requests.`);
      await sendToAdmins(`Hệ thống đã tự động dọn dẹp ${deletedCount} dữ liệu cũ từ trước ngày ${cutoffDate.toLocaleDateString('vi-VN')}.`);
    } catch (err) {
      console.error('Error during data cleanup:', err);
    }
  });
}

module.exports = setupCronJobs;
