const db = require('./database');

async function test() {
    const senderId = '12345';
    const text = '@Bot Meyschool - IT huỷ nha'; // Notice I typed huỷ (uỷ) here! Wait, the log had 'hủy nha' but maybe it was 'huỷ nha' in real life, or we need to add 'huỷ' to the keywords anyway. Let's just use what I wrote.
    const BOT_NAME = '@Bot';
    
    let requestContent = text.replace(new RegExp(`@?${BOT_NAME}`, 'gi'), '').replace(/@?Bot/gi, '').trim();
    requestContent = requestContent.replace(/^@\s*/, '').replace(/@\s*$/, '').trim();
    if (!requestContent) requestContent = '(Không có nội dung)';
    
    console.log('requestContent:', requestContent);
    
    const allReqsContext = await db.getAllRequests();
    const pendingReqs = allReqsContext.filter(r => r.sender_id === senderId && (r.status === 'Đang chờ' || r.status === 'Đang xử lý'));
    console.log('pendingReqs length:', pendingReqs.length);
    
    let openTicketsContext = '';
    if (pendingReqs.length > 0) {
        openTicketsContext = 'CURRENT OPEN TICKETS FOR THIS USER:\n' + pendingReqs.map(r => '- Ticket #' + r.id + ': ' + r.content).join('\n');
    }
    
    const lowerReq = requestContent.toLowerCase();
    const cancelKeywords = ['hủy', 'huy', 'xong rồi', 'đã xử lý', 'không cần', 'bỏ qua'];
    const isCancelIntent = cancelKeywords.some(kw => lowerReq.includes(kw));
    
    console.log('lowerReq:', lowerReq);
    console.log('isCancelIntent:', isCancelIntent);
    
    if (isCancelIntent && pendingReqs.length > 0) {
        console.log('SUCCESS: Will cancel');
    } else {
        console.log('FAIL: Will call AI');
    }
}
test();
