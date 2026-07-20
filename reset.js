const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, 'database.json');

console.log('⚠️ ĐANG TIẾN HÀNH KHÔI PHỤC CÀI ĐẶT GỐC (FACTORY RESET)...');

if (!fs.existsSync(dbPath)) {
  console.log('Không tìm thấy database.json. Hệ thống đã sạch.');
  process.exit(0);
}

try {
  const data = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
  
  if (data.settings) {
    // Xóa User Web
    delete data.settings.users;
    console.log('- Đã xóa toàn bộ tài khoản Web.');
    
    // Xóa Admin Zalo
    delete data.settings.admins;
    delete data.settings.pending_admins;
    console.log('- Đã xóa toàn bộ Quản trị viên Zalo.');
    
    // Xóa FAQ
    delete data.settings.faq_content;
    console.log('- Đã xóa dữ liệu FAQ.');
  }

  // Ghi lại DB
  fs.writeFileSync(dbPath, JSON.stringify(data, null, 2), 'utf8');
  console.log('\n✅ KHÔI PHỤC CÀI ĐẶT GỐC THÀNH CÔNG!');
  console.log('Bộ não AI (System Prompt) và Dữ liệu sự cố (Tickets, Groups) được GIỮ NGUYÊN.');
  console.log('Vui lòng truy cập Web Dashboard (/setup) để tạo lại tài khoản mới.');
  
} catch (error) {
  console.error('❌ Lỗi khi đọc/ghi database.json:', error);
  process.exit(1);
}
