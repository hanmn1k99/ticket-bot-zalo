const fs = require('fs');
const path = require('path');
const db = require('../database');

async function renderTableRows() {
  const requests = await db.getAllRequests();
  const groupNames = await db.getAllGroupNames();
  
  return requests.map(r => {
     const currentChatName = groupNames[r.chat_id] || r.chat_name || 'CÃ¡ nhÃ¢n';
     const d = new Date(r.timestamp);
     const day = String(d.getDate()).padStart(2, '0');
     const month = String(d.getMonth() + 1).padStart(2, '0');
     const time = d.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });
     
     let statusBadge = '';
     if (r.status === 'ÄÃ£ xong') {
       statusBadge = '<span style="background:#dcfce7; color:#166534; padding:4px 10px; border-radius:9999px; font-weight:600; font-size:12px; white-space:nowrap; display:inline-flex; align-items:center; gap:4px;"><ion-icon name="checkmark-circle" style="font-size:14px; color:#166534;"></ion-icon> ÄÃ£ xong</span>';
     } else if (r.status === 'Tá»« chá»‘i') {
       statusBadge = `<span id="statusBadge_${r.id}" style="background:#ffedd5; color:#c2410c; padding:4px 10px; border-radius:9999px; font-weight:600; font-size:12px; white-space:nowrap; display:inline-flex; align-items:center; gap:4px;"><ion-icon name="close-circle" style="font-size:14px; color:#c2410c;"></ion-icon> Tá»« chá»‘i</span>`;
     } else if (r.status === 'Äang xá»­ lÃ½') {
       statusBadge = `<span id="statusBadge_${r.id}" style="background:#fef08a; color:#854d0e; padding:4px 10px; border-radius:9999px; font-weight:600; font-size:12px; white-space:nowrap; display:inline-flex; align-items:center; gap:4px;"><ion-icon name="construct" style="font-size:14px; color:#854d0e;"></ion-icon> Äang xá»­ lÃ½</span>`;
     } else {
       statusBadge = `<span id="statusBadge_${r.id}" style="background:#fee2e2; color:#991b1b; padding:4px 10px; border-radius:9999px; font-weight:600; font-size:12px; white-space:nowrap; display:inline-flex; align-items:center; gap:4px;"><ion-icon name="time" style="font-size:14px; color:#991b1b;"></ion-icon> Äang chá»</span>`;
     }

     let timeHtml = `<div style="font-size:13px; white-space:nowrap; display:flex; align-items:center; gap:4px;"><ion-icon name="time-outline" style="font-size:14px; color:var(--text-muted);"></ion-icon> ${time} <span style="color:var(--text-muted); font-size:12px;">${day}/${month}</span></div>`;
     if ((r.status === 'ÄÃ£ xong' || r.status === 'Tá»« chá»‘i' || r.status === 'ÄÃ£ thay Ä‘á»•i') && r.completed_at) {
       const cd = new Date(r.completed_at);
       const cday = String(cd.getDate()).padStart(2, '0');
       const cmonth = String(cd.getMonth() + 1).padStart(2, '0');
       const ctime = cd.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });
       timeHtml += `<div style="font-size:13px; margin-top:4px; white-space:nowrap; color:#16a34a; display:flex; align-items:center; gap:4px;"><ion-icon name="flag" style="font-size:14px;"></ion-icon> ${ctime} <span style="color:var(--text-muted); font-size:12px;">${cday}/${cmonth}</span></div>`;
     }
       
     let adminReplyCell = '';
     const handlerName = r.assignee_name || '-';
       if (r.status === 'ÄÃ£ xong' || r.status === 'Tá»« chá»‘i' || r.status === 'ÄÃ£ thay Ä‘á»•i') {
         const replyText = r.admin_reply ? r.admin_reply : '<i style="color:#94a3b8">KhÃ´ng cÃ³ ná»™i dung</i>';
         adminReplyCell = `
           <div style="display:flex; justify-content:space-between; align-items:center; gap:8px;">
               <span>${replyText}</span>
               <button onclick="deleteTicket(${r.id})" title="XÃ³a sá»± cá»‘ nÃ y" style="background:none; border:none; color:#ef4444; cursor:pointer; padding:4px; border-radius:4px; display:flex; align-items:center; justify-content:center; transition: background 0.2s;" onmouseover="this.style.background='#fee2e2'" onmouseout="this.style.background='none'">
                   <ion-icon name="trash" style="font-size:16px;"></ion-icon>
               </button>
           </div>
         `;
       } else if (r.status === 'Äang xá»­ lÃ½') {
         adminReplyCell = `
           <div id="actionBox_${r.id}" style="display:flex; flex-direction:column; gap:8px;">
              <input type="text" id="replyInput_${r.id}" onkeypress="if(event.key === 'Enter') resolveTicket(${r.id})" placeholder="Chi tiáº¿t kháº¯c phá»¥c..." style="width:100%; padding:8px 12px; border:1px solid #cbd5e1; border-radius:9999px; font-size:13px; outline:none; box-sizing:border-box;">
              <div style="display:flex; gap:6px; justify-content:flex-start;">
                  <button onclick="resolveTicket(${r.id})" style="padding:6px 16px; font-size:13px; background:#16a34a; color:white; border:none; border-radius:9999px; cursor:pointer; white-space:nowrap; transition: all 0.2s; box-shadow: 0 1px 2px rgba(0,0,0,0.05); display:flex; align-items:center; gap:4px;"><ion-icon name="send"></ion-icon> Gá»­i</button>
                  <button onclick="rejectTicket(${r.id}, event)" style="padding:6px 16px; font-size:13px; background:#3b82f6; color:white; border:none; border-radius:9999px; cursor:pointer; white-space:nowrap; transition: all 0.2s; box-shadow: 0 1px 2px rgba(0,0,0,0.05); display:flex; align-items:center; gap:4px;"><ion-icon name="swap-horizontal"></ion-icon> Chuyá»ƒn</button>
              </div>
           </div>
         `;
     } else {
         adminReplyCell = `
           <div id="actionBox_${r.id}" style="display:flex; gap:6px;">
              <button onclick="acceptTicket(${r.id}, event)" style="flex:1; display:flex; justify-content:center; align-items:center; gap:4px; padding:6px 12px; font-size:13px; font-weight:600; background:#fef08a; color:#854d0e; border:none; border-radius:9999px; cursor:pointer; white-space:nowrap; transition: all 0.2s; box-shadow: 0 1px 2px rgba(0,0,0,0.05);"><ion-icon name="hand-left"></ion-icon> Nháº­n</button>
              <button onclick="rejectTicket(${r.id}, event)" style="flex:1; display:flex; justify-content:center; align-items:center; gap:4px; padding:6px 12px; font-size:13px; font-weight:600; background:#3b82f6; color:white; border:none; border-radius:9999px; cursor:pointer; white-space:nowrap; transition: all 0.2s; box-shadow: 0 1px 2px rgba(0,0,0,0.05);"><ion-icon name="close-circle-outline"></ion-icon> Tá»« chá»‘i</button>
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
  } catch(e) { /* ignore */ }
  
  const htmlContent = `
  <!DOCTYPE html>
  <html lang="vi">
  <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Há»‡ Thá»‘ng Quáº£n LÃ½ IT - minhhan.net</title>
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
          btnOk.innerText = 'ÄÃ³ng';
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

        function showConfirm(msg, onConfirm) {
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
            text.style.color = 'var(--text-main, #000)';
            text.style.lineHeight = '1.5';
            
            const btns = document.createElement('div');
            btns.style.display = 'flex';
            btns.style.justifyContent = 'flex-end';
            btns.style.gap = '8px';
            
            const btnCancel = document.createElement('button');
            btnCancel.innerText = 'Há»§y';
            btnCancel.style.padding = '8px 20px';
            btnCancel.style.background = 'var(--btn-secondary-bg, #e2e8f0)';
            btnCancel.style.color = 'var(--btn-secondary-text, #000)';
            btnCancel.style.border = '1px solid var(--btn-secondary-border, #cbd5e1)';
            btnCancel.style.borderRadius = '8px';
            btnCancel.style.cursor = 'pointer';
            btnCancel.style.fontWeight = '600';
            btnCancel.onclick = () => overlay.remove();

            const btnOk = document.createElement('button');
            btnOk.innerText = 'XÃ³a';
            btnOk.style.padding = '8px 20px';
            btnOk.style.background = '#ef4444';
            btnOk.style.color = '#fff';
            btnOk.style.border = 'none';
            btnOk.style.borderRadius = '8px';
            btnOk.style.cursor = 'pointer';
            btnOk.style.fontWeight = '600';
            btnOk.onclick = () => {
                overlay.remove();
                if (onConfirm) onConfirm();
            };
            
            btns.appendChild(btnCancel);
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
      <script type="module" src="https://unpkg.com/ionicons@7.1.0/dist/ionicons/ionicons.esm.js"></script>
      <script nomodule src="https://unpkg.com/ionicons@7.1.0/dist/ionicons/ionicons.js"></script>
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
          #reportTable th:nth-child(1) { width: 6%; }
          #reportTable th:nth-child(2) { width: 12%; }
          #reportTable th:nth-child(3) { width: 12%; }
          #reportTable th:nth-child(4) { width: 14%; }
          #reportTable th:nth-child(5) { width: 18%; }
          #reportTable th:nth-child(6) { width: 11%; }
          #reportTable th:nth-child(7) { width: 11%; }
          #reportTable th:nth-child(8) { width: 16%; }
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
          /* Chá»‰ Ä‘á»‹nh vÃ¹ng Ä‘á»ƒ in PDF */
          #pdf-content {
              padding: 20px;
              background: var(--card-bg);
          }
          
          /* Responsive (Giao diá»‡n Mobile) */
          @media screen and (max-width: 768px) {
              .grid-container { grid-template-columns: 1fr; }
              .header { gap: 12px; }
              .header h2 {
                  font-size: 18px;
                  text-align: center;
                  width: 100%;
                  flex-wrap: wrap;
                  justify-content: center;
              }
              .brand-divider {
                  display: none !important;
              }
              .header h2 div {
                  align-items: center;
                  text-align: center;
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
              table { 
                  min-width: 0 !important; 
                  width: 100% !important; 
                  table-layout: auto !important;
              }
              table, tbody, th, td, tr { 
                  display: flex !important; 
                  flex-direction: column;
                  width: 100% !important;
                  box-sizing: border-box !important;
              }
              colgroup, col, thead, thead tr { 
                  display: none !important; 
              }
              tr { 
                  background: var(--card-bg);
                  margin-bottom: 15px; 
                  border-radius: 12px; 
                  padding: 10px; 
                  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                  border: 1px solid var(--border-color);
                  width: 100% !important;
                  max-width: 100% !important;
              }
              td { 
                  border: none !important;
                  border-bottom: 1px solid #f1f5f9 !important; 
                  position: relative !important;
                  padding: 12px 10px 12px 130px !important; 
                  text-align: right !important;
                  box-sizing: border-box !important;
                  max-width: none !important;
                  min-width: 0 !important;
                  white-space: normal !important;
                  word-break: break-word !important;
                  flex-direction: column !important;
                  align-items: flex-end;
                  justify-content: center;
                  gap: 4px;
                  min-height: 45px;
              }
              td:last-child { border-bottom: 0; }
              td::before { 
                  position: absolute;
                  top: 50%;
                  transform: translateY(-50%);
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
              td:nth-of-type(2)::before { content: "NgÆ°á»i YÃªu Cáº§u"; }
              td:nth-of-type(3)::before { content: "NhÃ³m"; }
              td:nth-of-type(4)::before { content: "Thá»i gian"; }
              td:nth-of-type(5)::before { content: "MÃ´ táº£ sá»± cá»‘"; }
              td:nth-of-type(6)::before { content: "Tráº¡ng thÃ¡i"; }
              td:nth-of-type(7)::before { content: "NgÆ°á»i xá»­ lÃ½"; }
              td:nth-of-type(8)::before { content: "Pháº£n há»“i cá»§a IT"; }

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

          /* Äá»‹nh dáº¡ng khi in (Print) */
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
              
              /* áº¨n cÃ¡c nÃºt báº¥m vÃ  form nháº­p liá»‡u khi in */
              td button { display: none !important; }
              td div[id^="actionBox_"] input { display: none !important; }
          }
      </style>
  </head>
  <body>
      <div class="container">
          <div class="print-header">
              ${printTemplateHtml}
          </div>
          <div class="header" style="display:flex; flex-direction:column; gap:16px; margin-bottom:24px;">
              <!-- Táº§ng 1: ThÆ°Æ¡ng hiá»‡u (TrÃ¡i) & NÃºt Thao tÃ¡c + TÃ i khoáº£n (Pháº£i) -->
              <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:16px; width:100%;">
                  <h2 style="display:flex; align-items:center; gap:16px; margin:0;">
                      <a href="https://minhhan.net" target="_blank" class="brand-logo-link" style="text-decoration:none; display:flex; align-items:center; background: var(--btn-secondary-bg); padding: 6px 12px; border-radius: 10px; border: 1px solid var(--border-color); flex-shrink: 0;">
                          <img src="/assets/logo.png" alt="Logo" style="height: 32px; width: auto; object-fit: contain;" onerror="this.parentNode.style.display='none'">
                      </a>
                      <div class="brand-divider" style="height: 36px; width: 1px; background: var(--border-color); opacity: 0.8; flex-shrink: 0;"></div>
                      <div style="display:flex; flex-direction:column; justify-content:center;">
                          <span class="screen-title" style="font-size: 20px; font-weight: 700; line-height: 1.2; color: var(--text-main);">Há»‡ Thá»‘ng Quáº£n LÃ½ IT - minhhan.net</span>
                          <span class="screen-title" style="font-size: 13px; font-weight: 400; color: var(--text-muted); margin-top: 3px;">Giáº£i phÃ¡p tiáº¿p nháº­n & há»— trá»£ xá»­ lÃ½ sá»± cá»‘ ká»¹ thuáº­t chuyÃªn nghiá»‡p</span>
                          <span class="print-title" style="display:none; font-size: 20px; font-weight: 700; line-height: 1.2;">Há»‡ Thá»‘ng Quáº£n LÃ½ IT - minhhan.net</span>
                          <span class="print-title" style="display:none; font-size: 13px; font-weight: 400; color: var(--text-muted); margin-top: 3px;">BÃ¡o cÃ¡o tá»•ng há»£p sá»± cá»‘ - ThÃ¡ng ${monthStr}</span>
                      </div>
                  </h2>
                  
                  <div class="action-bar" style="display:flex; align-items:center; gap:10px;">
                      <button class="btn-secondary" onclick="toggleDarkMode()" title="Äá»•i giao diá»‡n Tá»‘i/SÃ¡ng" style="padding: 9px 12px; border-radius: 8px;">
                          <ion-icon name="moon-outline" style="font-size:18px;"></ion-icon>
                      </button>
                      <button class="btn-secondary" onclick="window.location.reload()" title="Táº£i láº¡i trang" style="padding: 9px 12px; border-radius: 8px;">
                          <ion-icon name="refresh-outline" style="font-size:18px;"></ion-icon>
                      </button>
                      <button onclick="window.print()" title="In bÃ¡o cÃ¡o" style="padding: 9px 14px; border-radius: 8px;">
                          <ion-icon name="print-outline" style="font-size:18px;"></ion-icon>
                      </button>
                      <div class="dropdown">
                          <button class="btn-secondary" style="color:var(--text-main); display:flex; align-items:center; gap:6px; padding: 9px 14px; border-radius: 8px;">
                              <ion-icon name="person-circle-outline" style="font-size:18px;"></ion-icon>
                              TÃ i khoáº£n
                          </button>
                          <div class="dropdown-content">
                              ${(!user || user.role === 'SUPER_ADMIN') ? `
                              <button onclick="window.location.href='/settings'" style="color:#2563eb;">
                                  <ion-icon name="settings-outline" style="font-size:16px;"></ion-icon>
                                  CÃ i Ä‘áº·t & AI
                              </button>
                              <button onclick="cleanData()" style="color:#ef4444;">
                                  <ion-icon name="trash-outline" style="font-size:16px;"></ion-icon>
                                  XÃ³a toÃ n bá»™ CSDL
                              </button>
                              ` : ''}
                              <button onclick="window.location.href='/logout'" style="color:#475569;">
                                  <ion-icon name="log-out-outline" style="font-size:16px;"></ion-icon>
                                  ÄÄƒng xuáº¥t
                              </button>
                          </div>
                      </div>
                  </div>
              </div>

              <!-- Táº§ng 2: Thanh tÃ¬m kiáº¿m & Bá»™ lá»c -->
              <div class="controls" style="display:flex; gap:12px; align-items:center; flex-wrap:wrap; width:100%;">
                  <select id="statusFilter" style="flex:1; min-width:160px; max-width:220px;">
                      <option value="">-- Táº¥t cáº£ tráº¡ng thÃ¡i --</option>
                      <option value="Ä‘Ã£ xong">âœ“ ÄÃ£ xong</option>
                      <option value="Ä‘ang xá»­ lÃ½">â–¶ Äang xá»­ lÃ½</option>
                      <option value="Ä‘ang chá»">â—‹ Äang chá»</option>
                  </select>
                  <select id="nameFilter" style="flex:1; min-width:180px; max-width:240px;">
                      <option value="">-- Táº¥t cáº£ ngÆ°á»i bÃ¡o --</option>
                  </select>
                  <input type="text" id="searchInput" placeholder="TÃ¬m kiáº¿m tá»± do..." style="flex:2; min-width:220px;">
              </div>
          </div>

          <div class="table-wrapper" id="pdf-content">
              <table id="reportTable">
                  <thead>
                      <tr>
                          <th>STT</th>
                          <th>NgÆ°á»i YÃªu Cáº§u</th>
                          <th>NhÃ³m</th>
                          <th>Thá»i gian</th>
                          <th>MÃ´ táº£ sá»± cá»‘</th>
                          <th>Tráº¡ng thÃ¡i</th>
                          <th>NgÆ°á»i xá»­ lÃ½</th>
                          <th>Pháº£n há»“i cá»§a IT</th>
                      </tr>
                  </thead>
                  <tbody>
                      ${formattedRequests}
                  </tbody>
              </table>
              <div id="emptyState" class="empty-state">KhÃ´ng tÃ¬m tháº¥y káº¿t quáº£ nÃ o phÃ¹ há»£p.</div>
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
          btnOk.innerText = 'ÄÃ³ng';
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
          // Khá»Ÿi táº¡o cÃ¡c pháº§n tá»­ DOM
          const searchInput = document.getElementById('searchInput');
          const nameFilter = document.getElementById('nameFilter');
          const statusFilter = document.getElementById('statusFilter');
          const table = document.getElementById('reportTable');
          const emptyState = document.getElementById('emptyState');

          function getRows() {
              return table.getElementsByTagName('tbody')[0].getElementsByTagName('tr');
          }

          // Cáº­p nháº­t danh sÃ¡ch ngÆ°á»i yÃªu cáº§u vÃ o dropdown
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
              nameFilter.innerHTML = '<option value="">-- Táº¥t cáº£ ngÆ°á»i bÃ¡o --</option>';
              uniqueNames.forEach(name => {
                  const option = document.createElement('option');
                  option.value = name.toLowerCase();
                  option.textContent = name;
                  if (option.value === currentValue) option.selected = true;
                  nameFilter.appendChild(option);
              });
          }

          // HÃ m cháº¡y Bá»™ lá»c (káº¿t há»£p TÃ¬m kiáº¿m tá»± do + Chá»n tÃªn + Chá»n tráº¡ng thÃ¡i)
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
                  zaloSelect.innerHTML = '<option value="">-- Chá»n tÃ i khoáº£n Zalo --</option>';
                  data.active.forEach(a => {
                      zaloSelect.innerHTML += \`<option value="\${a.id}">\${a.name} (\${maskId(a.id)})</option>\`;
                  });
                  activeZaloAdminsForDropdown = data.active;
              }

              if (visibleCount === 0) {
                  table.style.display = 'none';
                  emptyState.style.display = 'block';
              } else {
                  table.style.display = '';
                  emptyState.style.display = 'none';
              }
          }

          searchInput.addEventListener('keyup', filterData);
          nameFilter.addEventListener('change', filterData);
          statusFilter.addEventListener('change', filterData);

          // Khá»Ÿi táº¡o láº§n Ä‘áº§u
          updateNameDropdown();

          // Bá»™ Ä‘áº¿m thá»i gian khÃ´ng hoáº¡t Ä‘á»™ng (Tá»± Ä‘á»™ng Ä‘Äƒng xuáº¥t sau 30 phÃºt)
          let idleMinutes = 0;
          
          // TÄƒng biáº¿n Ä‘áº¿m má»—i phÃºt
          const idleInterval = setInterval(() => {
              idleMinutes++;
              if (idleMinutes >= 30) {
                  window.location.href = '/logout';
              }
          }, 60000); // 1 phÃºt

          // HÃ m reset bá»™ Ä‘áº¿m khi cÃ³ thao tÃ¡c ngÆ°á»i dÃ¹ng
          function resetIdleTimer() {
              idleMinutes = 0;
          }

          // Láº¯ng nghe cÃ¡c sá»± kiá»‡n tÆ°Æ¡ng tÃ¡c cá»§a ngÆ°á»i dÃ¹ng
          ['mousemove', 'mousedown', 'keypress', 'touchmove', 'scroll'].forEach(evt => 
              document.addEventListener(evt, resetIdleTimer, true)
          );


          // CÆ¡ cháº¿ Ä‘á»“ng bá»™ thá»i gian thá»±c (Real-time Polling)
          let lastRenderedHtml = '';
          async function fetchAndRenderRows() {
              try {
                  // Ngá»«ng cáº­p nháº­t náº¿u ngÆ°á»i dÃ¹ng Ä‘ang focus vÃ o Ã´ input HOáº¶C Ã´ input Ä‘Ã£ cÃ³ chá»¯ (chÆ°a gá»­i)
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
                          
                          // LÆ°u láº¡i scroll position cá»§a wrapper Ä‘á»ƒ trÃ¡nh nháº£y
                          const wrapper = document.querySelector('.table-wrapper');
                          const scrollTop = wrapper ? wrapper.scrollTop : 0;
                          const scrollLeft = wrapper ? wrapper.scrollLeft : 0;

                          const tbody = table.getElementsByTagName('tbody')[0];
                          tbody.innerHTML = data.html;
                          updateNameDropdown();
                          filterData();

                          // Restore láº¡i scroll position
                          if (wrapper) {
                              wrapper.scrollTop = scrollTop;
                              wrapper.scrollLeft = scrollLeft;
                          }
                      }
                  }
              } catch (e) {}
          }
          setInterval(fetchAndRenderRows, 2000);

          // HÃ m XÃ³a Sá»± cá»‘ (Thá»§ cÃ´ng)
          function deleteTicket(ticketId) {
              showConfirm('Báº¡n cÃ³ cháº¯c cháº¯n muá»‘n xÃ³a sá»± cá»‘ #' + ticketId + ' khÃ´ng? HÃ nh Ä‘á»™ng nÃ y khÃ´ng thá»ƒ hoÃ n tÃ¡c!', async () => {
                  try {
                      const response = await fetch('/api/tickets/' + ticketId, {
                          method: 'DELETE'
                      });
                      const data = await response.json();
                      if (response.ok && data.success) {
                          fetchAndRenderRows();
                      } else {
                          showAlert(data.error || 'Lá»—i há»‡ thá»‘ng');
                      }
                  } catch (error) {
                      showAlert('Lá»—i káº¿t ná»‘i');
                  }
              });
          }

          // HÃ m Nháº­n yÃªu cáº§u
          async function acceptTicket(ticketId, event) {
              const btn = event.currentTarget;
              const originalBtnText = btn.textContent;
              btn.textContent = 'Äang nháº­n...';
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
                      showAlert('Lá»—i: ' + (data.error || 'KhÃ´ng thá»ƒ nháº­n yÃªu cáº§u.'));
                      btn.textContent = originalBtnText;
                      btn.disabled = false;
                  }
              } catch (err) {
                  showAlert('Lá»—i káº¿t ná»‘i tá»›i mÃ¡y chá»§.');
                  btn.textContent = originalBtnText;
                  btn.disabled = false;
              }
          }

          function cancelReject(ticketId) {
              // Force re-render báº±ng cÃ¡ch reset cache, rá»“i fetch láº¡i
              lastRenderedHtml = '';
              fetchAndRenderRows();
          }

          function rejectTicket(ticketId, event) {
              const actionBox = document.getElementById('actionBox_' + ticketId);
              if (actionBox) {
                  const isRejecting = event && event.currentTarget && event.currentTarget.textContent.trim() === 'Chuyá»ƒn';
                  const placeholder = isRejecting ? "LÃ½ do chuyá»ƒn tráº¡ng thÃ¡i..." : "LÃ½ do thay Ä‘á»•i tráº¡ng thÃ¡i...";
                  const btnColor = isRejecting ? "#ef4444" : "#3b82f6";

                  actionBox.innerHTML = \`
                    <div style="display:flex; flex-direction:column; gap:8px;">
                        <input type="text" id="rejectInput_\${ticketId}" onkeypress="if(event.key === 'Enter') submitReject(\${ticketId})" placeholder="\${placeholder}" style="width:100%; padding:8px 12px; border:1px solid #cbd5e1; border-radius:9999px; font-size:13px; outline:none; box-sizing:border-box;">
                        <div style="display:flex; gap:6px; justify-content:flex-start;">
                            <button onclick="submitReject(\${ticketId})" style="padding:6px 16px; font-size:13px; background:\${btnColor}; color:white; border:none; border-radius:9999px; cursor:pointer; white-space:nowrap; transition: all 0.2s; box-shadow: 0 1px 2px rgba(0,0,0,0.05);">XÃ¡c nháº­n</button>
                            <button onclick="cancelReject(\${ticketId})" style="padding:6px 16px; font-size:13px; background:#f1f5f9; color:#475569; border:none; border-radius:9999px; cursor:pointer; white-space:nowrap; transition: all 0.2s;">Há»§y</button>
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
                  showAlert('Vui lÃ²ng nháº­p lÃ½ do thay Ä‘á»•i tráº¡ng thÃ¡i!');
                  if (input) input.focus();
                  return;
              }

              const btn = input.nextElementSibling;
              const originalBtnText = btn.textContent;
              btn.textContent = 'Äang xá»­...';
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
                      showAlert('Lá»—i: ' + (data.error || 'KhÃ´ng thá»ƒ tá»« chá»‘i yÃªu cáº§u.'));
                      btn.textContent = originalBtnText;
                      btn.disabled = false;
                      input.disabled = false;
                  }
              } catch (err) {
                  showAlert('Lá»—i káº¿t ná»‘i tá»›i mÃ¡y chá»§.');
                  btn.textContent = originalBtnText;
                  btn.disabled = false;
                  input.disabled = false;
              }
          }


          // HÃ m Xá»­ lÃ½ ÄÃ³ng Ticket Trá»±c Tiáº¿p Tá»« Web
          async function resolveTicket(ticketId) {
              const input = document.getElementById('replyInput_' + ticketId);
              const replyText = input.value.trim();
              if (!replyText) {
                  showAlert('Vui lÃ²ng nháº­p ná»™i dung pháº£n há»“i trÆ°á»›c khi ÄÃ³ng sá»± cá»‘!');
                  input.focus();
                  return;
              }

              const btn = input.nextElementSibling;
              const originalBtnText = btn.textContent;
              btn.textContent = 'Äang xá»­ lÃ½...';
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
                      // Cáº­p nháº­t giao diá»‡n mÃ  khÃ´ng cáº§n táº£i trang
                      document.getElementById('statusCell_' + ticketId).innerHTML = '<span style="background:#dcfce7; color:#166534; padding:4px 10px; border-radius:9999px; font-weight:600; font-size:12px; white-space:nowrap;">ðŸŸ¢ ÄÃ£ xong</span>';
                      document.getElementById('replyCell_' + ticketId).innerHTML = replyText;
                  } else {
                      showAlert('Lá»—i: ' + (data.error || 'KhÃ´ng thá»ƒ Ä‘Ã³ng sá»± cá»‘.'));
                      btn.textContent = originalBtnText;
                      btn.disabled = false;
                      input.disabled = false;
                  }
              } catch (err) {
                  showAlert('Lá»—i káº¿t ná»‘i tá»›i mÃ¡y chá»§.');
                  btn.textContent = originalBtnText;
                  btn.disabled = false;
                  input.disabled = false;
              }
          }

          // HÃ m XÃ³a ToÃ n Bá»™ Dá»¯ Liá»‡u
          async function cleanData() {
              if (!confirm('Cáº£nh bÃ¡o nguy hiá»ƒm: HÃ nh Ä‘á»™ng nÃ y sáº½ xÃ³a TOÃ€N Bá»˜ dá»¯ liá»‡u bÃ¡o cÃ¡o hiá»‡n táº¡i vÃ  reset láº¡i bá»™ Ä‘áº¿m ID sá»± cá»‘ vá» #1.\\n\\nBáº¡n cÃ³ cháº¯c cháº¯n muá»‘n xÃ³a sáº¡ch há»‡ thá»‘ng khÃ´ng?')) return;
              
              const btn = event.currentTarget;
              const originalHTML = btn.innerHTML;
              btn.innerHTML = '...';
              btn.disabled = true;

              try {
                  const response = await fetch('/api/tickets/clean', { method: 'POST' });
                  if (response.ok) {
                      showAlert('âœ… ÄÃ£ dá»n dáº¹p sáº¡ch sáº½ toÃ n bá»™ dá»¯ liá»‡u!', true);
                      window.location.reload();
                  } else {
                      showAlert('âŒ Lá»—i: KhÃ´ng thá»ƒ xÃ³a dá»¯ liá»‡u (Thiáº¿u quyá»n).');
                      btn.innerHTML = originalHTML;
                      btn.disabled = false;
                  }
              } catch (err) {
                  showAlert('âŒ Lá»—i káº¿t ná»‘i mÃ¡y chá»§.');
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
