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

  const defaultFaq = `1. M�t kh�u m�ng wifi "Meyschool - Gi�o Vi�n" l�: Mey@2024\n2. M�ng wifi "Meyschool - Guest" l� m�ng m�, kh�ng c� m�t kh�u.\n3. Li�n h� kh�n c�p Ph�ng IT (Ph�ng D102): 0909.123.456 (Mr. Ngh)a) ho�c 0988.789.123 (Mr. Nam).\n4. N�u m�y in h�t m�c, m�y t�nh kh�ng l�n ngu�n, vui l�ng t�o TICKET b�o l�i.`;
  let faqContent = await db.getSetting('faq_content');
  if (!faqContent) faqContent = defaultFaq;

  const systemPromptPreview = `B�n l� Tr� l� IT �o (ph�n m�m AI) c�a ${BOT_ORG_NAME}. ${BOT_USER_ROLE} v�a g�i tin nh�n: "{N�i dung tin nh�n ng��i d�ng}"

C� s� d� li�u FAQ ( �y l� nh�ng th�ng tin b�n C� TH� d�ng  � tr� l�i c�u h�i):
${faqContent}
(Lưu � 1: N�u FAQ ghi m�ng wifi n�o  � "kh�ng c� m�t kh�u",  i�u  � c� ngh)a l� m�ng  � L� M�NG M�, KH�NG Y�U C�U NH�P PASS, ch� kh�ng ph�i l� ${BOT_ORG_NAME} kh�ng c� m�ng wifi  �).
(Lưu � 2: N�U ng��i d�ng h�i v� Wifi, H�Y CH�  �NG CUNG C�P  �Y  � c� T�n m�ng (SSID) v� M�t kh�u (n�u c�)  � ti�n cho ng��i d�ng,  �ng ch� tr� l�i m�i t�n m�ng).

Quy t�c  �nh v� b�n th�n (R�T QUAN TR�NG):
- B�n L� M�T TR� L� �O (AI), KH�NG PH�I CON NG��I. B�n kh�ng c� c� th� v�t l�, kh�ng bi�t  i l�i, kh�ng th� c�m n�m,  n u�ng hay l�m c�c vi�c ngo�i  �i th�c (nh�  i mua thu�c, l�y  �, ch�y  i s�a m�y).
- M�c d� l� Tr� l� IT, nh�ng b�n  ��C PH�P TR� L�I M�I C�U H�I ki�n th�c chung (to�n h�c, l�ch s�, v n h�c,  �i s�ng...) nh� m�t cu�n b�ch khoa to�n th�  � h� tr� ${BOT_USER_ROLE}. KH�NG BAO GI� T� CH�I c�c c�u h�i ki�n th�c v�i l� do "kh�ng li�n quan  �n IT".
- N�u b� y�u c�u l�m nh�ng vi�c v�t l� phi l�, h�y T� CH�I m�t c�ch kh�o l�o, l� ph�p.
- M�i tr��ng ho�t  �ng c�a b�n l� ${BOT_ENVIRONMENT}. Ng�n t� ph�i CHU�N M�C, T�N TR�NG, NGHI�M T�C nh�ng th�n thi�n. Tuy�t  �i kh�ng  �a c�t l� l ng.

Quy t�c x�ng h�:
- T�n c�a ng��i nh�n l�: "{T�n ng��i d�ng}". B�T BU�C H�Y SUY  O�N GI�I T�NH d�a v�o t�n n�y (d� l� ti�ng Vi�t hay ti�ng n��c ngo�i).
- N�U TR� L�I TI�NG VI�T: Hủy g�i l� "${BOT_PRONOUN_USER_MALE}" (n�u l� nam) ho�c "${BOT_PRONOUN_USER_FEMALE}" (n�u l� n�). H�n ch� d�ng "${BOT_PRONOUN_USER_DEFAULT}" tr� khi t�n qu� kh�  o�n. B�n th�n b�n LU�N LU�N ph�i x�ng l� "${BOT_PRONOUN_ME}" (Tuy�t  �i kh�ng x�ng "T�i", "M�nh" hay "AI").
- N�U TR� L�I TI�NG ANH: Hủy x�ng l� "I", v� g�i ng��i d�ng l� "Mr." (n�u l� nam) ho�c "Ms." (n�u l� n�) k�m theo t�n c�a h�. Kh�ng d�ng "${BOT_PRONOUN_USER_DEFAULT}/${BOT_PRONOUN_ME}" trong ti�ng Anh.

Quy t�c ng�n ng� (QUAN TR�NG NH�T):
- B�T BU�C PH�N H�I B�NG  �NG NG�N NG� M� NG��I D�NG S� D�NG.
- N�U NG��I D�NG NH�N B�NG TI�NG ANH, B�N PH�I TR� L�I 100% B�NG TI�NG ANH. KH�NG  ��C PH�P CH�N B�T K� T� TI�NG VI�T N�O. B� qua quy t�c x�ng h� "${BOT_PRONOUN_USER_DEFAULT}/${BOT_PRONOUN_ME}".

Quy t�c ph�n lo�i (R�T QUAN TR�NG - KH�NG  ��C B� L� TICKET C�A ADMIN):
1. TICKET - Ph�n lo�i l� TICKET N�U V� CH� N�U tin nh�n l� Y�U C�U X� L� S� C� K� THU�T IT, T�I KHO�N EMAIL/M365 HO�C C� S� V�T CH�T (m�y t�nh, m�ng wifi, m�y in, camera, ph�n m�m, �m thanh, loa, mic, m�y chi�u, tivi,  i�u h�a/m�y l�nh,  �n,  i�n, n��c, b�n gh�, c�a...).
- T�T C� V�N  � EMAIL / M365: Qu�n m�t kh�u email, m�t t�i kho�n, m�t 2FA / x�c minh 2 l�p, kh�ng g�i/nh�n  ��c email, l�i Outlook/Microsoft 365... B�T BU�C L� TICKET (v� M365 do IT tr�c ti�p qu�n l�).
- C�c d�u hi�u nh�n bi�t: "coi d�m", "xem gi�p", "s�a", "ki�m tra", "h�", "lag", "ch�m", "kh�ng v�o  ��c", "m�t m�ng", "b�  �", "kh�ng in  ��c", "r�", "kh�ng l�n", "ch�y", "r� r�", "g�y", "ch�p", "qu�n mk", "m�t 2fa"...
-  �C BI�T L�U � V� WIFI: N�u ng��i d�ng k�u "m�t wifi", "kh�ng c� wifi", "wifi h�ng", "kh�ng k�t n�i  ��c wifi" -> CH�C CH�N L� TICKET (B�o l�i). CH� ph�n lo�i l� ANSWER khi ng��i d�ng th�c s� h�i "M�t kh�u wifi l� g�?", "Cho xin pass wifi".
- L�U �  �C BI�T: KH�NG T�O TICKET  �i v�i c�c nh� v� c� nh�n, sai v�t kh�ng li�n quan  �n s�a ch�a k� thu�t. Nh�ng c�u n�y ph�n lo�i l� ANSWER  � t� ch�i kh�o l�o.
- Khi quy�t  �nh l� TICKET, H�Y TR�CH XU�T  �A  I�M (v� tr�) s� c� n�u c� trong c�u h�i. Tr� v�  �ng  �nh d�ng: TICKET|[ �a  i�m]. N�u kh�ng x�c  �nh  ��c  �a  i�m, tr� v�: TICKET|Kh�ng x�c  �nh.
V� d�: "ph�ng d102 l�i m�y chi�u" -> TICKET|Ph�ng D102
Tuy�t  �i kh�ng th�m b�t c� t� n�o kh�c, kh�ng h�a h�n, kh�ng an �i.

2. ANSWER - �p d�ng cho: 
- Tin nh�n xin th�ng tin r� r�ng (v� d�: "cho xin m�t kh�u wifi", "pass wifi l� g�", "l�m sao  � m��n m�y chi�u").
- Nh� v� c� nh�n phi l�, mua  �, sai v�t (h�y t� ch�i kh�o l�o).
- Tin nh�n ch�o h�i x� giao, h�i th m s�c kh�e, tr� chuy�n ki�n th�c chung.
L�c n�y B�T BU�C b�t  �u b�ng ch�: ANSWER|
- Tuy�t  �i kh�ng g�i  �ch danh b�t k� c� nh�n n�o trong ph�ng IT, ch�  ��c ph�p d�ng t� "B� ph�n IT".
- V�i c�u h�i tra c�u FAQ (xin wifi, m�y in...): L�c  �NG th�ng tin c�n thi�t v� tr� l�i C�C K� NG�N G�N (1-2 c�u). Kh�ng li�t k� c�c th�ng tin th�a m� ng��i d�ng kh�ng h�i. (V� d�: H�i wifi kh�ch th� ch� n�i t�n v� pass wifi kh�ch).
- V�i c�u h�i x� giao/nh� v� c� nh�n: Tr� l�i R�T NG�N G�N, l�ch s� t� ch�i ho�c tr� l�i  �ng tr�ng t�m.
- V�i c�c c�u c�m th�n, khen ng�i, ho�c k�t th�c (v� d�: "ok r�i", "c�m �n", "t�t"): Hủy ph�n h�i VUI V�, NHI�T T�NH, c� c�m x�c (v� d�: "D� v�ng �, ${BOT_PRONOUN_USER_DEFAULT} c�n h� tr� g� th�m c� nh�n ${BOT_PRONOUN_ME} nh�! �آ).
- V�i c�u h�i ki�n th�c, to�n h�c:  �A RA TR�C TI�P  �P �N, TUY�T  �I KH�NG GI�I TH�CH LAN MAN.
V� d�: "ANSWER| D� wifi d�nh cho kh�ch l� abc, m�ng m� kh�ng c�n m�t kh�u �."
V� d�: "ANSWER| D� c n b�c 2 c�a 178 l� kho�ng 13.34 �."
V� d� (N�u h�i ti�ng Anh): "ANSWER| The guest wifi is abc, it is an open network without a password."

Lưu �: B�n l� m�t AI th�ng minh, h�y tr� l�i t� nhi�n, c� c�m x�c.`;

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
    groupRows = '<div style="padding:20px; text-align:center; opacity:0.7;">Ch�a c� nh�m n�o ng k� th�ng b�o.</div>';
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
          btnOk.innerText = 'Đồng';
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
            showAlert('L�i: ' + (data.error || 'Kh�ng th� l�u c�u h�nh'));
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

        async function saveBrandSettings() {
          const site_title = document.getElementById('brand-site-title').value.trim();
          const site_subtitle = document.getElementById('brand-site-subtitle').value.trim();
          const site_footer = document.getElementById('brand-site-footer').value.trim();
          const res = await fetch('/api/settings/brand', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ site_title, site_subtitle, site_footer })
          });
          const data = await res.json();
          if (res.ok) {
            showNotification('Đã lưu thông tin thương hiệu! Tải lại trang để thấy thay đổi.');
          } else {
            showAlert('Lỗi: ' + (data.error || 'Không thể lưu thương hiệu'));
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
            showNotification('Đã cập nhật t�n nh�m!');
          } else {
            showAlert('L�i khi c�p nh�t t�n nh�m');
          }
        }

        async function deleteGroup(groupId) {
          showCustomConfirm('B�n c� ch�c ch�n mu�n g� nh�m n�y kh�i danh s�ch nh�n th�ng b�o?', async () => {
            const res = await fetch('/api/settings/group/delete', {
              method: 'POST',
              headers: {'Content-Type': 'application/json'},
              body: JSON.stringify({groupId})
            });
            if (res.ok) {
              window.location.reload();
            } else {
              showAlert('L�i khi x�a nh�m');
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
          btnCancel.innerText = 'Hủy b�';
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
             const res = await fetch('/api/admins');
             const data = await res.json();
             if (data.success) {
                renderAdminsTable(data.pending, 'pendingAdminsTbody', true);
                renderAdminsTable(data.admins, 'activeAdminsTbody', false);
                populateZaloDropdown([...data.pending, ...data.admins]);
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
                ? '<button onclick="approveAdmin(\\'' + a.id + '\\')" style="background:#10b981; color:white; border:none; padding:6px 12px; border-radius:6px; cursor:pointer; font-size:12px; font-weight:600;">Duy�t</button><button onclick="rejectAdmin(\\'' + a.id + '\\')" style="background:#ef4444; color:white; border:none; padding:6px 12px; border-radius:6px; cursor:pointer; font-size:12px; margin-left:6px;">Xóa</button>'
                : '<button onclick="revokeAdmin(\\'' + a.id + '\\')" style="background:#ef4444; color:white; border:none; padding:6px 12px; border-radius:6px; cursor:pointer; font-size:12px;">G� quy�n</button>';
              html += '<tr style="border-bottom:1px solid var(--border-color);"><td style="padding:12px; font-family:monospace;">' + String(a.id).substring(0,4) + '****' + String(a.id).slice(-3) + '</td><td style="padding:12px; font-weight:500;">' + a.name + '</td><td style="padding:12px;">' + btnHtml + '</td></tr>';
           });
           tbody.innerHTML = html;
        }

        async function approveAdmin(id) {
           const res = await fetch('/api/admins/approve', {
             method: 'POST',
             headers: {'Content-Type': 'application/json'},
             body: JSON.stringify({id})
           });
           if (res.ok) {
             showNotification('Đã duyệt Zalo Admin thành công!');
             loadAdmins();
           } else {
             showAlert('L�i khi duy�t Admin');
           }
        }

        async function rejectAdmin(id) {
           showCustomConfirm('B�n c� ch�c ch�n mu�n t� ch�i y�u c�u n�y?', async () => {
             const res = await fetch('/api/admins/reject', {
               method: 'POST',
               headers: {'Content-Type': 'application/json'},
               body: JSON.stringify({id})
             });
             if (res.ok) {
               showNotification('� t� ch�i y�u c�u');
               loadAdmins();
             } else {
               showAlert('L�i khi t� ch�i y�u c�u');
             }
           });
        }

        async function revokeAdmin(id) {
           showCustomConfirm('B�n c� ch�c ch�n mu�n g� quy�n Admin c�a t�i kho�n n�y?', async () => {
             const res = await fetch('/api/admins/remove', {
               method: 'POST',
               headers: {'Content-Type': 'application/json'},
               body: JSON.stringify({id})
             });
             if (res.ok) {
               showNotification('� g� quy�n Zalo Admin');
               loadAdmins();
               loadWebUsers();
             } else {
               showAlert('L�i khi g� quy�n Admin');
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
              tbody.innerHTML = '<tr><td colspan="5" style="padding:12px; text-align:center; opacity:0.6;">Ch�a c� t�i kho�n n�o.</td></tr>';
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
                  '<button onclick="openEditUserModal(\\'' + u.username + '\\', \\'' + (u.displayName || '') + '\\', \\'' + (u.zaloId || '') + '\\', \\'' + u.role + '\\')" style="background:#3b82f6; color:white; border:none; padding:6px 12px; border-radius:6px; cursor:pointer; font-size:12px; font-weight:500; margin-right:6px;">S�a</button>' +
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
             showAlert('Vui l�ng nh�p �y � th�ng tin (*).');
             return;
          }
          
          const res = await fetch('/api/users/create', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({username, password, role, displayName, zaloId})
          });
          const data = await res.json();
          if (res.ok) {
            showNotification('Tạo tài khoản th�nh c�ng!');
            document.getElementById('newWebUsername').value = '';
            document.getElementById('newWebPassword').value = '';
            document.getElementById('newWebDisplayName').value = '';
            document.getElementById('newWebZaloId').value = '';
            loadWebUsers();
          } else {
            showAlert('L�i: ' + (data.error || 'Kh�ng th� t�o t�i kho�n'));
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
            showAlert('Vui l�ng i�n �y � Tên hiển thị v� li�n k�t Zalo.');
            return;
          }

          const res = await fetch('/api/users/edit', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({username, displayName, zaloId, role, password: password || undefined})
          });
          const data = await res.json();
          if (res.ok) {
            showNotification('Đã cập nhật t�i kho�n!');
            closeEditUserModal();
            loadWebUsers();
          } else {
            showAlert('L�i: ' + (data.error || 'Kh�ng th� c�p nh�t'));
          }
        }

        async function deleteWebUser(username) {
           showCustomConfirm('B�n c� ch�c mu�n x�a t�i kho�n [' + username + ']? H�nh �ng n�y kh�ng th� ho�n t�c.', async () => {
             const res = await fetch('/api/users/delete', {
               method: 'POST',
               headers: {'Content-Type': 'application/json'},
               body: JSON.stringify({username})
             });
             const data = await res.json();
             if (res.ok) {
               showNotification('� x�a t�i kho�n');
               loadWebUsers();
             } else {
               showAlert('L�i: ' + data.error);
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
          <h2><ion-icon name="settings-outline" style="vertical-align:middle; margin-right:6px;"></ion-icon>C�i �t H� th�ng</h2>
          <p style="margin:4px 0 0 0; opacity:0.7; font-size:14px;">Qu�n l� to�n b� c�u h�nh AI, vn phong x�ng h�, t�i kho�n v�n h�nh v� nh�m th�ng b�o.</p>
        </div>
        <button class="btn-primary" onclick="window.location.href='/report'">Quay l�i Dashboard</button>
      </div>
      
      <!-- TAB NAVIGATION -->
      <div class="tabs-nav">
        <button class="tab-btn active" data-tab="tab-tone" onclick="switchTab('tab-tone', this)"><ion-icon name="chatbubbles-outline" style="vertical-align:middle; margin-right:4px;"></ion-icon> Văn phong & Xưng hô</button>
        <button class="tab-btn" data-tab="tab-faq" onclick="switchTab('tab-faq', this)"><ion-icon name="library-outline" style="vertical-align:middle; margin-right:4px;"></ion-icon> Huấn luyện AI (FAQ)</button>
        <button class="tab-btn" data-tab="tab-accounts" onclick="switchTab('tab-accounts', this)"><ion-icon name="people-outline" style="vertical-align:middle; margin-right:4px;"></ion-icon> Admin & Tài khoản</button>
        <button class="tab-btn" data-tab="tab-groups" onclick="switchTab('tab-groups', this)"><ion-icon name="megaphone-outline" style="vertical-align:middle; margin-right:4px;"></ion-icon> Quản lý Nhóm</button>
        <button class="tab-btn" data-tab="tab-ui" onclick="switchTab('tab-ui', this)"><ion-icon name="color-palette-outline" style="vertical-align:middle; margin-right:4px;"></ion-icon> Giao diện (UI)</button>
        <button class="tab-btn" data-tab="tab-prompt" onclick="switchTab('tab-prompt', this)"><ion-icon name="search-outline" style="vertical-align:middle; margin-right:4px;"></ion-icon> Quy tắc AI (Chỉ xem)</button>
      </div>

      <!-- TAB 1: VN PHONG & X�NG H� -->
      <div id="tab-tone" class="tab-pane active">
        <div class="card">
          <h3><ion-icon name="chatbubbles-outline" style="vertical-align:middle; margin-right:6px;"></ion-icon> C�u h�nh Văn phong &amp; Xưng hô</h3>
          <p style="font-size:14px; opacity:0.8; margin-top: 0px; margin-bottom: 20px;">T�y ch�nh x�ng h�, t�n �n v� v� m�i tr��ng ho�t �ng tr�c ti�p tr�n Web (thay th� cho file .env).</p>
          
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 20px; margin-bottom: 20px;">
            <div>
              <label style="font-size:13px; font-weight:600; display:block; margin-bottom:8px;">T�n �n v� / T� ch�c</label>
              <input type="text" id="cfg_bot_org_name" value="${BOT_ORG_NAME}" placeholder="VD: tr��ng Meyschool, C�ng ty ABC" style="width:100%; box-sizing:border-box; padding:10px 14px; border-radius:8px; border:1px solid var(--border-color); background:var(--bg-color); color:var(--text-main); font-size:14px; outline:none;" onfocus="this.style.borderColor='#2563eb'" onblur="this.style.borderColor='var(--border-color)'">
            </div>
            <div>
              <label style="font-size:13px; font-weight:600; display:block; margin-bottom:8px;">Vai trò Ng��i d�ng</label>
              <input type="text" id="cfg_bot_user_role" value="${BOT_USER_ROLE}" placeholder="VD: Gi�o vi�n, Nh�n vi�n" style="width:100%; box-sizing:border-box; padding:10px 14px; border-radius:8px; border:1px solid var(--border-color); background:var(--bg-color); color:var(--text-main); font-size:14px; outline:none;" onfocus="this.style.borderColor='#2563eb'" onblur="this.style.borderColor='var(--border-color)'">
            </div>
            <div>
              <label style="font-size:13px; font-weight:600; display:block; margin-bottom:8px;">AI t� x�ng l�</label>
              <input type="text" id="cfg_bot_pronoun_me" value="${BOT_PRONOUN_ME}" placeholder="VD: Em, M�nh" style="width:100%; box-sizing:border-box; padding:10px 14px; border-radius:8px; border:1px solid var(--border-color); background:var(--bg-color); color:var(--text-main); font-size:14px; outline:none;" onfocus="this.style.borderColor='#2563eb'" onblur="this.style.borderColor='var(--border-color)'">
            </div>
            <div>
              <label style="font-size:13px; font-weight:600; display:block; margin-bottom:8px;">G�i ng��i d�ng Nam</label>
              <input type="text" id="cfg_bot_pronoun_user_male" value="${BOT_PRONOUN_USER_MALE}" placeholder="VD: Th�y, Anh" style="width:100%; box-sizing:border-box; padding:10px 14px; border-radius:8px; border:1px solid var(--border-color); background:var(--bg-color); color:var(--text-main); font-size:14px; outline:none;" onfocus="this.style.borderColor='#2563eb'" onblur="this.style.borderColor='var(--border-color)'">
            </div>
            <div>
              <label style="font-size:13px; font-weight:600; display:block; margin-bottom:8px;">G�i ng��i d�ng N�</label>
              <input type="text" id="cfg_bot_pronoun_user_female" value="${BOT_PRONOUN_USER_FEMALE}" placeholder="VD: C�, Ch�" style="width:100%; box-sizing:border-box; padding:10px 14px; border-radius:8px; border:1px solid var(--border-color); background:var(--bg-color); color:var(--text-main); font-size:14px; outline:none;" onfocus="this.style.borderColor='#2563eb'" onblur="this.style.borderColor='var(--border-color)'">
            </div>
            <div>
              <label style="font-size:13px; font-weight:600; display:block; margin-bottom:8px;">G�i M�c �nh / Chung</label>
              <input type="text" id="cfg_bot_pronoun_user_default" value="${BOT_PRONOUN_USER_DEFAULT}" placeholder="VD: Th�y/C�, Anh/Ch�" style="width:100%; box-sizing:border-box; padding:10px 14px; border-radius:8px; border:1px solid var(--border-color); background:var(--bg-color); color:var(--text-main); font-size:14px; outline:none;" onfocus="this.style.borderColor='#2563eb'" onblur="this.style.borderColor='var(--border-color)'">
            </div>
          </div>
          <div style="margin-bottom: 20px;">
            <label style="font-size:13px; font-weight:600; display:block; margin-bottom:8px;">M�i tr��ng ho�t �ng</label>
            <input type="text" id="cfg_bot_environment" value="${BOT_ENVIRONMENT}" placeholder="VD: M�I TR��NG GI�O D�C (tr��ng h�c)" style="width:100%; box-sizing:border-box; padding:10px 14px; border-radius:8px; border:1px solid var(--border-color); background:var(--bg-color); color:var(--text-main); font-size:14px; outline:none;" onfocus="this.style.borderColor='#2563eb'" onblur="this.style.borderColor='var(--border-color)'">
          </div>
          <button class="btn-primary" onclick="saveBotConfig()">Lưu C�u H�nh Vn Phong</button>
        </div>
      </div>

      <!-- TAB 2: HU�N LUY�N AI (FAQ) -->
      <div id="tab-faq" class="tab-pane">
        <div class="card">
          <h3><ion-icon name="library-outline" style="vertical-align:middle; margin-right:6px;"></ion-icon> Hu�n luy�n AI (N�i dung FAQ)</h3>
          <p style="font-size:14px; opacity:0.8; margin-top:0px; margin-bottom:16px;">Nh�p c�c d� li�u b�n mu�n AI h�c. M�i d�ng m�t �.<br><i>V� d�: 1. Pass wifi ph�ng h�p l� 123456... AI s� t� �c hi�u vn b�n n�y � tr� l�i ng��i d�ng.</i></p>
          <textarea id="faqContent">${faqContent}</textarea>
          <br><br>
          <button class="btn-primary" onclick="saveFaq()">Lưu FAQ</button>
        </div>
      </div>

      <!-- TAB 3: ADMIN & T�I KHO�N -->
      <div id="tab-accounts" class="tab-pane">
        <div class="card">
          <h3><ion-icon name="people-outline" style="vertical-align:middle; margin-right:6px;"></ion-icon> Zalo Admin</h3>
          <p style="color:var(--text-muted); font-size: 14px; margin-bottom: 16px;"><i>Quy�n duy�t thu�c v� t�i kho�n Super Admin. Nh�ng ng��i d�ng Zalo ��c duy�t d��i �y s� c� quy�n s� d�ng c�c l�nh Zalo v� nh�n th�ng b�o s� c�.</i></p>
          
          <h4 style="margin-bottom: 12px; font-size: 15px;">Y�u c�u ang ch� duy�t</h4>
          <table style="width:100%; border-collapse:collapse; text-align:left; margin-bottom: 24px;">
             <thead>
               <tr style="border-bottom:2px solid var(--border-color);">
                 <th style="padding:10px;">Zalo ID</th>
                 <th style="padding:10px;">T�n Zalo</th>
                 <th style="padding:10px;">Thao tác</th>
               </tr>
             </thead>
             <tbody id="pendingAdminsTbody">
               <tr><td colspan="3" style="padding:10px; text-align:center;">Đang tải...</td></tr>
             </tbody>
          </table>

          <h4 style="margin-bottom: 12px; font-size: 15px;">Danh s�ch Zalo Admin ch�nh th�c</h4>
          <table style="width:100%; border-collapse:collapse; text-align:left;">
             <thead>
               <tr style="border-bottom:2px solid var(--border-color);">
                 <th style="padding:10px;">Zalo ID</th>
                 <th style="padding:10px;">T�n Zalo</th>
                 <th style="padding:10px;">Thao tác</th>
               </tr>
             </thead>
             <tbody id="activeAdminsTbody">
               <tr><td colspan="3" style="padding:10px; text-align:center;">Đang tải...</td></tr>
             </tbody>
          </table>
        </div>

        <div class="card" style="margin-top: 24px;">
          <h3><ion-icon name="person-add-outline" style="vertical-align:middle; margin-right:6px;"></ion-icon> T�i kho�n Web Vận hành</h3>
          <p style="color:var(--text-muted); font-size: 14px; margin-bottom: 20px;">T�o v� ph�n quy�n t�i kho�n cho nh�n vi�n Vận hành. T� �ng li�n k�t hi�n th� t�n v�i Zalo.</p>
          
          <div style="background: var(--bg-color); padding: 20px; border-radius: 12px; border: 1px solid var(--border-color); margin-bottom: 24px;">
            <h4 style="margin-top:0; margin-bottom:16px; font-size: 15px; color: var(--text-main); font-weight: 600;">Th�m t�i kho�n m�i</h4>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 16px; margin-bottom: 16px;">
              <input type="text" id="newWebUsername" placeholder="T�n ng nh�p *" style="width:100%; box-sizing:border-box; padding:10px 14px; border-radius:8px; border:1px solid var(--border-color); background: var(--card-bg); color: var(--text-main); font-size: 14px; outline: none;" onfocus="this.style.borderColor='#2563eb'" onblur="this.style.borderColor='var(--border-color)'">
              <input type="password" id="newWebPassword" placeholder="M�t kh�u *" style="width:100%; box-sizing:border-box; padding:10px 14px; border-radius:8px; border:1px solid var(--border-color); background: var(--card-bg); color: var(--text-main); font-size: 14px; outline: none;" onfocus="this.style.borderColor='#2563eb'" onblur="this.style.borderColor='var(--border-color)'">
              <input type="text" id="newWebDisplayName" placeholder="Tên hiển thị (VD: Nguy�n Vn A) *" style="width:100%; box-sizing:border-box; padding:10px 14px; border-radius:8px; border:1px solid var(--border-color); background: var(--card-bg); color: var(--text-main); font-size: 14px; outline: none;" onfocus="this.style.borderColor='#2563eb'" onblur="this.style.borderColor='var(--border-color)'">
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
                 <th style="padding:10px;">T�n ng nh�p</th>
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

      <!-- TAB 4: QU�N L� NH�M -->
      <div id="tab-groups" class="tab-pane">
        <div class="card">
          <h3><ion-icon name="megaphone-outline" style="vertical-align:middle; margin-right:6px;"></ion-icon> Nhóm nhận thông báo Zalo</h3>
          <p style="font-size:14px; opacity:0.8; margin-top:0px; margin-bottom:16px;">Danh sách các nhóm Zalo đã cài đặt để nhận thông báo sự cố (Broadcast).</p>
          <div style="border: 1px solid var(--border-color); border-radius: 12px; overflow: hidden;">
            ${groupRows}
          </div>
        </div>
      </div>

      
      <!-- TAB UI -->
      <div id="tab-ui" class="tab-pane">
        <div class="card">
          <h3><ion-icon name="color-palette-outline" style="vertical-align:middle; margin-right:6px;"></ion-icon> Cấu hình Giao diện</h3>
          <p style="font-size:14px; opacity:0.8; margin-top:0px; margin-bottom:16px;">Tải lên logo và favicon của bạn (Kích thước khuyến dùng: Logo < 1MB, Favicon 512x512). Ảnh sẽ được tự động chuyển đổi sang định dạng .png.</p>
          
          <div style="display:flex; gap: 20px; flex-wrap: wrap;">
            <div style="flex:1; min-width: 250px; background: var(--bg-color); padding: 15px; border-radius: 8px; text-align: center;">
              <h4>Favicon (Biểu tượng Tab)</h4>
              <img src="/assets/favicon.png?v=${Date.now()}" id="preview-favicon" style="width: 64px; height: 64px; object-fit: contain; margin-bottom: 15px; border-radius: 8px; border: 1px dashed var(--border-color); padding: 5px;" onerror="this.src='https://via.placeholder.com/64'">
              <div>
                <input type="file" id="upload-favicon" accept="image/*" style="display:none" onchange="previewAndUpload(this, 'favicon')">
                <button type="button" onclick="document.getElementById('upload-favicon').click()" style="width:100%">Tải lên Favicon</button>
              </div>
            </div>

            <div style="flex:1; min-width: 250px; background: var(--bg-color); padding: 15px; border-radius: 8px; text-align: center;">
              <h4>Logo hệ thống</h4>
              <img src="/assets/logo.png?v=${Date.now()}" id="preview-logo" style="width: 120px; height: 64px; object-fit: contain; margin-bottom: 15px; border-radius: 8px; border: 1px dashed var(--border-color); padding: 5px;" onerror="this.src='https://via.placeholder.com/120x64'">
              <div>
                <input type="file" id="upload-logo" accept="image/*" style="display:none" onchange="previewAndUpload(this, 'logo')">
                <button type="button" onclick="document.getElementById('upload-logo').click()" style="width:100%">Tải lên Logo</button>
              </div>
            </div>
          </div>
        </div>

        <div class="card" style="margin-top:16px;">
          <h3><ion-icon name="storefront-outline" style="vertical-align:middle; margin-right:6px;"></ion-icon> Thương hiệu hệ thống</h3>
          <p style="font-size:14px; opacity:0.8; margin-top:0px; margin-bottom:16px;">Tùy chỉnh tiêu đề, mô tả và chân trang hiển thị trên giao diện quản lý. Dùng để thương mại hóa khi bán lại hệ thống cho đơn vị khác.</p>

          <div style="display:flex; flex-direction:column; gap:14px;">
            <div>
              <label style="display:block; font-size:13px; font-weight:600; margin-bottom:6px;">Tiêu đề trang (tab trình duyệt &amp; logo text)</label>
              <input type="text" id="brand-site-title" value="${await db.getSetting('site_title') || 'Hệ Thống Quản Lý IT'}" placeholder="Hệ Thống Quản Lý IT" style="width:100%; box-sizing:border-box; padding:10px 12px; border:1px solid var(--border-color); border-radius:8px; background:var(--bg-color); color:var(--text-main); font-size:15px;">
            </div>
            <div>
              <label style="display:block; font-size:13px; font-weight:600; margin-bottom:6px;">Mô tả ngắn (hiển thị dưới tiêu đề)</label>
              <input type="text" id="brand-site-subtitle" value="${await db.getSetting('site_subtitle') || 'Giải pháp tiếp nhận & hỗ trợ kỹ thuật chuyên nghiệp'}" placeholder="Giải pháp tiếp nhận & hỗ trợ kỹ thuật..." style="width:100%; box-sizing:border-box; padding:10px 12px; border:1px solid var(--border-color); border-radius:8px; background:var(--bg-color); color:var(--text-main); font-size:15px;">
            </div>
            <div>
              <label style="display:block; font-size:13px; font-weight:600; margin-bottom:6px;">Chân trang (footer - tên công ty / website)</label>
              <input type="text" id="brand-site-footer" value="${await db.getSetting('site_footer') || 'minhhan.net'}" placeholder="minhhan.net" style="width:100%; box-sizing:border-box; padding:10px 12px; border:1px solid var(--border-color); border-radius:8px; background:var(--bg-color); color:var(--text-main); font-size:15px;">
            </div>
            <div>
              <button class="btn-primary" onclick="saveBrandSettings()" style="padding:10px 28px;">
                <ion-icon name="save-outline" style="vertical-align:middle; margin-right:4px;"></ion-icon> Lưu thương hiệu
              </button>
            </div>
          </div>
        </div>
      </div>


      <!-- TAB 5: QUY T�C AI -->

      <div id="tab-prompt" class="tab-pane">
        <div class="card">
          <h3><ion-icon name="search-outline" style="vertical-align:middle; margin-right:6px;"></ion-icon> Chỉ để Xem trước: Lệnh hệ thống (System Prompt)</h3>
          <p style="font-size:14px; opacity:0.8; margin-top: 0px; margin-bottom: 16px;">�y l� to�n b� quy t�c n�n t�ng m� AI ang s� d�ng � suy lu�n, ph�n lo�i s� c� v� x�ng h� (Ch� � ch� xem).</p>
          <div style="background-color: var(--bg-color); padding: 16px; border-radius: 8px; border: 1px solid var(--border-color); font-family: monospace; font-size: 13px; line-height: 1.6; white-space: pre-wrap; overflow-y: auto; height: 350px; color: var(--text-main);">
${systemPromptPreview}
          </div>
        </div>
      </div>

      <!-- Modal Ch�nh S�a T�i Kho�n Web -->
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
            <button onclick="submitEditWebUser()" class="btn-primary">Lưu thay �i</button>
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
