const fs = require('fs');

let content = fs.readFileSync('src/App.tsx', 'utf8');
if (!content.includes('saveSupabaseConfig')) {
  // It shouldn't happen, let's just make sure
}

if (!content.includes("from './utils/supabaseClient'")) {
  content = content.replace(
    "import { hashPassword, comparePassword } from './utils/crypto';", 
    "import { hashPassword, comparePassword } from './utils/crypto';\nimport { saveSupabaseConfig, clearSupabaseConfig, getSupabaseConfig } from './utils/supabaseClient';"
  );
  fs.writeFileSync('src/App.tsx', content);
}

