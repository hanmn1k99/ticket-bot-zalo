const fs = require('fs');
let content = fs.readFileSync('services/aiService.js', 'utf8');

content = content.replace(/return \{ type: 'TICKET', location: "Không xác định" \};/g, `return { type: 'TICKET', location: extractLocationFallback(text) || "Không xác định" };`);

fs.writeFileSync('services/aiService.js', content, 'utf8');
console.log('Success');