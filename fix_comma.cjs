const fs = require('fs');
let content = fs.readFileSync('src/components/AdminPanel.tsx', 'utf8');
content = content.replace(
  "  onSyncAll = () => {}\n  defaultTab,",
  "  onSyncAll = () => {},\n  defaultTab,"
);
fs.writeFileSync('src/components/AdminPanel.tsx', content);
