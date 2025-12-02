import React, { useEffect, useRef } from 'react';
import { LogEntry } from '../types';
import { CheckCircle2, AlertCircle, Loader2, Play, RefreshCw, XCircle } from 'lucide-react';

interface SyncStepProps {
  logs: LogEntry[];
  isSyncing: boolean;
  onStart: () => void;
  onReset: () => void;
}

const SyncStep: React.FC<SyncStepProps> = ({ logs, isSyncing, onStart, onReset }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  // Determine overall status
  const errorCount = logs.filter(l => l.level === 'error').length;
  const successCount = logs.filter(l => l.level === 'success').length;
  const warningCount = logs.filter(l => l.level === 'warning').length;

  return (
    <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
      
      {/* Left Panel: Status Card */}
      <div className="lg:col-span-1 space-y-6">
        <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 p-8 flex flex-col h-full">
          <h3 className="text-xl font-semibold text-gray-900 mb-6 tracking-tight">Sync Overview</h3>
          
          <div className="space-y-4 flex-1">
            <div className="flex items-center justify-between p-4 bg-green-50/50 rounded-2xl border border-green-100/50">
              <div className="flex items-center space-x-3">
                 <div className="p-1.5 bg-green-100 rounded-full text-green-600">
                    <CheckCircle2 size={16} />
                 </div>
                 <span className="text-sm font-medium text-gray-600">Success</span>
              </div>
              <span className="text-xl font-bold text-green-600">{successCount}</span>
            </div>
            
            <div className="flex items-center justify-between p-4 bg-red-50/50 rounded-2xl border border-red-100/50">
              <div className="flex items-center space-x-3">
                 <div className="p-1.5 bg-red-100 rounded-full text-red-600">
                    <XCircle size={16} />
                 </div>
                 <span className="text-sm font-medium text-gray-600">Errors</span>
              </div>
              <span className="text-xl font-bold text-red-600">{errorCount}</span>
            </div>

            <div className="flex items-center justify-between p-4 bg-yellow-50/50 rounded-2xl border border-yellow-100/50">
               <div className="flex items-center space-x-3">
                 <div className="p-1.5 bg-yellow-100 rounded-full text-yellow-600">
                    <AlertCircle size={16} />
                 </div>
                 <span className="text-sm font-medium text-gray-600">Warnings</span>
              </div>
              <span className="text-xl font-bold text-yellow-600">{warningCount}</span>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-gray-100">
            {!isSyncing && logs.length === 0 && (
                <button
                onClick={onStart}
                className="w-full flex items-center justify-center py-4 px-4 bg-[#0071E3] hover:bg-[#0077ED] text-white rounded-2xl shadow-sm text-sm font-semibold transition-all transform active:scale-[0.98]"
                >
                <Play size={16} className="mr-2 fill-current" />
                Start Sync
                </button>
            )}
            
            {isSyncing && (
                 <button disabled className="w-full flex items-center justify-center py-4 px-4 bg-gray-100 text-gray-400 rounded-2xl text-sm font-medium cursor-not-allowed">
                   <Loader2 size={18} className="animate-spin mr-2" />
                   Processing...
                 </button>
            )}

            {!isSyncing && logs.length > 0 && (
                 <button onClick={onReset} className="w-full flex items-center justify-center py-4 px-4 bg-white border border-gray-200 hover:bg-gray-50 text-gray-900 rounded-2xl text-sm font-medium transition-colors">
                    <RefreshCw size={16} className="mr-2" />
                    New Sync
                 </button>
            )}
          </div>
        </div>
      </div>

      {/* Right Panel: Console */}
      <div className="lg:col-span-2">
        <div className="bg-[#1e1e1e] rounded-3xl shadow-2xl overflow-hidden flex flex-col h-[600px] border border-gray-800">
          {/* macOS-like Window Header */}
          <div className="bg-[#2d2d2d] px-4 py-3 border-b border-black/20 flex items-center justify-between">
            <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full bg-[#ff5f56]"></div>
                <div className="w-3 h-3 rounded-full bg-[#ffbd2e]"></div>
                <div className="w-3 h-3 rounded-full bg-[#27c93f]"></div>
            </div>
            <div className="text-xs font-medium text-gray-400">process_log.txt</div>
            <div className="w-10"></div> {/* Spacer for centering */}
          </div>
          
          <div 
            ref={scrollRef}
            className="flex-1 overflow-y-auto p-6 space-y-2.5 font-mono text-[13px] leading-relaxed no-scrollbar"
          >
            {logs.length === 0 && !isSyncing && (
                <div className="h-full flex flex-col items-center justify-center text-gray-500 space-y-4">
                    <div className="w-16 h-16 rounded-full bg-gray-800 flex items-center justify-center">
                        <Play size={24} className="ml-1 opacity-50" />
                    </div>
                    <p>Ready to execute synchronization task.</p>
                </div>
            )}

            {logs.map((log) => (
              <div key={log.id} className="flex items-start group">
                <span className="text-gray-600 shrink-0 w-24 select-none">
                  {log.timestamp.toLocaleTimeString([], { hour12: false, hour: '2-digit', minute:'2-digit', second:'2-digit' })}
                </span>
                <span className={`break-words flex-1 ${
                    log.level === 'error' ? 'text-red-400 font-medium' :
                    log.level === 'success' ? 'text-emerald-400' :
                    log.level === 'warning' ? 'text-yellow-400' :
                    'text-gray-300'
                }`}>
                  {log.level === 'error' && '✖ '}
                  {log.level === 'success' && '✓ '}
                  {log.level === 'warning' && '⚠ '}
                  {log.message}
                </span>
              </div>
            ))}
             {isSyncing && (
                 <div className="flex items-center space-x-2 text-gray-500 pl-24">
                     <span className="animate-pulse">_</span>
                 </div>
             )}
          </div>
        </div>
      </div>

    </div>
  );
};

export default SyncStep;