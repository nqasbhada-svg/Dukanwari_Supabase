const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

// 1. Add import
if (!content.includes('SystemAdminSupabaseView')) {
  content = content.replace(
    "import AdminApprovalView from './components/AdminApprovalView';",
    "import AdminApprovalView from './components/AdminApprovalView';\nimport SystemAdminSupabaseView from './components/SystemAdminSupabaseView';"
  );
}

// 2. Add menu item
const menuItemsStr = `  const menuItems = session?.role === 'system_admin'
    ? [
        { id: 'approvals', label: isMr ? 'नोंदणी मंजुरी आणि वर्गणी' : 'Licensing & Subscriptions', icon: ShieldCheck },
        { id: 'admin', label: t.adminPanel, icon: Settings }
      ]`;
const newMenuItemsStr = `  const menuItems = session?.role === 'system_admin'
    ? [
        { id: 'approvals', label: isMr ? 'नोंदणी मंजुरी आणि वर्गणी' : 'Licensing & Subscriptions', icon: ShieldCheck },
        { id: 'supabase_sync', label: 'Cloud DB Sync', icon: Database },
        { id: 'admin', label: t.adminPanel, icon: Settings }
      ]`;
content = content.replace(menuItemsStr, newMenuItemsStr);

// 3. Implement handler
const handlerStr = `  const handleUpdateRegistrationStatus = async (`;
const newHandlerStr = `  const handleUpdateShopSupabase = (id: string, supabaseUrl: string, supabaseAnonKey: string) => {
    const updated = registrations.map(reg => {
      if (reg.id === id) {
        return {
          ...reg,
          supabaseUrl,
          supabaseAnonKey
        };
      }
      return reg;
    });
    setRegistrations(updated);
  };

  const handleUpdateRegistrationStatus = async (`
if (!content.includes('handleUpdateShopSupabase')) {
  content = content.replace(handlerStr, newHandlerStr);
}

// 4. Add to render switch
const renderStr = `                  {currentView === 'approvals' && (
                    <AdminApprovalView 
                      registrations={registrations}
                      onUpdateStatus={handleUpdateRegistrationStatus}
                      isMr={isMr}
                    />
                  )}`;
const newRenderStr = `                  {currentView === 'approvals' && (
                    <AdminApprovalView 
                      registrations={registrations}
                      onUpdateStatus={handleUpdateRegistrationStatus}
                      isMr={isMr}
                    />
                  )}

                  {currentView === 'supabase_sync' && (
                    <SystemAdminSupabaseView 
                      registrations={registrations}
                      onUpdateRegistration={handleUpdateShopSupabase}
                      isMr={isMr}
                    />
                  )}`;
if (!content.includes('SystemAdminSupabaseView registrations=')) {
  content = content.replace(renderStr, newRenderStr);
}

fs.writeFileSync('src/App.tsx', content);
