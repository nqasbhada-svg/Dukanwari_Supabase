const fs = require('fs');

let content = fs.readFileSync('src/App.tsx', 'utf8');

const target = `    if (role === 'system_admin') {
      setCurrentView('approvals');
    } else {
      setCurrentView('dashboard');
    }
  };`;

const replacement = `    if (role === 'system_admin') {
      clearSupabaseConfig();
      setCurrentView('approvals');
    } else {
      // In fast login, we just clear to default local storage since it's a dummy
      clearSupabaseConfig();
      setCurrentView('dashboard');
    }
  };`;

content = content.replace(target, replacement);

fs.writeFileSync('src/App.tsx', content);
