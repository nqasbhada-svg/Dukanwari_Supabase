const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

const oldTooltip = `                  {/* Tooltip detail on hover */}
                  <div className="absolute right-0 top-full mt-2 w-48 p-2.5 bg-slate-950 text-white rounded-lg shadow-xl border border-slate-800 opacity-0 group-hover:opacity-100 transition duration-200 pointer-events-none z-50 text-[10px] space-y-1 leading-normal font-mono">
                    <p className="font-bold text-slate-300">
                      {isMr ? 'क्लाउड डेटाबेस कनेक्शन' : 'Cloud DB Connection'}
                    </p>
                    <div className="flex items-center gap-1 text-slate-400">
                      <span className={\`w-1.5 h-1.5 rounded-full \${supabaseOnline ? 'bg-emerald-400' : 'bg-rose-400'}\`}></span>
                      <span>{supabaseOnline ? (isMr ? 'सुरक्षित जोडणी सक्रिय' : 'Secure SQL Connection') : (isMr ? 'कनेक्शन नाही' : 'Offline Mode')}</span>
                    </div>
                    <p className="text-slate-500 text-[9px] pt-1 border-t border-slate-800 mt-1">
                      {isMr ? 'शेवटचे सिंक: ' : 'Last synchronized: '}
                      {lastSyncTime.toLocaleTimeString()}
                    </p>
                  </div>`;

const newTooltip = `                  {/* Tooltip detail on hover */}
                  <div className="absolute right-0 top-full pt-2 w-56 opacity-0 group-hover:opacity-100 transition duration-200 z-50 pointer-events-none group-hover:pointer-events-auto">
                    <div className="p-3 bg-slate-950 text-white rounded-lg shadow-xl border border-slate-800 text-[10px] space-y-2 leading-normal font-sans" onClick={(e) => e.stopPropagation()}>
                      <div>
                        <p className="font-bold text-slate-200 text-xs">
                          {isMr ? 'क्लाउड डेटाबेस कनेक्शन' : 'Cloud DB Connection'}
                        </p>
                        <p className="text-slate-400 mt-0.5">
                          {isMr ? 'रिअल-टाइम डेटाबेस सिंक स्थिती' : 'Real-time database sync status'}
                        </p>
                      </div>
                      
                      <div className={\`flex items-center gap-1.5 p-1.5 rounded \${supabaseOnline ? 'bg-emerald-950/30 text-emerald-400' : 'bg-rose-950/30 text-rose-400'}\`}>
                        <span className={\`w-1.5 h-1.5 rounded-full shrink-0 \${supabaseOnline ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'}\`}></span>
                        <span className="font-mono">{supabaseOnline ? (isMr ? 'सुरक्षित जोडणी सक्रिय' : 'Secure SQL Connection') : (isMr ? 'कनेक्शन अयशस्वी / नाही' : 'Connection Failed or Offline')}</span>
                      </div>
                      
                      {supabaseOnline ? (
                        <p className="text-slate-500 text-[9px] font-mono border-t border-slate-800 pt-2">
                          {isMr ? 'शेवटचे सिंक: ' : 'Last synchronized: '}
                          {lastSyncTime.toLocaleTimeString()}
                        </p>
                      ) : (
                        <div className="pt-1 border-t border-slate-800">
                          <p className="text-slate-400 mb-2">
                            {isMr ? 'तुमचा डेटा क्लाउडवर सुरक्षित करण्यासाठी Supabase कॉन्फिगर करा.' : 'Your data is not syncing to the cloud. Please configure Supabase.'}
                          </p>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setAdminDefaultTab('supabase');
                              setCurrentView('admin');
                            }}
                            className="w-full py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-[10px] font-bold transition flex items-center justify-center gap-1"
                          >
                            <Settings size={12} />
                            {isMr ? 'कनेक्शन दुरुस्त करा (Fix Connection)' : 'Fix Connection'}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>`;

if(content.includes(oldTooltip)) {
  content = content.replace(oldTooltip, newTooltip);
  fs.writeFileSync('src/App.tsx', content);
  console.log('Tooltip replaced successfully');
} else {
  console.log('Failed to find tooltip string');
}
