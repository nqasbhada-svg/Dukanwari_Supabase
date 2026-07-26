const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

content = content.replace(
  "  const [currentView, setCurrentView] = useState<string>(() => {",
  "  const [adminDefaultTab, setAdminDefaultTab] = useState<'profile' | 'whatsapp' | 'roles' | 'audit' | 'supabase'>('profile');\n  const [currentView, setCurrentView] = useState<string>(() => {"
);

const adminPanelRenderStr = `                  {currentView === 'admin' && (
                    <AdminPanel 
                      settings={shopSettings}`;

const newAdminPanelRenderStr = `                  {currentView === 'admin' && (
                    <AdminPanel 
                      defaultTab={adminDefaultTab}
                      settings={shopSettings}`;

content = content.replace(adminPanelRenderStr, newAdminPanelRenderStr);

fs.writeFileSync('src/App.tsx', content);
