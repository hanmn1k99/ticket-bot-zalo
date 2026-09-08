const fs = require('fs');
let content = fs.readFileSync('services/aiService.js', 'utf8');

content = content.replace(
  `if (!AI_API_KEY) return { type: 'TICKET' };`,
  `if (!AI_API_KEY) return { type: 'TICKET', location: extractLocationFallback(text) || "Không xác định" };`
);

// Tối ưu fallback logic
const targetLogic = `
        let loc = parts.length > 1 ? parts[1].trim().split('\\n')[0] : "";
        if (!loc || loc.toLowerCase().includes('không xác định') || loc === 'TICKET') {
          const fallback = extractLocationFallback(text);
          if (fallback) loc = fallback;
          else loc = "Không xác định";
        }
        return { type: 'TICKET', location: loc };`;

const replaceLogic = `
        let loc = parts.length > 1 ? parts[1].trim().split('\\n')[0] : "";
        const fallback = extractLocationFallback(text);
        
        // Luôn ưu tiên Regex Fallback vì nó chính xác với rule của trường hơn AI
        if (fallback) {
            loc = fallback;
        } else if (!loc || loc.toLowerCase().includes('không') || loc.toLowerCase().includes('chưa') || loc.toLowerCase().includes('none') || loc === 'TICKET') {
            loc = "Không xác định";
        }
        
        return { type: 'TICKET', location: loc };`;

content = content.replace(targetLogic, replaceLogic);
fs.writeFileSync('services/aiService.js', content, 'utf8');
console.log('Success');