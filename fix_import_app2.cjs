const fs = require('fs');

let content = fs.readFileSync('src/App.tsx', 'utf8');
content = content.replace(
  "  getSupabaseConfig,\n",
  "  getSupabaseConfig,\n  saveSupabaseConfig,\n  clearSupabaseConfig,\n"
);
fs.writeFileSync('src/App.tsx', content);
