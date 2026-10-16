import React, { useState, useMemo } from 'react';
import { 
  Download, 
  Copy, 
  Check, 
  Search, 
  ArrowUpDown, 
  ArrowUp, 
  ArrowDown, 
  AlertCircle, 
  CheckCircle2, 
  Pin, 
  Bot, 
  FileSpreadsheet,
  Clock,
  Layers,
  Maximize2,
  Minimize2,
  Minus,
  ChevronDown
} from 'lucide-react';
import { QueryResult } from '../types';

interface ResultsViewerProps {
  results: QueryResult[];
  onAskAiAboutError?: (error: string, sql: string) => void;
  onPinResultToAi?: (result: QueryResult) => void;
  isFullScreen?: boolean;
  onToggleFullScreen?: () => void;
  onMinimize?: () => void;
}

export const ResultsViewer: React.FC<ResultsViewerProps> = ({
  results,
  onAskAiAboutError,
  onPinResultToAi,
  isFullScreen = false,
  onToggleFullScreen,
  onMinimize
}) => {
  const [activeResultIndex, setActiveResultIndex] = useState<number>(0);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [pageSize, setPageSize] = useState<number>(25);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);

  const currentResult = results[activeResultIndex] || results[0];

  // Reset pagination when active result changes
  React.useEffect(() => {
    setCurrentPage(1);
    setSearchQuery('');
    setSortColumn(null);
  }, [activeResultIndex, results]);

  // Sorting handler
  const handleSort = (col: string) => {
    if (sortColumn === col) {
      if (sortDirection === 'asc') {
        setSortDirection('desc');
      } else {
        setSortColumn(null);
        setSortDirection('asc');
      }
    } else {
      setSortColumn(col);
      setSortDirection('asc');
    }
  };

  const deferredSearchQuery = React.useDeferredValue(searchQuery);

  // Filter and sort rows with deferred search to keep 60fps input response
  const filteredAndSortedRows = useMemo(() => {
    if (!currentResult || !currentResult.rows) return [];

    let rows = currentResult.rows;

    // Search filter with deferred query
    if (deferredSearchQuery.trim()) {
      const q = deferredSearchQuery.toLowerCase();
      rows = rows.filter(row => {
        return Object.values(row).some(val => {
          if (val === null || val === undefined) return false;
          return String(val).toLowerCase().includes(q);
        });
      });
    }

    // Sort only if column is selected
    if (sortColumn) {
      const sorted = [...rows];
      sorted.sort((a, b) => {
        const valA = a[sortColumn];
        const valB = b[sortColumn];

        if (valA === valB) return 0;
        if (valA === null || valA === undefined) return 1;
        if (valB === null || valB === undefined) return -1;

        if (typeof valA === 'number' && typeof valB === 'number') {
          return sortDirection === 'asc' ? valA - valB : valB - valA;
        }

        const strA = String(valA).toLowerCase();
        const strB = String(valB).toLowerCase();
        return sortDirection === 'asc' ? strA.localeCompare(strB) : strB.localeCompare(strA);
      });
      return sorted;
    }

    return rows;
  }, [currentResult, deferredSearchQuery, sortColumn, sortDirection]);

  // Paginated slice (capped at 250 rows if "All" is chosen to avoid crashing weak devices)
  const paginatedRows = useMemo(() => {
    if (pageSize === -1) return filteredAndSortedRows.slice(0, 250);
    const start = (currentPage - 1) * pageSize;
    return filteredAndSortedRows.slice(start, start + pageSize);
  }, [filteredAndSortedRows, currentPage, pageSize]);

  const totalPages = pageSize === -1 ? 1 : Math.ceil(filteredAndSortedRows.length / pageSize);

  // Export functions
  const downloadCsv = () => {
    if (!currentResult || currentResult.rows.length === 0) return;
    const cols = currentResult.columns;
    const header = cols.map(c => `"${c.replace(/"/g, '""')}"`).join(',');
    const lines = currentResult.rows.map(row => {
      return cols.map(c => {
        const v = row[c];
        if (v === null || v === undefined) return '';
        if (typeof v === 'object') return `"${JSON.stringify(v).replace(/"/g, '""')}"`;
        return `"${String(v).replace(/"/g, '""')}"`;
      }).join(',');
    });
    const csvContent = [header, ...lines].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `query_result_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadJson = () => {
    if (!currentResult || currentResult.rows.length === 0) return;
    const jsonStr = JSON.stringify(currentResult.rows, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `query_result_${Date.now()}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const copyMarkdown = async () => {
    if (!currentResult || currentResult.rows.length === 0) return;
    const cols = currentResult.columns;
    const header = `| ${cols.join(' | ')} |`;
    const separator = `| ${cols.map(() => '---').join(' | ')} |`;
    const body = currentResult.rows.slice(0, 100).map(r => {
      return `| ${cols.map(c => (r[c] !== null && r[c] !== undefined ? String(r[c]) : 'NULL')).join(' | ')} |`;
    }).join('\n');
    const md = `${header}\n${separator}\n${body}`;
    await navigator.clipboard.writeText(md);
    setCopyFeedback('markdown');
    setTimeout(() => setCopyFeedback(null), 2000);
  };

  if (!results || results.length === 0) {
    return (
      <div className="flex flex-col h-full bg-white dark:bg-neutral-900 overflow-hidden">
        {isFullScreen && (
          <div className="bg-emerald-500/10 border-b border-emerald-500/20 px-3 py-1.5 flex items-center justify-between text-xs text-emerald-800 dark:text-emerald-300">
            <div className="flex items-center gap-1.5 font-medium">
              <Maximize2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Output Full Screen Mode</span>
              <span className="text-neutral-400 text-[11px] hidden sm:inline">(Press Esc to restore editor split)</span>
            </div>
            {onToggleFullScreen && (
              <button
                onClick={onToggleFullScreen}
                className="text-xs font-medium text-emerald-700 dark:text-emerald-300 hover:underline flex items-center gap-1"
              >
                <Minimize2 className="w-3 h-3" />
                <span>Restore Split View</span>
              </button>
            )}
          </div>
        )}
        <div className="flex flex-col items-center justify-center flex-1 p-8 text-center text-neutral-400">
          <FileSpreadsheet className="w-12 h-12 stroke-[1.2] mb-3 text-neutral-300 dark:text-neutral-700" />
          <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400">Ready to execute SQL query</p>
          <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-1">Press Execute or press Ctrl + Enter to run your query</p>
          {isFullScreen && onToggleFullScreen && (
            <button
              onClick={onToggleFullScreen}
              className="mt-4 px-3 py-1.5 rounded-lg border border-neutral-300 dark:border-neutral-700 text-xs font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800"
            >
              Restore Split View
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white dark:bg-neutral-900 overflow-hidden">
      {/* Top Banner when in Fullscreen Output mode */}
      {isFullScreen && (
        <div className="bg-emerald-500/10 border-b border-emerald-500/20 px-3 py-1.5 flex items-center justify-between text-xs text-emerald-800 dark:text-emerald-300">
          <div className="flex items-center gap-1.5 font-medium">
            <Maximize2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Output Full Screen Mode</span>
            <span className="text-neutral-400 text-[11px] hidden sm:inline">(Press Esc to restore editor split)</span>
          </div>
          {onToggleFullScreen && (
            <button
              onClick={onToggleFullScreen}
              className="text-xs font-medium text-emerald-700 dark:text-emerald-300 hover:underline flex items-center gap-1"
            >
              <Minimize2 className="w-3 h-3" />
              <span>Restore Split View</span>
            </button>
          )}
        </div>
      )}

      {/* Top Header / Result Selector if multi-statement */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 text-xs">
        {/* Left: Result Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto scrollbar-none">
          {results.length > 1 ? (
            results.map((res, idx) => (
              <button
                key={idx}
                onClick={() => setActiveResultIndex(idx)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs whitespace-nowrap transition-colors ${
                  activeResultIndex === idx
                    ? 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white font-semibold shadow-xs border border-neutral-200 dark:border-neutral-700'
                    : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
                }`}
              >
                {res.error ? (
                  <AlertCircle className="w-3 h-3 text-red-500" />
                ) : (
                  <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                )}
                <span>Statement {idx + 1}</span>
                {res.isSelect && (
                  <span className="font-mono text-[10px] text-neutral-400 tabular-nums">
                    ({res.rowCount})
                  </span>
                )}
              </button>
            ))
          ) : (
            <div className="flex items-center gap-2">
              {currentResult.error ? (
                <span className="flex items-center gap-1 text-red-600 dark:text-red-400 font-medium">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>Execution Failed</span>
                </span>
              ) : (
                <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Success</span>
                </span>
              )}
            </div>
          )}

          {/* Telemetry info */}
          <div className="hidden sm:flex items-center gap-2 text-neutral-500 dark:text-neutral-400 text-[11px] ml-2 border-l border-neutral-200 dark:border-neutral-800 pl-2">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              <span className="font-mono tabular-nums">{currentResult.executionTimeMs}ms</span>
            </span>
            <span>·</span>
            <span className="font-mono tabular-nums">
              {currentResult.rowCount} {currentResult.rowCount === 1 ? 'row' : 'rows'}
            </span>
          </div>
        </div>

        {/* Right: Actions (Search, Pin to AI, Export) */}
        <div className="flex items-center gap-1.5">
          {/* Search box inside table */}
          {currentResult.isSelect && currentResult.rows.length > 0 && (
            <div className="relative">
              <Search className="w-3 h-3 absolute left-2 top-2 text-neutral-400" />
              <input
                type="text"
                placeholder="Filter output..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-6 pr-2 py-0.5 text-xs bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 outline-none w-28 sm:w-36 focus:w-44 transition-all"
              />
            </div>
          )}

          {/* Pin Result to AI */}
          {onPinResultToAi && (
            <button
              onClick={() => onPinResultToAi(currentResult)}
              className="flex items-center gap-1 px-2 py-1 rounded border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300"
              title="Pin this query result to Groq AI as context"
            >
              <Pin className="w-3 h-3 text-amber-500" />
              <span className="hidden sm:inline">Pin to AI</span>
            </button>
          )}

          {/* Export Menu */}
          {currentResult.isSelect && currentResult.rows.length > 0 && (
            <div className="flex items-center gap-1">
              <button
                onClick={downloadCsv}
                className="p-1 rounded border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300"
                title="Download as CSV"
              >
                <Download className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={copyMarkdown}
                className="p-1 rounded border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300"
                title="Copy as Markdown table"
              >
                {copyFeedback === 'markdown' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          )}

          {/* Output Window Controls: Minimize & Fullscreen */}
          <div className="flex items-center gap-1 border-l border-neutral-200 dark:border-neutral-800 pl-1.5 ml-0.5">
            {onMinimize && (
              <button
                onClick={onMinimize}
                className="p-1 rounded border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-400 transition-colors"
                title="Minimize Output to Bottom Dock"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
            )}

            {onToggleFullScreen && (
              <button
                onClick={onToggleFullScreen}
                className={`p-1 rounded border transition-colors flex items-center gap-1 ${
                  isFullScreen
                    ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300'
                    : 'border-neutral-300 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300'
                }`}
                title={isFullScreen ? 'Restore Split View (Esc)' : 'Full Screen Output Space'}
              >
                {isFullScreen ? (
                  <>
                    <Minimize2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span className="hidden sm:inline text-[11px] font-medium text-emerald-600 dark:text-emerald-400">Restore</span>
                  </>
                ) : (
                  <>
                    <Maximize2 className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline text-[11px]">Full Screen</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content Area: Table or Error */}
      <div className="flex-1 overflow-auto bg-white dark:bg-neutral-900">
        {currentResult.error ? (
          /* Error Display */
          <div className="p-4 sm:p-6 max-w-2xl mx-auto space-y-4">
            <div className="p-4 rounded-xl border border-red-200 dark:border-red-900/60 bg-red-50/50 dark:bg-red-950/20 text-neutral-800 dark:text-neutral-200">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                <div className="space-y-2 flex-1">
                  <h4 className="font-semibold text-sm text-red-900 dark:text-red-300">
                    SQL Execution Error
                  </h4>
                  <pre className="text-xs font-mono bg-white dark:bg-neutral-950 p-2.5 rounded border border-red-100 dark:border-red-900/40 text-red-700 dark:text-red-300 whitespace-pre-wrap overflow-x-auto">
                    {currentResult.error}
                  </pre>
                  <p className="text-xs text-neutral-600 dark:text-neutral-400">
                    Failed SQL statement:
                  </p>
                  <pre className="text-xs font-mono bg-white dark:bg-neutral-950 p-2 rounded border border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 overflow-x-auto">
                    {currentResult.statement}
                  </pre>
                </div>
              </div>

              {onAskAiAboutError && (
                <div className="mt-4 pt-3 border-t border-red-100 dark:border-red-900/40 flex justify-end">
                  <button
                    onClick={() => onAskAiAboutError(currentResult.error!, currentResult.statement)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-medium shadow-xs"
                  >
                    <Bot className="w-3.5 h-3.5" />
                    <span>Ask Groq AI to Diagnose & Fix</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : !currentResult.isSelect ? (
          /* DDL/DML Success Confirmation */
          <div className="p-6 max-w-md mx-auto text-center space-y-2">
            <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
              {currentResult.message || 'Statement Completed'}
            </h4>
            <p className="text-xs text-neutral-500 font-mono">
              Executed in {currentResult.executionTimeMs}ms
            </p>
          </div>
        ) : filteredAndSortedRows.length === 0 ? (
          /* Empty rows */
          <div className="p-8 text-center text-neutral-400">
            <p className="text-xs font-medium">No records match the current criteria.</p>
          </div>
        ) : (
          /* High-Density Data Grid */
          <div className="inline-block min-w-full align-middle">
            <table className="min-w-full divide-y divide-neutral-200 dark:divide-neutral-800 text-left border-collapse text-xs">
              <thead className="bg-neutral-50 dark:bg-neutral-950 sticky top-0 z-10 select-none">
                <tr className="divide-x divide-neutral-200 dark:divide-neutral-800">
                  <th className="w-12 px-3 py-2 text-[11px] font-mono font-medium text-neutral-400 text-right">
                    #
                  </th>
                  {currentResult.columns.map(col => {
                    const isSorted = sortColumn === col;
                    return (
                      <th
                        key={col}
                        onClick={() => handleSort(col)}
                        className="px-3 py-2 text-[11px] font-semibold text-neutral-700 dark:text-neutral-300 cursor-pointer hover:bg-neutral-100 dark:hover:bg-neutral-850 transition-colors whitespace-nowrap"
                      >
                        <div className="flex items-center justify-between gap-1.5">
                          <span className="font-mono">{col}</span>
                          <span className="text-neutral-400">
                            {isSorted ? (
                              sortDirection === 'asc' ? <ArrowUp className="w-3 h-3 text-emerald-500" /> : <ArrowDown className="w-3 h-3 text-emerald-500" />
                            ) : (
                              <ArrowUpDown className="w-2.5 h-2.5 opacity-40 hover:opacity-100" />
                            )}
                          </span>
                        </div>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800/60 bg-white dark:bg-neutral-900 font-mono text-neutral-800 dark:text-neutral-200">
                {paginatedRows.map((row, rowIdx) => {
                  const globalIdx = (currentPage - 1) * (pageSize === -1 ? 0 : pageSize) + rowIdx + 1;
                  return (
                    <tr
                      key={rowIdx}
                      style={{ contentVisibility: 'auto', containIntrinsicSize: '36px' }}
                      className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors divide-x divide-neutral-100 dark:divide-neutral-800/40"
                    >
                      <td className="px-3 py-1.5 text-right text-neutral-400 text-[10px] tabular-nums select-none bg-neutral-50/50 dark:bg-neutral-950/30">
                        {globalIdx}
                      </td>
                      {currentResult.columns.map(col => {
                        const val = row[col];
                        const isNull = val === null || val === undefined;
                        const isNumber = typeof val === 'number';

                        return (
                          <td
                            key={col}
                            className={`px-3 py-1.5 whitespace-nowrap text-xs ${
                              isNumber ? 'text-right tabular-nums text-indigo-600 dark:text-indigo-400' : ''
                            } ${isNull ? 'italic text-neutral-400' : ''}`}
                          >
                            {isNull ? (
                              'NULL'
                            ) : typeof val === 'object' ? (
                              JSON.stringify(val)
                            ) : (
                              String(val)
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination & Status Footer */}
      {currentResult.isSelect && currentResult.rows.length > 0 && (
        <div className="px-3 py-1.5 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 flex flex-wrap items-center justify-between gap-2 text-xs text-neutral-600 dark:text-neutral-400">
          <div className="flex items-center gap-2">
            <span>Rows per page:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded px-1.5 py-0.5 text-xs text-neutral-800 dark:text-neutral-200 outline-none"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
              <option value={-1}>All</option>
            </select>
            <span className="font-mono tabular-nums text-[11px] text-neutral-500">
              Showing {filteredAndSortedRows.length === 0 ? 0 : (currentPage - 1) * pageSize + 1} -{' '}
              {pageSize === -1 ? filteredAndSortedRows.length : Math.min(currentPage * pageSize, filteredAndSortedRows.length)} of{' '}
              {filteredAndSortedRows.length}
            </span>
          </div>

          {pageSize !== -1 && totalPages > 1 && (
            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-2 py-0.5 rounded border border-neutral-300 dark:border-neutral-700 disabled:opacity-40 hover:bg-neutral-200 dark:hover:bg-neutral-800"
              >
                Prev
              </button>
              <span className="px-2 font-mono tabular-nums text-xs">
                {currentPage} / {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-2 py-0.5 rounded border border-neutral-300 dark:border-neutral-700 disabled:opacity-40 hover:bg-neutral-200 dark:hover:bg-neutral-800"
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
