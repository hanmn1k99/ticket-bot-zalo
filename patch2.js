const fs = require('fs');
let content = fs.readFileSync('services/aiService.js', 'utf8');

const targetCatch = `return { type: 'TICKET', location: "KhA'ng xAc `<nh" };`;
const targetCatch2 = `return { type: 'TICKET', location: "Không xác định" };`;

// Replace all fallbacks returning hardcoded "Không xác định" with regex extraction
content = content.replace(/return \{ type: 'TICKET', location: "Không xác định" \};/g, `return { type: 'TICKET', location: extractLocationFallback(text) || "Không xác định" };`);

fs.writeFileSync('services/aiService.js', content, 'utf8');
console.log('Success');