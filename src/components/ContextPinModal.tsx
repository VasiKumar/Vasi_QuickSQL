import React, { useState } from 'react';
import { 
  Pin, 
  Plus, 
  X, 
  FileCode, 
  Database, 
  Table, 
  Bookmark, 
  AlertCircle, 
  CheckCircle2, 
  FileSpreadsheet,
  Check
} from 'lucide-react';
import { AttachedContext, QueryResult, SavedQuery, TableSchema } from '../types';

interface ContextPinModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAttachContext: (context: AttachedContext) => void;
  currentSql: string;
  activeTabTitle: string;
  schemas: TableSchema[];
  lastResult?: QueryResult;
  savedQueries: SavedQuery[];
  folders?: string[];
}

export const ContextPinModal: React.FC<ContextPinModalProps> = ({
  isOpen,
  onClose,
  onAttachContext,
  currentSql,
  activeTabTitle,
  schemas,
  lastResult,
  savedQueries,
  folders = ['Default']
}) => {
  const [activeCategory, setActiveCategory] = useState<'editor' | 'schema' | 'result' | 'saved'>('editor');
  const [selectedSavedId, setSelectedSavedId] = useState<string | null>(null);
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);

  if (!isOpen) return null;

  // 1. Attach Active Working File / Editor Query
  const handleAttachCurrentQuery = () => {
    if (!currentSql.trim()) return;
    onAttachContext({
      id: 'ctx_file_' + Date.now(),
      type: 'working_file',
      title: `Working File: ${activeTabTitle}`,
      content: `-- Working File: ${activeTabTitle}.sql\n${currentSql.trim()}`,
      fileName: activeTabTitle
    });
    onClose();
  };

  // 2. Attach Entire Schema or Specific Table
  const handleAttachSchema = () => {
    if (schemas.length === 0) return;

    if (selectedTable) {
      const table = schemas.find(s => s.name === selectedTable);
      if (table) {
        const text = `Table: ${table.name} (${table.rowCount} rows)\nColumns:\n` +
          table.columns.map(c => `  - ${c.name} (${c.type}${c.isPrimary ? ', PRIMARY KEY' : ''})`).join('\n');
        onAttachContext({
          id: 'ctx_tbl_' + Date.now(),
          type: 'schema',
          title: `Table: ${table.name}`,
          content: text
        });
        onClose();
        return;
      }
    }

    // Attach all tables
    const text = schemas.map(table => {
      const cols = table.columns.map(c => `${c.name} ${c.type}`).join(', ');
      return `CREATE TABLE ${table.name} (${cols}); -- (~${table.rowCount} rows)`;
    }).join('\n\n');

    onAttachContext({
      id: 'ctx_schema_' + Date.now(),
      type: 'schema',
      title: `DB Schema (${schemas.length} tables)`,
      content: text
    });
    onClose();
  };

  // 3. Attach Last Result or Error
  const handleAttachResult = () => {
    if (!lastResult) return;

    if (lastResult.error) {
      onAttachContext({
        id: 'ctx_err_' + Date.now(),
        type: 'result',
        title: 'SQL Execution Error',
        content: `Error: ${lastResult.error}\nStatement: ${lastResult.statement}`
      });
    } else {
      const sample = lastResult.rows.slice(0, 5);
      const sampleText = JSON.stringify(sample, null, 2);
      onAttachContext({
        id: 'ctx_res_' + Date.now(),
        type: 'result',
        title: `Last Query Result (${lastResult.rowCount} rows)`,
        content: `Query: ${lastResult.statement}\nColumns: ${lastResult.columns.join(', ')}\nSample Rows (up to 5):\n${sampleText}`
      });
    }
    onClose();
  };

  // 4. Attach Saved Query from folder
  const handleAttachSavedQuery = (q: SavedQuery) => {
    onAttachContext({
      id: 'ctx_saved_' + q.id + '_' + Date.now(),
      type: 'saved_query',
      title: `Saved: ${q.title}`,
      content: `-- Title: ${q.title}\n-- Tags: ${q.tags.join(', ')}\n${q.query}`
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
      <div className="w-full max-w-lg bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header with Safety-pin icon */}
        <div className="p-4 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Pin className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-neutral-900 dark:text-neutral-100">
                Pin Context to Groq AI
              </h3>
              <p className="text-[11px] text-neutral-500">
                Parsed as plain text context so the model understands your exact SQL & tables
              </p>
            </div>
          </div>

          <button onClick={onClose} className="p-1 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Category Tabs */}
        <div className="flex items-center border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 px-3 text-xs overflow-x-auto">
          {[
            { id: 'editor', label: 'Working File', icon: FileCode },
            { id: 'schema', label: 'Database Schema', icon: Database },
            { id: 'result', label: 'Query Result / Error', icon: FileSpreadsheet },
            { id: 'saved', label: 'Workspace Files', icon: Bookmark }
          ].map(cat => {
            const Icon = cat.icon;
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id as any)}
                className={`flex items-center gap-1.5 py-2.5 px-3 border-b-2 font-medium whitespace-nowrap transition-colors ${
                  isActive
                    ? 'border-amber-500 text-neutral-900 dark:text-neutral-100 font-semibold'
                    : 'border-transparent text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-300'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>

        {/* Content Body */}
        <div className="p-4 overflow-y-auto flex-1 text-xs space-y-3">
          {/* CATEGORY: Editor Query */}
          {activeCategory === 'editor' && (
            <div className="space-y-3">
              <p className="text-neutral-600 dark:text-neutral-400">
                Pin the SQL code currently open in the <strong>{activeTabTitle}</strong> editor tab:
              </p>

              {currentSql.trim() ? (
                <pre className="p-2.5 rounded-lg bg-neutral-100 dark:bg-neutral-950 font-mono text-[11px] text-neutral-800 dark:text-neutral-200 border border-neutral-200 dark:border-neutral-800 max-h-48 overflow-y-auto whitespace-pre-wrap">
                  {currentSql}
                </pre>
              ) : (
                <div className="p-4 text-center rounded-lg border border-dashed border-neutral-300 dark:border-neutral-700 text-neutral-400">
                  Active editor tab is currently empty.
                </div>
              )}

              <button
                onClick={handleAttachCurrentQuery}
                disabled={!currentSql.trim()}
                className="w-full py-2 bg-amber-500 hover:bg-amber-600 disabled:bg-neutral-300 dark:disabled:bg-neutral-800 text-white rounded-lg font-medium shadow-xs flex items-center justify-center gap-1.5"
              >
                <Pin className="w-3.5 h-3.5" />
                <span>Attach Active Query</span>
              </button>
            </div>
          )}

          {/* CATEGORY: Schema */}
          {activeCategory === 'schema' && (
            <div className="space-y-3">
              <p className="text-neutral-600 dark:text-neutral-400">
                Attach your table definitions so the AI knows table names, column types, and relations:
              </p>

              <div className="space-y-2 max-h-48 overflow-y-auto">
                <div
                  onClick={() => setSelectedTable(null)}
                  className={`p-2 rounded-lg border cursor-pointer flex items-center justify-between ${
                    selectedTable === null
                      ? 'border-amber-500 bg-amber-50/40 dark:bg-amber-950/20 text-neutral-900 dark:text-neutral-100'
                      : 'border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Database className="w-3.5 h-3.5 text-amber-500" />
                    <span className="font-medium">All Tables ({schemas.length})</span>
                  </div>
                  {selectedTable === null && <Check className="w-3.5 h-3.5 text-amber-600" />}
                </div>

                {schemas.map(s => (
                  <div
                    key={s.name}
                    onClick={() => setSelectedTable(s.name)}
                    className={`p-2 rounded-lg border cursor-pointer flex items-center justify-between ${
                      selectedTable === s.name
                        ? 'border-amber-500 bg-amber-50/40 dark:bg-amber-950/20 text-neutral-900 dark:text-neutral-100'
                        : 'border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800'
                    }`}
                  >
                    <div className="flex items-center gap-2 font-mono">
                      <Table className="w-3.5 h-3.5 text-neutral-500" />
                      <span>{s.name}</span>
                      <span className="text-[10px] text-neutral-400">({s.columns.length} cols, {s.rowCount} rows)</span>
                    </div>
                    {selectedTable === s.name && <Check className="w-3.5 h-3.5 text-amber-600" />}
                  </div>
                ))}
              </div>

              <button
                onClick={handleAttachSchema}
                disabled={schemas.length === 0}
                className="w-full py-2 bg-amber-500 hover:bg-amber-600 disabled:bg-neutral-300 dark:disabled:bg-neutral-800 text-white rounded-lg font-medium shadow-xs flex items-center justify-center gap-1.5"
              >
                <Pin className="w-3.5 h-3.5" />
                <span>{selectedTable ? `Attach Table '${selectedTable}'` : 'Attach Full Database Schema'}</span>
              </button>
            </div>
          )}

          {/* CATEGORY: Query Result */}
          {activeCategory === 'result' && (
            <div className="space-y-3">
              <p className="text-neutral-600 dark:text-neutral-400">
                Attach the latest execution result or error for AI diagnosis or summarization:
              </p>

              {lastResult ? (
                <div className="p-3 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 space-y-2">
                  <div className="flex items-center gap-2">
                    {lastResult.error ? (
                      <span className="flex items-center gap-1 text-red-600 dark:text-red-400 font-semibold text-xs">
                        <AlertCircle className="w-3.5 h-3.5" />
                        <span>Execution Error</span>
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold text-xs">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Success ({lastResult.rowCount} rows)</span>
                      </span>
                    )}
                  </div>

                  <pre className="font-mono text-[11px] text-neutral-700 dark:text-neutral-300 line-clamp-3 overflow-hidden">
                    {lastResult.error || `Statement: ${lastResult.statement}\nColumns: ${lastResult.columns.join(', ')}`}
                  </pre>
                </div>
              ) : (
                <div className="p-4 text-center rounded-lg border border-dashed border-neutral-300 dark:border-neutral-700 text-neutral-400">
                  No query has been executed yet.
                </div>
              )}

              <button
                onClick={handleAttachResult}
                disabled={!lastResult}
                className="w-full py-2 bg-amber-500 hover:bg-amber-600 disabled:bg-neutral-300 dark:disabled:bg-neutral-800 text-white rounded-lg font-medium shadow-xs flex items-center justify-center gap-1.5"
              >
                <Pin className="w-3.5 h-3.5" />
                <span>Attach Last Result / Error</span>
              </button>
            </div>
          )}

          {/* CATEGORY: Workspace Files */}
          {activeCategory === 'saved' && (
            <div className="space-y-3">
              <p className="text-neutral-600 dark:text-neutral-400">
                Pick a query file from your workspace to attach as prompt context:
              </p>

              {/* Folder Selector Pills */}
              {folders && folders.length > 0 && (
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px]">
                  <button
                    onClick={() => setSelectedFolder(null)}
                    className={`px-2.5 py-1 rounded-md border font-medium transition-colors shrink-0 ${
                      selectedFolder === null
                        ? 'bg-amber-500 text-white border-amber-500'
                        : 'border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 hover:border-neutral-300'
                    }`}
                  >
                    All Files ({savedQueries.length})
                  </button>
                  {folders.map(f => {
                    const count = savedQueries.filter(q => (q.folder || 'Default') === f).length;
                    return (
                      <button
                        key={f}
                        onClick={() => setSelectedFolder(f)}
                        className={`px-2.5 py-1 rounded-md border font-medium transition-colors shrink-0 ${
                          selectedFolder === f
                            ? 'bg-amber-500 text-white border-amber-500'
                            : 'border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 hover:border-neutral-300'
                        }`}
                      >
                        📁 {f} ({count})
                      </button>
                    );
                  })}
                </div>
              )}

              <div className="space-y-2 max-h-52 overflow-y-auto">
                {savedQueries
                  .filter(q => selectedFolder === null || (q.folder || 'Default') === selectedFolder)
                  .map(q => (
                    <div
                      key={q.id}
                      onClick={() => handleAttachSavedQuery(q)}
                      className="p-2.5 rounded-lg border border-neutral-200 dark:border-neutral-800 hover:border-amber-500 dark:hover:border-amber-500 bg-white dark:bg-neutral-900 cursor-pointer transition-colors space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="font-semibold text-neutral-800 dark:text-neutral-200 text-xs truncate">
                            {q.title}
                          </span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-500 font-mono shrink-0">
                            📁 {q.folder || 'Default'}
                          </span>
                        </div>
                        <Pin className="w-3 h-3 text-amber-500 shrink-0" />
                      </div>
                      <pre className="font-mono text-[10px] text-neutral-500 line-clamp-1">
                        {q.query}
                      </pre>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
