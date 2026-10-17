export interface ColumnSchema {
  name: string;
  type: string;
  isPrimary?: boolean;
}

export interface TableSchema {
  name: string;
  columns: ColumnSchema[];
  rowCount: number;
}

export interface QueryResult {
  columns: string[];
  rows: any[];
  rowCount: number;
  executionTimeMs: number;
  error?: string;
  query: string;
  timestamp: number;
}

export interface QueryHistoryItem {
  id: string;
  sql: string;
  timestamp: number;
  rowCount: number;
  durationMs: number;
  success: boolean;
  error?: string;
}

export interface SavedQuery {
  id: string;
  title: string;
  sql: string;
  createdAt: number;
  updatedAt: number;
  tags?: string[];
  folder?: string;
}

export interface EditorTab {
  id: string;
  title: string;
  query: string;
}
