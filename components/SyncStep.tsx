import React, { useEffect, useRef } from 'react';
import { LogEntry, LarkOperationConfig } from '../types';
import { countNotionRecords } from '../services/notionService';
import { CheckCircle2, AlertCircle, Loader2, Play, RefreshCw, XCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface SyncStepProps {
  logs: LogEntry[];
  isSyncing: boolean;
  onStart: (op: LarkOperationConfig) => void;
  onReset: () => void;
  notionConfig: { databaseId: string };
  larkConfig: { appToken?: string; tableId: string };
  refreshTick: number;
}

const SyncStep: React.FC<SyncStepProps> = ({ logs, isSyncing, onStart, onReset, notionConfig, larkConfig, refreshTick }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [notionCount, setNotionCount] = React.useState<number | null>(null);
  const [syncLimit, setSyncLimit] = React.useState<number>(20);
  const [op, setOp] = React.useState<LarkOperationConfig>({ op: 'insert_records' });
  const [newAppName, setNewAppName] = React.useState('');
  const [copyFolderToken, setCopyFolderToken] = React.useState('');

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  useEffect(() => {
    const run = async () => {
      if (notionConfig?.databaseId) {
        const c = await countNotionRecords(notionConfig.databaseId);
        setNotionCount(c);
        if (c > 0 && syncLimit > c) setSyncLimit(Math.min(syncLimit, c));
      }
      // Lark records count display is removed per request
    };
    run();
  }, [notionConfig?.databaseId, larkConfig?.appToken, larkConfig?.tableId, refreshTick]);

  // Determine overall status
  const errorCount = logs.filter(l => l.level === 'error').length;
  const successCount = logs.filter(l => l.level === 'success').length;
  const warningCount = logs.filter(l => l.level === 'warning').length;

  const { t } = useTranslation();
  return (
    <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
      
      {/* Left Panel: Status Card */}
      <div className="lg:col-span-1 space-y-6">
        <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 p-8 flex flex-col h-full">
          <h3 className="text-xl font-semibold text-gray-900 mb-6 tracking-tight">{t('sync_overview')}</h3>
          
          <div className="space-y-4 flex-1">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100/50">
              <span className="text-sm font-medium text-gray-600">{t('notion_records')}</span>
              <span className="text-xl font-bold text-gray-900">{notionCount ?? '-'}</span>
            </div>
            {/* Lark records count removed */}
            <div className="flex items-center justify-between p-4 bg-green-50/50 rounded-2xl border border-green-100/50">
              <div className="flex items-center space-x-3">
                 <div className="p-1.5 bg-green-100 rounded-full text-green-600">
                    <CheckCircle2 size={16} />
                 </div>
                 <span className="text-sm font-medium text-gray-600">{t('success')}</span>
              </div>
              <span className="text-xl font-bold text-green-600">{successCount}</span>
            </div>
            
            <div className="flex items-center justify-between p-4 bg-red-50/50 rounded-2xl border border-red-100/50">
              <div className="flex items-center space-x-3">
                 <div className="p-1.5 bg-red-100 rounded-full text-red-600">
                    <XCircle size={16} />
                 </div>
                 <span className="text-sm font-medium text-gray-600">{t('errors')}</span>
              </div>
              <span className="text-xl font-bold text-red-600">{errorCount}</span>
            </div>

            <div className="flex items-center justify-between p-4 bg-yellow-50/50 rounded-2xl border border-yellow-100/50">
               <div className="flex items-center space-x-3">
                 <div className="p-1.5 bg-yellow-100 rounded-full text-yellow-600">
                    <AlertCircle size={16} />
                 </div>
                 <span className="text-sm font-medium text-gray-600">{t('warnings')}</span>
              </div>
              <span className="text-xl font-bold text-yellow-600">{warningCount}</span>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-gray-100">
            {!isSyncing && (
              <div className="space-y-3">
                <div className="grid grid-cols-1 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">{t('sync_limit')}</label>
                    <input type="number" min={1} value={syncLimit} onChange={(e)=>setSyncLimit(Number(e.target.value))} className="w-full rounded-xl border-gray-200 bg-gray-50 px-3 py-2 text-sm" />
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-2">
                  <button onClick={() => setOp({ op: 'insert_records' })} className={`px-3 py-2 rounded-xl text-xs ${op.op==='insert_records'?'bg-gray-900 text-white':'bg-gray-100 text-gray-600'}`}>{t('bulk_import')}</button>
                </div>
                {op.op === 'create_app' && (
                  <div className="grid grid-cols-2 gap-2">
                    <input value={newAppName} onChange={(e)=>setNewAppName(e.target.value)} placeholder="新表名称" className="rounded-xl border-gray-200 bg-gray-50 px-3 py-2 text-xs" />
                    <input value={copyFolderToken} onChange={(e)=>setCopyFolderToken(e.target.value)} placeholder="文件夹 Token 可选" className="rounded-xl border-gray-200 bg-gray-50 px-3 py-2 text-xs" />
                  </div>
                )}
                {op.op === 'update_app' && (
                  <div className="grid grid-cols-1 gap-2">
                    <input value={newAppName} onChange={(e)=>setNewAppName(e.target.value)} placeholder="新的表名称" className="rounded-xl border-gray-200 bg-gray-50 px-3 py-2 text-xs" />
                  </div>
                )}
                <button
                  onClick={() => onStart({ op, params: { name: newAppName, folder_token: copyFolderToken, limit: syncLimit } } as any)}
                  className="w-full flex items-center justify-center py-4 px-4 bg-[#0071E3] hover:bg-[#0077ED] text-white rounded-2xl shadow-sm text-sm font-semibold transition-all transform active:scale-[0.98]"
                >
                  <Play size={16} className="mr-2 fill-current" />
                  {t('start_sync')}
                </button>
              </div>
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
                    {t('new_sync')}
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
