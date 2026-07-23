const db = require('../database');
const { getBotConfig } = require('../services/botConfigService');

async function getSettingsHtml(user) {
  if (!user || user.role !== 'SUPER_ADMIN') return null;

  const botConfig = await getBotConfig();
  const {
    BOT_ORG_NAME,
    BOT_USER_ROLE,
    BOT_ENVIRONMENT,
    BOT_PRONOUN_USER_MALE,
    BOT_PRONOUN_USER_FEMALE,
    BOT_PRONOUN_USER_DEFAULT,
    BOT_PRONOUN_ME
  } = botConfig;

  const defaultFaq = `1. Mật khẩu mạng wifi "Meyschool - Giáo Viên" là: Mey@2024\n2. Mạng wifi "Meyschool - Guest" là mạng mở, không có mật khẩu.\n3. Liên hệ khẩn cấp Phòng IT (Phòng D102): 0909.123.456 (Mr. Nghĩa) hoặc 0988.789.123 (Mr. Nam).\n4. Nếu máy in hết mực, máy tính không lên nguồn, vui lòng tạo TICKET báo lỗi.`;
  let faqContent = await db.getSetting('faq_content');
  if (!faqContent) faqContent = defaultFaq;

  const systemPromptPreview = `Bạn là Trợ lý IT Ảo (phần mềm AI) của ${BOT_ORG_NAME}. ${BOT_USER_ROLE} vừa gửi tin nhắn: "{Nội dung tin nhắn người dùng}"

Cơ sở dữ liệu FAQ (Đây là những thông tin bạn CÓ THỂ dùng để trả lời câu hỏi):
${faqContent}
(Lưu ý 1: Nếu FAQ ghi mạng wifi nào đó "không có mật khẩu", điều đó có nghĩa là mạng đó LÀ MẠNG MỞ, KHÔNG YÊU CẦU NHẬP PASS, chứ không phải là ${BOT_ORG_NAME} không có mạng wifi đó).
(Lưu ý 2: NẾU người dùng hỏi về Wifi, HÃY CHỦ ĐỘNG CUNG CẤP ĐẦY ĐỦ cả Tên mạng (SSID) và Mật khẩu (nếu có) để tiện cho người dùng, đừng chỉ trả lời mỗi tên mạng).

Quy tắc định vị bản thân (RẤT QUAN TRỌNG):
- Bạn LÀ MỘT TRỢ LÝ ẢO (AI), KHÔNG PHẢI CON NGƯỜI. Bạn không có cơ thể vật lý, không biết đi lại, không thể cầm nắm, ăn uống hay làm các việc ngoài đời thực (như đi mua thuốc, lấy đồ, chạy đi sửa máy).
- Mặc dù là Trợ lý IT, nhưng bạn ĐƯỢC PHÉP TRẢ LỜI MỌI CÂU HỎI kiến thức chung (toán học, lịch sử, văn học, đời sống...) như một cuốn bách khoa toàn thư để hỗ trợ ${BOT_USER_ROLE}. KHÔNG BAO GIỜ TỪ CHỐI các câu hỏi kiến thức với lý do "không liên quan đến IT".
- Nếu bị yêu cầu làm những việc vật lý phi lý, hãy TỪ CHỐI một cách khéo léo, lễ phép.
- Môi trường hoạt động của bạn là ${BOT_ENVIRONMENT}. Ngôn từ phải CHUẨN MỰC, TÔN TRỌNG, NGHIÊM TÚC nhưng thân thiện. Tuyệt đối không đùa cợt lố lăng.

Quy tắc xưng hô:
- Tên của người nhắn là: "{Tên người dùng}". BẮT BUỘC HÃY SUY ĐOÁN GIỚI TÍNH dựa vào tên này (dù là tiếng Việt hay tiếng nước ngoài).
- NẾU TRẢ LỜI TIẾNG VIỆT: Hãy gọi là "${BOT_PRONOUN_USER_MALE}" (nếu là nam) hoặc "${BOT_PRONOUN_USER_FEMALE}" (nếu là nữ). Hạn chế dùng "${BOT_PRONOUN_USER_DEFAULT}" trừ khi tên quá khó đoán. Bản thân bạn LUÔN LUÔN phải xưng là "${BOT_PRONOUN_ME}" (Tuyệt đối không xưng "Tôi", "Mình" hay "AI").
- NẾU TRẢ LỜI TIẾNG ANH: Hãy xưng là "I", và gọi người dùng là "Mr." (nếu là nam) hoặc "Ms." (nếu là nữ) kèm theo tên của họ. Không dùng "${BOT_PRONOUN_USER_DEFAULT}/${BOT_PRONOUN_ME}" trong tiếng Anh.

Quy tắc ngôn ngữ (QUAN TRỌNG NHẤT):
- BẮT BUỘC PHẢN HỒI BẰNG ĐÚNG NGÔN NGỮ MÀ NGƯỜI DÙNG SỬ DỤNG.
- NẾU NGƯỜI DÙNG NHẮN BẰNG TIẾNG ANH, BẠN PHẢI TRẢ LỜI 100% BẰNG TIẾNG ANH. KHÔNG ĐƯỢC PHÉP CHÈN BẤT KỲ TỪ TIẾNG VIỆT NÀO. Bỏ qua quy tắc xưng hô "${BOT_PRONOUN_USER_DEFAULT}/${BOT_PRONOUN_ME}".

Quy tắc phân loại (RẤT QUAN TRỌNG - KHÔNG ĐƯỢC BỎ LỠ TICKET CỦA ADMIN):
1. TICKET - Phân loại là TICKET NẾU VÀ CHỈ NẾU tin nhắn là YÊU CẦU XỬ LÝ SỰ CỐ KỸ THUẬT IT, TÀI KHOẢN EMAIL/M365 HOẶC CƠ SỞ VẬT CHẤT (máy tính, mạng wifi, máy in, camera, phần mềm, âm thanh, loa, mic, máy chiếu, tivi, điều hòa/máy lạnh, đèn, điện, nước, bàn ghế, cửa...).
- TẤT CẢ VẤN ĐỀ EMAIL / M365: Quên mật khẩu email, mất tài khoản, mất 2FA / xác minh 2 lớp, không gửi/nhận được email, lỗi Outlook/Microsoft 365... BẮT BUỘC LÀ TICKET (vì M365 do IT trực tiếp quản lý).
- Các dấu hiệu nhận biết: "coi dùm", "xem giúp", "sửa", "kiểm tra", "hư", "lag", "chậm", "không vào được", "mất mạng", "bị đơ", "không in được", "rè", "không lên", "cháy", "rò rỉ", "gãy", "chập", "quên mk", "mất 2fa"...
- ĐẶC BIỆT LƯU Ý VỀ WIFI: Nếu người dùng kêu "mất wifi", "không có wifi", "wifi hỏng", "không kết nối được wifi" -> CHẮC CHẮN LÀ TICKET (Báo lỗi). CHỈ phân loại là ANSWER khi người dùng thực sự hỏi "Mật khẩu wifi là gì?", "Cho xin pass wifi".
- LƯU Ý ĐẶC BIỆT: KHÔNG TẠO TICKET đối với các nhờ vả cá nhân, sai vặt không liên quan đến sửa chữa kỹ thuật. Những câu này phân loại là ANSWER để từ chối khéo léo.
- Khi quyết định là TICKET, HÃY TRÍCH XUẤT ĐỊA ĐIỂM (vị trí) sự cố nếu có trong câu hỏi. Trả về đúng định dạng: TICKET|[Địa điểm]. Nếu không xác định được địa điểm, trả về: TICKET|Không xác định.
Ví dụ: "phòng d102 lỗi máy chiếu" -> TICKET|Phòng D102
Tuyệt đối không thêm bất cứ từ nào khác, không hứa hẹn, không an ủi.

2. ANSWER - Áp dụng cho: 
- Tin nhắn xin thông tin rõ ràng (ví dụ: "cho xin mật khẩu wifi", "pass wifi là gì", "làm sao để mượn máy chiếu").
- Nhờ vả cá nhân phi lý, mua đồ, sai vặt (hãy từ chối khéo léo).
- Tin nhắn chào hỏi xã giao, hỏi thăm sức khỏe, trò chuyện kiến thức chung.
Lúc này BẮT BUỘC bắt đầu bằng chữ: ANSWER|
- Tuyệt đối không gọi đích danh bất kỳ cá nhân nào trong phòng IT, chỉ được phép dùng từ "Bộ phận IT".
- Với câu hỏi tra cứu FAQ (xin wifi, máy in...): Lọc ĐÚNG thông tin cần thiết và trả lời CỰC KỲ NGẮN GỌN (1-2 câu). Không liệt kê các thông tin thừa mà người dùng không hỏi. (Ví dụ: Hỏi wifi khách thì chỉ nói tên và pass wifi khách).
- Với câu hỏi xã giao/nhờ vả cá nhân: Trả lời RẤT NGẮN GỌN, lịch sự từ chối hoặc trả lời đúng trọng tâm.
- Với các câu cảm thán, khen ngợi, hoặc kết thúc (ví dụ: "ok rồi", "cảm ơn", "tốt"): Hãy phản hồi VUI VẺ, NHIỆT TÌNH, có cảm xúc (ví dụ: "Dạ vâng ạ, ${BOT_PRONOUN_USER_DEFAULT} cần hỗ trợ gì thêm cứ nhắn ${BOT_PRONOUN_ME} nhé! 😊").
- Với câu hỏi kiến thức, toán học: ĐƯA RA TRỰC TIẾP ĐÁP ÁN, TUYỆT ĐỐI KHÔNG GIẢI THÍCH LAN MAN.
Ví dụ: "ANSWER| Dạ wifi dành cho khách là abc, mạng mở không cần mật khẩu ạ."
Ví dụ: "ANSWER| Dạ căn bậc 2 của 178 là khoảng 13.34 ạ."
Ví dụ (Nếu hỏi tiếng Anh): "ANSWER| The guest wifi is abc, it is an open network without a password."

Lưu ý: Bạn là một AI thông minh, hãy trả lời tự nhiên, có cảm xúc.`;

  const groupNames = await db.getAllGroupNames();
  
      let groupRows = '';
      for (const [groupId, name] of Object.entries(groupNames)) {
         groupRows += `
           <div style="padding: 16px; border-bottom: 1px solid var(--border-color); display: flex; flex-direction: column; gap: 12px; background: var(--bg-color);">
             <div style="display: flex; justify-content: space-between; align-items: center;">
               <span style="font-family: monospace; font-size: 13px; color: #64748b; background: var(--card-bg); padding: 4px 8px; border-radius: 4px; border: 1px solid var(--border-color);" title="${groupId}">ID: ${String(groupId).substring(0,4)}****${String(groupId).slice(-3)}</span>
               <div style="display: flex; gap: 8px;">
                 <button onclick="updateGroup('${groupId}')" style="background:#3b82f6; color:white; border:none; padding:6px 12px; border-radius:6px; cursor:pointer; font-weight:500; font-size:12px; transition:0.2s;">Lưu</button>
                 <button onclick="deleteGroup('${groupId}')" style="background:#ef4444; color:white; border:none; padding:6px 12px; border-radius:6px; cursor:pointer; font-weight:500; font-size:12px; transition:0.2s;">Xóa</button>
               </div>
             </div>
             <input type="text" id="gname_${groupId}" value="${name}" placeholder="Tên nhóm (VD: Tổ Toán)" style="width:100%; padding:10px 12px; border:1px solid var(--border-color); border-radius:6px; background:var(--card-bg); color:var(--text-main); font-size:15px; box-sizing: border-box;">
           </div>
         `;
      }
  
  const html = `
    <!DOCTYPE html>
    <html lang="vi" data-theme="light">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Hệ thống quản lý IT - minhhan.net</title>
      <link rel="icon" type="image/png" href="/assets/favicon.png?v=${Date.now()}">
      <link rel="apple-touch-icon" href="/assets/favicon.png?v=${Date.now()}">
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
      <style>
          :root {
              --bg-color: #f8fafc;
              --card-bg: #ffffff;
              --text-main: #1e293b;
              --border-color: #e2e8f0;
          }
          [data-theme="dark"] {
              --bg-color: #0f172a;
              --card-bg: #1e293b;
              --text-main: #f8fafc;
              --border-color: #334155;
          }
          body {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
              background: var(--bg-color);
              color: var(--text-main);
              padding: 20px;
              max-width: 1400px;
              margin: 0 auto;
          }
          .card {
              background: var(--card-bg);
              border: 1px solid var(--border-color);
              border-radius: 8px;
              padding: 20px;
              margin-bottom: 20px;
          }
          textarea {
              width: 100%;
              height: 200px;
              padding: 10px;
              border: 1px solid var(--border-color);
              border-radius: 6px;
              background: var(--bg-color);
              color: var(--text-main);
              font-family: monospace;
          }
          button {
              padding: 10px 16px;
              border: none;
              border-radius: 6px;
              font-weight: 600;
              cursor: pointer;
          }
          .btn-primary { background: #2563eb; color: white; }
          .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
          .grid-container {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 24px;
          }
          .card {
              background: var(--card-bg);
              border: 1px solid var(--border-color);
              border-radius: 12px;
              padding: 24px;
              margin-bottom: 0;
              height: 100%;
              box-sizing: border-box;
              box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
              transition: transform 0.2s, box-shadow 0.2s;
          }
          .card:hover {
              box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
          }
          .card h3 {
              margin-top: 0;
              font-size: 18px;
              color: var(--text-main);
              border-bottom: 2px solid #f1f5f9;
              padding-bottom: 12px;
              margin-bottom: 16px;
          }
          [data-theme="dark"] .card h3 { border-bottom-color: #334155; }
      </style>
    </head>
    <body>
      <div class="header">
        <h2>Cài đặt Hệ thống</h2>
        <button class="btn-primary" onclick="window.location.href='/report'">Quay lại Dashboard</button>
      </div>
      
      <div class="grid-container">
        <div class="card">
          <h3>🔍 Xem Quy tắc Cốt lõi của AI</h3>
          <p style="font-size:14px; opacity:0.8; margin-top: 0px; margin-bottom: 16px;">Đây là toàn bộ quy tắc nền tảng mà AI đang sử dụng để suy luận, phân loại sự cố và xưng hô (Chế độ chỉ xem).</p>
          <div style="background-color: var(--bg-color); padding: 16px; border-radius: 8px; border: 1px solid var(--border-color); font-family: monospace; font-size: 13px; line-height: 1.6; white-space: pre-wrap; overflow-y: auto; height: 300px; color: var(--text-main);">
${systemPromptPreview}
          </div>
        </div>

      <div class="card">
        <h3>Huấn luyện AI (Nội dung FAQ)</h3>
        <p style="font-size:14px; opacity:0.8;">Nhập các dữ liệu bạn muốn AI học. Mỗi dòng một ý.<br><i>Ví dụ: 1. Pass wifi phòng họp là 123456... AI sẽ tự đọc hiểu văn bản này.</i></p>
        <textarea id="faqContent">${faqContent}</textarea>
        <br><br>
        <button class="btn-primary" onclick="saveFaq()">Lưu FAQ</button>
      </div>

      <div class="card">
        <h3>Quản lý Nhóm</h3>
        <p style="font-size:14px; opacity:0.8;">Danh sách các nhóm đã cài đặt để nhận thông báo Broadcast.</p>
        <div style="border: 1px solid var(--border-color); border-radius: 8px; overflow: hidden;">
          ${groupRows}
        </div>
      </div>

      <div class="card">
        <h3>Zalo Admin</h3>
        <p style="color:#666; font-size: 14px;"><i>Quyền duyệt tối cao thuộc về tài khoản Super Admin. Những người dùng Zalo được duyệt dưới đây sẽ có quyền sử dụng các lệnh Zalo và nhận thông báo khi có sự kiện.</i></p>
        
        <h4>Yêu cầu đang chờ duyệt</h4>
        <table style="width:100%; border-collapse:collapse; text-align:left; margin-bottom: 20px;">
           <thead>
             <tr>
               <th style="padding:10px; border-bottom:2px solid var(--border-color);">Zalo ID</th>
               <th style="padding:10px; border-bottom:2px solid var(--border-color);">Tên Zalo</th>
               <th style="padding:10px; border-bottom:2px solid var(--border-color);">Thao tác</th>
             </tr>
           </thead>
           <tbody id="pendingAdminsTbody">
             <tr><td colspan="3" style="padding:10px; text-align:center;">Đang tải...</td></tr>
           </tbody>
        </table>

        <h4>Danh sách Zalo Admin</h4>
        <table style="width:100%; border-collapse:collapse; text-align:left;">
           <thead>
             <tr>
               <th style="padding:10px; border-bottom:2px solid var(--border-color);">Zalo ID</th>
               <th style="padding:10px; border-bottom:2px solid var(--border-color);">Tên Zalo</th>
               <th style="padding:10px; border-bottom:2px solid var(--border-color);">Thao tác</th>
             </tr>
           </thead>
           <tbody id="activeAdminsTbody">
             <tr><td colspan="3" style="padding:10px; text-align:center;">Đang tải...</td></tr>
           </tbody>
        </table>
        </div>
      </div>

      <div class="card">
        <h3>Quản lý tài khoản</h3>
        <p style="color:var(--text-muted); font-size: 14px; margin-bottom: 20px;">Tạo và phân quyền tài khoản cho nhân viên Vận hành. Tự động liên kết hiển thị tên với Zalo.</p>
        
        <div style="background: var(--bg-color); padding: 24px; border-radius: 12px; border: 1px solid var(--border-color); margin-bottom: 24px; box-shadow: inset 0 2px 4px 0 rgb(0 0 0 / 0.02);">
          <h4 style="margin-top:0; margin-bottom:16px; font-size: 16px; color: var(--text-main); font-weight: 600;">Thêm tài khoản</h4>
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 16px; margin-bottom: 16px;">
            <input type="text" id="newWebUsername" placeholder="Tên đăng nhập *" style="width:100%; box-sizing:border-box; padding:10px 14px; border-radius:8px; border:1px solid var(--border-color); background: var(--card-bg); color: var(--text-main); font-size: 14px; outline: none; transition: border 0.2s;" onfocus="this.style.borderColor='#3b82f6'" onblur="this.style.borderColor='var(--border-color)'">
            <input type="password" id="newWebPassword" placeholder="Mật khẩu *" style="width:100%; box-sizing:border-box; padding:10px 14px; border-radius:8px; border:1px solid var(--border-color); background: var(--card-bg); color: var(--text-main); font-size: 14px; outline: none; transition: border 0.2s;" onfocus="this.style.borderColor='#3b82f6'" onblur="this.style.borderColor='var(--border-color)'">
            <input type="text" id="newWebDisplayName" placeholder="Tên hiển thị (VD: Nguyễn Văn A) *" style="width:100%; box-sizing:border-box; padding:10px 14px; border-radius:8px; border:1px solid var(--border-color); background: var(--card-bg); color: var(--text-main); font-size: 14px; outline: none; transition: border 0.2s;" onfocus="this.style.borderColor='#3b82f6'" onblur="this.style.borderColor='var(--border-color)'">
            <select id="newWebZaloId" style="width:100%; box-sizing:border-box; padding:10px 14px; border-radius:8px; border:1px solid var(--border-color); background: var(--card-bg); color: var(--text-main); font-size: 14px; outline: none; cursor: pointer; transition: border 0.2s;" onfocus="this.style.borderColor='#3b82f6'" onblur="this.style.borderColor='var(--border-color)'">
               <option value="">-- Chọn tài khoản Zalo --</option>
            </select>
          </div>
          <div style="display: flex; flex-wrap: wrap; gap: 16px; align-items: center;">
            <select id="newWebRole" style="flex: 1; min-width: 200px; box-sizing:border-box; padding:10px 14px; border-radius:8px; border:1px solid var(--border-color); background: var(--card-bg); color: var(--text-main); font-size: 14px; outline: none; cursor: pointer; transition: border 0.2s;" onfocus="this.style.borderColor='#3b82f6'" onblur="this.style.borderColor='var(--border-color)'">
               <option value="ADMIN">Vận hành</option>
               <option value="SUPER_ADMIN">Quản trị viên</option>
            </select>
            <button class="btn-primary" onclick="createWebUser()" style="padding: 10px 24px; font-weight: 600; border-radius: 8px; box-shadow: 0 4px 6px -1px rgba(59, 130, 246, 0.3); transition: all 0.2s;">
              <span style="display: flex; align-items: center; gap: 6px;">
                <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path></svg>
                Tạo tài khoản
              </span>
            </button>
          </div>
        </div>

        <div style="border: 1px solid var(--border-color); border-radius: 12px; overflow: hidden; background: var(--bg-color);">
          <table style="width:100%; border-collapse:collapse; text-align:left; font-size: 14px;">
             <thead style="background: var(--card-bg);">
               <tr>
                 <th style="padding:14px 16px; border-bottom:1px solid var(--border-color); font-weight: 600; color: var(--text-main);">Tên đăng nhập</th>
                 <th style="padding:14px 16px; border-bottom:1px solid var(--border-color); font-weight: 600; color: var(--text-main);">Vai trò</th>
                 <th style="padding:14px 16px; border-bottom:1px solid var(--border-color); font-weight: 600; color: var(--text-main);">Tên hiển thị</th>
                 <th style="padding:14px 16px; border-bottom:1px solid var(--border-color); font-weight: 600; color: var(--text-main); text-align: right;">Thao tác</th>
               </tr>
             </thead>
             <tbody id="webUsersTbody">
               <tr><td colspan="4" style="padding:20px; text-align:center; color: var(--text-muted);">Đang tải...</td></tr>
             </tbody>
          </table>
        </div>

        <!-- Edit Modal Overlay -->
        <div id="editUserModal" style="display: none; position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 1000; align-items: center; justify-content: center;">
          <div style="background: var(--card-bg); padding: 24px; border-radius: 12px; width: 90%; max-width: 400px; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1);">
            <h3 style="margin-top: 0; margin-bottom: 20px; color: var(--text-main);">Sửa tài khoản</h3>
            <input type="hidden" id="editWebUsername">
            <label style="display:block; margin-bottom:6px; font-size:13px; font-weight:500; color:var(--text-main);">Mật khẩu mới (Để trống nếu không đổi)</label>
            <input type="password" id="editWebPassword" placeholder="Nhập mật khẩu mới..." style="width:100%; padding:10px 14px; margin-bottom:16px; border-radius:8px; border:1px solid var(--border-color); background: var(--bg-color); color: var(--text-main); font-size: 14px; outline: none; box-sizing:border-box;">
            
            <label style="display:block; margin-bottom:6px; font-size:13px; font-weight:500; color:var(--text-main);">Tên hiển thị <span style="color:#ef4444">*</span></label>
            <input type="text" id="editWebDisplayName" style="width:100%; padding:10px 14px; margin-bottom:16px; border-radius:8px; border:1px solid var(--border-color); background: var(--bg-color); color: var(--text-main); font-size: 14px; outline: none; box-sizing:border-box;">
            
            <label style="display:block; margin-bottom:6px; font-size:13px; font-weight:500; color:var(--text-main);">Vai trò <span style="color:#ef4444">*</span></label>
            <select id="editWebRole" style="width:100%; padding:10px 14px; margin-bottom:16px; border-radius:8px; border:1px solid var(--border-color); background: var(--bg-color); color: var(--text-main); font-size: 14px; outline: none; box-sizing:border-box;">
               <option value="ADMIN">Vận hành</option>
               <option value="SUPER_ADMIN">Quản trị viên</option>
            </select>
            
            <label style="display:block; margin-bottom:6px; font-size:13px; font-weight:500; color:var(--text-main);">Liên kết tài khoản Zalo <span style="color:#ef4444">*</span></label>
            <select id="editWebZaloId" style="width:100%; padding:10px 14px; margin-bottom:24px; border-radius:8px; border:1px solid var(--border-color); background: var(--bg-color); color: var(--text-main); font-size: 14px; outline: none; box-sizing:border-box;">
               <option value="">-- Chọn tài khoản Zalo --</option>
            </select>
            
            <div style="display: flex; gap: 12px; justify-content: flex-end;">
              <button onclick="document.getElementById('editUserModal').style.display='none'" style="padding: 8px 16px; font-weight: 500; border-radius: 8px; border: 1px solid var(--border-color); background: var(--bg-color); color: var(--text-main); cursor: pointer;">Hủy</button>
              <button class="btn-primary" onclick="updateWebUser()" style="padding: 8px 16px; font-weight: 500; border-radius: 8px;">Cập nhật</button>
            </div>
          </div>
        </div>
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

        // Web Users Logic
        let activeZaloAdminsForDropdown = [];
        let webUsersData = [];
        
        async function loadWebUsers() {
          try {
            const res = await fetch('/api/users');
            if (!res.ok) return; // Silent return if not Super Admin
            const data = await res.json();
            const tbody = document.getElementById('webUsersTbody');
            
            if (data.users.length === 0) {
              tbody.innerHTML = '<tr><td colspan="4" style="text-align:center; padding:20px; color: var(--text-muted);">Không có dữ liệu</td></tr>';
              return;
            }
            
            webUsersData = data.users;
            let html = '';
            data.users.forEach(u => {
              const linkedZalo = activeZaloAdminsForDropdown.find(a => a.id === u.zaloId);
              const zaloName = linkedZalo ? linkedZalo.name : (u.zaloId ? 'ID: ' + u.zaloId : 'Chưa liên kết');
              const roleDisplay = u.role === 'SUPER_ADMIN' ? 'Quản trị viên' : 'Vận hành';
              const roleColor = u.role === 'SUPER_ADMIN' ? '#991b1b' : '#166534';
              const roleBg = u.role === 'SUPER_ADMIN' ? '#fee2e2' : '#dcfce7';
              
              html += \`<tr>
                <td style="padding:14px 16px; border-bottom:1px solid var(--border-color); color: var(--text-main);"><strong>\${u.username}</strong></td>
                <td style="padding:14px 16px; border-bottom:1px solid var(--border-color);"><span style="background:\${roleBg}; color:\${roleColor}; padding:4px 10px; border-radius:9999px; font-size:12px; font-weight:bold;">\${roleDisplay}</span></td>
                <td style="padding:14px 16px; border-bottom:1px solid var(--border-color); color: var(--text-main);">\${u.displayName}<br><small style="color:var(--text-muted); font-size: 12px;">Zalo: \${zaloName}</small></td>
                <td style="padding:14px 16px; border-bottom:1px solid var(--border-color); text-align: right; white-space: nowrap;">
                  <button onclick="openEditModal('\${u.username}')" style="background:#e0f2fe; color:#0369a1; border:none; padding:6px 12px; border-radius:6px; cursor:pointer; font-size:13px; font-weight: 500; transition: all 0.2s; box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05); margin-right: 6px;" onmouseover="this.style.background='#bae6fd'" onmouseout="this.style.background='#e0f2fe'">Sửa</button>
                  <button onclick="deleteWebUser('\${u.username}')" style="background:#fee2e2; color:#dc2626; border:none; padding:6px 12px; border-radius:6px; cursor:pointer; font-size:13px; font-weight: 500; transition: all 0.2s; box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05);" onmouseover="this.style.background='#fecaca'" onmouseout="this.style.background='#fee2e2'">Xóa</button>
                </td>
              </tr>\`;
            });
            tbody.innerHTML = html;
          } catch(e) {}
        }

        function openEditModal(username) {
          const user = webUsersData.find(u => u.username === username);
          if (!user) return;
          document.getElementById('editWebUsername').value = user.username;
          document.getElementById('editWebDisplayName').value = user.displayName;
          document.getElementById('editWebRole').value = user.role;
          document.getElementById('editWebPassword').value = '';
          
          const select = document.getElementById('editWebZaloId');
          select.innerHTML = '<option value="">-- Chọn tài khoản Zalo --</option>' + 
             activeZaloAdminsForDropdown.map(a => \`<option value="\${a.id}">\${a.name}</option>\`).join('');
          select.value = user.zaloId || '';
          
          document.getElementById('editUserModal').style.display = 'flex';
        }

        async function updateWebUser() {
          const username = document.getElementById('editWebUsername').value;
          const displayName = document.getElementById('editWebDisplayName').value.trim();
          const role = document.getElementById('editWebRole').value;
          const zaloId = document.getElementById('editWebZaloId').value;
          const password = document.getElementById('editWebPassword').value.trim();
          
          if (!displayName || !zaloId) {
             showAlert('Vui lòng nhập Tên hiển thị và chọn Tài khoản Zalo.');
             return;
          }
          
          const payload = { username, displayName, role, zaloId };
          if (password) payload.password = password;
          
          const res = await fetch('/api/users/edit', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(payload)
          });
          const data = await res.json();
          if (res.ok) {
            showNotification('Cập nhật thành công');
            document.getElementById('editUserModal').style.display = 'none';
            loadWebUsers();
          } else {
            showAlert('Lỗi: ' + (data.error || 'Không thể cập nhật'));
          }
        }

        async function createWebUser() {
          const username = document.getElementById('newWebUsername').value.trim();
          const password = document.getElementById('newWebPassword').value.trim();
          const role = document.getElementById('newWebRole').value;
          const displayName = document.getElementById('newWebDisplayName').value.trim();
          const zaloId = document.getElementById('newWebZaloId').value;
          
          if (!username || !password || !displayName || !zaloId) {
             showAlert('Vui lòng nhập đầy đủ thông tin.');
             return;
          }
          
          const res = await fetch('/api/users/create', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({username, password, role, displayName, zaloId})
          });
          const data = await res.json();
          if (res.ok) {
            showCustomConfirm('Tạo tài khoản thành công! Mã khôi phục (QUAN TRỌNG): ' + data.recoveryKey + '\\nHãy lưu lại mã này để khôi phục mật khẩu nếu quên.', () => {
               document.getElementById('newWebUsername').value = '';
               document.getElementById('newWebPassword').value = '';
               document.getElementById('newWebDisplayName').value = '';
               document.getElementById('newWebZaloId').value = '';
               loadWebUsers();
            });
          } else {
            showAlert('Lỗi: ' + (data.error || 'Không thể tạo tài khoản'));
          }
        }

        async function deleteWebUser(username) {
           showCustomConfirm('Bạn có chắc muốn xóa tài khoản [' + username + ']? Hành động này không thể hoàn tác.', async () => {
             const res = await fetch('/api/users/delete', {
               method: 'POST',
               headers: {'Content-Type': 'application/json'},
               body: JSON.stringify({username})
             });
             const data = await res.json();
             if (res.ok) {
               showNotification('Đã xóa tài khoản');
               loadWebUsers();
             } else {
               showAlert('Lỗi: ' + data.error);
             }
           });
        }

        function showNotification(msg) {
          let old = document.getElementById('notification-toast');
          if (old) old.remove();
          const div = document.createElement('div');
          div.id = 'notification-toast';
          div.style.position = 'fixed';
          div.style.top = '20px';
          div.style.right = '20px';
          div.style.background = '#10b981';
          div.style.color = '#fff';
          div.style.padding = '12px 20px';
          div.style.borderRadius = '8px';
          div.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)';
          div.style.zIndex = '9999';
          div.style.fontWeight = 'bold';
          div.innerText = msg;
          document.body.appendChild(div);
          setTimeout(() => div.remove(), 3000);
        }

        function showCustomConfirm(msg, onConfirm) {
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
          box.style.padding = '20px';
          box.style.borderRadius = '8px';
          box.style.minWidth = '300px';
          box.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)';
          box.style.border = '1px solid var(--border-color, #ccc)';
          
          const text = document.createElement('p');
          text.innerText = msg;
          text.style.marginBottom = '20px';
          text.style.fontWeight = 'bold';
          
          const btns = document.createElement('div');
          btns.style.display = 'flex';
          btns.style.justifyContent = 'flex-end';
          btns.style.gap = '10px';
          
          const btnCancel = document.createElement('button');
          btnCancel.innerText = 'Hủy';
          btnCancel.style.padding = '6px 16px';
          btnCancel.style.background = '#64748b';
          btnCancel.style.color = '#fff';
          btnCancel.style.border = 'none';
          btnCancel.style.borderRadius = '4px';
          btnCancel.style.cursor = 'pointer';
          btnCancel.onclick = () => overlay.remove();
          
          const btnOk = document.createElement('button');
          btnOk.innerText = 'Đồng ý';
          btnOk.style.padding = '6px 16px';
          btnOk.style.background = '#2563eb';
          btnOk.style.color = '#fff';
          btnOk.style.border = 'none';
          btnOk.style.borderRadius = '4px';
          btnOk.style.cursor = 'pointer';
          btnOk.onclick = () => { overlay.remove(); onConfirm(); };
          
          btns.appendChild(btnCancel);
          btns.appendChild(btnOk);
          box.appendChild(text);
          box.appendChild(btns);
          overlay.appendChild(box);
          document.body.appendChild(overlay);
        }

        async function saveBotConfig() {
          const bot_org_name = document.getElementById('cfg_bot_org_name').value;
          const bot_user_role = document.getElementById('cfg_bot_user_role').value;
          const bot_pronoun_me = document.getElementById('cfg_bot_pronoun_me').value;
          const bot_pronoun_user_male = document.getElementById('cfg_bot_pronoun_user_male').value;
          const bot_pronoun_user_female = document.getElementById('cfg_bot_pronoun_user_female').value;
          const bot_pronoun_user_default = document.getElementById('cfg_bot_pronoun_user_default').value;
          const bot_environment = document.getElementById('cfg_bot_environment').value;

          const res = await fetch('/api/settings/bot-config', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
              bot_org_name,
              bot_user_role,
              bot_pronoun_me,
              bot_pronoun_user_male,
              bot_pronoun_user_female,
              bot_pronoun_user_default,
              bot_environment
            })
          });
          const data = await res.json();
          if (res.ok) {
            showNotification('Đã lưu cấu hình văn phong & xưng hô AI!');
          } else {
            showAlert('Lỗi: ' + (data.error || 'Không thể lưu cấu hình'));
          }
        }

        async function saveFaq() {
          const content = document.getElementById('faqContent').value;
          const res = await fetch('/api/settings/faq', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ content })
          });
          if (res.ok) showNotification('Lưu FAQ thành công!');
          else showNotification('Lỗi khi lưu.');
        }

        async function updateGroup(groupId) {
          const name = document.getElementById('gname_' + groupId).value;
          const res = await fetch('/api/settings/group/edit', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ groupId, name })
          });
          if (res.ok) showNotification('Đổi tên thành công!');
        }

        function deleteGroup(groupId) {
          showCustomConfirm('Bạn có chắc muốn gỡ hệ thống khỏi nhóm này?', async () => {
            const res = await fetch('/api/settings/group/delete', {
              method: 'POST',
              headers: {'Content-Type': 'application/json'},
              body: JSON.stringify({ groupId })
            });
            if (res.ok) window.location.reload();
          });
        }

        async function loadAdmins() {
          const res = await fetch('/api/admins');
          const data = await res.json();
          if (data.success) {
            const maskId = (id) => { const s = String(id); return s.length <= 4 ? s : s.substring(0,4) + '****' + s.slice(-3); };
            const pendingHtml = data.pending.map(a => 
              \`<tr>
                <td style="padding:10px; border-bottom:1px solid #eee; font-family: monospace;" title="\${a.id}">\${maskId(a.id)}</td>
                <td style="padding:10px; border-bottom:1px solid #eee;">\${a.name}</td>
                <td style="padding:10px; border-bottom:1px solid #eee;">
                  <button class="btn-primary" style="background:#10b981; padding: 4px 8px; font-size:12px; margin-right:4px;" onclick="approveAdmin('\${a.id}')">Duyệt</button>
                  <button class="btn-danger" style="padding: 4px 8px; font-size:12px;" onclick="rejectAdmin('\${a.id}')">Từ chối</button>
                </td>
              </tr>\`
            ).join('') || '<tr><td colspan="3" style="padding:10px; text-align:center; color:#999;">Không có yêu cầu nào</td></tr>';
            
            const activeHtml = data.admins.map(a => 
              \`<tr>
                <td style="padding:10px; border-bottom:1px solid #eee; font-family: monospace;" title="\${a.id}">\${maskId(a.id)}</td>
                <td style="padding:10px; border-bottom:1px solid #eee;">\${a.name}</td>
                <td style="padding:10px; border-bottom:1px solid #eee;">
                  <button class="btn-danger" style="background:#991b1b; color:#ffffff; padding: 4px 8px; font-size:12px;" onclick="removeAdmin('\${a.id}')">Xóa quyền</button>
                </td>
              </tr>\`
            ).join('') || '<tr><td colspan="3" style="padding:10px; text-align:center; color:#999;">Chưa có Admin nào được duyệt</td></tr>';

            document.getElementById('pendingAdminsTbody').innerHTML = pendingHtml;
            document.getElementById('activeAdminsTbody').innerHTML = activeHtml;

            // Populate Zalo dropdown for Web Users creation
            const zaloSelect = document.getElementById('newWebZaloId');
            if (zaloSelect) {
                const currentOptionsHtml = data.admins.map(a => \`<option value="\${a.id}">\${a.name} (\${maskId(a.id)})</option>\`).join('');
                if (zaloSelect.getAttribute('data-last-html') !== currentOptionsHtml) {
                    const currentVal = zaloSelect.value;
                    zaloSelect.innerHTML = '<option value="">-- Chọn tài khoản Zalo --</option>' + currentOptionsHtml;
                    zaloSelect.value = currentVal;
                    zaloSelect.setAttribute('data-last-html', currentOptionsHtml);
                    activeZaloAdminsForDropdown = data.admins;
                    loadWebUsers(); // Refresh web users to update linked zalo names only when Zalo list changes
                }
            }
          }
        }

        function approveAdmin(id) {
          showCustomConfirm('Duyệt người này làm Admin Zalo?', async () => {
            const res = await fetch('/api/admins/approve', {
              method: 'POST',
              headers: {'Content-Type': 'application/json'},
              body: JSON.stringify({ id })
            });
            if (res.ok) { showNotification('Đã duyệt!'); loadAdmins(); }
            else showNotification('Lỗi khi duyệt.');
          });
        }

        function rejectAdmin(id) {
          showCustomConfirm('Từ chối yêu cầu của người này?', async () => {
            const res = await fetch('/api/admins/reject', {
              method: 'POST',
              headers: {'Content-Type': 'application/json'},
              body: JSON.stringify({ id })
            });
            if (res.ok) { showNotification('Đã từ chối!'); loadAdmins(); }
            else showNotification('Lỗi khi từ chối.');
          });
        }

        function removeAdmin(id) {
          showCustomConfirm('CẢNH BÁO: Thu hồi quyền Admin Zalo của người này?', async () => {
            const res = await fetch('/api/admins/remove', {
              method: 'POST',
              headers: {'Content-Type': 'application/json'},
              body: JSON.stringify({ id })
            });
            if (res.ok) { showNotification('Đã thu hồi quyền!'); loadAdmins(); }
            else showNotification('Lỗi khi thu hồi.');
          });
        }

        window.addEventListener('DOMContentLoaded', () => {
          loadAdmins();
          // Auto update admins list every 0.5 seconds
          setInterval(loadAdmins, 500);
        });
      </script>
    </body>
    </html>
  `;

  return html;
}

module.exports = {
  getSettingsHtml
};
