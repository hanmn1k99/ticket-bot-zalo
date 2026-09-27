const fs = require('fs');
const path = require('path');
const db = require('../database');

async function renderTableRows() {
  const requests = await db.getAllRequests();
  const groupNames = await db.getAllGroupNames();
  
  return requests.map(r => {
     const currentChatName = groupNames[r.chat_id] || r.chat_name || 'Cá nhân';
     const d = new Date(r.timestamp);
     const day = String(d.getDate()).padStart(2, '0');
     const month = String(d.getMonth() + 1).padStart(2, '0');
     const time = d.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });
     
     let statusBadge = '';
     if (r.status === 'Đã xong') {
       statusBadge = '<span style="background:#dcfce7; color:#166534; padding:4px 10px; border-radius:9999px; font-weight:600; font-size:12px; white-space:nowrap; display:inline-flex; align-items:center; gap:4px;"><ion-icon name="checkmark-circle" style="font-size:14px; color:#166534;"></ion-icon> Đã xong</span>';
     } else if (r.status === 'Từ chối') {
       statusBadge = `<span id="statusBadge_${r.id}" style="background:#ffedd5; color:#c2410c; padding:4px 10px; border-radius:9999px; font-weight:600; font-size:12px; white-space:nowrap; display:inline-flex; align-items:center; gap:4px;"><ion-icon name="close-circle" style="font-size:14px; color:#c2410c;"></ion-icon> Từ chối</span>`;
     } else if (r.status === 'Hủy') {
       statusBadge = `<span id="statusBadge_${r.id}" style="background:#f1f5f9; color:#64748b; padding:4px 10px; border-radius:9999px; font-weight:600; font-size:12px; white-space:nowrap; display:inline-flex; align-items:center; gap:4px;"><ion-icon name="ban" style="font-size:14px; color:#64748b;"></ion-icon> Hủy</span>`;
     } else if (r.status === 'Đang xử lý') {
       statusBadge = `<span id="statusBadge_${r.id}" style="background:#fef08a; color:#854d0e; padding:4px 10px; border-radius:9999px; font-weight:600; font-size:12px; white-space:nowrap; display:inline-flex; align-items:center; gap:4px;"><ion-icon name="construct" style="font-size:14px; color:#854d0e;"></ion-icon> Đang xử lý</span>`;
     } else {
       statusBadge = `<span id="statusBadge_${r.id}" style="background:#fee2e2; color:#991b1b; padding:4px 10px; border-radius:9999px; font-weight:600; font-size:12px; white-space:nowrap; display:inline-flex; align-items:center; gap:4px;"><ion-icon name="time" style="font-size:14px; color:#991b1b;"></ion-icon> Đang chờ</span>`;
     }

     let timeHtml = `<div style="font-size:13px; white-space:nowrap; display:flex; align-items:center; gap:4px;"><ion-icon name="time-outline" style="font-size:14px; color:var(--text-muted);"></ion-icon> ${time} <span style="color:var(--text-muted); font-size:12px;">${day}/${month}</span></div>`;
     if ((r.status === 'Đã xong' || r.status === 'Từ chối' || r.status === 'Hủy' || r.status === 'Đã thay đổi') && r.completed_at) {
       const cd = new Date(r.completed_at);
       const cday = String(cd.getDate()).padStart(2, '0');
       const cmonth = String(cd.getMonth() + 1).padStart(2, '0');
       const ctime = cd.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });
       timeHtml += `<div style="font-size:13px; margin-top:4px; white-space:nowrap; color:#16a34a; display:flex; align-items:center; gap:4px;"><ion-icon name="flag" style="font-size:14px;"></ion-icon> ${ctime} <span style="color:var(--text-muted); font-size:12px;">${cday}/${cmonth}</span></div>`;
     }
       
     let adminReplyCell = '';
     const handlerName = r.assignee_name || '-';
       if (r.status === 'Đã xong' || r.status === 'Từ chối' || r.status === 'Hủy' || r.status === 'Đã thay đổi') {
         const replyText = r.admin_reply ? r.admin_reply : '<i style="color:#94a3b8">Không có nội dung</i>';
         adminReplyCell = `
           <div style="display:flex; justify-content:space-between; align-items:center; gap:8px;">
               <span>${replyText}</span>
               <button onclick="deleteTicket(${r.id}, this)" title="Xóa sự cố này" class="btn-inline-delete">
                   <ion-icon name="trash" style="font-size:16px;"></ion-icon>
               </button>
           </div>
         `;
       } else if (r.status === 'Đang xử lý') {
         adminReplyCell = `
           <div id="actionBox_${r.id}" style="display:flex; flex-direction:column; gap:8px;">
              <input type="text" id="replyInput_${r.id}" onkeypress="if(event.key === 'Enter') resolveTicket(${r.id})" placeholder="Chi tiết khắc phục..." style="width:100%; padding:8px 12px; border:1px solid #cbd5e1; border-radius:9999px; font-size:13px; outline:none; box-sizing:border-box;">
              <div style="display:flex; gap:6px; justify-content:flex-start;">
                  <button onclick="resolveTicket(${r.id})" style="padding:6px 16px; font-size:13px; background:#16a34a; color:white; border:none; border-radius:9999px; cursor:pointer; white-space:nowrap; transition: all 0.2s; box-shadow: 0 1px 2px rgba(0,0,0,0.05); display:flex; align-items:center; gap:4px;"><ion-icon name="send"></ion-icon> Gửi</button>
                  <button onclick="rejectTicket(${r.id}, event)" style="padding:6px 16px; font-size:13px; background:#3b82f6; color:white; border:none; border-radius:9999px; cursor:pointer; white-space:nowrap; transition: all 0.2s; box-shadow: 0 1px 2px rgba(0,0,0,0.05); display:flex; align-items:center; gap:4px;"><ion-icon name="swap-horizontal"></ion-icon> Chuyển</button>
              </div>
           </div>
         `;
     } else {
         adminReplyCell = `
           <div id="actionBox_${r.id}" style="display:flex; gap:6px;">
              <button onclick="acceptTicket(${r.id}, event)" style="flex:1; display:flex; justify-content:center; align-items:center; gap:4px; padding:6px 12px; font-size:13px; font-weight:600; background:#fef08a; color:#854d0e; border:none; border-radius:9999px; cursor:pointer; white-space:nowrap; transition: all 0.2s; box-shadow: 0 1px 2px rgba(0,0,0,0.05);"><ion-icon name="hand-left"></ion-icon> Nhận</button>
              <button onclick="rejectTicket(${r.id}, event)" style="flex:1; display:flex; justify-content:center; align-items:center; gap:4px; padding:6px 12px; font-size:13px; font-weight:600; background:#3b82f6; color:white; border:none; border-radius:9999px; cursor:pointer; white-space:nowrap; transition: all 0.2s; box-shadow: 0 1px 2px rgba(0,0,0,0.05);"><ion-icon name="close-circle-outline"></ion-icon> Từ chối</button>
           </div>
         `;
     }

     return `
      <tr>
        <td><strong>#${r.id}</strong></td>
        <td>${r.sender_name}</td>
        <td><span style="background:var(--btn-secondary-bg); padding:4px 10px; border-radius:9999px; font-size:12px; display:inline-block; word-break:break-word; white-space:normal; line-height:1.4;">${currentChatName}</span></td>
        <td style="min-width:130px;">${timeHtml}</td>
        <td>${r.content}</td>
        <td id="statusCell_${r.id}">${statusBadge}</td>
        <td style="max-width:110px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;" title="${r.assignee_name || ''}">${handlerName}</td>
        <td id="replyCell_${r.id}">${adminReplyCell}</td>
      </tr>`;
  }).join('');
}

async function getDashboardHtml(user) {
  const formattedRequests = await renderTableRows();
  const monthStr = new Date().getMonth() + 1;
  
  // Load brand settings
  const siteTitle = await db.getSetting('site_title') || 'Hệ Thống Quản Lý IT';
  const siteSubtitle = await db.getSetting('site_subtitle') || 'Giải pháp tiếp nhận & hỗ trợ kỹ thuật chuyên nghiệp';
  const siteFooter = await db.getSetting('site_footer') || 'minhhan.net';
  let printTemplateHtml = '';
  try {
      printTemplateHtml = fs.readFileSync(path.join(__dirname, '..', 'print_template.html'), 'utf8');
  } catch(e) { /* ignore */ }
  
  const htmlContent = `
  <!DOCTYPE html>
  <html lang="vi">
  <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${siteTitle}</title>
      
      <link rel="icon" type="image/png" href="/assets/favicon.png?v=${Date.now()}">
      <link rel="apple-touch-icon" href="/assets/favicon.png?v=${Date.now()}">
      <link rel="manifest" href="/manifest.json">
      <meta name="theme-color" content="#2563eb">
      <script type="module" src="https://unpkg.com/ionicons@7.1.0/dist/ionicons/ionicons.esm.js"></script>
      <script nomodule src="https://unpkg.com/ionicons@7.1.0/dist/ionicons/ionicons.js"></script>
      <link rel="stylesheet" href="/css/dashboard.css">
  </head>
  <body>
      <div class="container">
          <div class="print-header">
              ${printTemplateHtml}
          </div>
          <div class="header" style="display:flex; flex-direction:column; gap:16px; margin-bottom:24px;">
              <!-- Tầng 1: Thương hiệu (Trái) & Nút Thao tác + Tài khoản (Phải) -->
              <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:16px; width:100%;">
                  <h2 style="display:flex; align-items:center; gap:16px; margin:0;">
                      <a href="https://${siteFooter}" target="_blank" class="brand-logo-link" style="text-decoration:none; display:flex; align-items:center; background: var(--btn-secondary-bg); padding: 6px 12px; border-radius: 10px; border: 1px solid var(--border-color); flex-shrink: 0;">
                          <img src="/assets/logo.png" alt="Logo" style="height: 32px; width: auto; object-fit: contain;" onerror="this.parentNode.style.display='none'">
                      </a>
                      <div class="brand-divider" style="height: 36px; width: 1px; background: var(--border-color); opacity: 0.8; flex-shrink: 0;"></div>
                      <div style="display:flex; flex-direction:column; justify-content:center;">
                          <span class="screen-title" style="font-size: 20px; font-weight: 700; line-height: 1.2; color: var(--text-main);">${siteTitle}</span>
                          <span class="screen-title" style="font-size: 13px; font-weight: 400; color: var(--text-muted); margin-top: 3px;">${siteSubtitle}</span>
                          <span class="print-title" style="display:none; font-size: 20px; font-weight: 700; line-height: 1.2;">${siteTitle}</span>
                          <span class="print-title" style="display:none; font-size: 13px; font-weight: 400; color: var(--text-muted); margin-top: 3px;">Báo cáo tổng hợp sự cố - Tháng ${monthStr}</span>
                      </div>
                  </h2>
                  
                  <div class="action-bar" style="display:flex; align-items:center; gap:10px;">
                      <button class="btn-secondary" onclick="toggleDarkMode()" title="Đổi giao diện Tối/Sáng" style="padding: 9px 12px; border-radius: 8px;">
                          <ion-icon name="moon-outline" style="font-size:18px;"></ion-icon>
                      </button>
                      <button class="btn-secondary" onclick="window.location.reload()" title="Tải lại trang" style="padding: 9px 12px; border-radius: 8px;">
                          <ion-icon name="refresh-outline" style="font-size:18px;"></ion-icon>
                      </button>
                      <button onclick="window.print()" title="In báo cáo" style="padding: 9px 14px; border-radius: 8px;">
                          <ion-icon name="print-outline" style="font-size:18px;"></ion-icon>
                      </button>
                      <div class="dropdown">
                          <button class="btn-secondary" style="color:var(--text-main); display:flex; align-items:center; gap:6px; padding: 9px 14px; border-radius: 8px;">
                              <ion-icon name="person-circle-outline" style="font-size:18px;"></ion-icon>
                              Tài khoản
                          </button>
                          <div class="dropdown-content">
                              ${(!user || user.role === 'SUPER_ADMIN') ? `
                              <button onclick="window.location.href='/settings'" style="color:#2563eb;">
                                  <ion-icon name="settings-outline" style="font-size:16px;"></ion-icon>
                                  Cài đặt & AI
                              </button>
                              <button onclick="cleanData()" style="color:#ef4444;">
                                  <ion-icon name="trash-outline" style="font-size:16px;"></ion-icon>
                                  Xóa toàn bộ CSDL
                              </button>
                              ` : ''}
                              <button onclick="window.location.href='/logout'" style="color:#475569;">
                                  <ion-icon name="log-out-outline" style="font-size:16px;"></ion-icon>
                                  Đăng xuất
                              </button>
                          </div>
                      </div>
                  </div>
              </div>

              <!-- Tầng 2: Thanh tìm kiếm & Bộ lọc -->
              <div class="controls" style="display:flex; gap:12px; align-items:center; flex-wrap:wrap; width:100%;">
                  <select id="statusFilter" style="flex:1; min-width:160px; max-width:220px;">
                      <option value="">-- Tất cả trạng thái --</option>
                      <option value="đã xong">✓ Đã xong</option>
                      <option value="đang xử lý">▶ Đang xử lý</option>
                      <option value="đang chờ">○ Đang chờ</option>
                  </select>
                  <select id="nameFilter" style="flex:1; min-width:180px; max-width:240px;">
                      <option value="">-- Tất cả người báo --</option>
                  </select>
                  <input type="text" id="searchInput" placeholder="Tìm kiếm tự do..." style="flex:2; min-width:220px;">
                  <button onclick="openCreateTicketModal()" class="btn-primary" style="white-space:nowrap; display:flex; align-items:center; gap:6px; font-size:13px; padding:9px 16px; border-radius:8px;">
                    <ion-icon name="add-circle-outline" style="font-size:16px;"></ion-icon> Tạo ticket
                  </button>
              </div>
          </div>

          <!-- Modal Tạo Ticket Thủ Công -->
          <div id="createTicketModal" style="display:none; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.5); z-index:10000; align-items:center; justify-content:center;">
            <div style="background:var(--card-bg); color:var(--text-main); border-radius:16px; padding:32px; width:100%; max-width:480px; box-shadow:0 20px 40px rgba(0,0,0,0.15); border:1px solid var(--border-color); margin:16px;">
              <h3 style="margin:0 0 6px; font-size:18px; font-weight:700; display:flex; align-items:center; gap:8px;">
                <ion-icon name="create-outline" style="font-size:22px; color:#2563eb;"></ion-icon> Tạo ticket thủ công
              </h3>
              <p style="margin:0 0 20px; font-size:13px; color:var(--text-muted);">Ghi lại sự cố từ Thầy/Cô liên hệ trực tiếp qua điện thoại hoặc gặp mặt.</p>
              <div style="display:flex; flex-direction:column; gap:14px;">
                <div>
                  <label style="font-size:13px; font-weight:600; display:block; margin-bottom:6px;">Tên người báo <span style="color:#ef4444;">*</span></label>
                  <input type="text" id="ct_senderName" placeholder="VD: Nguyễn Văn A" style="width:100%; padding:10px 14px; border:1px solid var(--border-color); border-radius:10px; font-size:14px; box-sizing:border-box; background:var(--bg-color); color:var(--text-main);" onkeydown="if(event.key==='Enter')document.getElementById('ct_location').focus()">
                </div>
                <div>
                  <label style="font-size:13px; font-weight:600; display:block; margin-bottom:6px;">Vị trí / Địa điểm</label>
                  <input type="text" id="ct_location" placeholder="VD: Lớp 10A1, Phòng máy tính" style="width:100%; padding:10px 14px; border:1px solid var(--border-color); border-radius:10px; font-size:14px; box-sizing:border-box; background:var(--bg-color); color:var(--text-main);" onkeydown="if(event.key==='Enter')document.getElementById('ct_content').focus()">
                </div>
                <div>
                  <label style="font-size:13px; font-weight:600; display:block; margin-bottom:6px;">Nội dung sự cố <span style="color:#ef4444;">*</span></label>
                  <textarea id="ct_content" rows="3" placeholder="Mô tả chi tiết sự cố..." style="width:100%; padding:10px 14px; border:1px solid var(--border-color); border-radius:10px; font-size:14px; box-sizing:border-box; background:var(--bg-color); color:var(--text-main); resize:vertical;"></textarea>
                </div>
                <div>
                  <label style="font-size:13px; font-weight:600; display:block; margin-bottom:6px;">Thông báo đến nhóm Zalo</label>
                  <select id="ct_group" style="width:100%; padding:10px 14px; border:1px solid var(--border-color); border-radius:10px; font-size:14px; box-sizing:border-box; background:var(--bg-color); color:var(--text-main);">
                    <option value="">-- Không thông báo nhóm --</option>
                  </select>
                </div>
              </div>
              <div style="display:flex; gap:10px; margin-top:24px; justify-content:flex-end;">
                <button onclick="closeCreateTicketModal()" style="padding:10px 20px; background:var(--btn-secondary-bg); color:var(--btn-secondary-text); border:1px solid var(--btn-secondary-border); border-radius:10px; font-weight:600; cursor:pointer; font-size:14px;">Hủy</button>
                <button onclick="submitCreateTicket()" id="ct_submitBtn" class="btn-primary" style="padding:10px 24px; border-radius:10px; font-size:14px; display:flex; align-items:center; gap:6px;">
                  <ion-icon name="checkmark-circle-outline" style="font-size:16px;"></ion-icon> Tạo ticket
                </button>
              </div>
            </div>
          </div>

          <div class="table-wrapper" id="pdf-content">
              <table id="reportTable">
                  <thead>
                      <tr>
                          <th>STT</th>
                          <th>Người Yêu Cầu</th>
                          <th>Nhóm</th>
                          <th>Thời gian</th>
                          <th>Mô tả sự cố</th>
                          <th>Trạng thái</th>
                          <th>Người xử lý</th>
                          <th>Phản hồi của IT</th>
                      </tr>
                  </thead>
                  <tbody>
                      ${formattedRequests}
                  </tbody>
              </table>
              <div id="emptyState" class="empty-state">Không tìm thấy kết quả nào phù hợp.</div>
          </div>
      </div>

      
  <script src="/js/dashboard.js"></script>
  </body>
  </html>`;
  return htmlContent;
}

module.exports = {
  renderTableRows,
  getDashboardHtml
};
