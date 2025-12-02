export enum AppStep {
  CONFIG_NOTION = 0,
  CONFIG_LARK = 1,
  MAPPING = 2,
  SYNC = 3,
}

export interface FieldSchema {
  id: string;
  name: string;
  type: 'text' | 'number' | 'select' | 'date' | 'person' | 'checkbox' | 'url' | 'email';
}

export interface MappingPair {
  sourceFieldId: string;
  targetFieldId: string;
}

export interface LogEntry {
  id: string;
  timestamp: Date;
  level: 'info' | 'success' | 'error' | 'warning';
  message: string;
}

export interface NotionConfig {
  databaseId: string;
  // apiKey is now retrieved from secure storage, not passed in flow state explicitly if not needed
}

export interface LarkConfig {
  tableId: string;
  // app credentials retrieved from storage
}

export interface UserCredentials {
  notionToken: string;
  larkAppId: string;
  larkAppSecret: string;
}

export type SimulationScenario = 'success' | 'partial_failure' | 'network_error' | 'auth_error';

export interface AppState {
  step: AppStep;
  notionConfig: NotionConfig;
  larkConfig: LarkConfig;
  notionSchema: FieldSchema[];
  larkSchema: FieldSchema[];
  mapping: MappingPair[];
  logs: LogEntry[];
  isSyncing: boolean;
}