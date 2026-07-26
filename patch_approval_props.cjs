const fs = require('fs');
let content = fs.readFileSync('src/components/AdminApprovalView.tsx', 'utf8');

const oldPropStr = `  onUpdateStatus: (
    id: string, 
    status: 'Pending' | 'Active' | 'Rejected' | 'MoreInfoNeeded',
    subscriptionUpdate?: {
      subscriptionType: 'Lifetime' | '1 Month' | '3 Months' | '6 Months' | '1 Year' | 'Custom';
      startDate: string;
      endDate?: string;
    },
    notes?: string
  ) => void;`;

const newPropStr = `  onUpdateStatus: (
    id: string, 
    status: 'Pending' | 'Active' | 'Rejected' | 'MoreInfoNeeded',
    subscriptionUpdate?: {
      subscriptionType: 'Lifetime' | '1 Month' | '3 Months' | '6 Months' | '1 Year' | 'Custom';
      startDate: string;
      endDate?: string;
    },
    notes?: string,
    supabaseUrl?: string,
    supabaseAnonKey?: string
  ) => void;`;

content = content.replace(oldPropStr, newPropStr);
fs.writeFileSync('src/components/AdminApprovalView.tsx', content);
