import React, { useState, useEffect } from 'react';
import { ArrowRight, Check, ChevronDown, RefreshCw, AlertTriangle, Settings, LayoutGrid, Table } from 'lucide-react';
import { hasCredentials, loadCredentials } from '../services/secureStorage';

interface ConfigStepProps {
  platform: 'notion' | 'lark';
  initialData: any;
  onNext: (data: any) => void;
  onOpenSettings: () => void;
}

const MOCK_NOTION_DATABASES = [
  { id: 'db_1', title: 'Product Roadmap', icon: '🗺️' },
  { id: 'db_2', title: 'Task Manager', icon: '✅' },
  { id: 'db_3', title: 'Customer Feedback', icon: '💬' },
  { id: 'db_4', title: 'Meeting Notes', icon: '📝' },
];

const MOCK_DETECTED_USER = {
    name: 'Engineering Team',
    email: 'dev@syncflow.app',
    avatar: 'https://ui-avatars.com/api/?name=Engineering+Team&background=0071E3&color=fff&size=128'
};

const ConfigStep: React.FC<ConfigStepProps> = ({ platform, initialData, onNext, onOpenSettings }) => {
  const [formData, setFormData] = useState(initialData);
  const [isLoading, setIsLoading] = useState(false);
  
  const [hasKeys, setHasKeys] = useState(false);
  
  // State specific for Notion Flow
  const [isNotionConnected, setIsNotionConnected] = useState(false);
  const [isConnectingNotion, setIsConnectingNotion] = useState(false);
  const [showDbDropdown, setShowDbDropdown] = useState(false);
  const [selectedDb, setSelectedDb] = useState<typeof MOCK_NOTION_DATABASES[0] | null>(
     MOCK_NOTION_DATABASES.find(d => d.id === initialData.databaseId) || null
  );
  
  // State for Cookie/Token Detection simulation
  const [isCheckingCredentials, setIsCheckingCredentials] = useState(false);
  const [detectedUser, setDetectedUser] = useState<typeof MOCK_DETECTED_USER | null>(null);

  const isNotion = platform === 'notion';

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


  // Auto-detect "session" if keys exist
  useEffect(() => {
      if (isNotion && hasKeys && !isNotionConnected && !detectedUser) {
          setIsCheckingCredentials(true);
          const timer = setTimeout(() => {
              setIsCheckingCredentials(false);
              setDetectedUser(MOCK_DETECTED_USER);
          }, 1500);
          return () => clearTimeout(timer);
      } else if (!hasKeys) {
        setDetectedUser(null);
      }
  }, [isNotion, hasKeys, isNotionConnected]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleNotionConnect = () => {
    setIsConnectingNotion(true);
    setTimeout(() => {
        setIsConnectingNotion(false);
        setIsNotionConnected(true);
    }, 800);
  };

  const selectDatabase = (db: typeof MOCK_NOTION_DATABASES[0]) => {
      setSelectedDb(db);
      setFormData({ ...formData, databaseId: db.id });
      setShowDbDropdown(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    // Simulate connection check
    setTimeout(() => {
        setIsLoading(false);
        onNext(formData);
    }, 800);
  };

  return (
    <div className="max-w-xl mx-auto">
      <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden border border-white/50 relative">
        
        {/* Header Section */}
        <div className="pt-10 pb-6 px-8 text-center relative z-10">
            <div className="w-16 h-16 mx-auto mb-6 bg-gray-50 rounded-2xl flex items-center justify-center shadow-inner relative">
                 {isNotion ? (
                    <img src="https://upload.wikimedia.org/wikipedia/commons/4/45/Notion_app_logo.png" alt="Notion" className="w-10 h-10 object-contain" />
                ) : (
                    <img src="https://lf3-static.bytednsdoc.com/obj/eden-cn/pipieh7nupabozups/lark_logo_2020.png" alt="Lark" className="w-10 h-10 object-contain" />
                )}
                {hasKeys && (
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-2 border-white flex items-center justify-center animate-in zoom-in">
                        <Check size={12} className="text-white stroke-[4px]" />
                    </div>
                )}
            </div>
            <h2 className="text-2xl font-semibold text-gray-900 tracking-tight">
                {isNotion ? 'Connect Notion Source' : 'Connect Lark Destination'}
            </h2>
            <p className="text-gray-500 mt-2 text-sm leading-relaxed max-w-xs mx-auto">
                {isNotion 
                ? 'We use your saved Integration Token to access databases.' 
                : 'We use your App ID & Secret to write to the Base.'}
            </p>
        </div>

        <form onSubmit={handleSubmit} className="px-8 pb-10 space-y-6">
          
          {/* 1. Missing Keys State */}
          {!hasKeys && (
             <div className="bg-yellow-50 rounded-2xl p-5 border border-yellow-100 flex flex-col items-center text-center space-y-3 animate-in fade-in slide-in-from-bottom-4">
                <div className="p-3 bg-yellow-100 rounded-full text-yellow-600">
                    <AlertTriangle size={24} />
                </div>
                <div>
                    <h3 className="text-gray-900 font-medium">Credentials Required</h3>
                    <p className="text-xs text-gray-500 mt-1 max-w-[240px] mx-auto">
                        {isNotion 
                            ? "Please configure your Notion Integration Token first." 
                            : "Please configure your Lark App ID and Secret first."
                        }
                    </p>
                </div>
                <button
                    type="button"
                    onClick={onOpenSettings}
                    className="mt-2 text-sm font-semibold text-[#0071E3] hover:underline flex items-center"
                >
                    <Settings size={14} className="mr-1.5" />
                    Open Settings
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
                                <span className="text-xs font-medium uppercase tracking-wider">Checking session...</span>
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
                                        Continue
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
                            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 ml-1">Select Database</label>
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
                                    <span className="text-gray-400">Choose a database...</span>
                                )}
                                <ChevronDown size={16} className={`text-gray-400 transition-transform ${showDbDropdown ? 'rotate-180' : ''}`} />
                            </button>

                            {showDbDropdown && (
                                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-20 animate-in fade-in zoom-in-95">
                                    <div className="max-h-60 overflow-y-auto p-2 space-y-1">
                                        {MOCK_NOTION_DATABASES.map(db => (
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
                    </div>
                )}
            </div>
          )}

          {/* 3. Lark Flow */}
          {hasKeys && !isNotion && (
            <div className="space-y-5 animate-in fade-in slide-in-from-bottom-4">
               <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 ml-1">Base Token</label>
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
                        <LayoutGrid size={18} />
                    </div>
                    <input
                        type="text"
                        name="appToken" // Keep state name compatible
                        value={formData.appToken || ''}
                        onChange={handleChange}
                        placeholder="e.g. bascn..."
                        className="block w-full rounded-2xl border-gray-200 bg-gray-50 pl-11 pr-4 py-3.5 text-sm focus:border-[#0071E3] focus:ring-[#0071E3] focus:bg-white transition-all"
                        required
                    />
                </div>
                <p className="mt-2 text-[10px] text-gray-400 ml-1">
                    Found in your Bitable URL: /base/<span className="font-mono text-gray-500">bascnXXXXXXXX</span>
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 ml-1">Table ID</label>
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
                    title="Settings"
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
                            <span>Continue</span>
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