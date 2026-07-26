const fs = require('fs');
let content = fs.readFileSync('src/components/AdminApprovalView.tsx', 'utf8');

// Add states
content = content.replace(
  "const [notesText, setNotesText] = useState('');",
  "const [notesText, setNotesText] = useState('');\n  const [supabaseUrl, setSupabaseUrl] = useState('');\n  const [supabaseAnonKey, setSupabaseAnonKey] = useState('');"
);

// Sync states
content = content.replace(
  "setNotesText(registrations[0].subscription.notes || '');",
  "setNotesText(registrations[0].subscription.notes || '');\n      setSupabaseUrl(registrations[0].supabaseUrl || '');\n      setSupabaseAnonKey(registrations[0].supabaseAnonKey || '');"
);

content = content.replace(
  "setNotesText(reg.subscription.notes || '');",
  "setNotesText(reg.subscription.notes || '');\n                      setSupabaseUrl(reg.supabaseUrl || '');\n                      setSupabaseAnonKey(reg.supabaseAnonKey || '');"
);

// Update handleApplyAction
const handleApplyActionOld = `  const handleApplyAction = (status: 'Active' | 'Rejected' | 'MoreInfoNeeded') => {
    if (!selectedReg) return;

    const subscriptionUpdate = status === 'Active' ? {
      subscriptionType: subType,
      startDate: startDate,
      endDate: subType === 'Lifetime' ? undefined : endDate
    } : undefined;

    onUpdateStatus(selectedReg.id, status, subscriptionUpdate, notesText || undefined);`;

const handleApplyActionNew = `  const handleApplyAction = (status: 'Active' | 'Rejected' | 'MoreInfoNeeded') => {
    if (!selectedReg) return;

    const subscriptionUpdate = status === 'Active' ? {
      subscriptionType: subType,
      startDate: startDate,
      endDate: subType === 'Lifetime' ? undefined : endDate
    } : undefined;

    onUpdateStatus(selectedReg.id, status, subscriptionUpdate, notesText || undefined, supabaseUrl || undefined, supabaseAnonKey || undefined);`;

content = content.replace(handleApplyActionOld, handleApplyActionNew);

fs.writeFileSync('src/components/AdminApprovalView.tsx', content);
