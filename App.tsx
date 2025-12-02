import React, { useState } from 'react';
import Header from './components/Header';
import StepWizard from './components/StepWizard';
import ConfigStep from './components/ConfigStep';
import MappingStep from './components/MappingStep';
import SyncStep from './components/SyncStep';
import SettingsModal from './components/SettingsModal';
import { AppState, AppStep, NotionConfig, LarkConfig, LogEntry } from './types';
import { MOCK_LARK_SCHEMA, MOCK_NOTION_SCHEMA } from './services/mockData';

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

  const handleNotionSubmit = (config: NotionConfig) => {
    // In a real app, we would use the stored credentials + config.databaseId to fetch schema
    setState(prev => ({
      ...prev,
      notionConfig: config,
      notionSchema: MOCK_NOTION_SCHEMA,
      step: AppStep.CONFIG_LARK
    }));
  };

  const handleLarkSubmit = (config: LarkConfig) => {
    setState(prev => ({
      ...prev,
      larkConfig: config,
      larkSchema: MOCK_LARK_SCHEMA,
      step: AppStep.MAPPING
    }));
  };

  const handleMappingConfirm = (mapping: any) => {
    setState(prev => ({
      ...prev,
      mapping,
      step: AppStep.SYNC
    }));
  };

  const runSyncSimulation = async () => {
    setState(prev => ({ ...prev, isSyncing: true, logs: [] }));
    addLog('Loading credentials from secure storage...', 'info');
    await new Promise(r => setTimeout(r, 400));
    
    addLog('Initializing sync job...', 'info');
    
    await new Promise(r => setTimeout(r, 800));
    addLog(`Connected to Notion Database: ${state.notionConfig.databaseId}`, 'info');
    
    await new Promise(r => setTimeout(r, 600));
    addLog(`Connected to Lark Table: ${state.larkConfig.tableId}`, 'info');

    await new Promise(r => setTimeout(r, 500));
    addLog(`Found 24 records to sync`, 'info');

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
        <StepWizard currentStep={state.step} />
        
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
            />
          )}
        </div>
      </main>
      
      <footer className="py-8 text-center text-xs text-gray-400">
          <p>&copy; {new Date().getFullYear()} SyncFlow. Built for high-performance teams.</p>
      </footer>
    </div>
  );
}

export default App;