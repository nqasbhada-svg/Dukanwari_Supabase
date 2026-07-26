const fs = require('fs');

let content = fs.readFileSync('src/App.tsx', 'utf8');

// 1. Add import
if (!content.includes('pushShopToCentralSupabase')) {
  content = content.replace(
    "import { downloadElementAsPDF } from './utils/pdfGenerator';",
    "import { downloadElementAsPDF } from './utils/pdfGenerator';\nimport { pushShopToCentralSupabase } from './utils/centralSupabaseClient';"
  );
}

// 2. Add to handleRegisterBusiness
const handleRegStr = `    // Log auth audit trail
    const timestamp = new Date().toISOString();`;

const newHandleRegStr = `    // Centralized Supabase Sync
    try {
      await pushShopToCentralSupabase(securedReg);
    } catch (error) {
      console.error('Failed to push to central supabase:', error);
    }

    // Log auth audit trail
    const timestamp = new Date().toISOString();`;

if (!content.includes('pushShopToCentralSupabase(securedReg)')) {
  content = content.replace(handleRegStr, newHandleRegStr);
}

// 3. Add to handleUpdateRegistrationStatus
const handleUpdateStr = `    setRegistrations(updated);
    localStorage.setItem('vastraa_registrations', JSON.stringify(updated));

    // Log the action to audit database`;

const newHandleUpdateStr = `    setRegistrations(updated);
    localStorage.setItem('vastraa_registrations', JSON.stringify(updated));

    // Push updated status to central supabase
    const targetReg = updated.find(r => r.id === id);
    if (targetReg) {
      try {
        await pushShopToCentralSupabase(targetReg);
      } catch (err) {
        console.error('Failed to update shop status in central supabase:', err);
      }
    }

    // Log the action to audit database`;

if (!content.includes('pushShopToCentralSupabase(targetReg)')) {
  const tRegStr = `    const targetReg = registrations.find(r => r.id === id);`;
  const newTRegStr = `    // targetReg moved above\n`;
  // We need to carefully replace the targetReg in handleUpdateRegistrationStatus
}
fs.writeFileSync('src/App.tsx', content);
