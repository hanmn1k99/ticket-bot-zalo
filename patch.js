const fs = require('fs');
let content = fs.readFileSync('services/aiService.js', 'utf8');

const regexFallback = `
function extractLocationFallback(text) {
  const lowerText = text.toLowerCase();
  
  // Mẫu 1: \d{1,2}m\d{1,2} (VD: 1m3, 12m5, 7m1)
  const match1 = lowerText.match(/\\b\\d{1,2}m\\d{1,2}\\b/i);
  if (match1) return match1[0];
  
  // Mẫu 2: Lớp/phòng + tên
  const match2 = lowerText.match(/(?:lớp|phòng)\\s+([a-z0-9\\-\\.]+)/i);
  if (match2) return match2[0];
  
  // Mẫu 3: Các phòng chức năng
  const match3 = lowerText.match(/(thư viện|hội trường|nhà xe|phòng y tế|sân trường|nhà đa năng|phòng lab|căn tin|bảo vệ)/i);
  if (match3) return match3[0];
  
  return null;
}
`;

if (!content.includes('extractLocationFallback')) {
  // Insert function before analyzeWithAI
  content = content.replace('async function analyzeWithAI', regexFallback + '\nasync function analyzeWithAI');
}

const targetLogic = `return { type: 'TICKET', location: parts.length > 1 ? parts[1].trim().split('\\n')[0] : "Không xác định" };`;
const replacementLogic = `
        let loc = parts.length > 1 ? parts[1].trim().split('\\n')[0] : "";
        if (!loc || loc.toLowerCase().includes('không xác định') || loc === 'TICKET') {
          const fallback = extractLocationFallback(text);
          if (fallback) loc = fallback;
          else loc = "Không xác định";
        }
        return { type: 'TICKET', location: loc };
`;

content = content.replace(targetLogic, replacementLogic);

fs.writeFileSync('services/aiService.js', content, 'utf8');
console.log('Success');