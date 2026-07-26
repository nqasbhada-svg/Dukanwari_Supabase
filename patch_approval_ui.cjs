const fs = require('fs');
let content = fs.readFileSync('src/components/AdminApprovalView.tsx', 'utf8');

const targetUI = `                {/* Admin Notes */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">`;

const replaceUI = `                {/* Supabase Integration Configuration */}
                <div className="space-y-3 bg-slate-800/50 border border-slate-700/50 rounded-xl p-3">
                  <div className="flex items-center justify-between border-b border-slate-700/50 pb-2">
                    <div className="flex items-center gap-2">
                      <Database size={14} className="text-indigo-400" />
                      <h4 className="text-xs font-bold text-white uppercase tracking-wider">{isMr ? 'क्लाउड सिंक सेटिंग्ज' : 'Supabase Sync Settings'}</h4>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Supabase Project URL</label>
                    <input 
                      type="text"
                      value={supabaseUrl}
                      onChange={(e) => setSupabaseUrl(e.target.value)}
                      placeholder="https://xxxxx.supabase.co"
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 outline-none text-white text-xs"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Supabase Anon Key</label>
                    <input 
                      type="password"
                      value={supabaseAnonKey}
                      onChange={(e) => setSupabaseAnonKey(e.target.value)}
                      placeholder="eyJh..."
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 outline-none text-white text-xs"
                    />
                  </div>
                </div>

                {/* Admin Notes */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">`;

content = content.replace(targetUI, replaceUI);

// Need to import Database from lucide-react if not present
if (!content.includes('Database,')) {
  content = content.replace(/import \{\s*/, 'import {\n  Database,\n  ');
}

fs.writeFileSync('src/components/AdminApprovalView.tsx', content);
