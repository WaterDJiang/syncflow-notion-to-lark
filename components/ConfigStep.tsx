import React, { useState, useEffect } from 'react';
import { ArrowRight, Check, ChevronDown, RefreshCw, AlertTriangle, Settings, LayoutGrid, Table } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { hasCredentials, loadCredentials, loadLarkTables, saveLarkTables } from '../services/secureStorage';
import { LarkTableConfig } from '../types';
import { fetchMe, listDatabases } from '../services/notionService';
import { getBitableApp, listLarkTables, fetchLarkSchema } from '../services/larkService';

interface ConfigStepProps {
  platform: 'notion' | 'lark';
  initialData: any;
  onNext: (data: any) => void;
  onOpenSettings: () => void;
}

type DetectedUser = { name: string; email?: string; avatar?: string };

const ConfigStep: React.FC<ConfigStepProps> = ({ platform, initialData, onNext, onOpenSettings }) => {
  const [formData, setFormData] = useState(initialData);
  const [isLoading, setIsLoading] = useState(false);
  
  const [hasKeys, setHasKeys] = useState(false);
  
  // State specific for Notion Flow
  const [isNotionConnected, setIsNotionConnected] = useState(false);
  const [isConnectingNotion, setIsConnectingNotion] = useState(false);
  const [showDbDropdown, setShowDbDropdown] = useState(false);
  const [databases, setDatabases] = useState<{ id: string; title: string; icon?: string }[]>([]);
  const [selectedDb, setSelectedDb] = useState<{ id: string; title: string; icon?: string } | null>(null);
  
  // State for Cookie/Token Detection simulation
  const [isCheckingCredentials, setIsCheckingCredentials] = useState(false);
  const [detectedUser, setDetectedUser] = useState<DetectedUser | null>(null);
  const [larkTables, setLarkTables] = useState<LarkTableConfig[]>([]);
  const [showLarkDropdown, setShowLarkDropdown] = useState(false);
  const [selectedLark, setSelectedLark] = useState<LarkTableConfig | null>(null);
  const [apiTables, setApiTables] = useState<{ id: string; name: string }[]>([]);
  const [showApiTableDropdown, setShowApiTableDropdown] = useState(false);
  const [larkError, setLarkError] = useState('');
  const [isTestingLark, setIsTestingLark] = useState(false);
  const [larkTestMsg, setLarkTestMsg] = useState('');
  const [saveNotice, setSaveNotice] = useState('');

  const isNotion = platform === 'notion';
  const { t } = useTranslation();

  // Check storage on mount
  useEffect(() => {
    const checkKeys = () => {
      const stored = loadCredentials();
      if (isNotion) {
        setHasKeys(!!stored?.notionToken);
      } else {
        setHasKeys(!!stored?.larkAppId && !!stored?.larkAppSecret);
      }
    };
    
    checkKeys();
    // Re-check every second in case settings modal updated it (simple polling for demo)
    const interval = setInterval(checkKeys, 1000);
    return () => clearInterval(interval);
  }, [isNotion]);

  useEffect(() => {
    if (!isNotion) {
      setLarkTables(loadLarkTables());
    }
  }, [isNotion, hasKeys]);

  useEffect(() => {
    const run = async () => {
      const stored = loadCredentials();
      if (!isNotion && stored?.larkAppId && stored?.larkAppSecret && formData.appToken) {
        const list = await listLarkTables(formData.appToken);
        setApiTables(list);
      } else {
        setApiTables([]);
      }
    };
    run();
  }, [isNotion, formData.appToken]);


  // Auto-detect session via Notion API if keys exist
  useEffect(() => {
    const detect = async () => {
      if (isNotion && hasKeys && !isNotionConnected && !detectedUser) {
        setIsCheckingCredentials(true);
        try {
          const timeout = new Promise<null>((resolve) => setTimeout(() => resolve(null), 4000));
          const mePromise = fetchMe();
          const me = await Promise.race([mePromise, timeout]);
          if (me) {
            const avatar = me.name ? `https://ui-avatars.com/api/?name=${encodeURIComponent(me.name)}&background=0071E3&color=fff&size=128` : undefined;
            setDetectedUser({ ...me, avatar });
          }
        } finally {
          setIsCheckingCredentials(false);
        }
      } else if (!hasKeys) {
        setDetectedUser(null);
      }
    };
    detect();
  }, [isNotion, hasKeys, isNotionConnected]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleNotionConnect = async () => {
    setIsConnectingNotion(true);
    try {
      const list = await listDatabases();
      if (list.length > 0) {
        setDatabases(list);
        const preselected = initialData.databaseId ? list.find(d => d.id === initialData.databaseId) || null : null;
        setSelectedDb(preselected);
      }
      setIsNotionConnected(true);
    } finally {
      setIsConnectingNotion(false);
    }
  };

  const selectDatabase = (db: { id: string; title: string; icon?: string }) => {
      setSelectedDb(db);
      setFormData({ ...formData, databaseId: db.id });
      setShowDbDropdown(false);
  };

  const refreshDatabases = async () => {
    const list = await listDatabases();
    setDatabases(list);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setLarkError('');
    if (isNotion) {
      setIsLoading(false);
      onNext(formData);
      return;
    }
    const meta = await getBitableApp(formData.appToken);
    if (!meta.ok) {
      setIsLoading(false);
      if (meta.code === 2001254040) setLarkError(t('lark_token_invalid'));
      else if (meta.msg === 'no_auth') setLarkError(t('tenant_token_missing'));
      else if (meta.code === 91403) setLarkError(t('permission_denied'));
      else setLarkError(t('validate_failed'));
      return;
    }
    let tableId = formData.tableId;
    if (!tableId) {
      const tables = await listLarkTables(formData.appToken);
      if (tables.length === 0) {
        setIsLoading(false);
        setLarkError(t('no_base_tables'));
        return;
      }
      tableId = tables[0].id;
      setFormData({ ...formData, tableId });
    }
    const fields = await fetchLarkSchema(formData.appToken, tableId);
    if (fields.length === 0) {
      setIsLoading(false);
      setLarkError(t('no_fields_found'));
      return;
    }
    const saved = loadLarkTables();
    const exists = saved.some(s => s.appToken === formData.appToken && s.tableId === tableId);
    if (!exists) {
      const tables = await listLarkTables(formData.appToken);
      const match = tables.find(t => t.id === tableId);
      const autoName = match?.name || `Table ${tableId.slice(0, 6)}`;
      const next = [...saved, { name: autoName, appToken: formData.appToken!, tableId }];
      saveLarkTables(next);
      setSaveNotice(`${t('saved_table_added')} · ${t('rename_notice')}`);
    }
    setIsLoading(false);
    onNext({ ...formData, tableId });
  };

  return (
    <div className="max-w-xl mx-auto">
      <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden border border-white/50 relative">
        
        {/* Header Section */}
        <div className="pt-10 pb-6 px-8 text-center relative z-10">
            <div className="w-16 h-16 mx-auto mb-6 bg-gray-50 rounded-2xl flex items-center justify-center shadow-inner relative">
                {isNotion ? (
                    <img src="/Notion_app_logo.png" alt="Notion" className="w-10 h-10 object-contain" />
                ) : (
                    <img src="/Lark_Suite_logo_2022.png" alt="Lark" className="w-10 h-10 object-contain" />
                )}
                {hasKeys && (
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-2 border-white flex items-center justify-center animate-in zoom-in">
                        <Check size={12} className="text-white stroke-[4px]" />
                    </div>
                )}
            </div>
            <h2 className="text-2xl font-semibold text-gray-900 tracking-tight">
                {isNotion ? t('connect_notion') : t('connect_lark')}
            </h2>
            
        </div>

        <form onSubmit={handleSubmit} className="px-8 pb-10 space-y-6">
          
          {/* 1. Missing Keys State */}
          {!hasKeys && (
             <div className="bg-yellow-50 rounded-2xl p-5 border border-yellow-100 flex flex-col items-center text-center space-y-3 animate-in fade-in slide-in-from-bottom-4">
                <div className="p-3 bg-yellow-100 rounded-full text-yellow-600">
                    <AlertTriangle size={24} />
                </div>
                <div>
                    <h3 className="text-gray-900 font-medium">{t('credentials_required')}</h3>
                    <p className="text-xs text-gray-500 mt-1 max-w-[240px] mx-auto">
                        {isNotion 
                            ? t('notion_config_first') 
                            : t('lark_config_first')
                        }
                    </p>
                </div>
                <button
                    type="button"
                    onClick={onOpenSettings}
                    className="mt-2 text-sm font-semibold text-[#0071E3] hover:underline flex items-center"
                >
                    <Settings size={14} className="mr-1.5" />
                    {t('open_settings')}
                </button>
             </div>
          )}

          {/* 2. Notion Flow */}
          {hasKeys && isNotion && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
                {/* 2a. User Detection / Connect */}
                {!isNotionConnected ? (
                    <div className="space-y-4">
                        {isCheckingCredentials ? (
                            <div className="py-8 flex flex-col items-center justify-center space-y-3 text-gray-400">
                                <RefreshCw className="animate-spin" size={24} />
                                <span className="text-xs font-medium uppercase tracking-wider">{t('checking_session')}</span>
                            </div>
                        ) : detectedUser ? (
                            <div className="bg-gray-50 rounded-2xl p-1 border border-gray-100">
                                <div className="p-4 flex items-center justify-between">
                                    <div className="flex items-center space-x-3">
                                        <img src={detectedUser.avatar} alt="Avatar" className="w-10 h-10 rounded-full shadow-sm" />
                                        <div className="text-left">
                                            <div className="text-sm font-semibold text-gray-900">{detectedUser.name}</div>
                                            <div className="text-xs text-gray-500">{detectedUser.email}</div>
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={handleNotionConnect}
                                        className="bg-[#0071E3] hover:bg-[#0077ED] text-white px-4 py-2 rounded-xl text-sm font-semibold transition-all shadow-sm active:scale-95"
                                    >
                                        {t('continue')}
                                    </button>
                                </div>
                                <div className="px-4 py-2 border-t border-gray-200/50 bg-gray-100/50 rounded-b-xl text-center">
                                    <p className="text-[10px] text-gray-400">
                                        Identified via stored integration token
                                    </p>
                                </div>
                            </div>
                        ) : (
                             <button
                                type="button"
                                onClick={handleNotionConnect}
                                className="w-full py-4 bg-gray-900 hover:bg-black text-white rounded-2xl font-medium transition-all shadow-lg flex items-center justify-center"
                            >
                                {isConnectingNotion ? <RefreshCw className="animate-spin mr-2" /> : null}
                                {isConnectingNotion ? 'Connecting...' : 'Connect Workspace'}
                            </button>
                        )}
                    </div>
                ) : (
                    /* 2b. Database Selection */
                    <div className="space-y-4">
                         <div className="relative">
                            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 ml-1">{t('select_database')}</label>
                            <button
                                type="button"
                                onClick={() => setShowDbDropdown(!showDbDropdown)}
                                className="w-full flex items-center justify-between bg-gray-50 hover:bg-gray-100 border border-transparent hover:border-gray-200 rounded-2xl px-4 py-3.5 text-left transition-all"
                            >
                                {selectedDb ? (
                                    <div className="flex items-center">
                                        <span className="text-xl mr-3">{selectedDb.icon}</span>
                                        <span className="text-gray-900 font-medium">{selectedDb.title}</span>
                                    </div>
                                ) : (
                                    <span className="text-gray-400">{t('choose_database')}</span>
                                )}
                                <ChevronDown size={16} className={`text-gray-400 transition-transform ${showDbDropdown ? 'rotate-180' : ''}`} />
                            </button>
                            {databases.length === 0 && (
                              <div className="mt-2 text-[11px] text-gray-400 flex items-center justify-between">
                                <span>{t('no_databases')}</span>
                                <button type="button" onClick={refreshDatabases} className="text-[#0071E3] hover:underline">{t('refresh')}</button>
                              </div>
                            )}
                            {showDbDropdown && (
                                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-20 animate-in fade-in zoom-in-95">
                                    <div className="max-h-60 overflow-y-auto p-2 space-y-1">
                                        {databases.map(db => (
                                            <button
                                                key={db.id}
                                                type="button"
                                                onClick={() => selectDatabase(db)}
                                                className="w-full flex items-center px-3 py-3 rounded-xl hover:bg-gray-50 transition-colors text-left"
                                            >
                                                <span className="text-lg mr-3">{db.icon}</span>
                                                <span className="text-sm font-medium text-gray-700">{db.title}</span>
                                                {selectedDb?.id === db.id && <Check size={16} className="ml-auto text-[#0071E3]" />}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                         </div>
                         <div>
                           <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 ml-1">{t('database_id_manual')}</label>
                           <input
                             type="text"
                             name="databaseId"
                             value={formData.databaseId || ''}
                             onChange={handleChange}
                             placeholder="e.g. 12345678-90ab-cdef-1234-567890abcdef"
                             className="block w-full rounded-2xl border-gray-200 bg-gray-50 px-4 py-3.5 text-sm focus:border-[#0071E3] focus:ring-[#0071E3] focus:bg-white transition-all"
                           />
                           <p className="mt-2 text-[10px] text-gray-400 ml-1">{t('share_db_hint')}</p>
                         </div>
                     </div>
                )}
            </div>
          )}

          {/* 3. Lark Flow */}
          {hasKeys && !isNotion && (
            <div className="space-y-5 animate-in fade-in slide-in-from-bottom-4">
              {larkError && (
                <div className="bg-red-50 rounded-2xl p-3 border border-red-100 text-red-600 text-xs">{larkError}</div>
              )}
              {larkTestMsg && (
                <div className="bg-blue-50 rounded-2xl p-3 border border-blue-100 text-blue-700 text-xs">{larkTestMsg}</div>
              )}
              {saveNotice && (
                <div className="bg-green-50 rounded-2xl p-3 border border-green-100 text-green-700 text-xs">{saveNotice}</div>
              )}
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 ml-1">{t('saved_lark_tables')}</label>
                <button
                  type="button"
                  onClick={() => setShowLarkDropdown(!showLarkDropdown)}
                  className="w-full flex items-center justify-between bg-gray-50 hover:bg-gray-100 border border-transparent hover:border-gray-200 rounded-2xl px-4 py-3.5 text-left transition-all"
                >
                  {selectedLark ? (
                    <span className="text-gray-900 font-medium">{selectedLark.name}</span>
                  ) : (
                    <span className="text-gray-400">{t('choose_saved_table')}</span>
                  )}
                  <ChevronDown size={16} className={`text-gray-400 transition-transform ${showLarkDropdown ? 'rotate-180' : ''}`} />
                </button>
                {showLarkDropdown && (
                  <div className="mt-2 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-20 animate-in fade-in zoom-in-95">
                    <div className="max-h-60 overflow-y-auto p-2 space-y-1">
                      {larkTables.map(t => (
                        <button
                          key={t.name}
                          type="button"
                          onClick={() => { setSelectedLark(t); setFormData({ ...formData, appToken: t.appToken, tableId: t.tableId }); setShowLarkDropdown(false); }}
                          className="w-full flex items-center px-3 py-3 rounded-xl hover:bg-gray-50 transition-colors text-left"
                        >
                          <span className="text-sm font-medium text-gray-700">{t.name}</span>
                          {selectedLark?.name === t.name && <Check size={16} className="ml-auto text-[#0071E3]" />}
                        </button>
                      ))}
                      {larkTables.length === 0 && (
                        <div className="px-3 py-2 text-xs text-gray-400">{t('no_saved_tables')}</div>
                      )}
                    </div>
                  </div>
                )}
              </div>
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={async () => {
                    setIsTestingLark(true);
                    setLarkTestMsg('');
                    setLarkError('');
                    const tokenOk = await getBitableApp(formData.appToken);
                    if (!tokenOk) {
                      setLarkTestMsg(t('test_failed_no_permission'));
                      setIsTestingLark(false);
                      return;
                    }
                    const tables = await listLarkTables(formData.appToken);
                    let fieldsCount = 0;
                    if (formData.tableId) {
                      const fields = await fetchLarkSchema(formData.appToken, formData.tableId);
                      fieldsCount = fields.length;
                    }
                    setLarkTestMsg(formData.tableId
                      ? t('test_ok_summary', { tables: tables.length, fields: fieldsCount })
                      : t('test_ok_tables_only', { tables: tables.length })
                    );
                    setIsTestingLark(false);
                  }}
                  disabled={isTestingLark || !formData.appToken}
                  className="mt-2 text-xs font-semibold text-[#0071E3] hover:underline disabled:opacity-50"
                >
                  {isTestingLark ? t('testing') : t('test_connection')}
                </button>
              </div>
               <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 ml-1">{t('base_token')}</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
                    <LayoutGrid size={18} />
                  </div>
                  <input
                    type="text"
                    name="appToken" // Keep state name compatible
                    value={formData.appToken || ''}
                    onChange={handleChange}
                    placeholder={t('bitable_url_hint') + ' /base/bascn...'}
                    className="block w-full rounded-2xl border-gray-200 bg-gray-50 pl-11 pr-4 py-3.5 text-sm focus:border-[#0071E3] focus:ring-[#0071E3] focus:bg-white transition-all"
                    required
                  />
                </div>
                <p className="mt-2 text-[10px] text-gray-400 ml-1">
                    {t('bitable_url_hint_full', { token: 'bascnXXXXXXXX' })}
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 ml-1">{t('table_id')}</label>
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
                        <Table size={18} />
                    </div>
                <input
                    type="text"
                    name="tableId"
                    value={formData.tableId}
                    onChange={handleChange}
                    placeholder="e.g. tbl..."
                    className="block w-full rounded-2xl border-gray-200 bg-gray-50 pl-11 pr-4 py-3.5 text-sm focus:border-[#0071E3] focus:ring-[#0071E3] focus:bg-white transition-all"
                    required
                  />
                </div>
                {apiTables.length > 0 && (
                  <div className="mt-2">
                    <button type="button" onClick={() => setShowApiTableDropdown(!showApiTableDropdown)} className="text-xs text-[#0071E3] hover:underline">{t('select_from_base_tables')}</button>
                    {showApiTableDropdown && (
                      <div className="mt-2 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
                        <div className="max-h-60 overflow-y-auto p-2 space-y-1">
                          {apiTables.map(t => (
                            <button
                              key={t.id}
                              type="button"
                              onClick={() => { setFormData({ ...formData, tableId: t.id }); setShowApiTableDropdown(false); }}
                              className="w-full flex items-center px-3 py-3 rounded-xl hover:bg-gray-50 transition-colors text-left"
                            >
                              <span className="text-sm font-medium text-gray-700">{t.name}</span>
                              {formData.tableId === t.id && <Check size={16} className="ml-auto text-[#0071E3]" />}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Footer Actions */}
          {hasKeys && (
            <div className="pt-4 flex items-center justify-between border-t border-gray-50">
                <button 
                    type="button" 
                    onClick={onOpenSettings}
                    className="text-gray-400 hover:text-gray-600 transition-colors p-2 rounded-lg hover:bg-gray-50"
                    title={t('settings')}
                >
                    <Settings size={20} />
                </button>

                <button
                    type="submit"
                    disabled={isLoading || (isNotion && !selectedDb) || (!isNotion && (!formData.appToken || !formData.tableId))}
                    className="flex items-center px-8 py-3.5 bg-[#0071E3] hover:bg-[#0077ED] text-white rounded-2xl font-semibold shadow-sm transition-all transform active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                    {isLoading ? (
                        <RefreshCw className="animate-spin h-5 w-5" />
                    ) : (
                        <>
                            <span>{t('continue')}</span>
                            <ArrowRight className="ml-2 h-4 w-4 stroke-[3px]" />
                        </>
                    )}
                </button>
            </div>
          )}

        </form>
      </div>
    </div>
  );
};

export default ConfigStep;
