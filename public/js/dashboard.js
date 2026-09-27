

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

        
        function inlineConfirmAction(btn, callback) {
            if (!btn) {
                // If this wasn't called by a button, fallback to the old confirm (or just run callback)
                return callback();
            }
            if (btn.classList.contains('confirming')) {
                btn.classList.remove('confirming');
                btn.innerHTML = btn.dataset.originalHtml;
                callback();
            } else {
                btn.classList.add('confirming');
                btn.dataset.originalHtml = btn.innerHTML;
                if (btn.innerHTML.includes('<ion-icon') && !btn.innerText.trim()) {
                    btn.innerHTML = '<ion-icon name="checkmark-outline" style="font-size:16px; color:#fff;"></ion-icon>';
                } else {
                    btn.innerHTML = '<ion-icon name="checkmark-outline" style="vertical-align:middle; margin-right:4px;"></ion-icon>Xác nhận';
                }
                setTimeout(() => {
                    if (btn.classList.contains('confirming')) {
                        btn.classList.remove('confirming');
                        btn.innerHTML = btn.dataset.originalHtml;
                    }
                }, 3000);
            }
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
            btnCancel.innerText = 'Hủy';
            btnCancel.style.padding = '8px 20px';
            btnCancel.style.background = 'var(--btn-secondary-bg, #e2e8f0)';
            btnCancel.style.color = 'var(--btn-secondary-text, #000)';
            btnCancel.style.border = '1px solid var(--btn-secondary-border, #cbd5e1)';
            btnCancel.style.borderRadius = '8px';
            btnCancel.style.cursor = 'pointer';
            btnCancel.style.fontWeight = '600';
            btnCancel.onclick = () => overlay.remove();

            const btnOk = document.createElement('button');
            btnOk.innerText = 'Xóa';
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

            // Enter = xác nhận, Escape = hủy
            const _keyHandler = (e) => {
                if (e.key === 'Enter') { e.preventDefault(); overlay.remove(); document.removeEventListener('keydown', _keyHandler); if (onConfirm) onConfirm(); }
                if (e.key === 'Escape') { overlay.remove(); document.removeEventListener('keydown', _keyHandler); }
            };
            document.addEventListener('keydown', _keyHandler);
        }

        if (localStorage.getItem('theme') === 'dark') {
            document.documentElement.setAttribute('data-theme', 'dark');
        }
      



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
                  timeEl.textContent = `${timeStr}, ${dateStr}`;
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
                      zaloSelect.innerHTML += `<option value="${a.id}">${a.name} (${maskId(a.id)})</option>`;
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
          setInterval(fetchAndRenderRows, 10000);

          // ==========================================
          // Tạo Ticket Thủ Công
          // ==========================================
          async function openCreateTicketModal() {
            try {
              const res = await fetch('/api/groups');
              if (res.ok) {
                const data = await res.json();
                const sel = document.getElementById('ct_group');
                sel.innerHTML = '<option value="">-- Không thông báo nhóm --</option>';
                if (data.groups && data.groups.length > 0) {
                  data.groups.forEach(g => {
                    const opt = document.createElement('option');
                    opt.value = g.id;
                    opt.textContent = g.name || g.id;
                    sel.appendChild(opt);
                  });
                  if (data.groups.length === 1) sel.value = data.groups[0].id;
                }
              }
            } catch(e) {}
            const modal = document.getElementById('createTicketModal');
            modal.style.display = 'flex';
            setTimeout(() => document.getElementById('ct_senderName').focus(), 50);
          }

          function closeCreateTicketModal() {
            document.getElementById('createTicketModal').style.display = 'none';
            ['ct_senderName','ct_location','ct_content'].forEach(id => { const el = document.getElementById(id); if(el) el.value = ''; });
            const sel = document.getElementById('ct_group');
            if(sel) sel.selectedIndex = 0;
          }

          async function submitCreateTicket() {
            const senderName = document.getElementById('ct_senderName').value.trim();
            const location = document.getElementById('ct_location').value.trim();
            const content = document.getElementById('ct_content').value.trim();
            const groupId = document.getElementById('ct_group').value;

            if (!senderName) { showAlert('Vui lòng nhập tên người báo sự cố!'); document.getElementById('ct_senderName').focus(); return; }
            if (!content) { showAlert('Vui lòng nhập nội dung sự cố!'); document.getElementById('ct_content').focus(); return; }

            const btn = document.getElementById('ct_submitBtn');
            const origHtml = btn.innerHTML;
            btn.textContent = 'Đang tạo...';
            btn.disabled = true;

            try {
              const res = await fetch('/api/tickets/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ senderName, content, location, groupId })
              });
              const data = await res.json();
              if (res.ok && data.success) {
                closeCreateTicketModal();
                if (data.rows) { document.querySelector('#reportTable tbody').innerHTML = data.rows; filterData(); }
                showAlert('Ticket #' + data.id + ' đã được tạo thành công!', true);
              } else {
                showAlert('Lỗi: ' + (data.error || 'Không thể tạo ticket.'));
              }
            } catch(e) {
              showAlert('Lỗi kết nối máy chủ.');
            } finally {
              btn.innerHTML = origHtml;
              btn.disabled = false;
            }
          }

          // Escape closes modal, Enter submits from textarea via Ctrl+Enter
          document.addEventListener('keydown', function(e) {
            const modal = document.getElementById('createTicketModal');
            if (modal && modal.style.display === 'flex') {
              if (e.key === 'Escape') closeCreateTicketModal();
              if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) submitCreateTicket();
            }
          });

          // Hàm hiển thị Toast thông báo nhỏ góc màn hình
          function showToast(msg, isSuccess) {
              var ok = isSuccess !== false;
              var bg = ok ? '#10b981' : '#ef4444';
              var toast = document.createElement('div');
              toast.style.position = 'fixed';
              toast.style.bottom = '24px';
              toast.style.right = '24px';
              toast.style.zIndex = '99999';
              toast.style.background = bg;
              toast.style.color = 'white';
              toast.style.padding = '12px 20px';
              toast.style.borderRadius = '10px';
              toast.style.fontSize = '14px';
              toast.style.fontWeight = '500';
              toast.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
              toast.style.display = 'flex';
              toast.style.alignItems = 'center';
              toast.style.gap = '8px';
              toast.style.maxWidth = '320px';
              toast.innerHTML = '<ion-icon name="' + (ok ? 'checkmark-circle' : 'close-circle') + '" style="font-size:18px;"></ion-icon> ' + msg;
              document.body.appendChild(toast);
              setTimeout(function() {
                  toast.style.opacity = '0';
                  toast.style.transition = 'opacity 0.4s ease';
                  setTimeout(function() { toast.remove(); }, 400);
              }, 3000);
          }

          // Hàm Xóa Sự cố (Thủ công)
          function deleteTicket(ticketId, btn) {
              if (btn) {
                  if (btn.classList.contains('confirming')) {
                      // Lần 2: Xác nhận → Xóa luôn
                      btn.classList.remove('confirming');
                      btn.innerHTML = btn.dataset.originalHtml;
                  } else {
                      // Lần 1: Chuyển đỏ + text Xác nhận?
                      btn.classList.add('confirming');
                      btn.dataset.originalHtml = btn.innerHTML;
                      btn.style.background = '#ef4444';
                      btn.style.color = 'white';
                      btn.style.borderRadius = '6px';
                      btn.style.padding = '2px 8px';
                      btn.style.fontSize = '12px';
                      btn.style.fontWeight = '600';
                      btn.innerHTML = 'Xác nhận?';
                      setTimeout(() => {
                          if (btn.classList.contains('confirming')) {
                              btn.classList.remove('confirming');
                              btn.innerHTML = btn.dataset.originalHtml;
                              btn.style.cssText = '';
                          }
                      }, 3000);
                      return;
                  }
              }

              (async () => {
                  try {
                      const response = await fetch('/api/tickets/' + ticketId, {
                          method: 'DELETE'
                      });
                      const data = await response.json();
                      if (response.ok && data.success) {
                          showToast('Đã xóa sự cố #' + ticketId);
                          fetchAndRenderRows();
                      } else {
                          showToast(data.error || 'Lỗi hệ thống', false);
                      }
                  } catch (error) {
                      showToast('Lỗi kết nối', false);
                  }
              })();
          }

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

          document.addEventListener('keydown', function _globalEscHandler(e) {
            if (e.key === 'Escape') {
                // Close any open reject input boxes
                document.querySelectorAll('[id^="rejectInput_"]').forEach(input => {
                    const match = input.id.match(/rejectInput_(d+)/);
                    if (match) cancelReject(parseInt(match[1]));
                });
            }
        });

        function cancelReject(ticketId) {
              // Force re-render bằng cách reset cache, rồi fetch lại
              lastRenderedHtml = '';
              fetchAndRenderRows();
          }

          function rejectTicket(ticketId, event) {
              const actionBox = document.getElementById('actionBox_' + ticketId);
              if (actionBox) {
                  const isRejecting = event && event.currentTarget && event.currentTarget.textContent.trim() === 'Chuyển';
                  const placeholder = isRejecting ? "Lý do chuyển trạng thái..." : "Lý do thay đổi trạng thái...";
                  const btnColor = isRejecting ? "#ef4444" : "#3b82f6";

                  actionBox.innerHTML = `
                    <div style="display:flex; flex-direction:column; gap:8px;">
                        <input type="text" id="rejectInput_${ticketId}" onkeypress="if(event.key === 'Enter') submitReject(${ticketId})" placeholder="${placeholder}" style="width:100%; padding:8px 12px; border:1px solid #cbd5e1; border-radius:9999px; font-size:13px; outline:none; box-sizing:border-box;">
                        <div style="display:flex; gap:6px; justify-content:flex-start;">
                            <button onclick="submitReject(${ticketId})" style="padding:6px 16px; font-size:13px; background:${btnColor}; color:white; border:none; border-radius:9999px; cursor:pointer; white-space:nowrap; transition: all 0.2s; box-shadow: 0 1px 2px rgba(0,0,0,0.05);">Xác nhận</button>
                            <button onclick="cancelReject(${ticketId})" style="padding:6px 16px; font-size:13px; background:#f1f5f9; color:#475569; border:none; border-radius:9999px; cursor:pointer; white-space:nowrap; transition: all 0.2s;">Hủy</button>
                        </div>
                    </div>
                  `;
                  setTimeout(() => {
                      const input = document.getElementById('rejectInput_' + ticketId);
                      if (input) input.focus();
                  }, 50);
              }
          }

          async function submitReject(ticketId) {
              const input = document.getElementById('rejectInput_' + ticketId);
              const reason = input ? input.value.trim() : '';
              // Backend sẽ kiểm tra quyền - Super Admin được phép không nhập lý do

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
              if (!confirm('Cảnh báo nguy hiểm: Hành động này sẽ xóa TOÀN BỘ dữ liệu báo cáo hiện tại và reset lại bộ đếm ID sự cố về #1.\n\nBạn có chắc chắn muốn xóa sạch hệ thống không?')) return;
              
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
      

