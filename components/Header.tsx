import React from 'react';
import { RefreshCw, Settings } from 'lucide-react';

interface HeaderProps {
  onOpenSettings: () => void;
}

const Header: React.FC<HeaderProps> = ({ onOpenSettings }) => {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/70 backdrop-blur-xl border-b border-gray-200/50 supports-[backdrop-filter]:bg-white/60">
      <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="text-gray-900">
            <RefreshCw size={20} strokeWidth={2.5} />
          </div>
          <h1 className="text-lg font-semibold text-gray-900 tracking-tight">SyncFlow</h1>
        </div>
        <div className="flex items-center space-x-4">
            <span className="hidden sm:inline text-xs font-medium text-gray-500 tracking-wide uppercase mr-2">
                Notion to Lark
            </span>
            <button 
              onClick={onOpenSettings}
              className="p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100/50 rounded-lg transition-colors"
              title="API Credentials"
            >
              <Settings size={20} strokeWidth={2} />
            </button>
        </div>
      </div>
    </header>
  );
};

export default Header;