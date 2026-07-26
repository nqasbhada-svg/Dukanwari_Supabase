const fs = require('fs');
let content = fs.readFileSync('src/components/AdminPanel.tsx', 'utf8');

// 1. Add defaultTab to props
content = content.replace(
  "  onSyncAll?: () => void;\n}",
  "  onSyncAll?: () => void;\n  defaultTab?: 'profile' | 'whatsapp' | 'roles' | 'audit' | 'supabase';\n}"
);

// 2. Change activeAdminTab initialization
content = content.replace(
  "  const [activeAdminTab, setActiveAdminTab] = useState<'profile' | 'whatsapp' | 'roles' | 'audit'>('profile');",
  "  const [activeAdminTab, setActiveAdminTab] = useState<'profile' | 'whatsapp' | 'roles' | 'audit' | 'supabase'>(defaultTab || 'profile');"
);

content = content.replace(
  "}: AdminPanelProps) {",
  "  defaultTab,\n}: AdminPanelProps) {"
);

// 3. Add sidebar button for Supabase
const sidebarStr = `        <button
          onClick={() => setActiveAdminTab('audit')}
          className={\`w-full text-left p-2.5 rounded-lg font-bold flex items-center gap-2 transition \${activeAdminTab === 'audit' ? 'bg-indigo-50 text-indigo-700 shadow-3xs' : 'hover:bg-slate-50 text-slate-500'}\`}
        >
          <History size={14} />
          {isMr ? 'ऑडिट लॉग्स' : 'Audit Logs'}
        </button>`;

const newSidebarStr = sidebarStr + `
        <button
          onClick={() => setActiveAdminTab('supabase')}
          className={\`w-full text-left p-2.5 rounded-lg font-bold flex items-center gap-2 transition \${activeAdminTab === 'supabase' ? 'bg-indigo-50 text-indigo-700 shadow-3xs' : 'hover:bg-slate-50 text-slate-500'}\`}
        >
          <Database size={14} />
          {isMr ? 'क्लाउड सिंक सेटिंग्ज' : 'Cloud DB Settings'}
        </button>`;

content = content.replace(sidebarStr, newSidebarStr);

// 4. Add the tab content
const tab3Str = `        {/* TAB 3: Backup & Cloud Sync */}
        {activeAdminTab === 'audit' && (`;

const supabaseTabStr = `        {/* TAB: Supabase Settings */}
        {activeAdminTab === 'supabase' && (
          <div className="space-y-6">
            <div className="border-b pb-4">
              <h3 className="font-bold text-slate-900 text-sm">Cloud Database Sync Configuration</h3>
              <p className="text-slate-500 text-xs">Configure your Supabase URL and Anon Key to enable real-time cloud data synchronization.</p>
            </div>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 uppercase">Supabase Project URL</label>
                <input 
                  type="text"
                  value={supabaseUrl}
                  onChange={(e) => setSupabaseUrl(e.target.value)}
                  placeholder="https://xyzabcd.supabase.co"
                  className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 rounded-lg p-2.5 outline-none font-mono text-sm"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 uppercase">Supabase Anon Key</label>
                <input 
                  type={showAnonKey ? 'text' : 'password'}
                  value={supabaseAnonKey}
                  onChange={(e) => setSupabaseAnonKey(e.target.value)}
                  placeholder="eyJh..."
                  className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 rounded-lg p-2.5 outline-none font-mono text-sm"
                />
                <button 
                  type="button"
                  onClick={() => setShowAnonKey(!showAnonKey)}
                  className="text-indigo-600 text-[10px] font-bold"
                >
                  {showAnonKey ? 'Hide Key' : 'Show Key'}
                </button>
              </div>

              {testMessage && (
                <div className={\`p-3 rounded-lg text-xs font-bold \${testStatus === 'error' ? 'bg-rose-50 text-rose-700 border border-rose-200' : testStatus === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'}\`}>
                  {testMessage}
                </div>
              )}

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleTestAndSave}
                  disabled={testStatus === 'testing'}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition shadow-sm"
                >
                  {testStatus === 'testing' ? (isMr ? 'तपासत आहे...' : 'Testing...') : (isMr ? 'जतन करा आणि तपासा' : 'Test & Save Connection')}
                </button>
                {getSupabaseConfig().isConfigured && (
                  <button
                    type="button"
                    onClick={handleDisconnect}
                    className="px-5 py-2.5 border border-rose-200 text-rose-600 hover:bg-rose-50 rounded-lg text-xs font-bold transition"
                  >
                    {isMr ? 'डिस्कनेक्ट करा' : 'Disconnect DB'}
                  </button>
                )}
              </div>
            </div>
            
            <div className="bg-slate-50 border border-slate-200 p-4 rounded-lg mt-6">
              <h4 className="font-bold text-slate-700 text-xs mb-2">Need to set up tables?</h4>
              <p className="text-[10px] text-slate-500 mb-3">If you are setting this up for the first time, you need to run the setup SQL in your Supabase project.</p>
              <button
                type="button"
                onClick={handleCopySql}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded text-xs font-bold transition"
              >
                {copiedSql ? 'Copied!' : 'Copy Setup SQL'}
              </button>
            </div>
          </div>
        )}

`;

content = content.replace(tab3Str, supabaseTabStr + tab3Str);

fs.writeFileSync('src/components/AdminPanel.tsx', content);
