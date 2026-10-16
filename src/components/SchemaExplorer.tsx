import React, { useState, useMemo } from 'react';
import { 
  Database, 
  Table, 
  Key, 
  Search, 
  Play, 
  Pin, 
  Trash2, 
  Download, 
  ChevronRight, 
  ChevronDown,
  ChevronUp,
  RotateCcw,
  Sparkles,
  Layers,
  Minimize2,
  Plus,
  Copy,
  Check,
  Columns
} from 'lucide-react';
import { TableSchema } from '../types';

interface SchemaExplorerProps {
  schemas: TableSchema[];
  onSelectQuery: (sql: string) => void;
  onPinTableToAi: (schema: TableSchema) => void;
  onRefreshSchema: () => void;
  onResetDb: () => void;
  onOpenPresets: () => void;
  onClose?: () => void;
  onInsertAttribute?: (attributeName: string, tableName: string) => void;
}

export const SchemaExplorer: React.FC<SchemaExplorerProps> = ({
  schemas,
  onSelectQuery,
  onPinTableToAi,
  onRefreshSchema,
  onResetDb,
  onOpenPresets,
  onClose,
  onInsertAttribute
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'tables' | 'attributes'>('tables');
  const [expandedTables, setExpandedTables] = useState<Record<string, boolean>>({});
  const [copiedAttr, setCopiedAttr] = useState<string | null>(null);

  const totalAttributes = useMemo(() => {
    return schemas.reduce((sum, s) => sum + s.columns.length, 0);
  }, [schemas]);

  const toggleExpand = (name: string) => {
    setExpandedTables(prev => ({ ...prev, [name]: !prev[name] }));
  };

  const handleExpandAll = () => {
    const all: Record<string, boolean> = {};
    schemas.forEach(s => { all[s.name] = true; });
    setExpandedTables(all);
  };

  const handleCollapseAll = () => {
    setExpandedTables({});
  };

  const allExpanded = schemas.length > 0 && schemas.every(s => expandedTables[s.name]);

  const filteredSchemas = useMemo(() => {
    if (!searchQuery.trim()) return schemas;
    const q = searchQuery.toLowerCase();
    return schemas.filter(s => {
      if (s.name.toLowerCase().includes(q)) return true;
      return s.columns.some(c => c.name.toLowerCase().includes(q) || c.type.toLowerCase().includes(q));
    });
  }, [schemas, searchQuery]);

  // Flattened attributes for the "Attributes" tab
  const allAttributesList = useMemo(() => {
    const list: Array<{
      tableName: string;
      columnName: string;
      type: string;
      isPrimary?: boolean;
    }> = [];

    schemas.forEach(s => {
      s.columns.forEach(c => {
        list.push({
          tableName: s.name,
          columnName: c.name,
          type: c.type,
          isPrimary: c.isPrimary
        });
      });
    });

    if (!searchQuery.trim()) return list;
    const q = searchQuery.toLowerCase();
    return list.filter(item => 
      item.columnName.toLowerCase().includes(q) ||
      item.tableName.toLowerCase().includes(q) ||
      item.type.toLowerCase().includes(q)
    );
  }, [schemas, searchQuery]);

  const handleCopyOrInsert = (attrName: string, tableName: string) => {
    if (onInsertAttribute) {
      onInsertAttribute(attrName, tableName);
    }
    navigator.clipboard.writeText(`${tableName}.${attrName}`);
    setCopiedAttr(`${tableName}.${attrName}`);
    setTimeout(() => setCopiedAttr(null), 1500);
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-neutral-900 border-r border-neutral-200 dark:border-neutral-800">
      {/* Top Header */}
      <div className="p-3 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <Database className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="font-semibold text-xs text-neutral-900 dark:text-neutral-100 uppercase tracking-wider">
              Tables & Attributes
            </span>
            <span className="px-1.5 py-0.2 rounded-full bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 font-mono text-[10px] font-semibold" title="Total Tables">
              {schemas.length} {schemas.length === 1 ? 'Table' : 'Tables'}
            </span>
            <span className="px-1.5 py-0.2 rounded-full bg-blue-100 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300 font-mono text-[10px] font-semibold" title="Total Attributes / Columns">
              {totalAttributes} Attrs
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={onRefreshSchema}
            className="p-1 rounded hover:bg-neutral-200 dark:hover:bg-neutral-800 text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200 transition-colors"
            title="Refresh schema"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          {onClose && (
            <button
              onClick={onClose}
              className="flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium border border-neutral-300 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-colors"
              title="Minimise Tables & Attributes panel (Esc)"
            >
              <Minimize2 className="w-3 h-3 text-neutral-500" />
              <span>Minimise</span>
            </button>
          )}
        </div>
      </div>

      {/* Internal Tabs: [Tables & Columns] vs [All Attributes] */}
      <div className="flex items-center border-b border-neutral-200 dark:border-neutral-800 bg-neutral-100/60 dark:bg-neutral-950 px-2 pt-1 gap-1 text-xs">
        <button
          onClick={() => setActiveTab('tables')}
          className={`flex items-center gap-1.5 px-3 py-1.5 font-medium border-b-2 transition-colors ${
            activeTab === 'tables'
              ? 'border-emerald-500 text-emerald-700 dark:text-emerald-400 bg-white dark:bg-neutral-900 rounded-t'
              : 'border-transparent text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
          }`}
        >
          <Table className="w-3.5 h-3.5" />
          <span>Tables ({schemas.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('attributes')}
          className={`flex items-center gap-1.5 px-3 py-1.5 font-medium border-b-2 transition-colors ${
            activeTab === 'attributes'
              ? 'border-emerald-500 text-emerald-700 dark:text-emerald-400 bg-white dark:bg-neutral-900 rounded-t'
              : 'border-transparent text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
          }`}
        >
          <Columns className="w-3.5 h-3.5" />
          <span>All Attributes ({totalAttributes})</span>
        </button>
      </div>

      {/* Search Bar & Expand/Minimise All Controls */}
      <div className="p-2 border-b border-neutral-200 dark:border-neutral-800 flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-neutral-400" />
          <input
            type="text"
            placeholder={activeTab === 'tables' ? "Search tables or attributes..." : "Search all attributes..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-neutral-100 dark:bg-neutral-800/80 border border-transparent focus:border-emerald-500 rounded text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 outline-none transition-all"
          />
        </div>

        {activeTab === 'tables' && schemas.length > 0 && (
          <button
            onClick={allExpanded ? handleCollapseAll : handleExpandAll}
            className="flex items-center gap-1 px-2 py-1.5 text-[11px] font-medium rounded border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-400 whitespace-nowrap transition-colors"
            title={allExpanded ? "Minimise all tables" : "Expand all tables to see attributes"}
          >
            {allExpanded ? (
              <>
                <ChevronUp className="w-3 h-3 text-emerald-600" />
                <span>Minimise All</span>
              </>
            ) : (
              <>
                <ChevronDown className="w-3 h-3 text-emerald-600" />
                <span>Expand All</span>
              </>
            )}
          </button>
        )}
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {activeTab === 'tables' ? (
          filteredSchemas.length === 0 ? (
            <div className="p-6 text-center text-neutral-400">
              {schemas.length === 0 ? (
                <div className="space-y-3">
                  <p className="text-xs">Database is currently empty (0 tables).</p>
                  <button
                    onClick={onOpenPresets}
                    className="px-3 py-1.5 text-xs font-medium bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg inline-flex items-center gap-1.5 shadow-xs"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Load Sample Dataset</span>
                  </button>
                </div>
              ) : (
                <p className="text-xs">No tables match your search query.</p>
              )}
            </div>
          ) : (
            filteredSchemas.map(schema => {
              const isExpanded = expandedTables[schema.name] ?? false;
              return (
                <div 
                  key={schema.name}
                  className="border border-neutral-200/80 dark:border-neutral-800 rounded-lg overflow-hidden transition-colors"
                >
                  {/* Table Header Row (Clicking expands and minimises) */}
                  <div 
                    onClick={() => toggleExpand(schema.name)}
                    className="flex items-center justify-between p-2 cursor-pointer bg-neutral-50/50 dark:bg-neutral-850 hover:bg-neutral-100/80 dark:hover:bg-neutral-800 select-none text-xs"
                    title={isExpanded ? "Click to minimise table attributes" : "Click to expand table attributes"}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <button className="text-neutral-400 p-0.5">
                        {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                      </button>
                      <Table className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span className="font-mono font-medium text-neutral-900 dark:text-neutral-100 truncate">
                        {schema.name}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 text-[11px] text-neutral-400">
                      <span className="px-1.5 py-0.2 rounded bg-neutral-200/70 dark:bg-neutral-800 text-[10px] font-mono text-neutral-600 dark:text-neutral-300">
                        {schema.columns.length} attrs
                      </span>
                      <span className="font-mono tabular-nums">{schema.rowCount} rows</span>
                    </div>
                  </div>

                  {/* Expanded Column Details & Quick Actions */}
                  {isExpanded && (
                    <div className="p-2 border-t border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-xs space-y-2">
                      {/* Action Bar */}
                      <div className="flex items-center gap-1 flex-wrap pb-1.5 border-b border-neutral-100 dark:border-neutral-800/60">
                        <button
                          onClick={() => onSelectQuery(`SELECT * FROM "${schema.name}" LIMIT 25;`)}
                          className="flex items-center gap-1 px-2 py-1 rounded bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 text-[11px]"
                          title="Query top 25 rows"
                        >
                          <Play className="w-2.5 h-2.5 fill-current text-emerald-600" />
                          <span>SELECT *</span>
                        </button>

                        <button
                          onClick={() => onSelectQuery(`SELECT COUNT(*) AS total_rows FROM "${schema.name}";`)}
                          className="flex items-center gap-1 px-2 py-1 rounded bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 text-[11px]"
                          title="Count rows"
                        >
                          <span>COUNT(*)</span>
                        </button>

                        <button
                          onClick={() => onPinTableToAi(schema)}
                          className="flex items-center gap-1 px-2 py-1 rounded bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-900/40 text-amber-700 dark:text-amber-400 text-[11px]"
                          title="Pin table schema to Groq AI as context"
                        >
                          <Pin className="w-2.5 h-2.5" />
                          <span>Pin to AI</span>
                        </button>
                      </div>

                      {/* Attributes / Columns List */}
                      <div className="space-y-1">
                        <div className="text-[10px] uppercase tracking-wider text-neutral-400 font-semibold px-1">
                          Table Attributes ({schema.columns.length})
                        </div>
                        {schema.columns.map(col => {
                          const isCopied = copiedAttr === `${schema.name}.${col.name}`;
                          return (
                            <div
                              key={col.name}
                              onClick={() => handleCopyOrInsert(col.name, schema.name)}
                              className="group flex items-center justify-between py-1 px-1.5 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800/70 text-[11px] font-mono cursor-pointer transition-colors"
                              title="Click to insert attribute into SQL editor (or copy)"
                            >
                              <div className="flex items-center gap-1.5 truncate">
                                {col.isPrimary ? (
                                  <span title="Primary Key">
                                    <Key className="w-3 h-3 text-amber-500 shrink-0" />
                                  </span>
                                ) : (
                                  <span className="w-3 h-3 rounded-full bg-neutral-200 dark:bg-neutral-800 flex items-center justify-center text-[8px] text-neutral-500">
                                    •
                                  </span>
                                )}
                                <span className="text-neutral-800 dark:text-neutral-200 font-medium truncate group-hover:text-emerald-600 dark:group-hover:text-emerald-400">
                                  {col.name}
                                </span>
                              </div>
                              <div className="flex items-center gap-1.5 shrink-0">
                                <span className="text-[10px] text-neutral-400 uppercase font-mono px-1 rounded bg-neutral-100 dark:bg-neutral-800">
                                  {col.type}
                                </span>
                                <span className="opacity-0 group-hover:opacity-100 text-[10px] text-emerald-600 transition-opacity">
                                  {isCopied ? <Check className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )
        ) : (
          /* All Attributes View */
          allAttributesList.length === 0 ? (
            <div className="p-6 text-center text-neutral-400 text-xs">
              No attributes found.
            </div>
          ) : (
            <div className="space-y-1">
              <div className="flex items-center justify-between px-2 py-1 text-[10px] uppercase tracking-wider text-neutral-400 font-semibold border-b border-neutral-100 dark:border-neutral-800">
                <span>Attribute & Table</span>
                <span>Type & Action</span>
              </div>
              {allAttributesList.map(item => {
                const attrKey = `${item.tableName}.${item.columnName}`;
                const isCopied = copiedAttr === attrKey;
                return (
                  <div
                    key={attrKey}
                    onClick={() => handleCopyOrInsert(item.columnName, item.tableName)}
                    className="group flex items-center justify-between p-2 rounded-lg border border-neutral-100 dark:border-neutral-800/80 hover:border-emerald-500/50 hover:bg-neutral-50 dark:hover:bg-neutral-800/60 cursor-pointer transition-colors"
                    title="Click to insert attribute into editor"
                  >
                    <div className="flex flex-col min-w-0 pr-2">
                      <div className="flex items-center gap-1.5 font-mono text-xs">
                        {item.isPrimary && <Key className="w-3 h-3 text-amber-500 shrink-0" />}
                        <span className="font-semibold text-neutral-900 dark:text-neutral-100 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 truncate">
                          {item.columnName}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-[10px] text-neutral-400 font-mono mt-0.5">
                        <Table className="w-2.5 h-2.5 text-neutral-400" />
                        <span>{item.tableName}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-500 uppercase">
                        {item.type}
                      </span>
                      <button
                        className="p-1 rounded bg-neutral-100 dark:bg-neutral-800 group-hover:bg-emerald-600 group-hover:text-white text-neutral-400 transition-colors"
                        title="Insert into editor"
                      >
                        {isCopied ? <Check className="w-3 h-3 text-white" /> : <Plus className="w-3 h-3" />}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )
        )}
      </div>

      {/* Footer Info & Presets quick button */}
      <div className="p-2 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 flex items-center justify-between text-xs">
        <button
          onClick={onOpenPresets}
          className="text-emerald-600 dark:text-emerald-400 hover:underline text-[11px] font-medium"
        >
          Browse Presets
        </button>
        <button
          onClick={onResetDb}
          className="text-neutral-400 hover:text-red-600 dark:hover:text-red-400 text-[11px]"
          title="Clear all tables"
        >
          Reset DB
        </button>
      </div>
    </div>
  );
};
