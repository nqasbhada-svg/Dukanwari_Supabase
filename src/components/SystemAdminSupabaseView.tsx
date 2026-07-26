import React, { useState } from 'react';
import { Database, Save, CheckCircle2, AlertTriangle, Link as LinkIcon, RefreshCcw } from 'lucide-react';
import { ShopRegistration } from '../types';

interface SystemAdminSupabaseViewProps {
  registrations: ShopRegistration[];
  onUpdateRegistration: (id: string, supabaseUrl: string, supabaseAnonKey: string) => void;
  isMr: boolean;
}

export default function SystemAdminSupabaseView({ registrations, onUpdateRegistration, isMr }: SystemAdminSupabaseViewProps) {
  const [selectedShopId, setSelectedShopId] = useState<string>(registrations.length > 0 ? registrations[0].id : '');
  const [supabaseUrl, setSupabaseUrl] = useState('');
  const [supabaseAnonKey, setSupabaseAnonKey] = useState('');
  const [saveMessage, setSaveMessage] = useState('');

  const activeShops = registrations.filter(r => r.subscription.status === 'Active' || r.subscription.status === 'Pending');
  const selectedShop = registrations.find(r => r.id === selectedShopId);

  // Sync state when shop changes
  React.useEffect(() => {
    if (selectedShop) {
      setSupabaseUrl(selectedShop.supabaseUrl || '');
      setSupabaseAnonKey(selectedShop.supabaseAnonKey || '');
      setSaveMessage('');
    }
  }, [selectedShopId, selectedShop]);

  const handleSave = () => {
    if (!selectedShopId) return;
    onUpdateRegistration(selectedShopId, supabaseUrl, supabaseAnonKey);
    setSaveMessage(isMr ? 'क्लाउड सिंक सेटिंग्ज यशस्वीरित्या सेव्ह केल्या!' : 'Supabase connection settings saved successfully!');
    setTimeout(() => setSaveMessage(''), 3000);
  };

  return (
    <div className="space-y-6">
      <header className="mb-6">
        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
          <Database className="text-indigo-600" />
          {isMr ? 'क्लाउड डेटाबेस कनेक्शन (सुपाबेस)' : 'Cloud Database Connection (Supabase)'}
        </h2>
        <p className="text-slate-500 text-sm mt-1">
          {isMr 
            ? 'दुकानदारांचा डेटा सुरक्षित ठेवण्यासाठी प्रत्येक दुकानासाठी स्वतंत्र सुपाबेस (Supabase) डेटाबेस कनेक्ट करा.' 
            : 'Configure dedicated Supabase database credentials for each shop to enable real-time cloud sync.'}
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Shop List */}
        <div className="lg:col-span-1 bg-white border border-slate-200 rounded-2xl shadow-sm p-4">
          <h3 className="font-bold text-slate-800 mb-4 px-2">{isMr ? 'दुकान निवडा' : 'Select Shop'}</h3>
          <div className="space-y-2 max-h-[600px] overflow-y-auto pr-2">
            {activeShops.map(shop => {
              const isSelected = shop.id === selectedShopId;
              const hasDb = !!(shop.supabaseUrl && shop.supabaseAnonKey);
              
              return (
                <button
                  key={shop.id}
                  onClick={() => setSelectedShopId(shop.id)}
                  className={`w-full text-left p-3 rounded-xl border transition-all flex items-center justify-between gap-2 ${
                    isSelected 
                      ? 'bg-indigo-50 border-indigo-200 shadow-sm' 
                      : 'bg-slate-50 border-transparent hover:bg-slate-100 hover:border-slate-200'
                  }`}
                >
                  <div className="min-w-0">
                    <p className={`font-bold truncate text-sm ${isSelected ? 'text-indigo-900' : 'text-slate-700'}`}>
                      {shop.shopName}
                    </p>
                    <p className="text-[10px] text-slate-500 truncate">{shop.ownerName} • {shop.mobile}</p>
                  </div>
                  <div>
                    {hasDb ? (
                      <span className="p-1 bg-emerald-100 text-emerald-600 rounded-full flex shrink-0" title="Connected">
                        <CheckCircle2 size={12} />
                      </span>
                    ) : (
                      <span className="p-1 bg-amber-100 text-amber-600 rounded-full flex shrink-0" title="Not Connected">
                        <AlertTriangle size={12} />
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
            
            {activeShops.length === 0 && (
              <div className="p-4 text-center text-slate-500 text-xs">
                {isMr ? 'कोणतीही दुकाने आढळली नाहीत.' : 'No shops found.'}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Connection Settings */}
        <div className="lg:col-span-2">
          {selectedShop ? (
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 space-y-6">
              <div className="border-b pb-4 mb-6">
                <h3 className="font-bold text-slate-800 text-lg">{selectedShop.shopName}</h3>
                <p className="text-slate-500 text-sm">{isMr ? 'क्लाउड सिंक क्रेडेन्शियल कॉन्फिगर करा' : 'Configure Cloud Sync Credentials'}</p>
              </div>

              <div className="space-y-5">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                    <LinkIcon size={14} className="text-slate-400" />
                    Supabase Project URL
                  </label>
                  <input 
                    type="text"
                    value={supabaseUrl}
                    onChange={(e) => setSupabaseUrl(e.target.value)}
                    placeholder="e.g. https://xyzabcd.supabase.co"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition text-sm text-slate-800"
                  />
                  <p className="text-[10px] text-slate-500">The unique URL of the Supabase project created for this shop.</p>
                </div>
                
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                    <Database size={14} className="text-slate-400" />
                    Supabase Anon/Public Key
                  </label>
                  <input 
                    type="text"
                    value={supabaseAnonKey}
                    onChange={(e) => setSupabaseAnonKey(e.target.value)}
                    placeholder="eyJh..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition text-sm text-slate-800 font-mono"
                  />
                  <p className="text-[10px] text-slate-500">The public anon key used to authenticate client requests.</p>
                </div>
              </div>

              {saveMessage && (
                <div className="p-3 bg-emerald-50 text-emerald-700 rounded-xl text-sm flex items-center gap-2 font-medium">
                  <CheckCircle2 size={16} />
                  {saveMessage}
                </div>
              )}

              <div className="pt-4 border-t flex justify-end">
                <button
                  onClick={handleSave}
                  disabled={!supabaseUrl || !supabaseAnonKey}
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-xl font-bold text-sm transition flex items-center gap-2 shadow-sm"
                >
                  <Save size={16} />
                  {isMr ? 'सेव्ह करा' : 'Save Connection'}
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-12 text-center flex flex-col items-center justify-center">
              <Database size={48} className="text-slate-300 mb-4" />
              <h3 className="font-bold text-slate-700 text-lg">{isMr ? 'दुकान निवडा' : 'Select a Shop'}</h3>
              <p className="text-slate-500 text-sm mt-1">{isMr ? 'सुपाबेस सेटिंग्ज पाहण्यासाठी डावीकडून दुकान निवडा.' : 'Select a shop from the list to configure its Supabase credentials.'}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
