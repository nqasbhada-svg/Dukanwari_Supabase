const fs = require('fs');

let content = fs.readFileSync('src/App.tsx', 'utf8');

const targetStr = `    setRegistrations(updated);
    localStorage.setItem('vastraa_registrations', JSON.stringify(updated));

    // Log the action to audit database
    const targetReg = registrations.find(r => r.id === id);`;

const replacementStr = `    setRegistrations(updated);
    localStorage.setItem('vastraa_registrations', JSON.stringify(updated));

    const targetReg = updated.find(r => r.id === id);
    if (targetReg) {
      try {
        await pushShopToCentralSupabase(targetReg);
      } catch (err) {
        console.error('Failed to update shop status in central supabase:', err);
      }
    }

    // Log the action to audit database`;

content = content.replace(targetStr, replacementStr);

fs.writeFileSync('src/App.tsx', content);
