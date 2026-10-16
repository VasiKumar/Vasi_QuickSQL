import React, { useState, useMemo } from 'react';
import { 
  Bookmark, 
  Search, 
  Trash2, 
  Play, 
  Pin, 
  Copy, 
  Check, 
  Plus, 
  X, 
  Download, 
  Upload, 
  Folder, 
  FolderPlus, 
  Edit2, 
  FolderInput,
  FolderOpen,
  Minimize2
} from 'lucide-react';
import { SavedQuery } from '../types';

interface SavedQueriesModalProps {
  savedQueries: SavedQuery[];
  folders?: string[];
  activeFolder?: string | null;
  onSelectFolder?: (folder: string | null) => void;
  onCreateFolder?: (name: string) => void;
  onRenameFolder?: (oldName: string, newName: string) => void;
  onDeleteFolder?: (name: string) => void;
  onRenameQuery?: (id: string, newTitle: string) => void;
  onMoveQuery?: (id: string, targetFolder: string) => void;
  onSelectQuery?: (sql: string) => void;
  onExecuteQuery?: (sql: string) => void;
  onDeleteQuery?: (id: string) => void;
  onPinToAi?: (sql: string, title: string) => void;
  onExport?: () => void;
  onImport?: (jsonStr: string) => void;
  isSavingOpen: boolean;
  onCloseSaveModal: () => void;
  onSaveCurrentQuery: (data: { title: string; description: string; tags: string[]; query: string; folder: string }, idToUpdate?: string) => void;
  prefillSql?: string;
  onClose?: () => void;
}

export const SavedQueriesModal: React.FC<SavedQueriesModalProps> = ({
  savedQueries,
  folders = ['Default', 'Analytics', 'Reports', 'Playground'],
  activeFolder = null,
  onSelectFolder = () => {},
  onCreateFolder = () => {},
  onRenameFolder = () => {},
  onDeleteFolder = () => {},
  onRenameQuery = () => {},
  onMoveQuery = () => {},
  onSelectQuery = () => {},
  onExecuteQuery = () => {},
  onDeleteQuery = () => {},
  onPinToAi = () => {},
  onExport = () => {},
  onImport = () => {},
  isSavingOpen,
  onCloseSaveModal,
  onSaveCurrentQuery,
  prefillSql = '',
  onClose
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // New folder dialog state
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [newFolderNameInput, setNewFolderNameInput] = useState('');

  // Rename query inline state
  const [editingTitleId, setEditingTitleId] = useState<string | null>(null);
  const [editTitleVal, setEditTitleVal] = useState('');

  // Moving query folder inline
  const [movingQueryId, setMovingQueryId] = useState<string | null>(null);

  // Form state for saving new query
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formTags, setFormTags] = useState('');
  const [formFolder, setFormFolder] = useState('Default');
  const [formSql, setFormSql] = useState('');
  const [customFolderInput, setCustomFolderInput] = useState('');
  const [isCustomFolder, setIsCustomFolder] = useState(false);
  const [editingId, setEditingId] = useState<string | undefined>(undefined);

  // When save modal opens, populate SQL
  React.useEffect(() => {
    if (isSavingOpen) {
      setFormSql(prefillSql);
      setFormTitle('');
      setFormDescription('');
      setFormTags('');
      setFormFolder(activeFolder || 'Default');
      setIsCustomFolder(false);
      setCustomFolderInput('');
      setEditingId(undefined);
    }
  }, [isSavingOpen, prefillSql, activeFolder]);

  const filteredQueries = useMemo(() => {
    return savedQueries.filter(q => {
      // Filter by active workspace folder
      if (activeFolder && activeFolder !== 'All') {
        const qFolder = q.folder || 'Default';
        if (qFolder !== activeFolder) return false;
      }
      if (!searchQuery.trim()) return true;
      const queryTerm = searchQuery.toLowerCase();
      return (
        q.title.toLowerCase().includes(queryTerm) ||
        (q.description && q.description.toLowerCase().includes(queryTerm)) ||
        q.query.toLowerCase().includes(queryTerm) ||
        (q.folder && q.folder.toLowerCase().includes(queryTerm))
      );
    });
  }, [savedQueries, activeFolder, searchQuery]);

  const handleCopy = async (id: string, query: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await navigator.clipboard.writeText(query);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSaveSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() || !formSql.trim()) return;

    const tagsArray = formTags
      .split(',')
      .map(t => t.trim())
      .filter(Boolean);

    const targetFolder = isCustomFolder && customFolderInput.trim()
      ? customFolderInput.trim()
      : (formFolder || 'Default');

    onSaveCurrentQuery(
      {
        title: formTitle.trim(),
        description: formDescription.trim(),
        tags: tagsArray.length > 0 ? tagsArray : ['Custom'],
        folder: targetFolder,
        query: formSql
      },
      editingId
    );

    onCloseSaveModal();
  };

  const handleCreateFolderSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderNameInput.trim()) return;
    onCreateFolder(newFolderNameInput.trim());
    onSelectFolder(newFolderNameInput.trim());
    setNewFolderNameInput('');
    setIsCreatingFolder(false);
  };

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const content = evt.target?.result;
      if (typeof content === 'string') {
        try {
          onImport(content);
        } catch (err: any) {
          console.error('Failed to import queries:', err);
        }
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-neutral-900 border-r border-neutral-200 dark:border-neutral-800">
      {/* Top Header */}
      <div className="p-3 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Bookmark className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <span className="font-semibold text-xs text-neutral-900 dark:text-neutral-100 uppercase tracking-wider">
            Queries & Workspaces
          </span>
          <span className="text-[11px] font-mono text-neutral-400 tabular-nums">
            ({savedQueries.length})
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <label className="p-1 rounded hover:bg-neutral-200 dark:hover:bg-neutral-800 text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200 cursor-pointer" title="Import queries JSON">
            <Upload className="w-3.5 h-3.5" />
            <input type="file" accept=".json" onChange={handleFileImport} className="hidden" />
          </label>

          <button
            onClick={onExport}
            className="p-1 rounded hover:bg-neutral-200 dark:hover:bg-neutral-800 text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200"
            title="Export queries to JSON"
          >
            <Download className="w-3.5 h-3.5" />
          </button>

          {onClose && (
            <button
              onClick={onClose}
              className="flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium border border-neutral-300 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-colors ml-1"
              title="Minimise saved queries panel"
            >
              <Minimize2 className="w-3 h-3 text-neutral-500" />
              <span>Minimise</span>
            </button>
          )}
        </div>
      </div>

      {/* Workspace Folders Strip */}
      <div className="p-2 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-100/60 dark:bg-neutral-950/40 space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-[11px] font-semibold text-neutral-600 dark:text-neutral-400 flex items-center gap-1">
            <FolderOpen className="w-3.5 h-3.5 text-amber-500" />
            <span>Folder Location:</span>
          </span>
          {!isCreatingFolder ? (
            <button
              onClick={() => setIsCreatingFolder(true)}
              className="flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 hover:underline font-medium"
            >
              <Plus className="w-3 h-3" />
              <span>New Folder</span>
            </button>
          ) : null}
        </div>

        {/* Create Folder Inline Input */}
        {isCreatingFolder && (
          <form onSubmit={handleCreateFolderSubmit} className="flex items-center gap-1.5 pt-1">
            <input
              type="text"
              autoFocus
              placeholder="Folder name (e.g. Finance)"
              value={newFolderNameInput}
              onChange={(e) => setNewFolderNameInput(e.target.value)}
              className="flex-1 px-2.5 py-1 text-xs bg-white dark:bg-neutral-900 border border-emerald-500 rounded-lg outline-none text-neutral-900 dark:text-neutral-100"
            />
            <button
              type="submit"
              className="px-2.5 py-1 bg-emerald-600 text-white rounded-lg text-[11px] font-medium"
            >
              Create
            </button>
            <button
              type="button"
              onClick={() => setIsCreatingFolder(false)}
              className="p-1 text-neutral-400 hover:text-neutral-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </form>
        )}

        {/* Folders horizontal pill tabs */}
        <div className="flex items-center gap-1 overflow-x-auto scrollbar-none py-0.5 text-xs">
          <button
            onClick={() => onSelectFolder(null)}
            className={`px-2.5 py-1 rounded-md text-[11px] font-medium whitespace-nowrap transition-colors ${
              activeFolder === null
                ? 'bg-neutral-800 dark:bg-neutral-200 text-white dark:text-neutral-900 font-semibold'
                : 'bg-white dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200'
            }`}
          >
            All Queries
          </button>
          {folders.map(f => {
            const isSelected = activeFolder === f;
            const count = savedQueries.filter(q => (q.folder || 'Default') === f).length;
            return (
              <button
                key={f}
                onClick={() => onSelectFolder(f)}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium whitespace-nowrap border transition-colors ${
                  isSelected
                    ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 font-semibold'
                    : 'border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-700'
                }`}
              >
                <Folder className="w-3 h-3 text-amber-500" />
                <span>{f}</span>
                <span className="text-[10px] opacity-60">({count})</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Search Bar */}
      <div className="p-2 border-b border-neutral-200 dark:border-neutral-800">
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-neutral-400" />
          <input
            type="text"
            placeholder={activeFolder ? `Search in ${activeFolder}...` : 'Search saved queries...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-neutral-100 dark:bg-neutral-800/80 border border-transparent focus:border-emerald-500 rounded text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 outline-none transition-all"
          />
        </div>
      </div>

      {/* Queries List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {filteredQueries.length === 0 ? (
          <div className="p-6 text-center text-neutral-400 space-y-1">
            <p className="text-xs">No saved query files in this folder.</p>
            {activeFolder && (
              <button
                onClick={() => onSelectFolder(null)}
                className="text-[11px] text-emerald-600 dark:text-emerald-400 hover:underline"
              >
                View All Queries
              </button>
            )}
          </div>
        ) : (
          filteredQueries.map(q => {
            const isEditingTitle = editingTitleId === q.id;
            const isMoving = movingQueryId === q.id;
            const folderName = q.folder || 'Default';

            return (
              <div
                key={q.id}
                onClick={() => onSelectQuery(q.query)}
                className="group border border-neutral-200/80 dark:border-neutral-800 rounded-lg p-2.5 bg-neutral-50/40 dark:bg-neutral-900/60 hover:bg-neutral-100/80 dark:hover:bg-neutral-800/80 cursor-pointer transition-all space-y-1.5"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    {/* Inline Title Edit or Title Display */}
                    {isEditingTitle ? (
                      <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="text"
                          value={editTitleVal}
                          onChange={(e) => setEditTitleVal(e.target.value)}
                          className="px-2 py-0.5 text-xs font-semibold bg-white dark:bg-neutral-900 border border-emerald-500 rounded outline-none w-full"
                          autoFocus
                        />
                        <button
                          onClick={() => {
                            onRenameQuery(q.id, editTitleVal);
                            setEditingTitleId(null);
                          }}
                          className="p-1 text-emerald-600 hover:bg-emerald-50 rounded"
                        >
                          <Check className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => setEditingTitleId(null)}
                          className="p-1 text-neutral-400 hover:bg-neutral-200 rounded"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5">
                        <h4 className="text-xs font-semibold text-neutral-900 dark:text-neutral-100 truncate">
                          {q.title}
                        </h4>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingTitleId(q.id);
                            setEditTitleVal(q.title);
                          }}
                          className="opacity-0 group-hover:opacity-100 p-0.5 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 transition-opacity"
                          title="Rename query file"
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                      </div>
                    )}

                    {/* Folder Badge & Description */}
                    <div className="flex items-center gap-2 mt-0.5 text-[11px] text-neutral-500">
                      <span className="flex items-center gap-1 font-mono text-[10px] text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-1.5 py-0.2 rounded border border-amber-200/50 dark:border-amber-900/40">
                        <Folder className="w-2.5 h-2.5" />
                        <span>{folderName}</span>
                      </span>
                      {q.description && (
                        <span className="truncate">{q.description}</span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onExecuteQuery(q.query);
                      }}
                      className="p-1 rounded hover:bg-emerald-100 dark:hover:bg-emerald-950 text-neutral-500 hover:text-emerald-600"
                      title="Execute immediately"
                    >
                      <Play className="w-3 h-3 fill-current" />
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setMovingQueryId(isMoving ? null : q.id);
                      }}
                      className="p-1 rounded hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-500"
                      title="Move to another folder location"
                    >
                      <FolderInput className="w-3 h-3" />
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onPinToAi(q.query, q.title);
                      }}
                      className="p-1 rounded hover:bg-amber-100 dark:hover:bg-amber-950 text-neutral-500 hover:text-amber-600"
                      title="Pin to Groq AI as context"
                    >
                      <Pin className="w-3 h-3" />
                    </button>

                    <button
                      onClick={(e) => handleCopy(q.id, q.query, e)}
                      className="p-1 rounded hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-500"
                      title="Copy query SQL"
                    >
                      {copiedId === q.id ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteQuery(q.id);
                      }}
                      className="p-1 rounded hover:bg-red-100 dark:hover:bg-red-950 text-neutral-400 hover:text-red-600"
                      title="Delete query file"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                {/* Move to folder quick selector */}
                {isMoving && (
                  <div 
                    onClick={(e) => e.stopPropagation()} 
                    className="p-2 rounded bg-amber-50/50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 flex items-center justify-between gap-2 text-xs"
                  >
                    <span className="font-medium text-amber-800 dark:text-amber-300">Move to folder:</span>
                    <select
                      value={folderName}
                      onChange={(e) => {
                        onMoveQuery(q.id, e.target.value);
                        setMovingQueryId(null);
                      }}
                      className="px-2 py-0.5 bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded text-xs outline-none"
                    >
                      {folders.map(f => (
                        <option key={f} value={f}>{f}</option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Tags line */}
                {q.tags && q.tags.length > 0 && (
                  <div className="flex items-center gap-1.5 text-[10px] text-neutral-400">
                    {q.tags.map(t => (
                      <span key={t} className="font-mono">
                        #{t}
                      </span>
                    ))}
                  </div>
                )}

                {/* Code preview snippet */}
                <pre className="font-mono text-[11px] text-neutral-700 dark:text-neutral-300 line-clamp-2 whitespace-pre-wrap break-all bg-white dark:bg-neutral-950 p-1.5 rounded border border-neutral-200/60 dark:border-neutral-800">
                  {q.query}
                </pre>
              </div>
            );
          })
        )}
      </div>

      {/* Save Query Modal Dialog with Custom Folder Selector */}
      {isSavingOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
          <div className="w-full max-w-md bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
              <h3 className="font-bold text-sm text-neutral-900 dark:text-neutral-100">
                {editingId ? 'Edit Query File' : 'Save Query to Workspace'}
              </h3>
              <button onClick={onCloseSaveModal} className="p-1 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveSubmit} className="p-4 space-y-3 text-xs">
              <div>
                <label className="block font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                  Query File Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Monthly Revenue Breakdown"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full px-3 py-1.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-neutral-100 outline-none focus:border-emerald-500"
                />
              </div>

              {/* Folder Location Selector */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-medium text-neutral-700 dark:text-neutral-300 flex items-center gap-1">
                    <Folder className="w-3.5 h-3.5 text-amber-500" />
                    <span>Folder Location</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsCustomFolder(!isCustomFolder)}
                    className="text-[11px] text-emerald-600 dark:text-emerald-400 hover:underline"
                  >
                    {isCustomFolder ? 'Select from list' : '+ Custom Folder'}
                  </button>
                </div>

                {isCustomFolder ? (
                  <input
                    type="text"
                    required
                    placeholder="Type new folder name (e.g. Migrations)"
                    value={customFolderInput}
                    onChange={(e) => setCustomFolderInput(e.target.value)}
                    className="w-full px-3 py-1.5 bg-neutral-50 dark:bg-neutral-800 border border-emerald-500 rounded-lg text-neutral-900 dark:text-neutral-100 outline-none"
                  />
                ) : (
                  <select
                    value={formFolder}
                    onChange={(e) => setFormFolder(e.target.value)}
                    className="w-full px-3 py-1.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-neutral-100 outline-none focus:border-emerald-500"
                  >
                    {folders.map(f => (
                      <option key={f} value={f}>{f}</option>
                    ))}
                  </select>
                )}
              </div>

              <div>
                <label className="block font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                  Description
                </label>
                <input
                  type="text"
                  placeholder="Brief note on what this query computes"
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full px-3 py-1.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-neutral-100 outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                  Tags (comma separated)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Analytics, Postgres, Sales"
                  value={formTags}
                  onChange={(e) => setFormTags(e.target.value)}
                  className="w-full px-3 py-1.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-neutral-100 outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                  SQL Query *
                </label>
                <textarea
                  required
                  rows={4}
                  value={formSql}
                  onChange={(e) => setFormSql(e.target.value)}
                  className="w-full p-2 font-mono text-[11px] bg-neutral-50 dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-neutral-100 outline-none focus:border-emerald-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={onCloseSaveModal}
                  className="px-3 py-1.5 border border-neutral-300 dark:border-neutral-700 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium shadow-xs"
                >
                  Save to Folder
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
