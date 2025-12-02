import React, { useState, useEffect } from 'react';
import { X, Lock, Save, ShieldCheck, Eye, EyeOff } from 'lucide-react';
import { loadCredentials, saveCredentials } from '../services/secureStorage';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const [notionToken, setNotionToken] = useState('');
  const [larkAppId, setLarkAppId] = useState('');
  const [larkAppSecret, setLarkAppSecret] = useState('');
  const [showSecrets, setShowSecrets] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const creds = loadCredentials();
      if (creds) {
        setNotionToken(creds.notionToken);
        setLarkAppId(creds.larkAppId);
        setLarkAppSecret(creds.larkAppSecret);
      }
    }
  }, [isOpen]);

  const handleSave = () => {
    saveCredentials({
      notionToken,
      larkAppId,
      larkAppSecret
    });
    onClose();
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
            <h3 className="font-semibold text-gray-900">Credential Manager</h3>
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
              Your credentials are saved locally in your browser using secure obfuscation. 
              They are never sent to our servers, only directly to Notion/Lark APIs (simulated in this demo).
            </p>
          </div>

          <div className="space-y-5">
            {/* Notion Section */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Notion Configuration</h4>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Integration Token</label>
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

            <hr className="border-gray-100" />

            {/* Lark Section */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Lark / Feishu Configuration</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">App ID</label>
                  <input
                    type="text"
                    value={larkAppId}
                    onChange={(e) => setLarkAppId(e.target.value)}
                    placeholder="cli_..."
                    className="block w-full rounded-xl border-gray-200 bg-gray-50 px-4 py-3 text-sm focus:border-[#0071E3] focus:ring-[#0071E3] focus:bg-white transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">App Secret</label>
                  <div className="relative">
                    <input
                      type={showSecrets ? "text" : "password"}
                      value={larkAppSecret}
                      onChange={(e) => setLarkAppSecret(e.target.value)}
                      placeholder="Input secret"
                      className="block w-full rounded-xl border-gray-200 bg-gray-50 px-4 py-3 text-sm focus:border-[#0071E3] focus:ring-[#0071E3] focus:bg-white transition-all pr-10"
                    />
                  </div>
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
             <span>{showSecrets ? 'Hide' : 'Show'} Keys</span>
           </button>

           <button
            onClick={handleSave}
            className="bg-[#0071E3] hover:bg-[#0077ED] text-white px-6 py-2.5 rounded-xl text-sm font-semibold shadow-sm transition-all active:scale-95 flex items-center"
           >
            <Save size={16} className="mr-2" />
            Save Configuration
           </button>
        </div>

      </div>
    </div>
  );
};

export default SettingsModal;