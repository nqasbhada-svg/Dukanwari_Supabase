const fs = require('fs');

let content = fs.readFileSync('src/App.tsx', 'utf8');

// 1. Add imports
const importRegex = /import \{ getWhatsAppBillingMessage[^}]*\} from '\.\/utils\/whatsapp';/;
const newImport = `import { getWhatsAppBillingMessage, openWhatsAppBillingShare, getWhatsAppStockAlert } from './utils/whatsapp';
import { saveSupabaseConfig, clearSupabaseConfig, getSupabaseConfig } from './utils/supabaseClient';`;
content = content.replace(importRegex, newImport);

// 2. Add to handleBusinessLogin
const loginSuccessStr = `        // Successful login
        setSession({
          role: 'owner',
          mobile: reg.mobile,
          name: \`\${reg.ownerName} (\${reg.shopName})\`,
          permissions: ['ALL', 'DELETE_PRODUCT', 'REPORTS_VIEW', 'SETTINGS_EDIT']
        });
        
        // Load custom settings for the approved shop owner`;

const newLoginSuccessStr = `        // Successful login
        setSession({
          role: 'owner',
          mobile: reg.mobile,
          name: \`\${reg.ownerName} (\${reg.shopName})\`,
          permissions: ['ALL', 'DELETE_PRODUCT', 'REPORTS_VIEW', 'SETTINGS_EDIT']
        });
        
        // Save Supabase Configuration for this shop if configured
        if (reg.supabaseUrl && reg.supabaseAnonKey) {
          saveSupabaseConfig(reg.supabaseUrl, reg.supabaseAnonKey);
        } else {
          clearSupabaseConfig();
        }

        // Load custom settings for the approved shop owner`;

content = content.replace(loginSuccessStr, newLoginSuccessStr);

// 3. Add to handleLogout
const logoutStr = `    setSession(null);
    setCurrentView('dashboard');
  };`;
const newLogoutStr = `    setSession(null);
    clearSupabaseConfig();
    setCurrentView('dashboard');
  };`;
content = content.replace(logoutStr, newLogoutStr);

// 4. Update handleOtpLogin to clear supabase config as well, since OTP login seems to be a hardcoded fallback or maybe we can fetch the shop from mobile? 
const handleOtpLoginStr = `        setSession({
          role: 'owner',
          mobile: loginMobile,
          name: 'Rahul Deshmukh (Owner)',
          permissions: ['ALL', 'DELETE_PRODUCT', 'REPORTS_VIEW', 'SETTINGS_EDIT']
        });`;
const newHandleOtpLoginStr = `        setSession({
          role: 'owner',
          mobile: loginMobile,
          name: 'Rahul Deshmukh (Owner)',
          permissions: ['ALL', 'DELETE_PRODUCT', 'REPORTS_VIEW', 'SETTINGS_EDIT']
        });
        
        const ownerReg = registrations.find(r => r.mobile === loginMobile && r.subscription.status === 'Active');
        if (ownerReg && ownerReg.supabaseUrl && ownerReg.supabaseAnonKey) {
          saveSupabaseConfig(ownerReg.supabaseUrl, ownerReg.supabaseAnonKey);
        } else {
          clearSupabaseConfig();
        }`;
content = content.replace(handleOtpLoginStr, newHandleOtpLoginStr);

const handleEmployeeOtpStr = `        setSession({
          role: 'employee',
          mobile: loginMobile,
          name: 'Amit Shinde (Employee)',
          permissions: ['POS_BILLING', 'STOCK_INWARD']
        });`;
const newHandleEmployeeOtpStr = `        setSession({
          role: 'employee',
          mobile: loginMobile,
          name: 'Amit Shinde (Employee)',
          permissions: ['POS_BILLING', 'STOCK_INWARD']
        });
        
        // For employee, we'd ideally know which shop they belong to. 
        // As a fallback, clear it.
        clearSupabaseConfig();`;
content = content.replace(handleEmployeeOtpStr, newHandleEmployeeOtpStr);


fs.writeFileSync('src/App.tsx', content);
