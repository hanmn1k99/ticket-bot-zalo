const cron = require('node-cron');
const db = require('./database');

function setupCronJobs(sendToAdmins) {
  // 1. Notify Admin on the last day of the month at 17:00 (Vietnam Time)
  cron.schedule('0 17 28-31 * *', async () => {
    // Use Intl.DateTimeFormat to reliably check the day in Vietnam time, ignoring server timezone
    const vnDayFormatter = new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Ho_Chi_Minh', day: 'numeric' });
    
    const todayMs = Date.now();
    const tomorrowMs = todayMs + 24 * 60 * 60 * 1000;
    const tomorrowDay = parseInt(vnDayFormatter.format(tomorrowMs), 10);

    // If tomorrow is the 1st, then today is the last day of the month
    if (tomorrowDay === 1) {
      console.log('Sending end-of-month report reminder...');
      await sendToAdmins('Hôm nay là ngày cuối tháng. Hãy gõ /report để xuất báo cáo dữ liệu sự cố trong tháng trước khi hệ thống dọn dẹp vào lúc 00:00 đêm nay nhé!');
    }
  }, {
    timezone: 'Asia/Ho_Chi_Minh'
  });

  // 2. Clean up old data on the 1st day of every month at 00:00 (Vietnam Time)
  cron.schedule('0 0 1 * *', async () => {
    console.log('Running monthly data cleanup...');
    
    // Since this runs exactly at 00:00 on the 1st, Date.now() represents the exact split-second 
    // boundary between the old month and the new month. We delete everything older than this moment.
    const cutoffTimestamp = Date.now();

    try {
      const deletedCount = await db.deleteRequestsOlderThan(cutoffTimestamp);
      console.log(`Deleted ${deletedCount} old requests.`);
      await sendToAdmins(`Hệ thống đã tự động dọn dẹp ${deletedCount} dữ liệu sự cố của tháng trước.`);
    } catch (err) {
      console.error('Error during data cleanup:', err);
    }
  }, {
    timezone: 'Asia/Ho_Chi_Minh'
  });
}

module.exports = setupCronJobs;