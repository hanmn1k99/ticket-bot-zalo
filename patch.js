const fs = require('fs');
let content = fs.readFileSync('services/aiService.js', 'utf8');

const target = '- Bạn PHẢI trích xuất MỌI thông tin chỉ vị trí nếu có. Tại trường này, các lớp học thường viết tắt kiểu "7m1", "10m2", "12M5"... nên nếu bạn thấy các chuỗi tương tự hoặc tên các phòng chức năng (Thư viện, Hội trường, Nhà xe, Phòng Y tế...), hãy hiểu đó là vị trí. Ví dụ: TICKET|7m1 (hoặc TICKET|Thư viện). Tuyệt đối không được bỏ sót vị trí! Chỉ khi hoàn toàn không có thông tin vị trí thì mới ghi: TICKET|Không xác định.';

const replacement = '- Bạn PHẢI trích xuất MỌI thông tin chỉ vị trí (như Lớp, Phòng, Tòa nhà, Khu vực...) nếu có. Kể cả khi người dùng viết tắt (như "lớp 1m3", "7m1", "thư viện", "phòng lab"), hãy lấy chính xác cụm từ đó làm vị trí. Ví dụ người dùng chat "lớp 1m3 tv chập chờn" -> Bạn phải xuất: TICKET|lớp 1m3. TUYỆT ĐỐI KHÔNG ĐƯỢC BỎ SÓT THÔNG TIN VỊ TRÍ, NẾU CÓ ĐỊA ĐIỂM MÀ BẠN GHI LÀ "Không xác định" THÌ ĐÓ LÀ LỖI RẤT NẶNG! Chỉ khi câu nói hoàn toàn vô danh (ví dụ: "máy bị lag") thì mới ghi: TICKET|Không xác định.';

if(content.includes(target)) {
    let updated = content.replace(target, replacement);
    fs.writeFileSync('services/aiService.js', updated, 'utf8');
    console.log('Success');
} else {
    console.log('Target not found!');
}