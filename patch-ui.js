const fs = require('fs');

let content = fs.readFileSync('views/settingsView.js', 'utf8');

const newTabBtn = `<button class="tab-btn" data-tab="tab-ui" onclick="switchTab('tab-ui', this)"><ion-icon name="color-palette-outline" style="vertical-align:middle; margin-right:4px;"></ion-icon> Giao diện (UI)</button>\n        <button class="tab-btn" data-tab="tab-prompt"`;
content = content.replace(/<button class="tab-btn" data-tab="tab-prompt"/, newTabBtn);

const newTabPane = `
      <!-- TAB UI -->
      <div id="tab-ui" class="tab-pane">
        <div class="card">
          <h3><ion-icon name="color-palette-outline" style="vertical-align:middle; margin-right:6px;"></ion-icon> Cấu hình Giao diện</h3>
          <p style="font-size:14px; opacity:0.8; margin-top:0px; margin-bottom:16px;">Tải lên logo và favicon của bạn (Kích thước khuyên dùng: Logo < 1MB, Favicon 512x512). Ảnh sẽ được tự động chuyển đổi sang định dạng .png.</p>
          
          <div style="display:flex; gap: 20px; flex-wrap: wrap;">
            <div style="flex:1; min-width: 250px; background: var(--bg-color); padding: 15px; border-radius: 8px; text-align: center;">
              <h4>Favicon (Biểu tượng Tab)</h4>
              <img src="/assets/favicon.png?v=\${Date.now()}" id="preview-favicon" style="width: 64px; height: 64px; object-fit: contain; margin-bottom: 15px; border-radius: 8px; border: 1px dashed var(--border-color); padding: 5px;" onerror="this.src='https://via.placeholder.com/64'">
              <div>
                <input type="file" id="upload-favicon" accept="image/*" style="display:none" onchange="previewAndUpload(this, 'favicon')">
                <button type="button" onclick="document.getElementById('upload-favicon').click()" style="width:100%">Tải lên Favicon</button>
              </div>
            </div>

            <div style="flex:1; min-width: 250px; background: var(--bg-color); padding: 15px; border-radius: 8px; text-align: center;">
              <h4>Logo hệ thống</h4>
              <img src="/assets/logo.png?v=\${Date.now()}" id="preview-logo" style="width: 120px; height: 64px; object-fit: contain; margin-bottom: 15px; border-radius: 8px; border: 1px dashed var(--border-color); padding: 5px;" onerror="this.src='https://via.placeholder.com/120x64'">
              <div>
                <input type="file" id="upload-logo" accept="image/*" style="display:none" onchange="previewAndUpload(this, 'logo')">
                <button type="button" onclick="document.getElementById('upload-logo').click()" style="width:100%">Tải lên Logo</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- TAB 5: QUY TẮC AI -->
`;

content = content.replace(/<!-- TAB 5: QUY TẮC AI -->/g, newTabPane);

const newScript = `
    async function previewAndUpload(input, type) {
      if (input.files && input.files[0]) {
        const file = input.files[0];
        if(file.size > 2 * 1024 * 1024) {
          showAlert('Lỗi: File ảnh quá lớn (vượt quá 2MB)', false);
          return;
        }

        const reader = new FileReader();
        reader.onload = async function(e) {
          const base64Str = e.target.result;
          
          try {
            const btn = input.nextElementSibling;
            const originalText = btn.innerText;
            btn.innerText = 'Đang tải lên...';
            btn.disabled = true;

            const res = await fetch('/api/settings/upload-image', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ type: type, imageBase64: base64Str })
            });

            const data = await res.json();
            if (data.success) {
              document.getElementById('preview-' + type).src = base64Str;
              showAlert('Đã cập nhật ' + type + ' thành công! Vui lòng F5 (tải lại trang) để thay đổi có hiệu lực trên toàn hệ thống.', true);
            } else {
              showAlert(data.error || 'Lỗi tải lên', false);
            }
            btn.innerText = originalText;
            btn.disabled = false;
          } catch(err) {
            showAlert('Lỗi kết nối mạng', false);
            input.nextElementSibling.disabled = false;
            input.nextElementSibling.innerText = 'Tải lên';
          }
        }
        reader.readAsDataURL(file);
      }
    }
  </script>
`;

content = content.replace(/<\/script>\s*<\/body>/, newScript + '\n</body>');

fs.writeFileSync('views/settingsView.js', content, 'utf8');