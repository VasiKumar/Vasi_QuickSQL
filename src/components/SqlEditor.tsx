import React, { useRef, useState, useEffect, useMemo } from 'react';
import { 
  Play, 
  Sparkles, 
  Trash2, 
  BookmarkPlus, 
  Pin, 
  Plus, 
  X, 
  WrapText, 
  Type,
  Copy,
  Check,
  Undo2,
  Redo2,
  Maximize2,
  Minimize2,
  Database,
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import { EditorTab } from '../types';

interface SqlEditorProps {
  tabs: EditorTab[];
  activeTabId: string;
  onSelectTab: (id: string) => void;
  onCloseTab: (id: string) => void;
  onAddTab: () => void;
  onUpdateQuery: (id: string, query: string) => void;
  onExecute: (queryToRun?: string) => void;
  isRunning: boolean;
  onSaveQueryModal: (sql: string) => void;
  onPinToAi: (sql: string, title: string) => void;
  isFullScreen?: boolean;
  onToggleFullScreen?: () => void;
  tablesCount?: number;
  attributesCount?: number;
  onToggleSchema?: () => void;
  isSchemaOpen?: boolean;
  isFocusMode?: boolean;
}

const COMMON_SQL_KEYWORDS = [
  'SELECT', 'FROM', 'WHERE', 'JOIN', 'LEFT JOIN', 'ON', 
  'GROUP BY', 'ORDER BY', 'LIMIT 10', 'AND', '*', ';'
];

export const SqlEditor: React.FC<SqlEditorProps> = ({
  tabs,
  activeTabId,
  onSelectTab,
  onCloseTab,
  onAddTab,
  onUpdateQuery,
  onExecute,
  isRunning,
  onSaveQueryModal,
  onPinToAi,
  isFullScreen = false,
  onToggleFullScreen,
  tablesCount,
  attributesCount,
  onToggleSchema,
  isSchemaOpen = false,
  isFocusMode = false
}) => {
  const currentTab = tabs.find(t => t.id === activeTabId) || tabs[0];
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lineNumbersRef = useRef<HTMLPreElement>(null);

  const [fontSize, setFontSize] = useState<number>(14);
  const [wordWrap, setWordWrap] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [selectedText, setSelectedText] = useState<string>('');

  // Undo / Redo history stacks
  const [undoStack, setUndoStack] = useState<string[]>([]);
  const [redoStack, setRedoStack] = useState<string[]>([]);
  const isUndoRedoAction = useRef(false);

  // Clear redo stack on tab switch
  useEffect(() => {
    setUndoStack([]);
    setRedoStack([]);
  }, [activeTabId]);

  const handleQueryChange = (newVal: string) => {
    if (!isUndoRedoAction.current && currentTab && currentTab.query !== newVal) {
      setUndoStack(prev => [...prev.slice(-30), currentTab.query]);
      setRedoStack([]);
    }
    isUndoRedoAction.current = false;
    onUpdateQuery(currentTab.id, newVal);
  };

  const handleUndo = () => {
    if (undoStack.length === 0 || !currentTab) return;
    const previous = undoStack[undoStack.length - 1];
    const newUndoStack = undoStack.slice(0, -1);
    setRedoStack(prev => [...prev, currentTab.query]);
    setUndoStack(newUndoStack);
    isUndoRedoAction.current = true;
    onUpdateQuery(currentTab.id, previous);
  };

  const handleRedo = () => {
    if (redoStack.length === 0 || !currentTab) return;
    const next = redoStack[redoStack.length - 1];
    const newRedoStack = redoStack.slice(0, -1);
    setUndoStack(prev => [...prev, currentTab.query]);
    setRedoStack(newRedoStack);
    isUndoRedoAction.current = true;
    onUpdateQuery(currentTab.id, next);
  };

  // Track selection inside textarea
  const handleSelect = () => {
    if (textareaRef.current) {
      const start = textareaRef.current.selectionStart;
      const end = textareaRef.current.selectionEnd;
      if (start !== end) {
        setSelectedText(textareaRef.current.value.substring(start, end));
      } else {
        setSelectedText('');
      }
    }
  };

  // Synchronize line numbers scrolling with textarea
  const handleScroll = () => {
    if (textareaRef.current && lineNumbersRef.current) {
      lineNumbersRef.current.scrollTop = textareaRef.current.scrollTop;
    }
  };

  // Keyboard shortcut Ctrl+Enter to execute, Ctrl+Z for undo, Ctrl+Y for redo
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Ctrl+Enter or Cmd+Enter to execute
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      if (selectedText.trim()) {
        onExecute(selectedText);
      } else {
        onExecute(currentTab?.query);
      }
      return;
    }

    // Ctrl+Z for Undo
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z' && !e.shiftKey) {
      e.preventDefault();
      handleUndo();
      return;
    }

    // Ctrl+Y or Ctrl+Shift+Z for Redo
    if (
      ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') ||
      ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'z')
    ) {
      e.preventDefault();
      handleRedo();
      return;
    }

    // Allow Tab key for indentation
    if (e.key === 'Tab') {
      e.preventDefault();
      const start = e.currentTarget.selectionStart;
      const end = e.currentTarget.selectionEnd;
      const val = e.currentTarget.value;
      const newVal = val.substring(0, start) + '  ' + val.substring(end);
      handleQueryChange(newVal);
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.selectionStart = textareaRef.current.selectionEnd = start + 2;
        }
      }, 0);
    }
  };

  // Format SQL by standardizing uppercase keywords
  const handleFormatSql = () => {
    if (!currentTab) return;
    const keywords = [
      'select', 'from', 'where', 'and', 'or', 'not', 'in', 'between', 'like', 'is', 'null',
      'group by', 'order by', 'having', 'limit', 'offset', 'join', 'left join', 'right join',
      'inner join', 'outer join', 'full join', 'cross join', 'on', 'as', 'with', 'union',
      'union all', 'case', 'when', 'then', 'else', 'end', 'insert into', 'values', 'update',
      'set', 'delete from', 'create table', 'drop table', 'alter table', 'primary key'
    ];

    let formatted = currentTab.query;
    keywords.forEach(kw => {
      const regex = new RegExp(`\\b${kw}\\b`, 'gi');
      formatted = formatted.replace(regex, kw.toUpperCase());
    });

    handleQueryChange(formatted);
  };

  // Insert snippet or keyword at cursor
  const handleInsertSnippet = (snippet: string) => {
    if (!textareaRef.current || !currentTab) return;
    const start = textareaRef.current.selectionStart;
    const end = textareaRef.current.selectionEnd;
    const val = currentTab.query;
    const newVal = val.substring(0, start) + (start > 0 && !val[start - 1].match(/\s/) ? ' ' : '') + snippet + ' ' + val.substring(end);
    handleQueryChange(newVal);
    setTimeout(() => {
      if (textareaRef.current) {
        const newPos = start + snippet.length + 1;
        textareaRef.current.focus();
        textareaRef.current.selectionStart = textareaRef.current.selectionEnd = newPos;
      }
    }, 0);
  };

  const handleCopy = async () => {
    if (!currentTab?.query) return;
    await navigator.clipboard.writeText(currentTab.query);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Memoized line numbers string
  const lineNumbersText = useMemo(() => {
    const count = (currentTab?.query || '').split('\n').length;
    let s = '1';
    for (let i = 2; i <= Math.max(count, 1); i++) {
      s += '\n' + i;
    }
    return s;
  }, [currentTab?.query]);

  const linesCount = (currentTab?.query || '').split('\n').length;

  return (
    <div className="flex flex-col h-full bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800">
      {/* Tab Bar */}
      <div className="flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 px-2 overflow-x-auto scrollbar-none">
        <div className="flex items-center gap-1 py-1.5">
          {tabs.map(tab => {
            const isActive = tab.id === activeTabId;
            return (
              <div
                key={tab.id}
                onClick={() => onSelectTab(tab.id)}
                className={`group flex items-center gap-2 px-3 py-1.5 text-xs rounded-t-md cursor-pointer border-t-2 transition-all whitespace-nowrap select-none ${
                  isActive
                    ? 'bg-white dark:bg-neutral-900 border-emerald-500 font-semibold text-neutral-900 dark:text-neutral-100 shadow-xs'
                    : 'bg-transparent border-transparent text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-900/60'
                }`}
              >
                <span>{tab.title}</span>
                {tabs.length > 1 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onCloseTab(tab.id);
                    }}
                    className="p-0.5 rounded hover:bg-neutral-200 dark:hover:bg-neutral-800 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200"
                    title="Close tab"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            );
          })}

          <button
            onClick={onAddTab}
            className="p-1 rounded text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200 hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-colors ml-1"
            title="New Query Tab"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>

          {/* Tables & Attributes Tab: Click to Expand / Minimise (hidden in focus mode) */}
          {!isFocusMode && onToggleSchema && (
            <button
              onClick={onToggleSchema}
              className={`flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-t-md border-t-2 transition-all select-none ml-2 ${
                isSchemaOpen
                  ? 'bg-white dark:bg-neutral-900 border-emerald-500 font-semibold text-emerald-700 dark:text-emerald-400 shadow-xs'
                  : 'bg-transparent border-transparent text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 hover:bg-neutral-100 dark:hover:bg-neutral-900/60'
              }`}
              title={isSchemaOpen ? 'Minimise Tables & Attributes panel' : 'Expand Tables & Attributes inspector'}
            >
              <Database className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Tables ({tablesCount ?? 0})</span>
              {attributesCount !== undefined && attributesCount > 0 && (
                <span className="text-[10px] opacity-75 font-mono hidden sm:inline">· {attributesCount} attrs</span>
              )}
              {isSchemaOpen ? (
                <ChevronDown className="w-3 h-3 text-emerald-600" />
              ) : (
                <ChevronRight className="w-3 h-3 text-neutral-400" />
              )}
            </button>
          )}
        </div>

        {/* Action icons on right */}
        <div className="hidden sm:flex items-center gap-1.5 py-1 text-xs">
          <button
            onClick={() => onPinToAi(currentTab.query, currentTab.title)}
            className="flex items-center gap-1 px-2 py-1 rounded border border-neutral-300 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800"
            title="Pin current query to Groq AI as context"
          >
            <Pin className="w-3 h-3 text-amber-500" />
            <span className="text-[11px]">Pin to AI</span>
          </button>

          <button
            onClick={() => onSaveQueryModal(currentTab.query)}
            className="flex items-center gap-1 px-2 py-1 rounded border border-neutral-300 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800"
            title="Save query"
          >
            <BookmarkPlus className="w-3 h-3 text-emerald-600" />
            <span className="text-[11px]">Save</span>
          </button>

          {onToggleFullScreen && (
            <button
              onClick={onToggleFullScreen}
              className={`flex items-center gap-1 px-2 py-1 rounded border transition-colors ${
                isFullScreen
                  ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300'
                  : 'border-neutral-300 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800'
              }`}
              title={isFullScreen ? 'Restore Split View (Esc)' : 'Full Screen Query Writing Space'}
            >
              {isFullScreen ? <Minimize2 className="w-3 h-3 text-emerald-600" /> : <Maximize2 className="w-3 h-3" />}
              <span className="text-[11px]">{isFullScreen ? 'Restore' : 'Full Screen'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Editor Sub-toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-1.5 border-b border-neutral-200 dark:border-neutral-800/80 bg-neutral-100/50 dark:bg-neutral-900/60 text-xs">
        <div className="flex items-center gap-1.5">
          {selectedText.trim() ? (
            <button
              onClick={() => onExecute(selectedText)}
              disabled={isRunning}
              className="flex items-center gap-1 px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-medium shadow-xs"
            >
              <Play className="w-3 h-3 fill-current" />
              <span>Run Selected ({selectedText.length} chars)</span>
            </button>
          ) : (
            <button
              onClick={() => onExecute(currentTab?.query)}
              disabled={isRunning}
              className="flex items-center gap-1 px-2.5 py-1 bg-neutral-800 dark:bg-neutral-700 hover:bg-neutral-900 dark:hover:bg-neutral-600 text-white rounded font-medium shadow-xs"
            >
              <Play className="w-3 h-3 fill-current" />
              <span>Run Script</span>
            </button>
          )}

          {/* Undo and Redo Buttons */}
          <div className="flex items-center border border-neutral-300 dark:border-neutral-700 rounded overflow-hidden">
            <button
              onClick={handleUndo}
              disabled={undoStack.length === 0}
              className="p-1 hover:bg-neutral-200 dark:hover:bg-neutral-800 disabled:opacity-30 text-neutral-700 dark:text-neutral-300 transition-colors"
              title="Undo (Ctrl + Z)"
            >
              <Undo2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleRedo}
              disabled={redoStack.length === 0}
              className="p-1 hover:bg-neutral-200 dark:hover:bg-neutral-800 disabled:opacity-30 text-neutral-700 dark:text-neutral-300 transition-colors border-l border-neutral-300 dark:border-neutral-700"
              title="Redo (Ctrl + Y)"
            >
              <Redo2 className="w-3.5 h-3.5" />
            </button>
          </div>

          <button
            onClick={handleFormatSql}
            className="flex items-center gap-1 px-2 py-1 rounded border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-200 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300"
            title="Standardize SQL keywords to UPPERCASE"
          >
            <Sparkles className="w-3 h-3 text-indigo-500" />
            <span className="hidden sm:inline">Format</span>
          </button>

          <button
            onClick={() => handleQueryChange('')}
            className="flex items-center gap-1 p-1 sm:px-2 sm:py-1 rounded border border-neutral-300 dark:border-neutral-700 hover:bg-red-50 dark:hover:bg-red-950/30 text-neutral-600 dark:text-neutral-400 hover:text-red-600"
            title="Clear editor content"
          >
            <Trash2 className="w-3 h-3" />
            <span className="hidden sm:inline">Clear</span>
          </button>
        </div>

        {/* View & Typography controls */}
        <div className="flex items-center gap-2 text-neutral-600 dark:text-neutral-400">
          {/* Word Wrap toggle */}
          <button
            onClick={() => setWordWrap(!wordWrap)}
            className={`p-1 rounded border transition-colors ${
              wordWrap 
                ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300' 
                : 'border-neutral-300 dark:border-neutral-700 hover:bg-neutral-200 dark:hover:bg-neutral-800'
            }`}
            title={wordWrap ? 'Disable Word Wrap' : 'Enable Word Wrap'}
          >
            <WrapText className="w-3.5 h-3.5" />
          </button>

          {/* Font Size Adjuster */}
          <div className="flex items-center border border-neutral-300 dark:border-neutral-700 rounded overflow-hidden">
            <button
              onClick={() => setFontSize(prev => Math.max(11, prev - 1))}
              className="px-1.5 py-0.5 hover:bg-neutral-200 dark:hover:bg-neutral-800 font-mono text-[11px]"
              title="Decrease Font Size"
            >
              A-
            </button>
            <span className="px-1.5 py-0.5 font-mono text-[11px] border-x border-neutral-200 dark:border-neutral-800">
              {fontSize}px
            </span>
            <button
              onClick={() => setFontSize(prev => Math.min(20, prev + 1))}
              className="px-1.5 py-0.5 hover:bg-neutral-200 dark:hover:bg-neutral-800 font-mono text-[11px]"
              title="Increase Font Size"
            >
              A+
            </button>
          </div>

          {/* Copy Button */}
          <button
            onClick={handleCopy}
            className="p-1 rounded border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-colors"
            title="Copy SQL"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
          </button>

          {/* Full Screen Toggle Button in sub-toolbar */}
          {onToggleFullScreen && (
            <button
              onClick={onToggleFullScreen}
              className={`p-1 rounded border transition-colors flex items-center gap-1 ${
                isFullScreen
                  ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300'
                  : 'border-neutral-300 dark:border-neutral-700 hover:bg-neutral-200 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300'
              }`}
              title={isFullScreen ? 'Restore Split View (Esc)' : 'Full Screen Query Writing Space'}
            >
              {isFullScreen ? (
                <>
                  <Minimize2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span className="hidden lg:inline text-[10px] font-medium text-emerald-600 dark:text-emerald-400">Restore</span>
                </>
              ) : (
                <>
                  <Maximize2 className="w-3.5 h-3.5" />
                  <span className="hidden lg:inline text-[10px]">Full Screen</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Mobile-Friendly SQL Quick-Keys Bar */}
      <div className="flex items-center gap-1 px-2 py-1 bg-neutral-100 dark:bg-neutral-950 border-b border-neutral-200 dark:border-neutral-800 overflow-x-auto scrollbar-none text-[11px]">
        <span className="text-[10px] text-neutral-400 shrink-0 font-medium px-1">Quick:</span>
        {COMMON_SQL_KEYWORDS.map(kw => (
          <button
            key={kw}
            onClick={() => handleInsertSnippet(kw)}
            className="px-2 py-0.5 font-mono font-medium rounded bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:border-emerald-500 hover:text-emerald-600 dark:hover:text-emerald-400 whitespace-nowrap shrink-0 transition-colors active:scale-95"
          >
            {kw}
          </button>
        ))}
      </div>

      {/* Code Textarea with Line Numbers */}
      <div className="relative flex-1 flex overflow-hidden font-mono min-h-[160px]">
        {/* Line Numbers Column */}
        <pre 
          ref={lineNumbersRef}
          className="select-none py-3 px-2 text-right bg-neutral-50 dark:bg-neutral-950 text-neutral-400 dark:text-neutral-600 border-r border-neutral-200 dark:border-neutral-800 overflow-hidden leading-6 tabular-nums m-0"
          style={{ fontSize: `${fontSize}px`, minWidth: '40px' }}
        >{lineNumbersText}</pre>

        {/* Text Area */}
        <textarea
          ref={textareaRef}
          value={currentTab?.query || ''}
          onChange={(e) => handleQueryChange(e.target.value)}
          onScroll={handleScroll}
          onSelect={handleSelect}
          onKeyDown={handleKeyDown}
          placeholder="-- Write or paste your SQL / PostgreSQL query here
-- e.g. CREATE TABLE users (id INT, name STRING);
-- Press Ctrl + Enter to execute, Ctrl + Z to Undo, Ctrl + Y to Redo"
          spellCheck={false}
          className={`flex-1 p-3 leading-6 bg-transparent text-neutral-900 dark:text-neutral-100 outline-none resize-none font-mono ${
            wordWrap ? 'whitespace-pre-wrap' : 'whitespace-pre overflow-x-auto'
          }`}
          style={{ fontSize: `${fontSize}px` }}
        />
      </div>

      {/* Editor Footer Status Bar */}
      <div className="px-3 py-1 bg-neutral-50 dark:bg-neutral-950 border-t border-neutral-200 dark:border-neutral-800 text-[11px] text-neutral-500 dark:text-neutral-400 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span>Lines: <strong className="font-mono text-neutral-700 dark:text-neutral-200">{linesCount}</strong></span>
          <span>Chars: <strong className="font-mono text-neutral-700 dark:text-neutral-200">{(currentTab?.query || '').length}</strong></span>
          <span className="hidden sm:inline">Shortcuts: <kbd className="px-1 py-0.5 bg-neutral-200 dark:bg-neutral-800 rounded font-mono text-[10px]">Ctrl+Enter</kbd> (Run) · <kbd className="px-1 py-0.5 bg-neutral-200 dark:bg-neutral-800 rounded font-mono text-[10px]">Ctrl+Z</kbd> (Undo)</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onPinToAi(currentTab.query, currentTab.title)}
            className="sm:hidden text-amber-600 dark:text-amber-400 font-medium"
          >
            Pin to AI
          </button>
          <button
            onClick={() => onSaveQueryModal(currentTab.query)}
            className="sm:hidden text-emerald-600 dark:text-emerald-400 font-medium"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
};
