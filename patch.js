const fs = require('fs');
let content = fs.readFileSync('.github/workflows/deploy.yml', 'utf8');
content = content.replace('`${{ secrets.DISCORD_WEBHOOK_URL }}', '${{ secrets.DISCORD_WEBHOOK_URL }}');
fs.writeFileSync('.github/workflows/deploy.yml', content, 'utf8');