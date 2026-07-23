function getLoginHtml() {
  return `
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
      <style>
          :root {
              --bg-color: #f1f5f9;
              --card-bg: #ffffff;
              --text-main: #1e293b;
              --border-color: #cbd5e1;
              --input-bg: #ffffff;
          }
          [data-theme="dark"] {
              --bg-color: #0f172a;
              --card-bg: #1e293b;
              --text-main: #f8fafc;
              --border-color: #334155;
              --input-bg: #1e293b;
          }
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap');
        body { font-family: 'Inter', sans-serif; background: var(--bg-color); display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
        .login-card { background: var(--card-bg); padding: 40px; border-radius: 12px; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1); width: 100%; max-width: 400px; text-align: center; box-sizing: border-box; }
        .login-card img { max-width: 250px; margin-bottom: 20px; border-radius: 8px; }
        .login-card h2 { margin-top: 0; color: var(--text-main); font-size: 24px; }
        .input-group { margin-bottom: 20px; text-align: left; }
        .input-group label { display: block; font-size: 14px; font-weight: 500; color: var(--text-main); margin-bottom: 8px; }
        .input-group input { width: 100%; padding: 12px; border: 1px solid var(--border-color); border-radius: 8px; font-size: 16px; outline: none; box-sizing: border-box; background: var(--input-bg); color: var(--text-main); }
        .input-group input:focus { border-color: #3b82f6; box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1); }
        .btn { background: #3b82f6; color: white; border: none; padding: 12px; border-radius: 8px; width: 100%; font-size: 16px; font-weight: 600; cursor: pointer; transition: background 0.2s; }
        .btn:hover { background: #2563eb; }
        .error { color: #ef4444; font-size: 14px; margin-bottom: 16px; display: none; }
      </style>
    </head>
    <body>
      <div class="login-card">
        <img src="/assets/logo.png" alt="Logo" onerror="this.style.display='none'">
        <h2>Đăng Nhập Quản Trị</h2>
        <div class="error" id="errorMsg">Tài khoản hoặc mật khẩu không đúng!</div>
        <form id="loginForm" onsubmit="doLogin(event)">
          <div class="input-group">
            <label>Tên đăng nhập</label>
            <input type="text" id="username" required>
          </div>
          <div class="input-group">
            <label>Mật khẩu</label>
            <input type="password" id="password" required>
          </div>
          <button type="submit" class="btn">Đăng Nhập</button>
        </form>
      </div>
      <script>
        async function doLogin(e) {
          e.preventDefault();
          const btn = document.querySelector('.btn');
          btn.textContent = 'Đang đăng nhập...';
          btn.disabled = true;
          const u = document.getElementById('username').value;
          const p = document.getElementById('password').value;
          
          const res = await fetch('/login', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({username: u, password: p})
          });
          
          if (res.ok) {
            window.location.href = '/report';
          } else {
            document.getElementById('errorMsg').style.display = 'block';
            btn.textContent = 'Đăng Nhập';
            btn.disabled = false;
          }
        }
      </script>
    </body>
    </html>
  `;
}

function getSetupHtml() {
  return `
    <!DOCTYPE html>
    <html lang="vi">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Hệ Thống Quản Lý IT - minhhan.net</title>
      <style>
        body { font-family: sans-serif; background: #f1f5f9; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
        .card { background: #fff; padding: 40px; border-radius: 12px; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1); width: 100%; max-width: 400px; }
        h2 { margin-top: 0; color: #1e293b; text-align: center; }
        .input-group { margin-bottom: 20px; }
        label { display: block; font-size: 14px; font-weight: 500; margin-bottom: 8px; }
        input { width: 100%; padding: 12px; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 16px; box-sizing: border-box; }
        .btn { background: #3b82f6; color: white; border: none; padding: 12px; border-radius: 8px; width: 100%; font-size: 16px; font-weight: 600; cursor: pointer; }
        .recovery-box { display: none; background: #fef3c7; border: 1px solid #f59e0b; padding: 15px; border-radius: 8px; margin-top: 20px; color: #b45309; }
      </style>
    </head>
    <body>
      <div class="card">
        <h2>Khởi tạo Hệ thống</h2>
        <p style="text-align:center; color:#64748b; font-size:14px;">Tạo tài khoản quản trị tối cao</p>
        <form id="setupForm" onsubmit="doSetup(event)">
          <div class="input-group"><label>Tên đăng nhập</label><input type="text" id="username" required></div>
          <div class="input-group"><label>Mật khẩu</label><input type="password" id="password" required></div>
          <button type="submit" class="btn">Tạo tài khoản</button>
        </form>
        <div id="recoveryBox" class="recovery-box">
          <strong>QUAN TRỌNG: LƯU LẠI MÃ NÀY!</strong><br>
          Mã khôi phục của bạn là:<br><br>
          <code id="recCode" style="font-size:18px; font-weight:bold; letter-spacing:1px; background:#fff; padding:4px 8px; border-radius:4px; display:block; text-align:center;"></code><br>
          Mã này dùng để lấy lại mật khẩu nếu bạn quên. Nó chỉ hiện 1 lần duy nhất.<br><br>
          <button class="btn" onclick="window.location.href='/login'" style="background:#10b981;">Đã lưu, tới trang Đăng nhập</button>
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

        async function doSetup(e) {
          e.preventDefault();
          const u = document.getElementById('username').value;
          const p = document.getElementById('password').value;
          const res = await fetch('/api/auth/setup', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({username: u, password: p})
          });
          const data = await res.json();
          if (res.ok) {
            document.getElementById('setupForm').style.display = 'none';
            document.getElementById('recoveryBox').style.display = 'block';
            document.getElementById('recCode').innerText = data.recoveryKey;
          } else showAlert(data.error);
        }
      </script>
    </body>
    </html>
  `;
}

function getForgotPasswordHtml() {
  return `
    <!DOCTYPE html>
    <html lang="vi">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Hệ Thống Quản Lý IT - minhhan.net</title>
      <style>
        body { font-family: sans-serif; background: #f1f5f9; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
        .card { background: #fff; padding: 40px; border-radius: 12px; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1); width: 100%; max-width: 400px; }
        h2 { margin-top: 0; color: #1e293b; text-align: center; }
        .input-group { margin-bottom: 20px; }
        label { display: block; font-size: 14px; font-weight: 500; margin-bottom: 8px; }
        input { width: 100%; padding: 12px; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 16px; box-sizing: border-box; }
        .btn { background: #3b82f6; color: white; border: none; padding: 12px; border-radius: 8px; width: 100%; font-size: 16px; font-weight: 600; cursor: pointer; }
      </style>
    </head>
    <body>
      <div class="card">
        <h2>Khôi phục Mật khẩu</h2>
        <form id="forgotForm" onsubmit="doRecover(event)">
          <div class="input-group"><label>Tên đăng nhập</label><input type="text" id="username" required></div>
          <div class="input-group"><label>Mã khôi phục (Recovery Key)</label><input type="text" id="recoveryKey" required></div>
          <div class="input-group"><label>Mật khẩu mới</label><input type="password" id="newPassword" required></div>
          <button type="submit" class="btn">Đổi Mật Khẩu</button>
        </form>
        <p style="text-align:center; margin-top:20px; color:#64748b; font-size:13px;">*Nếu bạn quên cả mã khôi phục, hãy chạy lệnh <code>npm run reset-auth</code> trên máy chủ.</p>
        <p style="text-align:center;"><a href="/login" style="color:#3b82f6; text-decoration:none; font-size:14px;">Quay lại đăng nhập</a></p>
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

        async function doRecover(e) {
          e.preventDefault();
          const u = document.getElementById('username').value;
          const k = document.getElementById('recoveryKey').value;
          const p = document.getElementById('newPassword').value;
          const res = await fetch('/api/auth/forgot-password', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({username: u, recoveryKey: k, newPassword: p})
          });
          const data = await res.json();
          if (res.ok) {
            showAlert('Khôi phục thành công! Hãy đăng nhập lại.');
            window.location.href = '/login';
          } else showAlert(data.error);
        }
      </script>
    </body>
    </html>
  `;
}

module.exports = {
  getLoginHtml,
  getSetupHtml,
  getForgotPasswordHtml
};
