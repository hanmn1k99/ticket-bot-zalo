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
  if (!groupRows) {
    groupRows = '<div style="padding:20px; text-align:center; opacity:0.7;">Chưa có nhóm nào đăng ký thông báo.</div>';
  }

  const html = `
    <!DOCTYPE html>
    <html lang="vi" data-theme="light">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Cài đặt Hệ thống - minhhan.net</title>
      <link rel="icon" type="image/png" href="/assets/favicon.png?v=${Date.now()}">
      <link rel="apple-touch-icon" href="/assets/favicon.png?v=${Date.now()}">
      <script type="module" src="https://unpkg.com/ionicons@7.1.0/dist/ionicons/ionicons.esm.js"></script>
      <script nomodule src="https://unpkg.com/ionicons@7.1.0/dist/ionicons/ionicons.js"></script>
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

        function switchTab(tabId, btn) {
          document.querySelectorAll('.tab-pane').forEach(el => el.classList.remove('active'));
          document.querySelectorAll('.tab-btn').forEach(el => el.classList.remove('active'));
          const target = document.getElementById(tabId);
          if (target) target.classList.add('active');
          if (btn) btn.classList.add('active');
          localStorage.setItem('activeSettingsTab', tabId);
        }

        document.addEventListener('DOMContentLoaded', () => {
          const savedTab = localStorage.getItem('activeSettingsTab');
          if (savedTab && document.getElementById(savedTab)) {
            const btn = document.querySelector('.tab-btn[data-tab="' + savedTab + '"]');
            if (btn) switchTab(savedTab, btn);
          }
          loadAdmins();
          loadWebUsers();
        });

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
            body: JSON.stringify({content})
          });
          if (res.ok) {
            showNotification('Đã lưu dữ liệu FAQ!');
          } else {
            showAlert('Lỗi khi lưu dữ liệu');
          }
        }

        async function updateGroup(groupId) {
          const name = document.getElementById('gname_' + groupId).value;
          const res = await fetch('/api/settings/group/edit', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({groupId, name})
          });
          if (res.ok) {
            showNotification('Đã cập nhật tên nhóm!');
          } else {
            showAlert('Lỗi khi cập nhật tên nhóm');
          }
        }

        async function deleteGroup(groupId) {
          showCustomConfirm('Bạn có chắc chắn muốn gỡ nhóm này khỏi danh sách nhận thông báo?', async () => {
            const res = await fetch('/api/settings/group/delete', {
              method: 'POST',
              headers: {'Content-Type': 'application/json'},
              body: JSON.stringify({groupId})
            });
            if (res.ok) {
              window.location.reload();
            } else {
              showAlert('Lỗi khi xóa nhóm');
            }
          });
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
          box.style.padding = '24px';
          box.style.borderRadius = '12px';
          box.style.minWidth = '320px';
          box.style.boxShadow = '0 10px 15px -3px rgba(0,0,0,0.1)';
          box.style.border = '1px solid var(--border-color, #e2e8f0)';
          
          const text = document.createElement('p');
          text.innerText = msg;
          text.style.marginBottom = '24px';
          text.style.fontWeight = '500';
          text.style.lineHeight = '1.5';
          
          const btns = document.createElement('div');
          btns.style.display = 'flex';
          btns.style.justifyContent = 'flex-end';
          btns.style.gap = '12px';
          
          const btnCancel = document.createElement('button');
          btnCancel.innerText = 'Hủy bỏ';
          btnCancel.style.padding = '8px 16px';
          btnCancel.style.background = 'var(--border-color, #e2e8f0)';
          btnCancel.style.color = 'var(--text-main, #000)';
          btnCancel.style.border = 'none';
          btnCancel.style.borderRadius = '8px';
          btnCancel.style.cursor = 'pointer';
          btnCancel.onclick = () => overlay.remove();
          
          const btnOk = document.createElement('button');
          btnOk.innerText = 'Xác nhận';
          btnOk.style.padding = '8px 16px';
          btnOk.style.background = '#ef4444';
          btnOk.style.color = '#fff';
          btnOk.style.border = 'none';
          btnOk.style.borderRadius = '8px';
          btnOk.style.cursor = 'pointer';
          btnOk.style.fontWeight = '600';
          btnOk.onclick = () => {
             overlay.remove();
             onConfirm();
          };
          
          btns.appendChild(btnCancel);
          btns.appendChild(btnOk);
          box.appendChild(text);
          box.appendChild(btns);
          overlay.appendChild(box);
          document.body.appendChild(overlay);
        }

        async function loadAdmins() {
           try {
             const res = await fetch('/api/admin/list');
             const data = await res.json();
             if (data.success) {
                renderAdminsTable(data.pending, 'pendingAdminsTbody', true);
                renderAdminsTable(data.active, 'activeAdminsTbody', false);
                populateZaloDropdown([...data.pending, ...data.active]);
             }
           } catch(e) { console.error(e); }
        }

        function populateZaloDropdown(admins) {
          const select = document.getElementById('newWebZaloId');
          const editSelect = document.getElementById('editWebZaloId');
          
          const currentVal = select ? select.value : '';
          const currentEditVal = editSelect ? editSelect.value : '';

          let html = '<option value="">-- Chọn tài khoản Zalo --</option>';
          admins.forEach(a => {
             html += '<option value="' + a.id + '">' + a.name + ' (' + a.id + ')</option>';
          });
          
          if (select) {
            select.innerHTML = html;
            if (currentVal) select.value = currentVal;
          }
          if (editSelect) {
            editSelect.innerHTML = html;
            if (currentEditVal) editSelect.value = currentEditVal;
          }
        }

        function renderAdminsTable(list, tbodyId, isPending) {
           const tbody = document.getElementById(tbodyId);
           if (!tbody) return;
           if (list.length === 0) {
              tbody.innerHTML = '<tr><td colspan="3" style="padding:12px; text-align:center; opacity:0.6;">' + (isPending ? 'Không có yêu cầu chờ duyệt.' : 'Chưa có Zalo Admin nào.') + '</td></tr>';
              return;
           }
           let html = '';
           list.forEach(a => {
              const btnHtml = isPending 
                ? '<button onclick="approveAdmin(\\'' + a.id + '\\')" style="background:#10b981; color:white; border:none; padding:6px 12px; border-radius:6px; cursor:pointer; font-size:12px; font-weight:600;">Duyệt</button><button onclick="revokeAdmin(\\'' + a.id + '\\')" style="background:#ef4444; color:white; border:none; padding:6px 12px; border-radius:6px; cursor:pointer; font-size:12px; margin-left:6px;">Xóa</button>'
                : '<button onclick="revokeAdmin(\\'' + a.id + '\\')" style="background:#ef4444; color:white; border:none; padding:6px 12px; border-radius:6px; cursor:pointer; font-size:12px;">Gỡ quyền</button>';
              html += '<tr style="border-bottom:1px solid var(--border-color);"><td style="padding:12px; font-family:monospace;">' + String(a.id).substring(0,4) + '****' + String(a.id).slice(-3) + '</td><td style="padding:12px; font-weight:500;">' + a.name + '</td><td style="padding:12px;">' + btnHtml + '</td></tr>';
           });
           tbody.innerHTML = html;
        }

        async function approveAdmin(id) {
           const res = await fetch('/api/admin/approve', {
             method: 'POST',
             headers: {'Content-Type': 'application/json'},
             body: JSON.stringify({id})
           });
           if (res.ok) {
             showNotification('Đã duyệt Zalo Admin thành công!');
             loadAdmins();
           } else {
             showAlert('Lỗi khi duyệt Admin');
           }
        }

        async function revokeAdmin(id) {
           showCustomConfirm('Bạn có chắc chắn muốn gỡ quyền Admin của tài khoản này?', async () => {
             const res = await fetch('/api/admin/revoke', {
               method: 'POST',
               headers: {'Content-Type': 'application/json'},
               body: JSON.stringify({id})
             });
             if (res.ok) {
               showNotification('Đã gỡ quyền Zalo Admin');
               loadAdmins();
               loadWebUsers();
             } else {
               showAlert('Lỗi khi gỡ quyền Admin');
             }
           });
        }

        async function loadWebUsers() {
           try {
             const res = await fetch('/api/users');
             const data = await res.json();
             if (data.success) {
                renderWebUsersTable(data.users);
             }
           } catch(e) { console.error(e); }
        }

        function renderWebUsersTable(users) {
           const tbody = document.getElementById('webUsersTbody');
           if (!tbody) return;
           if (users.length === 0) {
              tbody.innerHTML = '<tr><td colspan="5" style="padding:12px; text-align:center; opacity:0.6;">Chưa có tài khoản nào.</td></tr>';
              return;
           }
           let html = '';
           users.forEach(u => {
              const roleBadge = u.role === 'SUPER_ADMIN' 
                ? '<span style="background:#fee2e2; color:#991b1b; padding:4px 8px; border-radius:6px; font-size:11px; font-weight:600;">Quản trị viên</span>' 
                : '<span style="background:#e0f2fe; color:#0369a1; padding:4px 8px; border-radius:6px; font-size:11px; font-weight:600;">Vận hành</span>';
              
              const zaloTag = u.zaloId ? ('<span style="font-family:monospace; font-size:12px; background:var(--bg-color); padding:2px 6px; border-radius:4px; border:1px solid var(--border-color);">ID: ' + String(u.zaloId).substring(0,4) + '****' + String(u.zaloId).slice(-3) + '</span>') : '<span style="opacity:0.5;">-</span>';

              html += '<tr style="border-bottom:1px solid var(--border-color);">' +
                '<td style="padding:12px; font-weight:600;">' + u.username + '</td>' +
                '<td style="padding:12px;">' + (u.displayName || '-') + '</td>' +
                '<td style="padding:12px;">' + zaloTag + '</td>' +
                '<td style="padding:12px;">' + roleBadge + '</td>' +
                '<td style="padding:12px; text-align:right;">' +
                  '<button onclick="openEditUserModal(\\'' + u.username + '\\', \\'' + (u.displayName || '') + '\\', \\'' + (u.zaloId || '') + '\\', \\'' + u.role + '\\')" style="background:#3b82f6; color:white; border:none; padding:6px 12px; border-radius:6px; cursor:pointer; font-size:12px; font-weight:500; margin-right:6px;">Sửa</button>' +
                  '<button onclick="deleteWebUser(\\'' + u.username + '\\')" style="background:#ef4444; color:white; border:none; padding:6px 12px; border-radius:6px; cursor:pointer; font-size:12px; font-weight:500;">Xóa</button>' +
                '</td>' +
              '</tr>';
           });
           tbody.innerHTML = html;
        }

        async function createWebUser() {
          const username = document.getElementById('newWebUsername').value.trim();
          const password = document.getElementById('newWebPassword').value.trim();
          const role = document.getElementById('newWebRole').value;
          const displayName = document.getElementById('newWebDisplayName').value.trim();
          const zaloId = document.getElementById('newWebZaloId').value;
          
          if (!username || !password || !displayName || !zaloId) {
             showAlert('Vui lòng nhập đầy đủ thông tin (*).');
             return;
          }
          
          const res = await fetch('/api/users/create', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({username, password, role, displayName, zaloId})
          });
          const data = await res.json();
          if (res.ok) {
            showCustomConfirm('Tạo tài khoản thành công! Mã khôi phục (QUAN TRỌNG): ' + data.recoveryKey + '\\n\\nHãy lưu lại mã này để khôi phục mật khẩu khi cần.', () => {
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

        function openEditUserModal(username, displayName, zaloId, role) {
          document.getElementById('editWebUsername').value = username;
          document.getElementById('editWebDisplayName').value = displayName;
          document.getElementById('editWebZaloId').value = zaloId;
          document.getElementById('editWebRole').value = role;
          document.getElementById('editWebPassword').value = '';
          document.getElementById('editUserModal').style.display = 'flex';
        }

        function closeEditUserModal() {
          document.getElementById('editUserModal').style.display = 'none';
        }

        async function submitEditWebUser() {
          const username = document.getElementById('editWebUsername').value;
          const displayName = document.getElementById('editWebDisplayName').value.trim();
          const zaloId = document.getElementById('editWebZaloId').value;
          const role = document.getElementById('editWebRole').value;
          const password = document.getElementById('editWebPassword').value.trim();

          if (!displayName || !zaloId) {
            showAlert('Vui lòng điền đầy đủ Tên hiển thị và liên kết Zalo.');
            return;
          }

          const res = await fetch('/api/users/edit', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({username, displayName, zaloId, role, password: password || undefined})
          });
          const data = await res.json();
          if (res.ok) {
            showNotification('Đã cập nhật tài khoản!');
            closeEditUserModal();
            loadWebUsers();
          } else {
            showAlert('Lỗi: ' + (data.error || 'Không thể cập nhật'));
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
          div.style.padding = '12px 24px';
          div.style.borderRadius = '8px';
          div.style.fontWeight = '600';
          div.style.boxShadow = '0 10px 15px -3px rgba(0,0,0,0.1)';
          div.style.zIndex = '10001';
          div.innerText = msg;
          document.body.appendChild(div);
          setTimeout(() => div.remove(), 3000);
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
              padding: 24px;
              max-width: 1200px;
              margin: 0 auto;
          }
          .header { 
              display: flex; 
              justify-content: space-between; 
              align-items: center; 
              margin-bottom: 24px; 
          }
          .header h2 {
              margin: 0;
              font-size: 24px;
              font-weight: 700;
          }
          .btn-primary { 
              background: #2563eb; 
              color: white; 
              border: none;
              padding: 10px 20px;
              border-radius: 8px;
              font-weight: 600;
              cursor: pointer;
              transition: background 0.2s;
          }
          .btn-primary:hover {
              background: #1d4ed8;
          }
          
          /* Tab Navigation Styling */
          .tabs-nav {
              display: flex;
              gap: 8px;
              margin-bottom: 24px;
              border-bottom: 2px solid var(--border-color);
              overflow-x: auto;
              padding-bottom: 2px;
          }
          .tab-btn {
              padding: 12px 20px;
              border: none;
              background: transparent;
              color: var(--text-main);
              font-size: 15px;
              font-weight: 600;
              cursor: pointer;
              border-radius: 8px 8px 0 0;
              opacity: 0.7;
              transition: all 0.2s;
              white-space: nowrap;
          }
          .tab-btn:hover {
              opacity: 1;
              background: rgba(37, 99, 235, 0.05);
          }
          .tab-btn.active {
              opacity: 1;
              color: #2563eb;
              background: var(--card-bg);
              border-bottom: 3px solid #2563eb;
              box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
          }
          
          .tab-pane {
              display: none;
          }
          .tab-pane.active {
              display: block;
              animation: fadeIn 0.2s ease-in-out;
          }
          @keyframes fadeIn {
              from { opacity: 0; transform: translateY(4px); }
              to { opacity: 1; transform: translateY(0); }
          }
          
          .card {
              background: var(--card-bg);
              border: 1px solid var(--border-color);
              border-radius: 12px;
              padding: 24px;
              margin-bottom: 24px;
              box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.05);
          }
          .card h3 {
              margin-top: 0;
              font-size: 18px;
              font-weight: 700;
              color: var(--text-main);
              border-bottom: 2px solid var(--border-color);
              padding-bottom: 12px;
              margin-bottom: 16px;
          }
          textarea {
              width: 100%;
              height: 220px;
              padding: 14px;
              border: 1px solid var(--border-color);
              border-radius: 8px;
              background: var(--bg-color);
              color: var(--text-main);
              font-family: monospace;
              font-size: 14px;
              box-sizing: border-box;
              outline: none;
          }
          textarea:focus {
              border-color: #2563eb;
          }
      </style>
    </head>
    <body>
      <div class="header" style="display:flex; justify-content:space-between; align-items:center;">
        <div>
          <h2><ion-icon name="settings-outline" style="vertical-align:middle; margin-right:6px;"></ion-icon>Cài đặt Hệ thống</h2>
          <p style="margin:4px 0 0 0; opacity:0.7; font-size:14px;">Quản lý toàn bộ cấu hình AI, văn phong xưng hô, tài khoản vận hành và nhóm thông báo.</p>
        </div>
        <button class="btn-primary" onclick="window.location.href='/report'">Quay lại Dashboard</button>
      </div>
      
      <!-- TAB NAVIGATION -->
      <div class="tabs-nav">
        <button class="tab-btn active" data-tab="tab-tone" onclick="switchTab('tab-tone', this)"><ion-icon name="chatbubbles-outline" style="vertical-align:middle; margin-right:4px;"></ion-icon> Văn phong & Xưng hô</button>
        <button class="tab-btn" data-tab="tab-faq" onclick="switchTab('tab-faq', this)"><ion-icon name="library-outline" style="vertical-align:middle; margin-right:4px;"></ion-icon> Huấn luyện AI (FAQ)</button>
        <button class="tab-btn" data-tab="tab-accounts" onclick="switchTab('tab-accounts', this)"><ion-icon name="people-outline" style="vertical-align:middle; margin-right:4px;"></ion-icon> Admin & Tài khoản</button>
        <button class="tab-btn" data-tab="tab-groups" onclick="switchTab('tab-groups', this)"><ion-icon name="megaphone-outline" style="vertical-align:middle; margin-right:4px;"></ion-icon> Quản lý Nhóm</button>
        <button class="tab-btn" data-tab="tab-prompt" onclick="switchTab('tab-prompt', this)"><ion-icon name="search-outline" style="vertical-align:middle; margin-right:4px;"></ion-icon> Quy tắc AI (Chỉ xem)</button>
      </div>

      <!-- TAB 1: VĂN PHONG & XƯNG HÔ -->
      <div id="tab-tone" class="tab-pane active">
        <div class="card">
          <h3><ion-icon name="chatbubbles-outline" style="vertical-align:middle; margin-right:6px;"></ion-icon> Cấu hình Văn phong & Xưng hô AI</h3>
          <p style="font-size:14px; opacity:0.8; margin-top: 0px; margin-bottom: 20px;">Tùy chỉnh xưng hô, tên đơn vị và môi trường hoạt động trực tiếp trên Web (thay thế cho file .env).</p>
          
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 20px; margin-bottom: 20px;">
            <div>
              <label style="font-size:13px; font-weight:600; display:block; margin-bottom:8px;">Tên Đơn vị / Tổ chức</label>
              <input type="text" id="cfg_bot_org_name" value="${BOT_ORG_NAME}" placeholder="VD: trường Meyschool, Công ty ABC" style="width:100%; box-sizing:border-box; padding:10px 14px; border-radius:8px; border:1px solid var(--border-color); background:var(--bg-color); color:var(--text-main); font-size:14px; outline:none;" onfocus="this.style.borderColor='#2563eb'" onblur="this.style.borderColor='var(--border-color)'">
            </div>
            <div>
              <label style="font-size:13px; font-weight:600; display:block; margin-bottom:8px;">Vai trò Người dùng</label>
              <input type="text" id="cfg_bot_user_role" value="${BOT_USER_ROLE}" placeholder="VD: Giáo viên, Nhân viên" style="width:100%; box-sizing:border-box; padding:10px 14px; border-radius:8px; border:1px solid var(--border-color); background:var(--bg-color); color:var(--text-main); font-size:14px; outline:none;" onfocus="this.style.borderColor='#2563eb'" onblur="this.style.borderColor='var(--border-color)'">
            </div>
            <div>
              <label style="font-size:13px; font-weight:600; display:block; margin-bottom:8px;">AI tự xưng là</label>
              <input type="text" id="cfg_bot_pronoun_me" value="${BOT_PRONOUN_ME}" placeholder="VD: Em, Mình" style="width:100%; box-sizing:border-box; padding:10px 14px; border-radius:8px; border:1px solid var(--border-color); background:var(--bg-color); color:var(--text-main); font-size:14px; outline:none;" onfocus="this.style.borderColor='#2563eb'" onblur="this.style.borderColor='var(--border-color)'">
            </div>
            <div>
              <label style="font-size:13px; font-weight:600; display:block; margin-bottom:8px;">Gọi người dùng Nam</label>
              <input type="text" id="cfg_bot_pronoun_user_male" value="${BOT_PRONOUN_USER_MALE}" placeholder="VD: Thầy, Anh" style="width:100%; box-sizing:border-box; padding:10px 14px; border-radius:8px; border:1px solid var(--border-color); background:var(--bg-color); color:var(--text-main); font-size:14px; outline:none;" onfocus="this.style.borderColor='#2563eb'" onblur="this.style.borderColor='var(--border-color)'">
            </div>
            <div>
              <label style="font-size:13px; font-weight:600; display:block; margin-bottom:8px;">Gọi người dùng Nữ</label>
              <input type="text" id="cfg_bot_pronoun_user_female" value="${BOT_PRONOUN_USER_FEMALE}" placeholder="VD: Cô, Chị" style="width:100%; box-sizing:border-box; padding:10px 14px; border-radius:8px; border:1px solid var(--border-color); background:var(--bg-color); color:var(--text-main); font-size:14px; outline:none;" onfocus="this.style.borderColor='#2563eb'" onblur="this.style.borderColor='var(--border-color)'">
            </div>
            <div>
              <label style="font-size:13px; font-weight:600; display:block; margin-bottom:8px;">Gọi Mặc định / Chung</label>
              <input type="text" id="cfg_bot_pronoun_user_default" value="${BOT_PRONOUN_USER_DEFAULT}" placeholder="VD: Thầy/Cô, Anh/Chị" style="width:100%; box-sizing:border-box; padding:10px 14px; border-radius:8px; border:1px solid var(--border-color); background:var(--bg-color); color:var(--text-main); font-size:14px; outline:none;" onfocus="this.style.borderColor='#2563eb'" onblur="this.style.borderColor='var(--border-color)'">
            </div>
          </div>
          <div style="margin-bottom: 20px;">
            <label style="font-size:13px; font-weight:600; display:block; margin-bottom:8px;">Môi trường hoạt động</label>
            <input type="text" id="cfg_bot_environment" value="${BOT_ENVIRONMENT}" placeholder="VD: MÔI TRƯỜNG GIÁO DỤC (trường học)" style="width:100%; box-sizing:border-box; padding:10px 14px; border-radius:8px; border:1px solid var(--border-color); background:var(--bg-color); color:var(--text-main); font-size:14px; outline:none;" onfocus="this.style.borderColor='#2563eb'" onblur="this.style.borderColor='var(--border-color)'">
          </div>
          <button class="btn-primary" onclick="saveBotConfig()">Lưu Cấu Hình Văn Phong</button>
        </div>
      </div>

      <!-- TAB 2: HUẤN LUYỆN AI (FAQ) -->
      <div id="tab-faq" class="tab-pane">
        <div class="card">
          <h3><ion-icon name="library-outline" style="vertical-align:middle; margin-right:6px;"></ion-icon> Huấn luyện AI (Nội dung FAQ)</h3>
          <p style="font-size:14px; opacity:0.8; margin-top:0px; margin-bottom:16px;">Nhập các dữ liệu bạn muốn AI học. Mỗi dòng một ý.<br><i>Ví dụ: 1. Pass wifi phòng họp là 123456... AI sẽ tự đọc hiểu văn bản này để trả lời người dùng.</i></p>
          <textarea id="faqContent">${faqContent}</textarea>
          <br><br>
          <button class="btn-primary" onclick="saveFaq()">Lưu FAQ</button>
        </div>
      </div>

      <!-- TAB 3: ADMIN & TÀI KHOẢN -->
      <div id="tab-accounts" class="tab-pane">
        <div class="card">
          <h3><ion-icon name="people-outline" style="vertical-align:middle; margin-right:6px;"></ion-icon> Zalo Admin</h3>
          <p style="color:var(--text-muted); font-size: 14px; margin-bottom: 16px;"><i>Quyền duyệt thuộc về tài khoản Super Admin. Những người dùng Zalo được duyệt dưới đây sẽ có quyền sử dụng các lệnh Zalo và nhận thông báo sự cố.</i></p>
          
          <h4 style="margin-bottom: 12px; font-size: 15px;">Yêu cầu đang chờ duyệt</h4>
          <table style="width:100%; border-collapse:collapse; text-align:left; margin-bottom: 24px;">
             <thead>
               <tr style="border-bottom:2px solid var(--border-color);">
                 <th style="padding:10px;">Zalo ID</th>
                 <th style="padding:10px;">Tên Zalo</th>
                 <th style="padding:10px;">Thao tác</th>
               </tr>
             </thead>
             <tbody id="pendingAdminsTbody">
               <tr><td colspan="3" style="padding:10px; text-align:center;">Đang tải...</td></tr>
             </tbody>
          </table>

          <h4 style="margin-bottom: 12px; font-size: 15px;">Danh sách Zalo Admin chính thức</h4>
          <table style="width:100%; border-collapse:collapse; text-align:left;">
             <thead>
               <tr style="border-bottom:2px solid var(--border-color);">
                 <th style="padding:10px;">Zalo ID</th>
                 <th style="padding:10px;">Tên Zalo</th>
                 <th style="padding:10px;">Thao tác</th>
               </tr>
             </thead>
             <tbody id="activeAdminsTbody">
               <tr><td colspan="3" style="padding:10px; text-align:center;">Đang tải...</td></tr>
             </tbody>
          </table>
        </div>

        <div class="card" style="margin-top: 24px;">
          <h3><ion-icon name="person-add-outline" style="vertical-align:middle; margin-right:6px;"></ion-icon> Tài khoản Web Vận hành</h3>
          <p style="color:var(--text-muted); font-size: 14px; margin-bottom: 20px;">Tạo và phân quyền tài khoản cho nhân viên Vận hành. Tự động liên kết hiển thị tên với Zalo.</p>
          
          <div style="background: var(--bg-color); padding: 20px; border-radius: 12px; border: 1px solid var(--border-color); margin-bottom: 24px;">
            <h4 style="margin-top:0; margin-bottom:16px; font-size: 15px; color: var(--text-main); font-weight: 600;">Thêm tài khoản mới</h4>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 16px; margin-bottom: 16px;">
              <input type="text" id="newWebUsername" placeholder="Tên đăng nhập *" style="width:100%; box-sizing:border-box; padding:10px 14px; border-radius:8px; border:1px solid var(--border-color); background: var(--card-bg); color: var(--text-main); font-size: 14px; outline: none;" onfocus="this.style.borderColor='#2563eb'" onblur="this.style.borderColor='var(--border-color)'">
              <input type="password" id="newWebPassword" placeholder="Mật khẩu *" style="width:100%; box-sizing:border-box; padding:10px 14px; border-radius:8px; border:1px solid var(--border-color); background: var(--card-bg); color: var(--text-main); font-size: 14px; outline: none;" onfocus="this.style.borderColor='#2563eb'" onblur="this.style.borderColor='var(--border-color)'">
              <input type="text" id="newWebDisplayName" placeholder="Tên hiển thị (VD: Nguyễn Văn A) *" style="width:100%; box-sizing:border-box; padding:10px 14px; border-radius:8px; border:1px solid var(--border-color); background: var(--card-bg); color: var(--text-main); font-size: 14px; outline: none;" onfocus="this.style.borderColor='#2563eb'" onblur="this.style.borderColor='var(--border-color)'">
              <select id="newWebZaloId" style="width:100%; box-sizing:border-box; padding:10px 14px; border-radius:8px; border:1px solid var(--border-color); background: var(--card-bg); color: var(--text-main); font-size: 14px; outline: none;">
                 <option value="">-- Chọn tài khoản Zalo --</option>
              </select>
            </div>
            <div style="display: flex; flex-wrap: wrap; gap: 16px; align-items: center;">
              <select id="newWebRole" style="flex: 1; min-width: 180px; box-sizing:border-box; padding:10px 14px; border-radius:8px; border:1px solid var(--border-color); background: var(--card-bg); color: var(--text-main); font-size: 14px; outline: none;">
                 <option value="ADMIN">Vận hành</option>
                 <option value="SUPER_ADMIN">Quản trị viên</option>
              </select>
              <button class="btn-primary" onclick="createWebUser()" style="padding:10px 24px;">Tạo tài khoản</button>
            </div>
          </div>

          <h4 style="margin-bottom: 12px; font-size: 15px;">Danh sách tài khoản Web hiện tại</h4>
          <table style="width:100%; border-collapse:collapse; text-align:left;">
             <thead>
               <tr style="border-bottom:2px solid var(--border-color);">
                 <th style="padding:10px;">Tên đăng nhập</th>
                 <th style="padding:10px;">Tên hiển thị</th>
                 <th style="padding:10px;">Liên kết Zalo</th>
                 <th style="padding:10px;">Vai trò</th>
                 <th style="padding:10px; text-align:right;">Thao tác</th>
               </tr>
             </thead>
             <tbody id="webUsersTbody">
               <tr><td colspan="5" style="padding:10px; text-align:center;">Đang tải...</td></tr>
             </tbody>
          </table>
        </div>
      </div>

      <!-- TAB 4: QUẢN LÝ NHÓM -->
      <div id="tab-groups" class="tab-pane">
        <div class="card">
          <h3><ion-icon name="megaphone-outline" style="vertical-align:middle; margin-right:6px;"></ion-icon> Nhóm nhận thông báo Zalo</h3>
          <p style="font-size:14px; opacity:0.8; margin-top:0px; margin-bottom:16px;">Danh sách các nhóm Zalo đã cài đặt để nhận thông báo sự cố (Broadcast).</p>
          <div style="border: 1px solid var(--border-color); border-radius: 12px; overflow: hidden;">
            ${groupRows}
          </div>
        </div>
      </div>

      <!-- TAB 5: QUY TẮC AI -->
      <div id="tab-prompt" class="tab-pane">
        <div class="card">
          <h3><ion-icon name="search-outline" style="vertical-align:middle; margin-right:6px;"></ion-icon> Chế độ Xem trước: Lệnh hệ thống (System Prompt)</h3>
          <p style="font-size:14px; opacity:0.8; margin-top: 0px; margin-bottom: 16px;">Đây là toàn bộ quy tắc nền tảng mà AI đang sử dụng để suy luận, phân loại sự cố và xưng hô (Chế độ chỉ xem).</p>
          <div style="background-color: var(--bg-color); padding: 16px; border-radius: 8px; border: 1px solid var(--border-color); font-family: monospace; font-size: 13px; line-height: 1.6; white-space: pre-wrap; overflow-y: auto; height: 350px; color: var(--text-main);">
${systemPromptPreview}
          </div>
        </div>
      </div>

      <!-- Modal Chỉnh Sửa Tài Khoản Web -->
      <div id="editUserModal" style="display:none; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.5); z-index:10000; align-items:center; justify-content:center;">
        <div style="background:var(--card-bg); padding:24px; border-radius:12px; width:450px; max-width:90%; border:1px solid var(--border-color); box-shadow:0 10px 25px -5px rgba(0,0,0,0.1);">
          <h3 style="margin-top:0; margin-bottom:16px;">Chỉnh sửa tài khoản Web</h3>
          <input type="hidden" id="editWebUsername">
          
          <div style="margin-bottom:14px;">
            <label style="display:block; font-size:13px; font-weight:600; margin-bottom:6px;">Tên hiển thị *</label>
            <input type="text" id="editWebDisplayName" style="width:100%; box-sizing:border-box; padding:10px; border-radius:8px; border:1px solid var(--border-color); background:var(--bg-color); color:var(--text-main);">
          </div>
          <div style="margin-bottom:14px;">
            <label style="display:block; font-size:13px; font-weight:600; margin-bottom:6px;">Liên kết Zalo *</label>
            <select id="editWebZaloId" style="width:100%; box-sizing:border-box; padding:10px; border-radius:8px; border:1px solid var(--border-color); background:var(--bg-color); color:var(--text-main);">
               <option value="">-- Chọn tài khoản Zalo --</option>
            </select>
          </div>
          <div style="margin-bottom:14px;">
            <label style="display:block; font-size:13px; font-weight:600; margin-bottom:6px;">Vai trò *</label>
            <select id="editWebRole" style="width:100%; box-sizing:border-box; padding:10px; border-radius:8px; border:1px solid var(--border-color); background:var(--bg-color); color:var(--text-main);">
               <option value="ADMIN">Vận hành</option>
               <option value="SUPER_ADMIN">Quản trị viên</option>
            </select>
          </div>
          <div style="margin-bottom:20px;">
            <label style="display:block; font-size:13px; font-weight:600; margin-bottom:6px;">Mật khẩu mới (Bỏ trống nếu không đổi)</label>
            <input type="password" id="editWebPassword" placeholder="Nhập mật khẩu mới..." style="width:100%; box-sizing:border-box; padding:10px; border-radius:8px; border:1px solid var(--border-color); background:var(--bg-color); color:var(--text-main);">
          </div>

          <div style="display:flex; justify-content:flex-end; gap:10px;">
            <button onclick="closeEditUserModal()" style="background:var(--border-color); color:var(--text-main);">Hủy</button>
            <button onclick="submitEditWebUser()" class="btn-primary">Lưu thay đổi</button>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  return html;
}

module.exports = {
  getSettingsHtml
};
