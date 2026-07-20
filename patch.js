const fs = require('fs');

let content = fs.readFileSync('index.js', 'utf8');

// 1. Add sendToAdmins and isAdmin
content = content.replace(
  `    return data;
  } catch (error) {
    console.error('Error sending message:', error);
  }
}`,
  `    return data;
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
}`
);

// 2. setupCronJobs
content = content.replace('setupCronJobs(sendZaloMessage);', 'setupCronJobs(sendToAdmins);');

// 3. API web fixes
content = content.replace(
`    // Thông báo cho Admin
    const adminId = await db.getSetting('admin_chat_id');
    if (adminId) {
      await sendZaloMessage(adminId, \`✅ Sự cố #\${id} đã hoàn thành qua web\`);
    }`,
`    // Thông báo cho Admin
    await sendToAdmins(\`✅ Sự cố #\${id} đã hoàn thành qua web\`);`
);

content = content.replace(
`    const adminId = await db.getSetting('admin_chat_id');
    if (adminId) {
      await sendZaloMessage(adminId, \`⛔ Sự cố #\${id} đã bị từ chối qua web\`);
    }`,
`    await sendToAdmins(\`⛔ Sự cố #\${id} đã bị từ chối qua web\`);`
);

content = content.replace(
`    const adminId = await db.getSetting('admin_chat_id');
    if (adminId) {
      await sendZaloMessage(adminId, \`✅ Sự cố #\${id} đã được tiếp nhận qua web\`);
    }`,
`    await sendToAdmins(\`✅ Sự cố #\${id} đã được tiếp nhận qua web\`);`
);

content = content.replace(
`  // Gửi thông báo cho Admin qua Zalo
  const adminId = await db.getSetting('admin_chat_id');
  if (adminId) {
    await sendZaloMessage(adminId, \`🧹 [WEB DASHBOARD] Đã dọn dẹp hệ thống. Xóa thành công \${count} sự cố. Bộ đếm ID đã được reset về #1.\`);
  }`,
`  // Gửi thông báo cho Admin qua Zalo
  await sendToAdmins(\`🧹 [WEB DASHBOARD] Đã dọn dẹp hệ thống. Xóa thành công \${count} sự cố. Bộ đếm ID đã được reset về #1.\`);`
);

// 4. Admin auth inside webhook
content = content.replace(/const adminId = await db\.getSetting\('admin_chat_id'\) \|\| process\.env\.ADMIN_CHAT_ID;\s*if \(senderId !== adminId\) \{/g, `if (!(await isAdmin(senderId))) {`);

// 5. Reply logic
content = content.replace(
`    // Xử lý tin nhắn từ Admin (Reply ticket)
    const adminIdForReply = await db.getSetting('admin_chat_id') || process.env.ADMIN_CHAT_ID;`,
`    // Xử lý tin nhắn từ Admin (Reply ticket)
    const isSenderAdmin = await isAdmin(senderId);`
);

content = content.replace(
`    // Là Reply nếu: Gửi từ Admin, KHÔNG phải lệnh, VÀ (Có Quote hợp lệ HOẶC có gõ #ID HOẶC không có nhắc đến @Bot)
    if (senderId === adminIdForReply && !text.startsWith('/') && (isExplicitQuoteReply || hasTextTicketId || !isBotMentioned)) {`,
`    // Là Reply nếu: Gửi từ Admin, KHÔNG phải lệnh, VÀ (Có Quote hợp lệ HOẶC có gõ #ID HOẶC không có nhắc đến @Bot)
    if (isSenderAdmin && !text.startsWith('/') && (isExplicitQuoteReply || hasTextTicketId || !isBotMentioned)) {`
);

// 6. New ticket notify
content = content.replace(
`      console.log('--- NHẬN YÊU CẦU MỚI ---');
      console.log(adminMessage);

      const adminId = await db.getSetting('admin_chat_id') || process.env.ADMIN_CHAT_ID;
      if (adminId) {
        // (Tùy chọn) Có thể gửi 1 tin hoặc 2 tin (Tin nhắn + Tin đính kèm ID để Reply dễ)
        // Hiện tại gộp chung vào 1 tin cho gọn.
        await sendZaloMessage(adminId, adminMessage);
      } else {
        console.warn('ADMIN_CHAT_ID is not configured. Cannot forward message.');
      }`,
`      console.log('--- NHẬN YÊU CẦU MỚI ---');
      console.log(adminMessage);
      
      const admins = await db.getAdmins();
      if (admins.length > 0) {
        await sendToAdmins(adminMessage);
      } else {
        console.warn('Không có Admin nào trong hệ thống. Không thể chuyển tiếp tin nhắn.');
      }`
);

// 7. Update /install
content = content.replace(
`    // Handle /install command
    if (text.trim() === '/install') {
      await db.setSetting('admin_chat_id', senderId);
      await sendZaloMessage(chatId, "✅ Thiết lập thành công! Bạn đã được gán làm Admin. Các yêu cầu từ người dùng sẽ được chuyển tiếp tới đây.");
      return;
    }

    // Handle /uninstall command
    if (text.trim() === '/uninstall') {
      await db.setSetting('admin_chat_id', null);
      await sendZaloMessage(chatId, "✅ Đã hủy quyền Admin. Bạn sẽ không nhận được thông báo nữa.");
      return;
    }`,
`    // Handle /install command
    if (text.trim() === '/install') {
      const isAlreadyAdmin = await isAdmin(senderId);
      if (isAlreadyAdmin) {
        await sendZaloMessage(chatId, "⚠️ Bạn đã là Quản trị viên (Admin) rồi.");
        return;
      }
      const added = await db.addPendingAdmin(senderId, senderName);
      if (added) {
        await sendZaloMessage(chatId, "✅ Yêu cầu cấp quyền Admin Zalo đã được gửi. Vui lòng chờ Quản trị viên Web phê duyệt.");
      } else {
        await sendZaloMessage(chatId, "⚠️ Yêu cầu của bạn đã tồn tại trong hàng đợi và đang chờ phê duyệt.");
      }
      return;
    }

    // Handle /admin command
    if (text.trim() === '/admin') {
      const admins = await db.getAdmins();
      if (admins.length === 0) {
        await sendZaloMessage(chatId, "Danh sách Quản trị viên hiện đang trống.");
      } else {
        let msg = "👥 DANH SÁCH QUẢN TRỊ VIÊN:\\n------------------------------\\n";
        admins.forEach((a, idx) => {
          msg += \`\${idx + 1}. \${a.name}\\n\`;
        });
        await sendZaloMessage(chatId, msg);
      }
      return;
    }

    // Handle /uninstall command (Không khuyến khích tự xóa, chỉ có web mới xóa)
    if (text.trim() === '/uninstall') {
       const removed = await db.removeAdmin(senderId);
       if (removed) {
         await sendZaloMessage(chatId, "✅ Đã tự động rời khỏi vị trí Admin. Bạn sẽ không nhận được thông báo nữa.");
       } else {
         await sendZaloMessage(chatId, "⚠️ Bạn không phải là Admin.");
       }
       return;
    }`
);

// 8. /ask help msg update
content = content.replace(
`1️⃣ /install : Trở thành Quản trị viên (nhận tin báo).
2️⃣ /uninstall : Hủy quyền Quản trị viên.
3️⃣ /report : Lấy link truy cập Trang quản trị Web.
4️⃣ /clean : (Nguy hiểm) Xóa toàn bộ dữ liệu.

🔹 Xử lý sự cố:`,
`1️⃣ /install : Đăng ký quyền Quản trị viên Zalo.
2️⃣ /admin : Xem danh sách Quản trị viên.
3️⃣ /uninstall : Tự xóa quyền Quản trị viên cá nhân.
4️⃣ /report : Lấy link truy cập Trang quản trị Web.
5️⃣ /clean : (Nguy hiểm) Xóa toàn bộ dữ liệu.
6️⃣ /test : Tạo sự cố thử nghiệm tự xóa sau 1 phút.

🔹 Xử lý sự cố:`
);

content = content.replace(
`8️⃣ /test [Nội dung tùy chọn]
   👉 Tạo sự cố thử nghiệm tự xóa sau 1 phút. (VD: /test)`,
``
); 

fs.writeFileSync('index.js', content, 'utf8');
console.log('Successfully patched index.js');
