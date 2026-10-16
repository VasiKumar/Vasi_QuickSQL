export interface QueryResult {
  statement: string;
  columns: string[];
  rows: Record<string, any>[];
  rowCount: number;
  executionTimeMs: number;
  error?: string;
  isSelect: boolean;
  message?: string;
}

export interface TableColumn {
  name: string;
  type: string;
  isPrimary?: boolean;
}

export interface TableSchema {
  name: string;
  columns: TableColumn[];
  rowCount: number;
}

export interface QueryHistoryItem {
  id: string;
  query: string;
  timestamp: number;
  durationMs: number;
  status: 'success' | 'error';
  errorMessage?: string;
  rowCount?: number;
}

export interface SavedQuery {
  id: string;
  title: string;
  query: string;
  description?: string;
  tags: string[];
  folder?: string; // custom folder location
  createdAt: number;
  updatedAt: number;
}

export interface WorkspaceFolder {
  id: string;
  name: string;
  color?: string;
  createdAt: number;
}

export interface EditorTab {
  id: string;
  title: string;
  query: string;
  isModified?: boolean;
}

export interface AttachedContext {
  id: string;
  type: 'query' | 'selection' | 'schema' | 'result' | 'saved_query' | 'dataset_sample' | 'working_file';
  title: string;
  content: string;
  fileName?: string;
  folder?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  attachedContexts?: AttachedContext[];
}

export interface StoredApiKey {
  id: string;
  name: string;
  key: string;
  isDefault: boolean;
  addedAt: number;
}

export interface GroqConfig {
  apiKey: string;
  model: string;
  temperature: number;
  keysList: StoredApiKey[];
}

export interface DatasetPreset {
  id: string;
  name: string;
  description: string;
  category: string;
  tables: string[];
  setupSql: string;
  sampleQueries: {
    title: string;
    description: string;
    sql: string;
  }[];
}
