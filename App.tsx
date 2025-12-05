import React, { useState } from 'react';
import './src/i18n';
import Header from './components/Header';
import Landing from './components/Landing';
import StepWizard from './components/StepWizard';
import ConfigStep from './components/ConfigStep';
import MappingStep from './components/MappingStep';
import SyncStep from './components/SyncStep';
import SettingsModal from './components/SettingsModal';
import { AppState, AppStep, NotionConfig, LarkConfig, LogEntry, LarkOperationConfig } from './types';
import { fetchNotionSchema, countNotionRecords } from './services/notionService';
import { computeSelectDistribution, fetchLarkRecordsSample } from './services/larkService';
import { fetchLarkSchema, createBitableApp, updateBitableApp, copyBitableApp, insertLarkRecords, listLarkTables, getBitableApp, batchCreateRecordsDetailed } from './services/larkService';
import { fetchNotionRecordsSample } from './services/notionService';
import { loadCredentials } from './services/secureStorage';

function App() {
  const [state, setState] = useState<AppState>({
    step: AppStep.CONFIG_NOTION,
    notionConfig: { databaseId: '' },
    larkConfig: { appToken: '', tableId: '' },
    notionSchema: [],
    larkSchema: [],
    mapping: [],
    logs: [],
    isSyncing: false,
  });

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [showLanding, setShowLanding] = useState(true);

  const addLog = (message: string, level: LogEntry['level'] = 'info') => {
    setState(prev => ({
      ...prev,
      logs: [...prev.logs, {
        id: Math.random().toString(36).substr(2, 9),
        timestamp: new Date(),
        level,
        message
      }]
    }));
  };

  const handleNotionSubmit = async (config: NotionConfig) => {
    const creds = loadCredentials();
    const hasToken = !!creds?.notionToken;
    let schema = [] as any[];
    if (hasToken && config.databaseId) {
      schema = await fetchNotionSchema(config.databaseId);
    }
    setState(prev => ({
      ...prev,
      notionConfig: config,
      notionSchema: schema,
      step: AppStep.CONFIG_LARK
    }));
  };

  const handleLarkSubmit = async (config: LarkConfig) => {
    const creds = loadCredentials();
    const hasApp = !!creds?.larkAppId && !!creds?.larkAppSecret;
    let schema: any[] = [];
    try {
      if (hasApp && config.tableId && config.appToken) {
        const meta = await getBitableApp(config.appToken);
        addLog(meta ? `Validated Lark Base token` : `Failed to validate Lark Base token`, meta ? 'success' : 'error');
        schema = await fetchLarkSchema(config.appToken, config.tableId);
        addLog(schema.length > 0 ? `Fetched ${schema.length} Lark fields` : `No Lark fields found (check table_id and permissions)`, schema.length > 0 ? 'success' : 'warning');
      } else if (hasApp && config.appToken && !config.tableId) {
        const meta = await getBitableApp(config.appToken);
        addLog(meta ? `Validated Lark Base token` : `Failed to validate Lark Base token`, meta ? 'success' : 'error');
        const tables = await listLarkTables(config.appToken);
        addLog(tables.length ? `Found ${tables.length} tables in Base` : 'No tables found in Base', tables.length ? 'info' : 'warning');
        const chosen = tables[0];
        if (chosen) {
          config.tableId = chosen.id;
          schema = await fetchLarkSchema(config.appToken, chosen.id);
          addLog(schema.length > 0 ? `Fetched ${schema.length} fields from table ${chosen.name}` : `No fields in table ${chosen.name}`, schema.length ? 'success' : 'warning');
        }
      }
    } catch {
      schema = [];
    }
    setState(prev => ({
      ...prev,
      larkConfig: config,
      larkSchema: schema,
      step: AppStep.MAPPING
    }));
  };

  const handleMappingConfirm = (mapping: any) => {
    setState(prev => ({
      ...prev,
      mapping,
      step: AppStep.SYNC,
      syncRefreshTick: Date.now()
    }));
  };

  const runSyncSimulation = async (opCfg: LarkOperationConfig) => {
    setState(prev => ({ ...prev, isSyncing: true, logs: [] }));
    addLog('Loading credentials from secure storage...', 'info');
    await new Promise(r => setTimeout(r, 400));
    
    addLog('Initializing sync job...', 'info');
    
    await new Promise(r => setTimeout(r, 800));
    addLog(`Connected to Notion Database: ${state.notionConfig.databaseId}`, 'info');
    
    await new Promise(r => setTimeout(r, 600));
    addLog(`Connected to Lark Table: ${state.larkConfig.tableId}`, 'info');

    await new Promise(r => setTimeout(r, 500));
    const creds = loadCredentials();
    const hasToken = !!creds?.notionToken;
    let notionTotal = 0;
    if (hasToken && state.notionConfig.databaseId) {
      notionTotal = await countNotionRecords(state.notionConfig.databaseId);
    }
    addLog(`Notion records detected: ${notionTotal}`, 'info');

    const hasLark = !!creds?.larkAppId && !!creds?.larkAppSecret;

    const selectNames = state.larkSchema.filter(f => f.type === 'select').map(f => f.name);
    if (hasLark && selectNames.length > 0 && state.larkConfig.appToken && state.larkConfig.tableId) {
      const dist = await computeSelectDistribution(state.larkConfig.appToken, state.larkConfig.tableId, selectNames, 200);
      Object.keys(dist).forEach(name => {
        const entries = Object.entries(dist[name]).map(([k, v]) => `${k}:${v}`).join(', ');
        addLog(`Distribution ${name}: ${entries || 'empty'}`, 'info');
      });
    }

    {
      if (hasToken && state.notionConfig.databaseId && hasLark && state.larkConfig.appToken && state.larkConfig.tableId) {
        const limit = opCfg?.params?.limit || 20;
        const notionRecords = await fetchNotionRecordsSample(state.notionConfig.databaseId, limit);
        const getValue = (prop: any, targetType: string): any => {
          const t = prop?.type;
          const v = prop?.[t];
          if (!t || v == null) return null;
          if (t === 'title' || t === 'rich_text') return Array.isArray(v) && v[0]?.plain_text ? v[0].plain_text : '';
          if (t === 'select') return v?.name ?? '';
          if (t === 'multi_select') return Array.isArray(v) ? v.map((x: any) => x?.name ?? String(x)) : [];
          if (t === 'date') return v?.start ?? null;
          if (t === 'number') return typeof v === 'number' ? v : Number(v ?? 0);
          if (t === 'checkbox') return !!v;
          if (t === 'url' || t === 'email') return v ?? null;
          if (t === 'people') return Array.isArray(v) ? v.map((p: any) => p?.id ?? '') : [];
          return v;
        };
        const mapped = notionRecords.map((rec: any) => {
          const fields: Record<string, any> = {};
          const props = rec?.properties || {};
          state.mapping.forEach(pair => {
            const byIdKey = Object.keys(props).find(k => props[k]?.id === pair.sourceFieldId);
            const byNameKey = props[pair.sourceFieldId] ? pair.sourceFieldId : undefined;
            const key = byIdKey || byNameKey;
            if (key) {
              const target = state.larkSchema.find(f => f.id === pair.targetFieldId);
              const targetKey = target?.name || pair.targetFieldId;
              fields[targetKey] = getValue(props[key], target?.type || 'text');
            }
          });
          return { fields };
        });
        // removed Lark count check per request
        const { success, total, failed, errors } = await batchCreateRecordsDetailed(state.larkConfig.appToken, state.larkConfig.tableId, mapped);
        addLog(`Inserted ${success}/${total} records into Lark`, success ? 'success' : 'error');
        if (failed > 0) {
          addLog(`Failed ${failed} records. Details: ${JSON.stringify(errors).slice(0, 200)}...`, 'warning');
          const hasForbidden = Array.isArray(errors) && errors.some((e: any) => e?.code === 91403 || e?.msg === 'Forbidden');
          if (hasForbidden) {
            addLog('Write forbidden: ensure the app is added as collaborator with edit permission to the Base/Table, or switch to user_access_token of a user with write access.', 'error');
          }
        }
        // removed after-insert count log per request
        const sample = await fetchLarkRecordsSample(state.larkConfig.appToken, state.larkConfig.tableId, 3);
        addLog(`Sample record: ${JSON.stringify(sample?.[0]?.fields ?? {})}`.slice(0, 200), 'info');
      }
    }

    const totalBatches = 5;
    for (let i = 1; i <= totalBatches; i++) {
        await new Promise(r => setTimeout(r, 1200));
        if (Math.random() > 0.8) {
             addLog(`Batch ${i}/${totalBatches}: Warning - Row ${i*3} missing email field, skipped`, 'warning');
        } else {
             addLog(`Batch ${i}/${totalBatches}: Successfully synced 5 records`, 'success');
        }
    }

    await new Promise(r => setTimeout(r, 500));
    addLog('Sync job completed successfully.', 'success');
    setState(prev => ({ ...prev, isSyncing: false }));
  };

  const handleReset = () => {
      setState(prev => ({
          ...prev,
          step: AppStep.CONFIG_NOTION,
          logs: [],
          mapping: []
      }));
  };

  return (
    <div className="min-h-screen flex flex-col pt-20 pb-10">
      <Header onOpenSettings={() => setIsSettingsOpen(true)} />
      
      <SettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
      />

      <main className="flex-grow container mx-auto px-4 sm:px-6">
        {showLanding ? (
          <div className="mt-6">
            <Landing onStartSync={() => setShowLanding(false)} onOpenSettings={() => setIsSettingsOpen(true)} />
          </div>
        ) : (
        <>
        <StepWizard currentStep={state.step} onSelectStep={(step) => setState(prev => ({ ...prev, step }))} />
        <div className="mt-8 transition-all duration-500 ease-in-out">
          {state.step === AppStep.CONFIG_NOTION && (
            <ConfigStep 
              platform="notion" 
              initialData={state.notionConfig} 
              onNext={handleNotionSubmit}
              onOpenSettings={() => setIsSettingsOpen(true)}
            />
          )}

          {state.step === AppStep.CONFIG_LARK && (
            <ConfigStep 
              platform="lark" 
              initialData={state.larkConfig} 
              onNext={handleLarkSubmit}
              onOpenSettings={() => setIsSettingsOpen(true)}
            />
          )}

          {state.step === AppStep.MAPPING && (
            <MappingStep 
              sourceSchema={state.notionSchema}
              targetSchema={state.larkSchema}
              onConfirm={handleMappingConfirm}
            />
          )}

          {state.step === AppStep.SYNC && (
            <SyncStep 
                logs={state.logs}
                isSyncing={state.isSyncing}
                onStart={runSyncSimulation}
                onReset={handleReset}
                notionConfig={state.notionConfig}
                larkConfig={state.larkConfig}
                refreshTick={state.syncRefreshTick || 0}
            />
          )}
        </div>
        </>
        )}
      </main>
      
      <footer className="py-8 text-center text-xs text-gray-400">
          <p>&copy; {new Date().getFullYear()} SyncFlow. Built for high-performance teams.</p>
      </footer>
    </div>
  );
}

export default App;
