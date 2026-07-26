const fs = require('fs');

let content = fs.readFileSync('src/App.tsx', 'utf8');

const importStatement = "import { saveSupabaseConfig, clearSupabaseConfig, getSupabaseConfig } from './utils/supabaseClient';\n";

if (!content.includes("from './utils/supabaseClient'")) {
  content = content.replace(
    "import { hashPassword, comparePassword } from './utils/crypto';", 
    "import { hashPassword, comparePassword } from './utils/crypto';\n" + importStatement
  );
  fs.writeFileSync('src/App.tsx', content);
  console.log("Injected import successfully");
} else {
  console.log("Import already exists");
}
