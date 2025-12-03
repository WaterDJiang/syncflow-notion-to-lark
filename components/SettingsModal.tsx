import React, { useState, useEffect } from 'react';
import { X, Lock, Save, ShieldCheck, Eye, EyeOff } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { loadCredentials, saveCredentials, loadLarkTables, saveLarkTables } from '../services/secureStorage';
import { LarkTableConfig } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const [notionToken, setNotionToken] = useState('');
  const [larkAppId, setLarkAppId] = useState('');
  const [larkAppSecret, setLarkAppSecret] = useState('');
  const [showSecrets, setShowSecrets] = useState(false);
  const [larkTables, setLarkTables] = useState<LarkTableConfig[]>([]);
  const [newName, setNewName] = useState('');
  const [newAppToken, setNewAppToken] = useState('');
  const [newTableId, setNewTableId] = useState('');
  const { t } = useTranslation();

  useEffect(() => {
    if (isOpen) {
      const creds = loadCredentials();
      if (creds) {
        setNotionToken(creds.notionToken);
        setLarkAppId(creds.larkAppId);
        setLarkAppSecret(creds.larkAppSecret);
      }
      setLarkTables(loadLarkTables());
    }
  }, [isOpen]);

  const handleSave = () => {
    const creds = loadCredentials();
    const next = {
      notionToken,
      larkAppId,
      larkAppSecret,
      larkTables: larkTables
    };
    saveCredentials(next as any);
    saveLarkTables(larkTables);
    onClose();
  };

  const addLarkTable = () => {
    if (!newName || !newAppToken || !newTableId) return;
    const exists = larkTables.some(t => t.name === newName);
    const next = exists
      ? larkTables.map(t => (t.name === newName ? { name: newName, appToken: newAppToken, tableId: newTableId } : t))
      : [...larkTables, { name: newName, appToken: newAppToken, tableId: newTableId }];
    setLarkTables(next);
    setNewName('');
    setNewAppToken('');
    setNewTableId('');
  };

  const removeLarkTable = (name: string) => {
    setLarkTables(larkTables.filter(t => t.name !== name));
  };


  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-gray-900/20 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Window */}
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-gray-100 animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="text-gray-900" size={20} />
            <h3 className="font-semibold text-gray-900">{t('credential_manager_title')}</h3>
          </div>
          <button 
            onClick={onClose}
            className="p-2 bg-white rounded-full text-gray-400 hover:text-gray-900 shadow-sm border border-gray-100 hover:bg-gray-50 transition-all"
          >
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          <div className="bg-blue-50/50 rounded-xl p-4 flex items-start space-x-3 border border-blue-100">
            <Lock className="text-[#0071E3] shrink-0 mt-0.5" size={16} />
            <p className="text-xs text-gray-600 leading-relaxed">
              {t('credential_manager_desc')}
            </p>
          </div>

          <div className="space-y-5">
            {/* Notion Section */}
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <img src="/Notion_app_logo.png" alt="Notion" className="w-6 h-6 rounded" />
                <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider">{t('notion_configuration')}</h4>
              </div>
              <div className="rounded-xl border border-gray-200 bg-white p-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('integration_token')}</label>
                <div className="relative">
                  <input
                    type={showSecrets ? "text" : "password"}
                    value={notionToken}
                    onChange={(e) => setNotionToken(e.target.value)}
                    placeholder="secret_..."
                    className="block w-full rounded-xl border-gray-200 bg-gray-50 px-4 py-3 text-sm focus:border-[#0071E3] focus:ring-[#0071E3] focus:bg-white transition-all pr-10"
                  />
                </div>
              </div>
            </div>

            <div className="h-px my-4 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200" />

            {/* Lark Section */}
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <img src="/Lark_Suite_logo_2022.png" alt="Lark" className="w-6 h-6 rounded" />
                <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider">{t('lark_configuration')}</h4>
              </div>
              <div className="rounded-xl border border-gray-200 bg-white p-4 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('app_id')}</label>
                    <input
                      type="text"
                      value={larkAppId}
                      onChange={(e) => setLarkAppId(e.target.value)}
                      placeholder="cli_..."
                      className="block w-full rounded-xl border-gray-200 bg-gray-50 px-4 py-3 text-sm focus:border-[#0071E3] focus:ring-[#0071E3] focus:bg-white transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('app_secret')}</label>
                    <div className="relative">
                      <input
                        type={showSecrets ? "text" : "password"}
                        value={larkAppSecret}
                        onChange={(e) => setLarkAppSecret(e.target.value)}
                        placeholder={t('input_secret')}
                        className="block w-full rounded-xl border-gray-200 bg-gray-50 px-4 py-3 text-sm focus:border-[#0071E3] focus:ring-[#0071E3] focus:bg-white transition-all pr-10"
                      />
                    </div>
                  </div>
                </div>

                <div className="text-xs text-gray-500">{t('lark_note')}</div>

                <div className="mt-2 space-y-3">
                  <h5 className="text-xs font-bold text-gray-700 uppercase tracking-wider">{t('saved_lark_tables')}</h5>
                  <div className="space-y-2">
                    {larkTables.map((t) => (
                      <div key={t.name} className="flex items-center justify-between bg-gray-50 rounded-xl border border-gray-200 px-3 py-2">
                        <div className="text-sm text-gray-700">
                          <span className="font-semibold">{t.name}</span>
                          <span className="ml-2 text-gray-400">{t.appToken}</span>
                          <span className="ml-2 text-gray-400">{t.tableId}</span>
                        </div>
                        <button onClick={() => removeLarkTable(t.name)} className="text-red-600 text-xs font-medium">Delete</button>
                      </div>
                    ))}
                    {larkTables.length === 0 && (
                      <div className="text-xs text-gray-400">{t('no_saved_tables')}</div>
                    )}
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <input
                      type="text"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      placeholder={t('name')}
                      className="rounded-xl border-gray-200 bg-gray-50 px-3 py-2 text-sm focus:border-[#0071E3] focus:ring-[#0071E3]"
                    />
                    <input
                      type="text"
                      value={newAppToken}
                      onChange={(e) => setNewAppToken(e.target.value)}
                      placeholder={t('base_token')}
                      className="rounded-xl border-gray-200 bg-gray-50 px-3 py-2 text-sm focus:border-[#0071E3] focus:ring-[#0071E3]"
                    />
                    <input
                      type="text"
                      value={newTableId}
                      onChange={(e) => setNewTableId(e.target.value)}
                      placeholder={t('table_id')}
                      className="rounded-xl border-gray-200 bg-gray-50 px-3 py-2 text-sm focus:border-[#0071E3] focus:ring-[#0071E3]"
                    />
                  </div>
                  <button onClick={addLarkTable} className="px-4 py-2 bg-gray-900 text-white rounded-xl text-sm font-semibold">{t('add')}</button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
           <button
            type="button"
            onClick={() => setShowSecrets(!showSecrets)}
            className="text-gray-500 hover:text-gray-900 text-sm font-medium flex items-center space-x-2"
           >
             {showSecrets ? <EyeOff size={16} /> : <Eye size={16} />}
             <span>{showSecrets ? t('hide_keys') : t('show_keys')}</span>
           </button>

           <button
            onClick={handleSave}
            className="bg-[#0071E3] hover:bg-[#0077ED] text-white px-6 py-2.5 rounded-xl text-sm font-semibold shadow-sm transition-all active:scale-95 flex items-center"
           >
            <Save size={16} className="mr-2" />
            {t('save_configuration')}
           </button>
        </div>

      </div>
    </div>
  );
};

export default SettingsModal;
