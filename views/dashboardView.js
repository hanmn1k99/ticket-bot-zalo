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
     const year = d.getFullYear();
     const time = d.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });
     
     let statusBadge = '';
     if (r.status === 'Đã xong') {
       statusBadge = '<span style="background:#dcfce7; color:#166534; padding:4px 10px; border-radius:9999px; font-weight:600; font-size:12px; white-space:nowrap;">🟢 Đã xong</span>';
     } else if (r.status === 'Từ chối') {
       statusBadge = `<span id="statusBadge_${r.id}" style="background:#ffedd5; color:#c2410c; padding:4px 10px; border-radius:9999px; font-weight:600; font-size:12px; white-space:nowrap;">🟠 Từ chối</span>`;
     } else if (r.status === 'Đang xử lý') {
       statusBadge = `<span id="statusBadge_${r.id}" style="background:#fef08a; color:#854d0e; padding:4px 10px; border-radius:9999px; font-weight:600; font-size:12px; white-space:nowrap;">🟡 Đang xử lý</span>`;
     } else {
       statusBadge = `<span id="statusBadge_${r.id}" style="background:#fee2e2; color:#991b1b; padding:4px 10px; border-radius:9999px; font-weight:600; font-size:12px; white-space:nowrap;">🔴 Đang chờ</span>`;
     }

     let timeHtml = `<div style="font-size:13px; white-space:nowrap;">🕒 ${time} <span style="color:var(--text-muted); font-size:12px;">${day}/${month}</span></div>`;
     if ((r.status === 'Đã xong' || r.status === 'Từ chối' || r.status === 'Đã thay đổi') && r.completed_at) {
       const cd = new Date(r.completed_at);
       const cday = String(cd.getDate()).padStart(2, '0');
       const cmonth = String(cd.getMonth() + 1).padStart(2, '0');
       const cyear = cd.getFullYear();
       const ctime = cd.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });
       timeHtml += `<div style="font-size:13px; margin-top:4px; white-space:nowrap; color:#16a34a;">🏁 ${ctime} <span style="color:var(--text-muted); font-size:12px;">${cday}/${cmonth}</span></div>`;
     }
       
     let adminReplyCell = '';
     const handlerName = r.assignee_name || '-';
     if (r.status === 'Đã xong' || r.status === 'Từ chối' || r.status === 'Đã thay đổi') {
         adminReplyCell = r.admin_reply ? r.admin_reply : '<i style="color:#94a3b8">Không có nội dung</i>';
     } else if (r.status === 'Đang xử lý') {
         adminReplyCell = `
           <div id="actionBox_${r.id}" style="display:flex; flex-direction:column; gap:8px;">
              <input type="text" id="replyInput_${r.id}" onkeypress="if(event.key === 'Enter') resolveTicket(${r.id})" placeholder="Chi tiết khắc phục..." style="width:100%; padding:8px 12px; border:1px solid #cbd5e1; border-radius:9999px; font-size:13px; outline:none; box-sizing:border-box;">
              <div style="display:flex; gap:6px; justify-content:flex-start;">
                  <button onclick="resolveTicket(${r.id})" style="padding:6px 16px; font-size:13px; background:#16a34a; color:white; border:none; border-radius:9999px; cursor:pointer; white-space:nowrap; transition: all 0.2s; box-shadow: 0 1px 2px rgba(0,0,0,0.05);">Gửi</button>
                  <button onclick="rejectTicket(${r.id}, event)" style="padding:6px 16px; font-size:13px; background:#3b82f6; color:white; border:none; border-radius:9999px; cursor:pointer; white-space:nowrap; transition: all 0.2s; box-shadow: 0 1px 2px rgba(0,0,0,0.05);">Hoãn</button>
              </div>
           </div>
         `;
     } else {
         adminReplyCell = `
           <div id="actionBox_${r.id}" style="display:flex; gap:6px;">
              <button onclick="acceptTicket(${r.id}, event)" style="flex:1; display:flex; justify-content:center; align-items:center; padding:6px 18px; font-size:13px; font-weight:600; background:#fef08a; color:#854d0e; border:none; border-radius:9999px; cursor:pointer; white-space:nowrap; transition: all 0.2s; box-shadow: 0 1px 2px rgba(0,0,0,0.05);">Nhận yêu cầu</button>
              <button onclick="rejectTicket(${r.id}, event)" style="flex:1; display:flex; justify-content:center; align-items:center; padding:6px 18px; font-size:13px; font-weight:600; background:#3b82f6; color:white; border:none; border-radius:9999px; cursor:pointer; white-space:nowrap; transition: all 0.2s; box-shadow: 0 1px 2px rgba(0,0,0,0.05);">Từ chối</button>
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
  let printTemplateHtml = '';
  try {
      printTemplateHtml = fs.readFileSync(path.join(__dirname, '..', 'print_template.html'), 'utf8');
  } catch(e) {}
  
  const htmlContent = `
  <!DOCTYPE html>
  <html lang="vi">
  <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Hệ Thống Quản Lý IT - minhhan.net</title>
      <script>

        function showAlert(msg, isSuccess = false) {
          const overlay = document.createElement('div');
          overlay.style.position = 'fixed';
          overlay.style.top = '0'; overlay.style.left = '0'; overlay.style.width = '100%'; overlay.style.height = '100%';
          overlay.style.background = 'rgba(0,0,0,0.5)';
          overlay.style.zIndex = '10000';
          overlay.style.display = 'flex';
          overlay.style.alignItems = 'center';
          overlay.style.justifyContent = 'center';
          
          const box = document.createElement('div');
          box.style.background = 'var(--card-bg, #fff)';
          box.style.color = 'var(--text-main, #000)';
          box.style.padding = '24px';
          box.style.borderRadius = '12px';
          box.style.minWidth = '320px';
          box.style.boxShadow = '0 10px 15px -3px rgba(0,0,0,0.1)';
          box.style.border = '1px solid var(--border-color, #e2e8f0)';
          
          const text = document.createElement('p');
          text.innerText = msg;
          text.style.marginBottom = '24px';
          text.style.fontWeight = '500';
          text.style.color = isSuccess ? '#10b981' : '#ef4444';
          text.style.lineHeight = '1.5';
          
          const btns = document.createElement('div');
          btns.style.display = 'flex';
          btns.style.justifyContent = 'flex-end';
          
          const btnOk = document.createElement('button');
          btnOk.innerText = 'Đóng';
          btnOk.style.padding = '8px 20px';
          btnOk.style.background = '#2563eb';
          btnOk.style.color = '#fff';
          btnOk.style.border = 'none';
          btnOk.style.borderRadius = '8px';
          btnOk.style.cursor = 'pointer';
          btnOk.style.fontWeight = '600';
          btnOk.onclick = () => overlay.remove();
          
          btns.appendChild(btnOk);
          box.appendChild(text);
          box.appendChild(btns);
          overlay.appendChild(box);
          document.body.appendChild(overlay);
        }

        if (localStorage.getItem('theme') === 'dark') {
            document.documentElement.setAttribute('data-theme', 'dark');
        }
      </script>
      <link rel="icon" type="image/png" href="/assets/favicon.png?v=${Date.now()}">
      <link rel="apple-touch-icon" href="/assets/favicon.png?v=${Date.now()}">
      <link rel="manifest" href="/manifest.json">
      <meta name="theme-color" content="#2563eb">
      <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
          :root {
              --primary: #2563eb;
              --primary-hover: #1d4ed8;
              --bg-color: #f8fafc;
              --card-bg: #ffffff;
              --text-main: #1e293b;
              --text-muted: #64748b;
              --border-color: #e2e8f0;
              --table-header-bg: #f1f5f9;
              --table-hover-bg: #f8fafc;
              --btn-secondary-bg: #f1f5f9;
              --btn-secondary-text: #475569;
              --btn-secondary-border: #cbd5e1;
          }
          [data-theme="dark"] {
              --bg-color: #0f172a;
              --card-bg: #1e293b;
              --text-main: #f8fafc;
              --text-muted: #94a3b8;
              --border-color: #334155;
              --table-header-bg: #334155;
              --table-hover-bg: #0f172a;
              --btn-secondary-bg: #1e293b;
              --btn-secondary-text: #cbd5e1;
              --btn-secondary-border: #475569;
          }
          body { 
              font-family: 'Inter', sans-serif; 
              padding: 30px; 
              background-color: var(--bg-color);
              color: var(--text-main);
              margin: 0;
          }
          .container {
              max-width: 1400px;
              margin: 0 auto;
          }
          .grid-container {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 20px;
          }
          .header {
              display: flex;
              justify-content: space-between;
              align-items: center;
              margin-bottom: 25px;
              flex-wrap: wrap;
              gap: 15px;
          }
          .header h2 { 
              margin: 0; 
              font-size: 24px;
              font-weight: 700;
              color: var(--text-main);
              display: flex;
              align-items: center;
              gap: 12px;
          }
          .header h2 a { display: flex; align-items: center; }
          .print-title { display: none; }
          
          /* Dropdown CSS */
          .dropdown {
              position: relative;
              display: inline-block;
          }
          .dropdown-content {
              display: none;
              position: absolute;
              right: 0;
              background-color: var(--card-bg);
              min-width: 180px;
              box-shadow: 0px 8px 16px 0px rgba(0,0,0,0.2);
              z-index: 1;
              border-radius: 6px;
              border: 1px solid var(--border-color);
          }
          .dropdown-content button {
              color: var(--text-main);
              padding: 10px 16px;
              display: flex;
              align-items: center;
              gap: 8px;
              width: 100%;
              border: none;
              background: none;
              text-align: left;
              cursor: pointer;
              font-size: 14px;
          }
          .dropdown-content button:hover {
              background-color: var(--table-hover-bg);
          }
          .dropdown:hover .dropdown-content {
              display: block;
          }

          .controls {
              display: flex;
              gap: 15px;
              align-items: center;
              flex-wrap: nowrap;
          }
          input[type="text"], select {
              padding: 10px 16px;
              border: 1px solid var(--border-color);
              border-radius: 8px;
              width: 100%;
              max-width: 200px;
              font-size: 14px;
              outline: none;
              transition: border-color 0.2s;
              background-color: var(--card-bg);
              color: var(--text-main);
          }
          input[type="text"]:focus, select:focus {
              border-color: var(--primary);
              box-shadow: 0 0 0 3px rgba(37,99,235,0.1);
          }
          button {
              background-color: var(--primary);
              color: white;
              border: none;
              padding: 10px 20px;
              border-radius: 8px;
              font-weight: 600;
              font-size: 14px;
              cursor: pointer;
              transition: background-color 0.2s;
              display: flex;
              align-items: center;
              gap: 8px;
              white-space: nowrap;
          }
          button.btn-secondary {
              background-color: var(--btn-secondary-bg);
              color: var(--btn-secondary-text);
              border: 1px solid var(--btn-secondary-border);
          }
          button.btn-secondary:hover {
              background-color: var(--border-color);
          }
          .table-wrapper {
              background: var(--card-bg);
              border-radius: 12px;
              box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.05);
              overflow-x: auto;
              -webkit-overflow-scrolling: touch;
          }
          table { 
              width: 100%; 
              border-collapse: collapse; 
              min-width: 800px;
              table-layout: fixed;
          }
          th, td { 
              padding: 16px; 
              text-align: left; 
              border-bottom: 1px solid var(--border-color);
              overflow: hidden;
              text-overflow: ellipsis;
          }
          th { 
              background-color: var(--table-header-bg); 
              color: var(--text-muted);
              font-weight: 600;
              font-size: 13px;
              text-transform: uppercase;
              letter-spacing: 0.05em;
          }
          td {
              font-size: 14px;
          }
          tr:last-child td {
              border-bottom: none;
          }
          tr:hover td { 
              background-color: var(--table-hover-bg); 
          }
          .empty-state {
              text-align: center;
              padding: 40px;
              color: var(--text-muted);
              display: none;
          }
          /* Chỉ định vùng để in PDF */
          #pdf-content {
              padding: 20px;
              background: var(--card-bg);
          }
          
          /* Responsive (Giao diện Mobile) */
          @media screen and (max-width: 768px) {
              .grid-container { grid-template-columns: 1fr; }
              .header { gap: 12px; }
              .header h2 {
                  font-size: 18px;
                  text-align: left;
                  width: 100%;
              }
              .action-bar {
                  width: 100%;
                  justify-content: flex-start;
              }
              .controls {
                  width: 100%;
                  display: flex;
                  flex-direction: column;
                  gap: 8px;
              }
              input[type="text"], select {
                  max-width: 100% !important;
                  width: 100% !important;
                  box-sizing: border-box;
              }
              .controls button {
                  width: 100%;
                  padding: 10px;
              }
              #pdf-content {
                  padding: 5px;
                  background: transparent;
              }
              .table-wrapper {
                  box-shadow: none;
                  background: transparent;
                  overflow-x: hidden;
              }
              table { min-width: 100%; }
              table, thead, tbody, th, td, tr { 
                  display: block; 
              }
              thead tr { 
                  display: none; 
              }
              tr { 
                  background: var(--card-bg);
                  margin-bottom: 15px; 
                  border-radius: 12px; 
                  padding: 10px; 
                  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                  border: 1px solid var(--border-color);
              }
              td { 
                  border: none;
                  border-bottom: 1px solid #f1f5f9; 
                  position: relative;
                  padding: 12px 10px 12px 130px; 
                  text-align: right;
              }
              td:last-child { border-bottom: 0; }
              td::before { 
                  position: absolute;
                  top: 12px;
                  left: 10px;
                  width: 110px; 
                  white-space: nowrap;
                  font-weight: 600;
                  color: var(--text-muted);
                  text-transform: uppercase;
                  font-size: 11px;
                  text-align: left;
              }
              td:nth-of-type(1)::before { content: "STT"; }
              td:nth-of-type(2)::before { content: "Người Yêu Cầu"; }
              td:nth-of-type(3)::before { content: "Nhóm"; }
              td:nth-of-type(4)::before { content: "Thời gian"; }
              td:nth-of-type(5)::before { content: "Mô tả sự cố"; }
              td:nth-of-type(6)::before { content: "Trạng thái"; }
              td:nth-of-type(7)::before { content: "Phản hồi của IT"; }

              /* Input Box for Action */
              td div[id^="actionBox_"] { 
                  flex-direction: column; 
                  gap: 10px;
              }
              td div[id^="actionBox_"] input { 
                  width: 100%; 
                  max-width: 100%;
              }
              td div[id^="actionBox_"] button {
                  width: 100%; 
                  justify-content: center;
              }
          }

          /* Định dạng khi in (Print) */
          @media print {
              @page { size: landscape; margin: 10mm; }
              :root, [data-theme="dark"], body {
                  --bg-color: #ffffff !important;
                  --card-bg: #ffffff !important;
                  --text-main: #000000 !important;
                  --text-muted: #333333 !important;
                  --border-color: #dddddd !important;
                  --table-header-bg: #f1f5f9 !important;
                  --table-hover-bg: #ffffff !important;
                  --btn-secondary-bg: #e2e8f0 !important;
                  --btn-secondary-text: #000000 !important;
              }
              * {
                  -webkit-print-color-adjust: exact !important;
                  print-color-adjust: exact !important;
              }
              .screen-title { display: none !important; }
              .print-title { display: block !important; }
              body { background: white; padding: 0 !important; }
              .container { max-width: 100%; width: 100%; margin: 0; }
              .controls, .action-bar { display: none !important; }
              .table-wrapper { 
                  box-shadow: none; 
                  border: none;
                  overflow: visible !important;
              }
              table { width: 100%; min-width: auto; }
              th, td { padding: 8px; font-size: 11px; }
              
              /* Ẩn bớt các form nhập liệu khi in */
              td div[id^="actionBox_"] { display: none !important; }
          }
      </style>
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
                      <a href="https://minhhan.net" target="_blank" class="brand-logo-link" style="text-decoration:none; display:flex; align-items:center; background: var(--btn-secondary-bg); padding: 6px 12px; border-radius: 10px; border: 1px solid var(--border-color); flex-shrink: 0;">
                          <img src="/assets/logo.png" alt="Logo" style="height: 32px; width: auto; object-fit: contain;" onerror="this.parentNode.style.display='none'">
                      </a>
                      <div class="brand-divider" style="height: 36px; width: 1px; background: var(--border-color); opacity: 0.8; flex-shrink: 0;"></div>
                      <div style="display:flex; flex-direction:column; justify-content:center;">
                          <span class="screen-title" style="font-size: 20px; font-weight: 700; line-height: 1.2; color: var(--text-main);">Hệ Thống Quản Lý IT - minhhan.net</span>
                          <span class="screen-title" style="font-size: 13px; font-weight: 400; color: var(--text-muted); margin-top: 3px;">Giải pháp tiếp nhận & hỗ trợ xử lý sự cố kỹ thuật chuyên nghiệp</span>
                          <span class="print-title" style="display:none; font-size: 20px; font-weight: 700; line-height: 1.2;">Hệ Thống Quản Lý IT - minhhan.net</span>
                          <span class="print-title" style="display:none; font-size: 13px; font-weight: 400; color: var(--text-muted); margin-top: 3px;">Báo cáo tổng hợp sự cố - Tháng ${monthStr}</span>
                      </div>
                  </h2>
                  
                  <div class="action-bar" style="display:flex; align-items:center; gap:10px;">
                      <button class="btn-secondary" onclick="toggleDarkMode()" title="Đổi giao diện Tối/Sáng" style="padding: 9px 12px; border-radius: 8px;">
                          <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"></path></svg>
                      </button>
                      <button class="btn-secondary" onclick="window.location.reload()" title="Tải lại trang" style="padding: 9px 12px; border-radius: 8px;">
                          <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
                      </button>
                      <button onclick="window.print()" title="In báo cáo" style="padding: 9px 14px; border-radius: 8px;">
                          <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"></path></svg>
                      </button>
                      <div class="dropdown">
                          <button class="btn-secondary" style="color:var(--text-main); display:flex; align-items:center; gap:6px; padding: 9px 14px; border-radius: 8px;">
                              <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                              Tài khoản
                          </button>
                          <div class="dropdown-content">
                              ${(!user || user.role === 'SUPER_ADMIN') ? `
                              <button onclick="window.location.href='/settings'" style="color:#2563eb;">
                                  <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                                  Cài đặt & AI
                              </button>
                              <button onclick="cleanData()" style="color:#ef4444;">
                                  <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                                  Xóa toàn bộ CSDL
                              </button>
                              ` : ''}
                              <button onclick="window.location.href='/logout'" style="color:#475569;">
                                  <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
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
                      <option value="đã xong">🟢 Đã xong</option>
                      <option value="đang xử lý">🟡 Đang xử lý</option>
                      <option value="đang chờ">🔴 Đang chờ</option>
                  </select>
                  <select id="nameFilter" style="flex:1; min-width:180px; max-width:240px;">
                      <option value="">-- Tất cả người báo --</option>
                  </select>
                  <input type="text" id="searchInput" placeholder="Tìm kiếm tự do..." style="flex:2; min-width:220px;">
              </div>
          </div>

          <div class="table-wrapper" id="pdf-content">
              <table id="reportTable">
                  <colgroup>
                      <col style="width:4%">
                      <col style="width:12%">
                      <col style="width:12%">
                      <col style="width:14%">
                      <col style="width:20%">
                      <col style="width:11%">
                      <col style="width:11%">
                      <col style="width:16%">
                  </colgroup>
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

      <script>

        function showAlert(msg, isSuccess = false) {
          const overlay = document.createElement('div');
          overlay.style.position = 'fixed';
          overlay.style.top = '0'; overlay.style.left = '0'; overlay.style.width = '100%'; overlay.style.height = '100%';
          overlay.style.background = 'rgba(0,0,0,0.5)';
          overlay.style.zIndex = '10000';
          overlay.style.display = 'flex';
          overlay.style.alignItems = 'center';
          overlay.style.justifyContent = 'center';
          
          const box = document.createElement('div');
          box.style.background = 'var(--card-bg, #fff)';
          box.style.color = 'var(--text-main, #000)';
          box.style.padding = '24px';
          box.style.borderRadius = '12px';
          box.style.minWidth = '320px';
          box.style.boxShadow = '0 10px 15px -3px rgba(0,0,0,0.1)';
          box.style.border = '1px solid var(--border-color, #e2e8f0)';
          
          const text = document.createElement('p');
          text.innerText = msg;
          text.style.marginBottom = '24px';
          text.style.fontWeight = '500';
          text.style.color = isSuccess ? '#10b981' : '#ef4444';
          text.style.lineHeight = '1.5';
          
          const btns = document.createElement('div');
          btns.style.display = 'flex';
          btns.style.justifyContent = 'flex-end';
          
          const btnOk = document.createElement('button');
          btnOk.innerText = 'Đóng';
          btnOk.style.padding = '8px 20px';
          btnOk.style.background = '#2563eb';
          btnOk.style.color = '#fff';
          btnOk.style.border = 'none';
          btnOk.style.borderRadius = '8px';
          btnOk.style.cursor = 'pointer';
          btnOk.style.fontWeight = '600';
          btnOk.onclick = () => overlay.remove();
          
          btns.appendChild(btnOk);
          box.appendChild(text);
          box.appendChild(btns);
          overlay.appendChild(box);
          document.body.appendChild(overlay);
        }

          function updateDynamicTime() {
              const timeEl = document.getElementById('dynamic-print-time');
              if (timeEl) {
                  const now = new Date();
                  const timeStr = now.toLocaleTimeString('vi-VN', { hour12: false, timeZone: 'Asia/Ho_Chi_Minh' });
                  const dateStr = now.toLocaleDateString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh', day: '2-digit', month: '2-digit', year: 'numeric' });
                  timeEl.style.fontVariantNumeric = 'tabular-nums';
                  timeEl.style.whiteSpace = 'nowrap';
                  timeEl.textContent = \`\${timeStr}, \${dateStr}\`;
              }
          }
          setInterval(updateDynamicTime, 1000);
          updateDynamicTime();

          function toggleDarkMode() {
              const current = document.documentElement.getAttribute('data-theme');
              if (current === 'dark') {
                  document.documentElement.setAttribute('data-theme', 'light');
                  localStorage.setItem('theme', 'light');
              } else {
                  document.documentElement.setAttribute('data-theme', 'dark');
                  localStorage.setItem('theme', 'dark');
              }
          }
          // Khởi tạo các phần tử DOM
          const searchInput = document.getElementById('searchInput');
          const nameFilter = document.getElementById('nameFilter');
          const statusFilter = document.getElementById('statusFilter');
          const table = document.getElementById('reportTable');
          const emptyState = document.getElementById('emptyState');

          function getRows() {
              return table.getElementsByTagName('tbody')[0].getElementsByTagName('tr');
          }

          // Cập nhật danh sách người yêu cầu vào dropdown
          function updateNameDropdown() {
              const rows = getRows();
              const uniqueNames = new Set();
              for (let i = 0; i < rows.length; i++) {
                  const nameCell = rows[i].getElementsByTagName('td')[1];
                  if (nameCell) {
                      uniqueNames.add(nameCell.textContent.trim());
                  }
              }
              
              const currentValue = nameFilter.value;
              nameFilter.innerHTML = '<option value="">-- Tất cả người báo --</option>';
              uniqueNames.forEach(name => {
                  const option = document.createElement('option');
                  option.value = name.toLowerCase();
                  option.textContent = name;
                  if (option.value === currentValue) option.selected = true;
                  nameFilter.appendChild(option);
              });
          }

          // Hàm chạy Bộ lọc (kết hợp Tìm kiếm tự do + Chọn tên + Chọn trạng thái)
          function filterData() {
              const searchText = searchInput.value.toLowerCase();
              const selectedName = nameFilter.value;
              const selectedStatus = statusFilter.value;
              const rows = getRows();
              let visibleCount = 0;

              for (let i = 0; i < rows.length; i++) {
                  const text = rows[i].textContent || rows[i].innerText;
                  const nameCell = rows[i].getElementsByTagName('td')[1];
                  const statusCell = rows[i].getElementsByTagName('td')[5];
                  if (!nameCell || !statusCell) continue;

                  const nameCellText = nameCell.textContent.trim().toLowerCase();
                  const statusCellText = statusCell.textContent.trim().toLowerCase();
                  
                  const matchesSearch = text.toLowerCase().indexOf(searchText) > -1;
                  const matchesName = selectedName === "" || nameCellText === selectedName;
                  const matchesStatus = selectedStatus === "" || statusCellText.includes(selectedStatus);

                  if (matchesSearch && matchesName && matchesStatus) {
                      rows[i].style.display = '';
                      visibleCount++;
                  } else {
                      rows[i].style.display = 'none';
                  }
              }

              let activeHtml = '';
            
              // Populate Zalo dropdown for Web Users creation
              const zaloSelect = document.getElementById('newWebZaloId');
              if (zaloSelect) {
                  zaloSelect.innerHTML = '<option value="">-- Chọn tài khoản Zalo --</option>';
                  data.active.forEach(a => {
                      zaloSelect.innerHTML += \`<option value="\${a.id}">\${a.name} (\${maskId(a.id)})</option>\`;
                  });
                  activeZaloAdminsForDropdown = data.active;
              }

              if (visibleCount === 0) {
                  table.style.display = 'none';
                  emptyState.style.display = 'block';
              } else {
                  table.style.display = 'table';
                  emptyState.style.display = 'none';
              }
          }

          searchInput.addEventListener('keyup', filterData);
          nameFilter.addEventListener('change', filterData);
          statusFilter.addEventListener('change', filterData);

          // Khởi tạo lần đầu
          updateNameDropdown();

          // Bộ đếm thời gian không hoạt động (Tự động đăng xuất sau 30 phút)
          let idleMinutes = 0;
          
          // Tăng biến đếm mỗi phút
          const idleInterval = setInterval(() => {
              idleMinutes++;
              if (idleMinutes >= 30) {
                  window.location.href = '/logout';
              }
          }, 60000); // 1 phút

          // Hàm reset bộ đếm khi có thao tác người dùng
          function resetIdleTimer() {
              idleMinutes = 0;
          }

          // Lắng nghe các sự kiện tương tác của người dùng
          ['mousemove', 'mousedown', 'keypress', 'touchmove', 'scroll'].forEach(evt => 
              document.addEventListener(evt, resetIdleTimer, true)
          );


          // Cơ chế đồng bộ thời gian thực (Real-time Polling)
          let lastRenderedHtml = '';
          async function fetchAndRenderRows() {
              try {
                  // Ngừng cập nhật nếu người dùng đang focus vào ô input HOẶC ô input đã có chữ (chưa gửi)
                  const hasActiveInput = Array.from(document.querySelectorAll('input[type="text"]')).some(input => {
                      return (input.id.startsWith('replyInput_') || input.id.startsWith('rejectInput_')) && (document.activeElement === input || input.value.trim() !== '');
                  });
                  if (hasActiveInput) {
                      return;
                  }
                  
                  const res = await fetch('/api/tickets/rows');
                  if (res.ok) {
                      const data = await res.json();
                      if (data.success && data.html !== lastRenderedHtml) {
                          lastRenderedHtml = data.html;
                          
                          // Lưu lại scroll position của wrapper để tránh nhảy
                          const wrapper = document.querySelector('.table-wrapper');
                          const scrollTop = wrapper ? wrapper.scrollTop : 0;
                          const scrollLeft = wrapper ? wrapper.scrollLeft : 0;

                          const tbody = table.getElementsByTagName('tbody')[0];
                          tbody.innerHTML = data.html;
                          updateNameDropdown();
                          filterData();

                          // Restore lại scroll position
                          if (wrapper) {
                              wrapper.scrollTop = scrollTop;
                              wrapper.scrollLeft = scrollLeft;
                          }
                      }
                  }
              } catch (e) {}
          }
          setInterval(fetchAndRenderRows, 2000);

          // Hàm Nhận yêu cầu
          async function acceptTicket(ticketId, event) {
              const btn = event.currentTarget;
              const originalBtnText = btn.textContent;
              btn.textContent = 'Đang nhận...';
              btn.disabled = true;

              try {
                  const response = await fetch('/api/tickets/inprogress', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ id: ticketId })
                  });
                  const data = await response.json();
                  if (response.ok && data.success) {
                      fetchAndRenderRows();
                  } else {
                      showAlert('Lỗi: ' + (data.error || 'Không thể nhận yêu cầu.'));
                      btn.textContent = originalBtnText;
                      btn.disabled = false;
                  }
              } catch (err) {
                  showAlert('Lỗi kết nối tới máy chủ.');
                  btn.textContent = originalBtnText;
                  btn.disabled = false;
              }
          }

          function cancelReject(ticketId) {
              // Force re-render bằng cách reset cache, rồi fetch lại
              lastRenderedHtml = '';
              fetchAndRenderRows();
          }

          function rejectTicket(ticketId, event) {
              const actionBox = document.getElementById('actionBox_' + ticketId);
              if (actionBox) {
                  const isRejecting = event && event.currentTarget && event.currentTarget.textContent.includes('Đổi trạng thái');
                  const placeholder = isRejecting ? "Lý do thay đổi..." : "Lý do thay đổi trạng thái...";
                  const btnColor = isRejecting ? "#ef4444" : "#3b82f6";

                  actionBox.innerHTML = \`
                    <div style="display:flex; flex-direction:column; gap:8px;">
                        <input type="text" id="rejectInput_\${ticketId}" onkeypress="if(event.key === 'Enter') submitReject(\${ticketId})" placeholder="\${placeholder}" style="width:100%; padding:8px 12px; border:1px solid #cbd5e1; border-radius:9999px; font-size:13px; outline:none; box-sizing:border-box;">
                        <div style="display:flex; gap:6px; justify-content:flex-start;">
                            <button onclick="submitReject(\${ticketId})" style="padding:6px 16px; font-size:13px; background:\${btnColor}; color:white; border:none; border-radius:9999px; cursor:pointer; white-space:nowrap; transition: all 0.2s; box-shadow: 0 1px 2px rgba(0,0,0,0.05);">Xác nhận</button>
                            <button onclick="cancelReject(\${ticketId})" style="padding:6px 16px; font-size:13px; background:#f1f5f9; color:#475569; border:none; border-radius:9999px; cursor:pointer; white-space:nowrap; transition: all 0.2s;">Hủy</button>
                        </div>
                    </div>
                  \`;
                  setTimeout(() => {
                      const input = document.getElementById('rejectInput_' + ticketId);
                      if (input) input.focus();
                  }, 50);
              }
          }

          async function submitReject(ticketId) {
              const input = document.getElementById('rejectInput_' + ticketId);
              const reason = input ? input.value.trim() : '';
              if (!reason) {
                  showAlert('Vui lòng nhập lý do thay đổi trạng thái!');
                  if (input) input.focus();
                  return;
              }

              const btn = input.nextElementSibling;
              const originalBtnText = btn.textContent;
              btn.textContent = 'Đang xử...';
              btn.disabled = true;
              input.disabled = true;

              try {
                  const response = await fetch('/api/tickets/reject', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ id: ticketId, replyText: reason })
                  });
                  const data = await response.json();
                  if (response.ok && data.success) {
                      if (input) input.value = '';
                      fetchAndRenderRows();
                  } else {
                      showAlert('Lỗi: ' + (data.error || 'Không thể từ chối yêu cầu.'));
                      btn.textContent = originalBtnText;
                      btn.disabled = false;
                      input.disabled = false;
                  }
              } catch (err) {
                  showAlert('Lỗi kết nối tới máy chủ.');
                  btn.textContent = originalBtnText;
                  btn.disabled = false;
                  input.disabled = false;
              }
          }


          // Hàm Xử lý Đóng Ticket Trực Tiếp Từ Web
          async function resolveTicket(ticketId) {
              const input = document.getElementById('replyInput_' + ticketId);
              const replyText = input.value.trim();
              if (!replyText) {
                  showAlert('Vui lòng nhập nội dung phản hồi trước khi Đóng sự cố!');
                  input.focus();
                  return;
              }

              const btn = input.nextElementSibling;
              const originalBtnText = btn.textContent;
              btn.textContent = 'Đang xử lý...';
              btn.disabled = true;
              input.disabled = true;

              try {
                  const response = await fetch('/api/tickets/resolve', {
                      method: 'POST',
                      headers: {
                          'Content-Type': 'application/json'
                      },
                      body: JSON.stringify({ id: ticketId, replyText: replyText })
                  });

                  const data = await response.json();
                  if (response.ok && data.success) {
                      if (input) input.value = '';
                      // Cập nhật giao diện mà không cần tải trang
                      document.getElementById('statusCell_' + ticketId).innerHTML = '<span style="background:#dcfce7; color:#166534; padding:4px 10px; border-radius:9999px; font-weight:600; font-size:12px; white-space:nowrap;">🟢 Đã xong</span>';
                      document.getElementById('replyCell_' + ticketId).innerHTML = replyText;
                  } else {
                      showAlert('Lỗi: ' + (data.error || 'Không thể đóng sự cố.'));
                      btn.textContent = originalBtnText;
                      btn.disabled = false;
                      input.disabled = false;
                  }
              } catch (err) {
                  showAlert('Lỗi kết nối tới máy chủ.');
                  btn.textContent = originalBtnText;
                  btn.disabled = false;
                  input.disabled = false;
              }
          }

          // Hàm Xóa Toàn Bộ Dữ Liệu
          async function cleanData() {
              if (!confirm('Cảnh báo nguy hiểm: Hành động này sẽ xóa TOÀN BỘ dữ liệu báo cáo hiện tại và reset lại bộ đếm ID sự cố về #1.\\n\\nBạn có chắc chắn muốn xóa sạch hệ thống không?')) return;
              
              const btn = event.currentTarget;
              const originalHTML = btn.innerHTML;
              btn.innerHTML = '...';
              btn.disabled = true;

              try {
                  const response = await fetch('/api/tickets/clean', { method: 'POST' });
                  if (response.ok) {
                      showAlert('✅ Đã dọn dẹp sạch sẽ toàn bộ dữ liệu!', true);
                      window.location.reload();
                  } else {
                      showAlert('❌ Lỗi: Không thể xóa dữ liệu (Thiếu quyền).');
                      btn.innerHTML = originalHTML;
                      btn.disabled = false;
                  }
              } catch (err) {
                  showAlert('❌ Lỗi kết nối máy chủ.');
                  btn.innerHTML = originalHTML;
                  btn.disabled = false;
              }
          }

          // Register Service Worker for PWA
          if ('serviceWorker' in navigator) {
              window.addEventListener('load', () => {
                  navigator.serviceWorker.register('/sw.js');
              });
          }
      </script>
  </body>
  </html>`;
  return htmlContent;
}

module.exports = {
  renderTableRows,
  getDashboardHtml
};
