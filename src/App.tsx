import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Header } from './components/Header';
import { SqlEditor } from './components/SqlEditor';
import { ResultsViewer } from './components/ResultsViewer';
import { SchemaExplorer } from './components/SchemaExplorer';
import { HistoryDrawer } from './components/HistoryDrawer';
import { SavedQueriesModal } from './components/SavedQueriesModal';
import { DatasetSelectorModal } from './components/DatasetSelectorModal';
import { ImportFileModal } from './components/ImportFileModal';
import { AiAssistantDrawer } from './components/AiAssistantDrawer';
import { ContextPinModal } from './components/ContextPinModal';
import { ProfileModal } from './components/ProfileModal';
import { GroqSetupModal } from './components/GroqSetupModal';
import { InstallApkModal } from './components/InstallApkModal';
import { sqlEngine } from './services/sqlEngine';
import { historyStorage } from './services/historyStorage';
import { savedQueriesStorage } from './services/savedQueriesStorage';
import { groqService } from './services/groqService';
import { 
  AttachedContext, 
  DatasetPreset, 
  EditorTab, 
  QueryResult, 
  SavedQuery, 
  TableSchema 
} from './types';
import { 
  Code2, 
  Database, 
  History, 
  Bookmark, 
  Bot, 
  Play, 
  Sparkles,
  Maximize2,
  Minimize2,
  Eye,
  FolderDown,
  Minus,
  ChevronUp,
  Table,
  Terminal
} from 'lucide-react';

export default function App() {
  // Theme state
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('sql_studio_theme');
    if (saved) return saved === 'dark';
    return true; // Dark mode by default for comfortable viewing during long sessions
  });

  useEffect(() => {
    localStorage.setItem('sql_studio_theme', darkMode ? 'dark' : 'light');
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Views, Layout & Focus Mode
  const [activeView, setActiveView] = useState<'editor' | 'schema' | 'history' | 'saved' | 'ai'>('editor');
  const [workspaceLayout, setWorkspaceLayout] = useState<'split' | 'editor-fullscreen' | 'output-fullscreen' | 'output-minimized'>('split');
  const [isFocusMode, setIsFocusMode] = useState<boolean>(false);

  // SQL Syntax Highlighting (VS Code color formatting)
  const [syntaxHighlighting, setSyntaxHighlighting] = useState<boolean>(() => {
    const saved = localStorage.getItem('quicksql_syntax_highlighting');
    return saved !== null ? saved === 'true' : true;
  });

  const handleToggleSyntaxHighlighting = (val: boolean) => {
    setSyntaxHighlighting(val);
    localStorage.setItem('quicksql_syntax_highlighting', String(val));
  };

  // Escape key restores split workspace layout
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && workspaceLayout !== 'split') {
        setWorkspaceLayout('split');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [workspaceLayout]);

  // Database & Engine state: Start completely blank by default!
  const [schemas, setSchemas] = useState<TableSchema[]>([]);
  const totalAttributesCount = useMemo(() => {
    return schemas.reduce((acc, s) => acc + s.columns.length, 0);
  }, [schemas]);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [results, setResults] = useState<QueryResult[]>([]);
  const [history, setHistory] = useState(() => historyStorage.getHistory());
  const [savedQueries, setSavedQueries] = useState(() => savedQueriesStorage.getSavedQueries());
  const [folders, setFolders] = useState<string[]>(() => savedQueriesStorage.getFolders());
  const [activeFolder, setActiveFolder] = useState<string | null>(null);

  // Tabs state: Clean empty editor query
  const [tabs, setTabs] = useState<EditorTab[]>(() => [
    {
      id: 'tab_1',
      title: 'Query 1',
      query: `-- Write your SQL / PostgreSQL query here
-- e.g. CREATE TABLE users (id INT, name STRING, country STRING);
-- Or click "Demo Data" in the top bar to import a demo dataset anytime.
`
    }
  ]);
  const [activeTabId, setActiveTabId] = useState<string>('tab_1');

  // Modals state
  const [isDatasetModalOpen, setIsDatasetModalOpen] = useState<boolean>(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState<boolean>(false);
  const [isSaveModalOpen, setIsSaveModalOpen] = useState<boolean>(false);
  const [saveModalSql, setSaveModalSql] = useState<string>('');
  const [isPinModalOpen, setIsPinModalOpen] = useState<boolean>(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState<boolean>(false);
  const [isGroqSetupModalOpen, setIsGroqSetupModalOpen] = useState<boolean>(false);
  const [isInstallModalOpen, setIsInstallModalOpen] = useState<boolean>(false);
  const [errorToDiagnose, setErrorToDiagnose] = useState<{ error: string; sql: string } | null>(null);

  // AI Attached Contexts
  const [attachedContexts, setAttachedContexts] = useState<AttachedContext[]>([]);
  const [hasGroqKey, setHasGroqKey] = useState<boolean>(() => !!groqService.getConfig().apiKey);

  const activeTab = tabs.find(t => t.id === activeTabId) || tabs[0];

  // Refresh database schema
  const refreshSchema = useCallback(async () => {
    const list = await sqlEngine.getSchema();
    setSchemas(list);
  }, []);

  // Initialize DB on start: starts with 0 tables (fully nothing. They do everything)
  useEffect(() => {
    const init = async () => {
      await sqlEngine.init();
      await refreshSchema();
    };
    init();
  }, [refreshSchema]);

  // Execute query handler
  const handleExecute = async (queryToRun?: string) => {
    const script = (queryToRun || activeTab?.query || '').trim();
    if (!script) return;

    // If output is minimized, restore to split view so user sees results
    if (workspaceLayout === 'output-minimized') {
      setWorkspaceLayout('split');
    }

    setIsRunning(true);
    const start = performance.now();

    try {
      const res = await sqlEngine.executeScript(script);
      setResults(res);

      const duration = Math.round(performance.now() - start);
      const firstRes = res[0];
      const isSuccess = !firstRes?.error;

      // Add to history
      const histItem = historyStorage.addItem({
        query: script,
        durationMs: duration,
        status: isSuccess ? 'success' : 'error',
        errorMessage: firstRes?.error,
        rowCount: firstRes?.rowCount
      });
      setHistory(prev => [histItem, ...prev.filter(h => h.id !== histItem.id)]);

      // If user is on another view on mobile, switch to editor to see results
      if (activeView !== 'editor') {
        setActiveView('editor');
      }

      // If any tables created or dropped, refresh schema
      await refreshSchema();
    } catch (err: any) {
      console.error('Execution failure', err);
    } finally {
      setIsRunning(false);
    }
  };

  // AI Button Click handler: If never set up any API, open setup modal; otherwise switch to AI tab
  const handleAiNavClick = () => {
    const cfg = groqService.getConfig();
    if (!cfg.apiKey) {
      setIsGroqSetupModalOpen(true);
    } else {
      setActiveView('ai');
    }
  };

  // Tab management
  const handleAddTab = () => {
    const newId = 'tab_' + Date.now();
    const newTabNumber = tabs.length + 1;
    const newTab: EditorTab = {
      id: newId,
      title: `Query ${newTabNumber}`,
      query: `-- Write your SQL / PostgreSQL query here\n`
    };
    setTabs(prev => [...prev, newTab]);
    setActiveTabId(newId);
  };

  const handleCloseTab = (id: string) => {
    if (tabs.length <= 1) return;
    const remaining = tabs.filter(t => t.id !== id);
    setTabs(remaining);
    if (activeTabId === id) {
      setActiveTabId(remaining[remaining.length - 1].id);
    }
  };

  const handleUpdateQuery = (id: string, query: string) => {
    setTabs(prev => prev.map(t => (t.id === id ? { ...t, query } : t)));
  };

  // Saved Queries
  const handleOpenSaveModal = (sql: string) => {
    setSaveModalSql(sql);
    setIsSaveModalOpen(true);
  };

  const handleSaveCurrentQuery = (
    data: { title: string; description: string; tags: string[]; query: string; folder: string },
    idToUpdate?: string
  ) => {
    savedQueriesStorage.saveQuery(data, idToUpdate);
    setSavedQueries(savedQueriesStorage.getSavedQueries());
    setFolders(savedQueriesStorage.getFolders());
  };

  const handleDeleteSavedQuery = (id: string) => {
    savedQueriesStorage.deleteQuery(id);
    setSavedQueries(savedQueriesStorage.getSavedQueries());
  };

  const handleCreateFolder = (name: string) => {
    const updated = savedQueriesStorage.createFolder(name);
    setFolders(updated);
  };

  const handleRenameFolder = (oldName: string, newName: string) => {
    const updated = savedQueriesStorage.renameFolder(oldName, newName);
    setFolders(updated);
    setSavedQueries(savedQueriesStorage.getSavedQueries());
  };

  const handleDeleteFolder = (name: string) => {
    const updated = savedQueriesStorage.deleteFolder(name);
    setFolders(updated);
    setSavedQueries(savedQueriesStorage.getSavedQueries());
    if (activeFolder === name) setActiveFolder(null);
  };

  const handleRenameQuery = (id: string, newTitle: string) => {
    savedQueriesStorage.renameQuery(id, newTitle);
    setSavedQueries(savedQueriesStorage.getSavedQueries());
  };

  const handleMoveQuery = (id: string, targetFolder: string) => {
    savedQueriesStorage.moveQuery(id, targetFolder);
    setSavedQueries(savedQueriesStorage.getSavedQueries());
  };

  // AI Workspace File & Folder Action Handlers
  const handleCreateNewFileFromAi = (name: string, content: string, folder?: string) => {
    const cleanTitle = (name || 'New Query').replace(/\.sql$/i, '').trim();
    const newId = 'tab_' + Date.now();
    const newTab: EditorTab = {
      id: newId,
      title: cleanTitle,
      query: content
    };
    setTabs(prev => [...prev, newTab]);
    setActiveTabId(newId);

    // Save to workspace saved queries library under target folder
    const targetFolder = folder && folder.trim() ? folder.trim() : (activeFolder || 'Default');
    savedQueriesStorage.saveQuery({
      title: cleanTitle,
      description: 'Created via AI Assistant',
      tags: ['AI Generated'],
      query: content,
      folder: targetFolder
    });
    setSavedQueries(savedQueriesStorage.getSavedQueries());
    setFolders(savedQueriesStorage.getFolders());
    setActiveView('editor');
  };

  const handleApplyEditToWorkingFile = (content: string, fileName?: string) => {
    let targetTabId = activeTabId;
    if (fileName && fileName !== 'active') {
      const cleanTarget = fileName.replace(/\.sql$/i, '').trim().toLowerCase();
      const match = tabs.find(t => t.title.toLowerCase() === cleanTarget);
      if (match) targetTabId = match.id;
    }
    handleUpdateQuery(targetTabId, content);
    setActiveView('editor');
  };

  const handleRenameFileFromAi = (oldName: string, newName: string) => {
    const cleanOld = oldName.replace(/\.sql$/i, '').trim();
    const cleanNew = newName.replace(/\.sql$/i, '').trim();
    if (!cleanNew) return;

    // Rename tab
    setTabs(prev => prev.map(t => (t.title.toLowerCase() === cleanOld.toLowerCase() ? { ...t, title: cleanNew } : t)));

    // Rename in saved storage if exists
    const target = savedQueries.find(q => q.title.toLowerCase() === cleanOld.toLowerCase());
    if (target) {
      savedQueriesStorage.renameQuery(target.id, cleanNew);
      setSavedQueries(savedQueriesStorage.getSavedQueries());
    }
  };

  const handleAttachActiveFileToPrompt = () => {
    if (!activeTab) return;
    setAttachedContexts(prev => {
      const filtered = prev.filter(c => c.type !== 'working_file');
      return [
        ...filtered,
        {
          id: 'ctx_file_' + Date.now(),
          type: 'working_file',
          title: `Working File: ${activeTab.title}`,
          content: `-- Working File: ${activeTab.title}.sql\n${activeTab.query}`,
          fileName: activeTab.title,
          folder: activeFolder || 'Default'
        }
      ];
    });
  };

  // Datasets
  const handleSelectDataset = async (preset: DatasetPreset) => {
    setIsRunning(true);
    try {
      await sqlEngine.resetDatabase();
      await sqlEngine.executeScript(preset.setupSql);
      await refreshSchema();

      // Load sample query into active tab
      if (preset.sampleQueries && preset.sampleQueries.length > 0) {
        const first = preset.sampleQueries[0];
        handleUpdateQuery(activeTabId, first.sql);
        const res = await sqlEngine.executeScript(first.sql);
        setResults(res);
      }
      setIsDatasetModalOpen(false);
    } catch (e) {
      console.error('Failed to load dataset preset', e);
    } finally {
      setIsRunning(false);
    }
  };

  // Reset DB
  const handleResetDb = async () => {
    await sqlEngine.resetDatabase();
    await refreshSchema();
    setResults([]);
    handleUpdateQuery(activeTabId, '-- Database reset. Write SQL to create tables\n');
  };

  // File import handlers
  const handleImportSql = async (sql: string, fileName: string) => {
    const newId = 'tab_import_' + Date.now();
    setTabs(prev => [
      ...prev,
      {
        id: newId,
        title: fileName.replace(/\.sql$/i, ''),
        query: sql
      }
    ]);
    setActiveTabId(newId);
    await handleExecute(sql);
  };

  const handleImportCsv = async (tableName: string, csvContent: string) => {
    await sqlEngine.importCsv(tableName, csvContent);
    await refreshSchema();
    const query = `SELECT * FROM \`${tableName}\` LIMIT 25;`;
    handleUpdateQuery(activeTabId, query);
    await handleExecute(query);
  };

  const handleImportJson = async (tableName: string, jsonContent: string) => {
    await sqlEngine.importJson(tableName, jsonContent);
    await refreshSchema();
    const query = `SELECT * FROM \`${tableName}\` LIMIT 25;`;
    handleUpdateQuery(activeTabId, query);
    await handleExecute(query);
  };

  // Groq AI Context attachment
  const handlePinToAi = (sql: string, title: string) => {
    setAttachedContexts(prev => [
      ...prev.filter(c => c.type !== 'working_file'),
      {
        id: 'pin_' + Date.now(),
        type: 'working_file',
        title: `Working File: ${title || 'Query'}`,
        content: `-- File: ${title || 'Query'}.sql\n${sql}`,
        fileName: title || 'Query',
        folder: activeFolder || 'Default'
      }
    ]);
    handleAiNavClick();
  };

  const handlePinTableToAi = (table: TableSchema) => {
    const text = `Table: ${table.name} (${table.rowCount} rows)\nColumns:\n` +
      table.columns.map(c => `  - ${c.name} (${c.type}${c.isPrimary ? ', PRIMARY KEY' : ''})`).join('\n');
    setAttachedContexts(prev => [
      ...prev,
      {
        id: 'pin_tbl_' + Date.now(),
        type: 'schema',
        title: `Table: ${table.name}`,
        content: text
      }
    ]);
    handleAiNavClick();
  };

  const handlePinResultToAi = (res: QueryResult) => {
    const text = res.error
      ? `Error: ${res.error}\nStatement: ${res.statement}`
      : `Statement: ${res.statement}\nColumns: ${res.columns.join(', ')}\nSample Rows (up to 5):\n${JSON.stringify(res.rows.slice(0, 5), null, 2)}`;
    setAttachedContexts(prev => [
      ...prev,
      {
        id: 'pin_res_' + Date.now(),
        type: 'result',
        title: res.error ? 'Query Error' : `Query Result (${res.rowCount} rows)`,
        content: text
      }
    ]);
    handleAiNavClick();
  };

  const handleAskAiAboutError = (error: string, sql: string) => {
    setErrorToDiagnose({ error, sql });
    handleAiNavClick();
  };

  return (
    <div className={`min-h-screen flex flex-col font-sans bg-neutral-100 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 ${darkMode ? 'dark' : ''}`}>
      
      {/* Top Header: hidden when in Focus Mode */}
      {!isFocusMode && (
        <Header
          activeView={activeView}
          setActiveView={setActiveView}
          darkMode={darkMode}
          setDarkMode={setDarkMode}
          onExecute={() => handleExecute()}
          isRunning={isRunning}
          onOpenDatasets={() => setIsDatasetModalOpen(true)}
          onOpenImport={() => setIsImportModalOpen(true)}
          onResetDb={handleResetDb}
          tablesCount={schemas.length}
          attributesCount={totalAttributesCount}
          historyCount={history.length}
          savedCount={savedQueries.length}
          hasGroqKey={hasGroqKey}
          onAiClick={handleAiNavClick}
          onOpenProfile={() => setIsProfileModalOpen(true)}
          isFocusMode={isFocusMode}
          onToggleFocusMode={() => setIsFocusMode(true)}
          onOpenInstallModal={() => setIsInstallModalOpen(true)}
        />
      )}

      {/* Floating Tiny Unhide / Exit Focus Mode Button (Icon only) */}
      {isFocusMode && (
        <button
          onClick={() => setIsFocusMode(false)}
          className="fixed top-3 right-4 z-50 p-2 rounded-full bg-neutral-900/90 dark:bg-neutral-100/90 text-white dark:text-neutral-900 shadow-xl hover:shadow-2xl border border-neutral-700/80 dark:border-neutral-300/80 transition-all active:scale-95 hover:scale-110 group"
          title="Unhide options (Exit focus mode to show all navigation tabs)"
          aria-label="Unhide options"
        >
          <Eye className="w-4 h-4 text-emerald-400 dark:text-emerald-600 transition-transform group-hover:scale-110" />
        </button>
      )}

      {/* Empty Database Notice Strip (shows only if 0 tables, giving option to load demo data) */}
      {!isFocusMode && schemas.length === 0 && (
        <div className="px-4 py-1.5 bg-neutral-50 dark:bg-neutral-950 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between text-xs text-neutral-500">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            <span>Database is currently empty (0 tables). You can create tables from scratch or load demo data.</span>
          </div>
          <button
            onClick={() => setIsDatasetModalOpen(true)}
            className="text-emerald-600 dark:text-emerald-400 hover:underline font-medium text-[11px] flex items-center gap-1"
          >
            <FolderDown className="w-3 h-3" />
            <span>Import Demo Dataset →</span>
          </button>
        </div>
      )}

      {/* Main Workspace */}
      <main className="flex-1 flex overflow-hidden">
        {/* Desktop Split View */}
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
          
          {/* Main IDE Workspace: Editor (Top) & Results (Bottom) */}
          <div className={`flex flex-col overflow-hidden transition-all duration-200 ${
            activeView === 'editor' || workspaceLayout === 'editor-fullscreen' || workspaceLayout === 'output-fullscreen'
              ? 'flex-1' 
              : 'hidden lg:flex lg:w-7/12 xl:w-2/3 border-r border-neutral-200 dark:border-neutral-800'
          }`}>
            {/* SQL Editor Area */}
            {workspaceLayout !== 'output-fullscreen' && (
              <div className={`transition-all duration-150 overflow-hidden flex flex-col ${
                workspaceLayout === 'editor-fullscreen' 
                  ? 'h-full flex-1' 
                  : workspaceLayout === 'output-minimized'
                    ? 'flex-1'
                    : 'h-[48%] min-h-[220px]'
              }`}>
                <SqlEditor
                  tabs={tabs}
                  activeTabId={activeTabId}
                  onSelectTab={setActiveTabId}
                  onCloseTab={handleCloseTab}
                  onAddTab={handleAddTab}
                  onUpdateQuery={handleUpdateQuery}
                  onExecute={handleExecute}
                  isRunning={isRunning}
                  onSaveQueryModal={handleOpenSaveModal}
                  onPinToAi={handlePinToAi}
                  isFullScreen={workspaceLayout === 'editor-fullscreen'}
                  onToggleFullScreen={() => {
                    setWorkspaceLayout(prev => prev === 'editor-fullscreen' ? 'split' : 'editor-fullscreen');
                  }}
                  tablesCount={schemas.length}
                  attributesCount={totalAttributesCount}
                  isSchemaOpen={activeView === 'schema'}
                  onToggleSchema={() => {
                    setActiveView(prev => prev === 'schema' ? 'editor' : 'schema');
                  }}
                  isFocusMode={isFocusMode}
                  syntaxHighlighting={syntaxHighlighting}
                  onToggleSyntaxHighlighting={handleToggleSyntaxHighlighting}
                />

                {/* Status Hint Bar when Query Writing Space is Full Screen */}
                {workspaceLayout === 'editor-fullscreen' && (
                  <div className="h-6 bg-neutral-100 dark:bg-neutral-950 border-t border-neutral-200 dark:border-neutral-800 px-3 flex items-center justify-between text-[11px] text-neutral-500 select-none shrink-0">
                    <span className="flex items-center gap-1.5 font-medium text-emerald-600 dark:text-emerald-400">
                      <Maximize2 className="w-3 h-3" />
                      <span>Query Writing Space Full Screen</span>
                      <span className="text-neutral-400 dark:text-neutral-500 text-[10px] hidden sm:inline">(Press Esc to restore)</span>
                    </span>
                    <button
                      onClick={() => setWorkspaceLayout('split')}
                      className="hover:text-neutral-900 dark:hover:text-neutral-100 flex items-center gap-1 text-[11px] font-medium text-emerald-700 dark:text-emerald-300 underline"
                      title="Exit Full Screen (Esc)"
                    >
                      <Minimize2 className="w-3 h-3" />
                      <span>Restore Split View</span>
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Split Divider Bar (visible in split mode) */}
            {workspaceLayout === 'split' && (
              <div className="h-6 bg-neutral-100 dark:bg-neutral-950 border-y border-neutral-200 dark:border-neutral-800 flex items-center justify-between px-3 text-[11px] text-neutral-500 select-none shrink-0">
                <div className="flex items-center gap-2">
                  <span className="font-semibold uppercase tracking-wider text-[10px] text-neutral-400">
                    Query Results
                  </span>
                  {results[0] && (
                    <span className="text-[10px] text-neutral-400">
                      ({results[0].error ? '1 Error' : `${results[0].rowCount} rows`})
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 text-[10px]">
                  {/* Fullscreen Editor */}
                  <button
                    onClick={() => setWorkspaceLayout('editor-fullscreen')}
                    className="hover:text-neutral-900 dark:hover:text-neutral-100 flex items-center gap-1 transition-colors"
                    title="Full Screen Query Writing Space (Hide Output)"
                  >
                    <Maximize2 className="w-3 h-3 text-neutral-500 hover:text-emerald-500" />
                    <span className="hidden sm:inline">Full Screen Editor</span>
                  </button>

                  <span className="text-neutral-300 dark:text-neutral-700">|</span>

                  {/* Minimize Output */}
                  <button
                    onClick={() => setWorkspaceLayout('output-minimized')}
                    className="hover:text-neutral-900 dark:hover:text-neutral-100 flex items-center gap-1 transition-colors"
                    title="Minimize Output to Bottom Dock"
                  >
                    <Minus className="w-3 h-3 text-neutral-500 hover:text-amber-500" />
                    <span className="hidden sm:inline">Minimize Output</span>
                  </button>

                  <span className="text-neutral-300 dark:text-neutral-700">|</span>

                  {/* Fullscreen Output */}
                  <button
                    onClick={() => setWorkspaceLayout('output-fullscreen')}
                    className="hover:text-neutral-900 dark:hover:text-neutral-100 flex items-center gap-1 transition-colors"
                    title="Full Screen Output (Hide Editor)"
                  >
                    <Maximize2 className="w-3 h-3 text-neutral-500 hover:text-emerald-500" />
                    <span className="hidden sm:inline">Full Screen Output</span>
                  </button>
                </div>
              </div>
            )}

            {/* Minimized Output Dock (visible in output-minimized mode) */}
            {workspaceLayout === 'output-minimized' && (
              <div className="h-8 bg-neutral-100 dark:bg-neutral-950 border-t border-neutral-200 dark:border-neutral-800 px-3 flex items-center justify-between text-xs select-none shadow-xs shrink-0">
                <div className="flex items-center gap-2 text-neutral-600 dark:text-neutral-400">
                  <Table className="w-3.5 h-3.5 text-neutral-500" />
                  <span className="font-semibold text-neutral-800 dark:text-neutral-200 text-[11px]">Query Output (Minimized)</span>
                  {results[0] && (
                    <span className="hidden sm:inline text-neutral-500 dark:text-neutral-400 text-[11px]">
                      · {results[0].error ? 'Execution Error' : `${results[0].rowCount} rows (${results[0].executionTimeMs}ms)`}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setWorkspaceLayout('split')}
                    className="flex items-center gap-1 px-2.5 py-0.5 rounded bg-white dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 border border-neutral-300 dark:border-neutral-700 text-neutral-800 dark:text-neutral-200 text-[11px] font-medium transition-colors shadow-2xs"
                    title="Restore Split View"
                  >
                    <ChevronUp className="w-3 h-3 text-emerald-600" />
                    <span>Restore Output</span>
                  </button>
                  <button
                    onClick={() => setWorkspaceLayout('output-fullscreen')}
                    className="flex items-center gap-1 px-2 py-0.5 rounded hover:bg-neutral-200 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-400 text-[11px] transition-colors"
                    title="Full Screen Output"
                  >
                    <Maximize2 className="w-3 h-3" />
                    <span className="hidden sm:inline">Full Screen</span>
                  </button>
                </div>
              </div>
            )}

            {/* Results Viewer Area (visible in split or output-fullscreen modes) */}
            {(workspaceLayout === 'split' || workspaceLayout === 'output-fullscreen') && (
              <div className="flex-1 overflow-hidden flex flex-col">
                <ResultsViewer
                  results={results}
                  onAskAiAboutError={handleAskAiAboutError}
                  onPinResultToAi={handlePinResultToAi}
                  isFullScreen={workspaceLayout === 'output-fullscreen'}
                  onToggleFullScreen={() => {
                    setWorkspaceLayout(prev => prev === 'output-fullscreen' ? 'split' : 'output-fullscreen');
                  }}
                  onMinimize={() => {
                    setWorkspaceLayout('output-minimized');
                  }}
                />
              </div>
            )}
          </div>

          {/* Auxiliary Side Panels: Schema / History / Saved Queries / Groq AI */}
          <div className={`overflow-hidden transition-all duration-150 ${
            activeView === 'editor' || workspaceLayout === 'editor-fullscreen' || workspaceLayout === 'output-fullscreen'
              ? 'hidden'
              : 'flex-1 lg:w-5/12 xl:w-1/3 flex flex-col'
          }`}>
            {activeView === 'schema' && (
              <SchemaExplorer
                schemas={schemas}
                onSelectQuery={(sql) => {
                  handleUpdateQuery(activeTabId, sql);
                  handleExecute(sql);
                  setActiveView('editor');
                }}
                onPinTableToAi={handlePinTableToAi}
                onRefreshSchema={refreshSchema}
                onResetDb={handleResetDb}
                onOpenPresets={() => setIsDatasetModalOpen(true)}
                onClose={() => setActiveView('editor')}
                onInsertAttribute={(colName, tableName) => {
                  const toInsert = tableName ? `"${tableName}"."${colName}"` : `"${colName}"`;
                  const cur = activeTab?.query || '';
                  handleUpdateQuery(activeTabId, cur ? `${cur} ${toInsert}` : toInsert);
                }}
              />
            )}

            {activeView === 'history' && (
              <HistoryDrawer
                history={history}
                onSelectQuery={(sql) => {
                  handleUpdateQuery(activeTabId, sql);
                  setActiveView('editor');
                }}
                onExecuteQuery={(sql) => {
                  handleUpdateQuery(activeTabId, sql);
                  handleExecute(sql);
                  setActiveView('editor');
                }}
                onClearHistory={() => {
                  historyStorage.clearHistory();
                  setHistory([]);
                }}
                onRemoveItem={(id) => {
                  historyStorage.removeItem(id);
                  setHistory(prev => prev.filter(h => h.id !== id));
                }}
                onPinToAi={handlePinToAi}
                onClose={() => setActiveView('editor')}
              />
            )}

            {activeView === 'saved' && (
              <SavedQueriesModal
                savedQueries={savedQueries}
                folders={folders}
                activeFolder={activeFolder}
                onSelectFolder={setActiveFolder}
                onCreateFolder={handleCreateFolder}
                onRenameFolder={handleRenameFolder}
                onDeleteFolder={handleDeleteFolder}
                onRenameQuery={handleRenameQuery}
                onMoveQuery={handleMoveQuery}
                onSelectQuery={(sql) => {
                  handleUpdateQuery(activeTabId, sql);
                  setActiveView('editor');
                }}
                onExecuteQuery={(sql) => {
                  handleUpdateQuery(activeTabId, sql);
                  handleExecute(sql);
                  setActiveView('editor');
                }}
                onDeleteQuery={handleDeleteSavedQuery}
                onPinToAi={handlePinToAi}
                onExport={() => {
                  const data = savedQueriesStorage.exportToJson();
                  const blob = new Blob([data], { type: 'application/json' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `saved_sql_queries_${Date.now()}.json`;
                  a.click();
                }}
                onImport={(jsonStr) => {
                  savedQueriesStorage.importFromJson(jsonStr);
                  setSavedQueries(savedQueriesStorage.getSavedQueries());
                  setFolders(savedQueriesStorage.getFolders());
                }}
                isSavingOpen={isSaveModalOpen}
                onCloseSaveModal={() => setIsSaveModalOpen(false)}
                onSaveCurrentQuery={handleSaveCurrentQuery}
                prefillSql={saveModalSql}
                onClose={() => setActiveView('editor')}
              />
            )}

            {activeView === 'ai' && (
              <AiAssistantDrawer
                onInsertToEditor={(code) => {
                  handleUpdateQuery(activeTabId, code);
                  setActiveView('editor');
                }}
                onExecuteSql={(code) => {
                  handleUpdateQuery(activeTabId, code);
                  handleExecute(code);
                  setActiveView('editor');
                }}
                onOpenPinModal={() => setIsPinModalOpen(true)}
                attachedContexts={attachedContexts}
                onRemoveContext={(id) => setAttachedContexts(prev => prev.filter(c => c.id !== id))}
                onClearContexts={() => setAttachedContexts([])}
                initialErrorToDiagnose={errorToDiagnose}
                onClearErrorToDiagnose={() => setErrorToDiagnose(null)}
                activeTabTitle={activeTab?.title || 'Query 1'}
                activeTabQuery={activeTab?.query || ''}
                onAttachActiveFile={handleAttachActiveFileToPrompt}
                onCreateNewFile={handleCreateNewFileFromAi}
                onApplyEditToWorkingFile={handleApplyEditToWorkingFile}
                onCreateFolder={handleCreateFolder}
                onRenameFolder={handleRenameFolder}
                onRenameFile={handleRenameFileFromAi}
                onClose={() => setActiveView('editor')}
              />
            )}
          </div>
        </div>
      </main>

      {/* Floating Bottom Navigation on Small Screens (hidden in focus mode) */}
      {!isFocusMode && (
        <div className="md:hidden sticky bottom-0 z-20 border-t border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 flex items-center justify-around py-2 px-1 text-[10px]">
          {[
            { id: 'editor', label: 'Editor', icon: Code2 },
            { id: 'schema', label: 'Tables', icon: Database },
            { id: 'history', label: 'History', icon: History },
            { id: 'saved', label: 'Saved', icon: Bookmark },
            { id: 'ai', label: 'Groq AI', icon: Bot }
          ].map(nav => {
            const Icon = nav.icon;
            const isActive = activeView === nav.id;
            return (
              <button
                key={nav.id}
                onClick={() => {
                  if (nav.id === 'ai') {
                    if (activeView === 'ai') {
                      setActiveView('editor');
                    } else {
                      handleAiNavClick();
                    }
                  } else {
                    if (activeView === nav.id && nav.id !== 'editor') {
                      setActiveView('editor');
                    } else {
                      setActiveView(nav.id as any);
                    }
                  }
                }}
                className={`flex flex-col items-center gap-1 py-1 px-3 rounded-lg font-medium transition-colors ${
                  isActive
                    ? 'text-emerald-600 dark:text-emerald-400 font-bold'
                    : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-200'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{nav.label}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Dataset Selection Modal */}
      <DatasetSelectorModal
        isOpen={isDatasetModalOpen}
        onClose={() => setIsDatasetModalOpen(false)}
        onSelectDataset={handleSelectDataset}
        isLoading={isRunning}
      />

      {/* File Import Modal (SQL, CSV, JSON) */}
      <ImportFileModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImportSql={handleImportSql}
        onImportCsv={handleImportCsv}
        onImportJson={handleImportJson}
      />

      {/* Save Query Modal (Standalone if opened from editor) */}
      {isSaveModalOpen && activeView !== 'saved' && (
        <SavedQueriesModal
          savedQueries={savedQueries}
          folders={folders}
          activeFolder={activeFolder}
          onCreateFolder={handleCreateFolder}
          isSavingOpen={isSaveModalOpen}
          onCloseSaveModal={() => setIsSaveModalOpen(false)}
          onSaveCurrentQuery={handleSaveCurrentQuery}
          prefillSql={saveModalSql}
        />
      )}

      {/* Context Pin Modal (Safety-Pin / Plus) */}
      <ContextPinModal
        isOpen={isPinModalOpen}
        onClose={() => setIsPinModalOpen(false)}
        onAttachContext={(ctx) => setAttachedContexts(prev => [...prev, ctx])}
        currentSql={activeTab?.query || ''}
        activeTabTitle={activeTab?.title || 'Active Tab'}
        schemas={schemas}
        lastResult={results[0]}
        savedQueries={savedQueries}
        folders={folders}
      />

      {/* First-Time Groq Setup Modal */}
      <GroqSetupModal
        isOpen={isGroqSetupModalOpen}
        onClose={() => setIsGroqSetupModalOpen(false)}
        onSuccess={() => {
          setHasGroqKey(true);
          setActiveView('ai');
        }}
      />

      {/* User Profile & API Keys Manager Modal (accessible from three dots) */}
      <ProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        onConfigUpdated={() => {
          setHasGroqKey(!!groqService.getConfig().apiKey);
        }}
        syntaxHighlighting={syntaxHighlighting}
        onToggleSyntaxHighlighting={handleToggleSyntaxHighlighting}
      />

      {/* Android WebAPK & Standalone App Installation Modal */}
      <InstallApkModal
        isOpen={isInstallModalOpen}
        onClose={() => setIsInstallModalOpen(false)}
      />
    </div>
  );
}
