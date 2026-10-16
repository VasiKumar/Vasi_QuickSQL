import React, { useState } from 'react';
import { 
  History, 
  Search, 
  Trash2, 
  Play, 
  Copy, 
  Check, 
  CheckCircle2, 
  AlertCircle, 
  Pin, 
  Clock, 
  Calendar,
  Minimize2
} from 'lucide-react';
import { QueryHistoryItem } from '../types';

interface HistoryDrawerProps {
  history: QueryHistoryItem[];
  onSelectQuery: (sql: string) => void;
  onExecuteQuery: (sql: string) => void;
  onClearHistory: () => void;
  onRemoveItem: (id: string) => void;
  onPinToAi: (sql: string, label: string) => void;
  onClose?: () => void;
}

export const HistoryDrawer: React.FC<HistoryDrawerProps> = ({
  history,
  onSelectQuery,
  onExecuteQuery,
  onClearHistory,
  onRemoveItem,
  onPinToAi,
  onClose
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const filteredHistory = history.filter(item => {
    if (!searchQuery.trim()) return true;
    return item.query.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const handleCopy = async (id: string, query: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await navigator.clipboard.writeText(query);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const formatTimestamp = (ts: number) => {
    const d = new Date(ts);
    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();
    if (isToday) {
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    }
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' }) + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-neutral-900 border-r border-neutral-200 dark:border-neutral-800">
      {/* Header */}
      <div className="p-3 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <History className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <span className="font-semibold text-xs text-neutral-900 dark:text-neutral-100 uppercase tracking-wider">
            Query History
          </span>
          <span className="text-[11px] font-mono text-neutral-400 tabular-nums">
            ({history.length})
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          {history.length > 0 && (
            <button
              onClick={onClearHistory}
              className="flex items-center gap-1 text-[11px] text-neutral-400 hover:text-red-600 transition-colors"
              title="Clear all history"
            >
              <Trash2 className="w-3 h-3" />
              <span>Clear</span>
            </button>
          )}

          {onClose && (
            <button
              onClick={onClose}
              className="flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium border border-neutral-300 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-colors ml-1"
              title="Minimise history panel"
            >
              <Minimize2 className="w-3 h-3 text-neutral-500" />
              <span>Minimise</span>
            </button>
          )}
        </div>
      </div>

      {/* Search Input */}
      <div className="p-2 border-b border-neutral-200 dark:border-neutral-800">
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-neutral-400" />
          <input
            type="text"
            placeholder="Search previous queries..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-neutral-100 dark:bg-neutral-800/80 border border-transparent focus:border-emerald-500 rounded text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 outline-none transition-all"
          />
        </div>
      </div>

      {/* History Items List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {filteredHistory.length === 0 ? (
          <div className="p-6 text-center text-neutral-400">
            <p className="text-xs">
              {history.length === 0 ? 'No commands executed yet.' : 'No queries match your search.'}
            </p>
          </div>
        ) : (
          filteredHistory.map(item => {
            const isSuccess = item.status === 'success';
            return (
              <div
                key={item.id}
                onClick={() => onSelectQuery(item.query)}
                className="group border border-neutral-200/80 dark:border-neutral-800 rounded-lg p-2.5 bg-neutral-50/40 dark:bg-neutral-900/60 hover:bg-neutral-100/80 dark:hover:bg-neutral-800/80 cursor-pointer transition-all space-y-1.5"
              >
                {/* Top Status & Meta */}
                <div className="flex items-center justify-between text-[11px] text-neutral-400">
                  <div className="flex items-center gap-1.5">
                    {isSuccess ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    ) : (
                      <AlertCircle className="w-3.5 h-3.5 text-red-500 shrink-0" />
                    )}
                    <span className="font-mono tabular-nums">{formatTimestamp(item.timestamp)}</span>
                  </div>

                  <div className="flex items-center gap-2 font-mono tabular-nums">
                    <span>{item.durationMs}ms</span>
                    {typeof item.rowCount === 'number' && (
                      <>
                        <span>·</span>
                        <span>{item.rowCount} rows</span>
                      </>
                    )}
                  </div>
                </div>

                {/* SQL Preview Snippet */}
                <pre className="font-mono text-xs text-neutral-800 dark:text-neutral-200 line-clamp-3 whitespace-pre-wrap break-all bg-white dark:bg-neutral-950 p-2 rounded border border-neutral-250/60 dark:border-neutral-800/80">
                  {item.query}
                </pre>

                {/* Error message preview if failed */}
                {!isSuccess && item.errorMessage && (
                  <p className="text-[11px] text-red-600 dark:text-red-400 font-mono truncate">
                    {item.errorMessage}
                  </p>
                )}

                {/* Bottom Action strip */}
                <div className="flex items-center justify-between pt-1 text-xs opacity-75 group-hover:opacity-100 transition-opacity">
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                    Click to load
                  </span>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onExecuteQuery(item.query);
                      }}
                      className="p-1 rounded hover:bg-emerald-100 dark:hover:bg-emerald-950 text-neutral-500 hover:text-emerald-600"
                      title="Run immediately"
                    >
                      <Play className="w-3 h-3 fill-current" />
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onPinToAi(item.query, 'History Query');
                      }}
                      className="p-1 rounded hover:bg-amber-100 dark:hover:bg-amber-950 text-neutral-500 hover:text-amber-600"
                      title="Pin to Groq AI"
                    >
                      <Pin className="w-3 h-3" />
                    </button>

                    <button
                      onClick={(e) => handleCopy(item.id, item.query, e)}
                      className="p-1 rounded hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-500"
                      title="Copy SQL"
                    >
                      {copiedId === item.id ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onRemoveItem(item.id);
                      }}
                      className="p-1 rounded hover:bg-red-100 dark:hover:bg-red-950 text-neutral-400 hover:text-red-600"
                      title="Remove from history"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
