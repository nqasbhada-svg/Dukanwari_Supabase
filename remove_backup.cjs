const fs = require('fs');

let content = fs.readFileSync('src/components/AdminPanel.tsx', 'utf8');

// Remove from state type
content = content.replace("'backup' | ", "");

// Remove the button
const buttonStart = content.indexOf("<button\n          onClick={() => setActiveAdminTab('backup')}");
if (buttonStart !== -1) {
  const buttonEnd = content.indexOf("</button>", buttonStart) + "</button>".length;
  content = content.substring(0, buttonStart) + content.substring(buttonEnd);
}

// Remove the content block
const contentStart = content.indexOf("{activeAdminTab === 'backup' && (");
if (contentStart !== -1) {
  const nextContent = content.indexOf("{activeAdminTab === 'audit' && (");
  if (nextContent !== -1) {
    content = content.substring(0, contentStart) + content.substring(nextContent);
  }
}

fs.writeFileSync('src/components/AdminPanel.tsx', content);
