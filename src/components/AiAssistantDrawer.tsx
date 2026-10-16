import React, { useState, useRef, useEffect } from 'react';
import { 
  Bot, 
  Send, 
  Pin, 
  Plus, 
  Key, 
  X, 
  Sparkles, 
  Code2, 
  Play, 
  Copy, 
  Check, 
  ExternalLink, 
  Settings2, 
  AlertCircle,
  FilePlus,
  FolderPlus,
  Edit3,
  FileText,
  Folder,
  ArrowRight,
  CheckCheck,
  Minimize2
} from 'lucide-react';
import { AttachedContext, ChatMessage, GroqConfig } from '../types';
import { DEFAULT_GROQ_MODELS, groqService } from '../services/groqService';

interface AiAssistantDrawerProps {
  onInsertToEditor: (sql: string) => void;
  onExecuteSql: (sql: string) => void;
  onOpenPinModal: () => void;
  attachedContexts: AttachedContext[];
  onRemoveContext: (id: string) => void;
  onClearContexts: () => void;
  initialErrorToDiagnose?: { error: string; sql: string } | null;
  onClearErrorToDiagnose?: () => void;

  // Workspace file & folder actions
  activeTabTitle?: string;
  activeTabQuery?: string;
  onAttachActiveFile?: () => void;
  onCreateNewFile?: (name: string, content: string, folder?: string) => void;
  onApplyEditToWorkingFile?: (content: string, fileName?: string) => void;
  onCreateFolder?: (folderName: string) => void;
  onRenameFolder?: (oldName: string, newName: string) => void;
  onRenameFile?: (oldName: string, newName: string) => void;
  onClose?: () => void;
}

export const AiAssistantDrawer: React.FC<AiAssistantDrawerProps> = ({
  onInsertToEditor,
  onExecuteSql,
  onOpenPinModal,
  attachedContexts,
  onRemoveContext,
  onClearContexts,
  initialErrorToDiagnose,
  onClearErrorToDiagnose,
  activeTabTitle = 'Query 1',
  activeTabQuery = '',
  onAttachActiveFile,
  onCreateNewFile,
  onApplyEditToWorkingFile,
  onCreateFolder,
  onRenameFolder,
  onRenameFile,
  onClose
}) => {
  const [config, setConfig] = useState<GroqConfig>(() => groqService.getConfig());
  const [isConfigOpen, setIsConfigOpen] = useState<boolean>(!config.apiKey);
  const [apiKeyInput, setApiKeyInput] = useState<string>(config.apiKey);
  const [selectedModel, setSelectedModel] = useState<string>(config.model || 'llama-3.3-70b-versatile');
  const [isTestingKey, setIsTestingKey] = useState<boolean>(false);
  const [testResult, setTestResult] = useState<{ success?: boolean; message?: string } | null>(null);

  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    {
      id: 'welcome',
      role: 'assistant',
      content: `Hello! I am your embedded **Groq AI SQL & Workspace Assistant**.\n\nI can:\n- Propose edits, changes, and fixes to your current working file\n- Create new query files and subfolders in your workspace\n- Rename files or subfolders on demand\n- Optimize and explain PostgreSQL queries\n\nClick the **Safety-Pin / Plus (+)** icon below anytime to attach your active query, database schema, or execution results as context!`,
      timestamp: Date.now()
    }
  ]);

  const [inputPrompt, setInputPrompt] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [copiedCodeId, setCopiedCodeId] = useState<string | null>(null);
  const [actionStatuses, setActionStatuses] = useState<Record<string, string>>({});

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // If prompted to diagnose an error from ResultsViewer
  useEffect(() => {
    if (initialErrorToDiagnose && config.apiKey) {
      const diagnoseMsg = `I encountered an SQL error:\n\`\`\`\n${initialErrorToDiagnose.error}\n\`\`\`\nStatement:\n\`\`\`sql\n${initialErrorToDiagnose.sql}\n\`\`\`\nPlease explain what caused this error and suggest the corrected SQL query.`;
      handleSendMessage(diagnoseMsg);
      onClearErrorToDiagnose?.();
    }
  }, [initialErrorToDiagnose, config.apiKey]);

  const handleSaveConfig = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!apiKeyInput.trim()) {
      setTestResult({ success: false, message: 'Please enter your Groq API key.' });
      return;
    }

    setIsTestingKey(true);
    setTestResult(null);

    const test = await groqService.testApiKey(apiKeyInput.trim());
    setIsTestingKey(false);

    if (test.success) {
      groqService.addApiKey('Groq Key', apiKeyInput.trim(), true);
      const updatedConfig = groqService.getConfig();
      updatedConfig.model = selectedModel;
      groqService.saveConfig(updatedConfig);
      setConfig(updatedConfig);
      setTestResult({ success: true, message: 'API key verified successfully!' });
      setTimeout(() => {
        setIsConfigOpen(false);
        setTestResult(null);
      }, 1000);
    } else {
      setTestResult({ success: false, message: test.error || 'Failed to authenticate key.' });
    }
  };

  const handleClearApiKey = () => {
    groqService.clearConfig();
    setConfig(groqService.getConfig());
    setApiKeyInput('');
    setIsConfigOpen(true);
    setTestResult(null);
  };

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputPrompt).trim();
    if (!text && attachedContexts.length === 0) return;

    if (!config.apiKey) {
      setIsConfigOpen(true);
      return;
    }

    const userMessage: ChatMessage = {
      id: 'user_' + Date.now(),
      role: 'user',
      content: text || 'Please review the attached context.',
      timestamp: Date.now(),
      attachedContexts: [...attachedContexts]
    };

    const newHistory = [...messages, userMessage];
    setMessages(newHistory);
    setInputPrompt('');
    onClearContexts();
    setIsLoading(true);

    try {
      const reply = await groqService.sendChatMessage(newHistory, userMessage.attachedContexts, config);
      setMessages(prev => [
        ...prev,
        {
          id: 'asst_' + Date.now(),
          role: 'assistant',
          content: reply,
          timestamp: Date.now()
        }
      ]);
    } catch (err: any) {
      setMessages(prev => [
        ...prev,
        {
          id: 'asst_err_' + Date.now(),
          role: 'assistant',
          content: `⚠️ **Error calling Groq API:** ${err?.message || 'Unknown network error'}\n\nPlease check your API key in Settings.`,
          timestamp: Date.now()
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleCopyCode = async (id: string, code: string) => {
    await navigator.clipboard.writeText(code);
    setCopiedCodeId(id);
    setTimeout(() => setCopiedCodeId(null), 2000);
  };

  const setStatusTemporarily = (id: string, status: string) => {
    setActionStatuses(prev => ({ ...prev, [id]: status }));
  };

  // Check if active file is pinned
  const isWorkingFilePinned = attachedContexts.some(
    c => c.type === 'working_file' || c.title.toLowerCase().includes(activeTabTitle.toLowerCase())
  );

  // Parse Action Blocks and Code Blocks in message content
  const renderMessageContent = (content: string, messageId: string) => {
    // Regex matches [ACTION:...]...[/ACTION:...] or √...√ or ```...```
    const regex = /(\[ACTION:[A-Z_]+\][\s\S]*?\[\/ACTION:[A-Z_]+\]|√[\s\S]*?√|```[\s\S]*?```)/g;
    const parts = content.split(regex);

    return parts.map((part, index) => {
      const blockId = `${messageId}_blk_${index}`;
      const status = actionStatuses[blockId];

      // 1. Check for Action Blocks
      if (part.startsWith('[ACTION:') && part.includes('[/ACTION:')) {
        const actionTypeMatch = part.match(/\[ACTION:([A-Z_]+)\]/);
        const actionType = actionTypeMatch ? actionTypeMatch[1] : '';
        const innerContent = part
          .replace(/\[ACTION:[A-Z_]+\]/, '')
          .replace(/\[\/ACTION:[A-Z_]+\]/, '')
          .trim();

        // 1a. EDIT_FILE Action
        if (actionType === 'EDIT_FILE') {
          const fileMatch = innerContent.match(/file:\s*([^\n]+)/i);
          const descMatch = innerContent.match(/description:\s*([^\n]+)/i);
          const contentMatch = innerContent.match(/content:\s*([\s\S]*)$/i);

          const targetFile = fileMatch ? fileMatch[1].trim() : activeTabTitle;
          const desc = descMatch ? descMatch[1].trim() : '';
          const code = contentMatch ? contentMatch[1].trim() : innerContent;

          return (
            <div key={index} className="my-3 rounded-xl border border-amber-500/40 bg-neutral-900 text-neutral-100 overflow-hidden text-xs shadow-md">
              <div className="flex items-center justify-between px-3 py-2 bg-amber-950/40 border-b border-amber-500/20 text-[11px]">
                <div className="flex items-center gap-1.5 font-medium text-amber-300">
                  <Edit3 className="w-3.5 h-3.5 text-amber-400" />
                  <span>Proposed Edits for Working File: <strong>{targetFile}</strong></span>
                </div>
                {status && (
                  <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-semibold flex items-center gap-1">
                    <CheckCheck className="w-3 h-3" />
                    {status}
                  </span>
                )}
              </div>

              {desc && (
                <div className="px-3 pt-2 pb-1 text-neutral-300 text-[11px] italic">
                  {desc}
                </div>
              )}

              <pre className="p-3 font-mono text-[11px] overflow-x-auto text-amber-200 bg-black/40 whitespace-pre">
                {code}
              </pre>

              {/* Action Buttons for user decision */}
              <div className="p-2 bg-neutral-950 border-t border-neutral-800 flex flex-wrap items-center justify-between gap-1.5">
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => {
                      onApplyEditToWorkingFile?.(code, targetFile);
                      setStatusTemporarily(blockId, `Applied to ${targetFile}!`);
                    }}
                    className="flex items-center gap-1 px-2.5 py-1 rounded bg-amber-500 hover:bg-amber-600 text-white font-medium text-[11px] shadow-xs transition-colors"
                    title="Replace working file query with this updated content"
                  >
                    <Edit3 className="w-3 h-3" />
                    <span>Apply Edits to Working File</span>
                  </button>

                  <button
                    onClick={() => {
                      onCreateNewFile?.(targetFile + ' (Edited)', code);
                      setStatusTemporarily(blockId, 'Created as New File!');
                    }}
                    className="flex items-center gap-1 px-2 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-[11px] transition-colors"
                    title="Keep existing query and create a separate new file instead"
                  >
                    <FilePlus className="w-3 h-3 text-neutral-400" />
                    <span>Generate New File Instead</span>
                  </button>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => onExecuteSql(code)}
                    className="flex items-center gap-1 px-2 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-emerald-400 text-[11px] transition-colors"
                    title="Test run query in database"
                  >
                    <Play className="w-3 h-3 fill-current" />
                    <span>Run</span>
                  </button>

                  <button
                    onClick={() => handleCopyCode(blockId, code)}
                    className="p-1 rounded hover:bg-neutral-800 text-neutral-400 hover:text-neutral-200"
                    title="Copy code"
                  >
                    {copiedCodeId === blockId ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            </div>
          );
        }

        // 1b. CREATE_FILE Action
        if (actionType === 'CREATE_FILE') {
          const nameMatch = innerContent.match(/name:\s*([^\n]+)/i);
          const folderMatch = innerContent.match(/folder:\s*([^\n]+)/i);
          const descMatch = innerContent.match(/description:\s*([^\n]+)/i);
          const contentMatch = innerContent.match(/content:\s*([\s\S]*)$/i);

          const fileName = nameMatch ? nameMatch[1].trim() : 'new_query.sql';
          const folderName = folderMatch ? folderMatch[1].trim() : '';
          const desc = descMatch ? descMatch[1].trim() : '';
          const code = contentMatch ? contentMatch[1].trim() : innerContent;

          return (
            <div key={index} className="my-3 rounded-xl border border-blue-500/40 bg-neutral-900 text-neutral-100 overflow-hidden text-xs shadow-md">
              <div className="flex items-center justify-between px-3 py-2 bg-blue-950/40 border-b border-blue-500/20 text-[11px]">
                <div className="flex items-center gap-1.5 font-medium text-blue-300">
                  <FilePlus className="w-3.5 h-3.5 text-blue-400" />
                  <span>Proposed New File: <strong>{fileName}</strong></span>
                  {folderName && (
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-blue-900/60 text-blue-200 font-mono">
                      📁 {folderName}
                    </span>
                  )}
                </div>
                {status && (
                  <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-semibold flex items-center gap-1">
                    <CheckCheck className="w-3 h-3" />
                    {status}
                  </span>
                )}
              </div>

              {desc && (
                <div className="px-3 pt-2 pb-1 text-neutral-300 text-[11px] italic">
                  {desc}
                </div>
              )}

              <pre className="p-3 font-mono text-[11px] overflow-x-auto text-blue-200 bg-black/40 whitespace-pre">
                {code}
              </pre>

              <div className="p-2 bg-neutral-950 border-t border-neutral-800 flex items-center justify-between gap-1.5">
                <button
                  onClick={() => {
                    onCreateNewFile?.(fileName, code, folderName);
                    setStatusTemporarily(blockId, `Created ${fileName}!`);
                  }}
                  className="flex items-center gap-1 px-2.5 py-1 rounded bg-blue-600 hover:bg-blue-500 text-white font-medium text-[11px] shadow-xs transition-colors"
                  title="Create this query file in workspace and open in editor"
                >
                  <FilePlus className="w-3 h-3" />
                  <span>Create & Open File</span>
                </button>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => onExecuteSql(code)}
                    className="flex items-center gap-1 px-2 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-emerald-400 text-[11px] transition-colors"
                    title="Test run query in database"
                  >
                    <Play className="w-3 h-3 fill-current" />
                    <span>Run</span>
                  </button>

                  <button
                    onClick={() => handleCopyCode(blockId, code)}
                    className="p-1 rounded hover:bg-neutral-800 text-neutral-400 hover:text-neutral-200"
                    title="Copy code"
                  >
                    {copiedCodeId === blockId ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            </div>
          );
        }

        // 1c. CREATE_FOLDER Action
        if (actionType === 'CREATE_FOLDER') {
          const nameMatch = innerContent.match(/name:\s*([^\n]+)/i);
          const folderName = nameMatch ? nameMatch[1].trim() : innerContent.trim();

          return (
            <div key={index} className="my-2.5 p-3 rounded-xl border border-purple-500/40 bg-purple-950/20 dark:bg-purple-950/30 flex items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2">
                <FolderPlus className="w-4 h-4 text-purple-400 shrink-0" />
                <div>
                  <div className="font-semibold text-neutral-800 dark:text-neutral-200">
                    Create Subfolder: <span className="font-mono text-purple-600 dark:text-purple-400">{folderName}</span>
                  </div>
                  <div className="text-[11px] text-neutral-500">
                    Workspace directory for grouping queries
                  </div>
                </div>
              </div>

              <button
                onClick={() => {
                  onCreateFolder?.(folderName);
                  setStatusTemporarily(blockId, 'Folder Created!');
                }}
                className="flex items-center gap-1 px-2.5 py-1 rounded bg-purple-600 hover:bg-purple-500 text-white font-medium text-[11px] transition-colors shadow-xs"
              >
                {status ? (
                  <>
                    <Check className="w-3 h-3" />
                    <span>{status}</span>
                  </>
                ) : (
                  <>
                    <FolderPlus className="w-3 h-3" />
                    <span>Create Folder</span>
                  </>
                )}
              </button>
            </div>
          );
        }

        // 1d. RENAME_FILE Action
        if (actionType === 'RENAME_FILE') {
          const oldMatch = innerContent.match(/oldName:\s*([^\n]+)/i);
          const newMatch = innerContent.match(/newName:\s*([^\n]+)/i);
          const oldName = oldMatch ? oldMatch[1].trim() : '';
          const newName = newMatch ? newMatch[1].trim() : '';

          return (
            <div key={index} className="my-2.5 p-3 rounded-xl border border-indigo-500/40 bg-indigo-950/20 dark:bg-indigo-950/30 flex items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-indigo-400 shrink-0" />
                <div>
                  <div className="font-semibold text-neutral-800 dark:text-neutral-200 flex items-center gap-1.5 font-mono">
                    <span>{oldName}</span>
                    <ArrowRight className="w-3 h-3 text-neutral-400" />
                    <span className="text-indigo-600 dark:text-indigo-400 font-bold">{newName}</span>
                  </div>
                  <div className="text-[11px] text-neutral-500">Rename query file</div>
                </div>
              </div>

              <button
                onClick={() => {
                  onRenameFile?.(oldName, newName);
                  setStatusTemporarily(blockId, 'Renamed!');
                }}
                className="flex items-center gap-1 px-2.5 py-1 rounded bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-[11px] transition-colors shadow-xs"
              >
                {status ? (
                  <>
                    <Check className="w-3 h-3" />
                    <span>{status}</span>
                  </>
                ) : (
                  <>
                    <Edit3 className="w-3 h-3" />
                    <span>Rename File</span>
                  </>
                )}
              </button>
            </div>
          );
        }

        // 1e. RENAME_FOLDER Action
        if (actionType === 'RENAME_FOLDER') {
          const oldMatch = innerContent.match(/oldName:\s*([^\n]+)/i);
          const newMatch = innerContent.match(/newName:\s*([^\n]+)/i);
          const oldName = oldMatch ? oldMatch[1].trim() : '';
          const newName = newMatch ? newMatch[1].trim() : '';

          return (
            <div key={index} className="my-2.5 p-3 rounded-xl border border-indigo-500/40 bg-indigo-950/20 dark:bg-indigo-950/30 flex items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2">
                <Folder className="w-4 h-4 text-indigo-400 shrink-0" />
                <div>
                  <div className="font-semibold text-neutral-800 dark:text-neutral-200 flex items-center gap-1.5 font-mono">
                    <span>{oldName}</span>
                    <ArrowRight className="w-3 h-3 text-neutral-400" />
                    <span className="text-indigo-600 dark:text-indigo-400 font-bold">{newName}</span>
                  </div>
                  <div className="text-[11px] text-neutral-500">Rename workspace folder</div>
                </div>
              </div>

              <button
                onClick={() => {
                  onRenameFolder?.(oldName, newName);
                  setStatusTemporarily(blockId, 'Renamed!');
                }}
                className="flex items-center gap-1 px-2.5 py-1 rounded bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-[11px] transition-colors shadow-xs"
              >
                {status ? (
                  <>
                    <Check className="w-3 h-3" />
                    <span>{status}</span>
                  </>
                ) : (
                  <>
                    <Edit3 className="w-3 h-3" />
                    <span>Rename Folder</span>
                  </>
                )}
              </button>
            </div>
          );
        }
      }

      // 2. Standard SQL Query Blocks (supports √ query √ and ```sql ... ```)
      const isCheckmarkBlock = part.startsWith('√') && part.endsWith('√') && part.length > 2;
      const isCodeBlock = part.startsWith('```');

      if (isCheckmarkBlock || isCodeBlock) {
        let code = '';
        let lang = 'sql';

        if (isCheckmarkBlock) {
          code = part.slice(1, -1).trim();
        } else {
          const lines = part.slice(3, -3).trim().split('\n');
          lang = lines[0].trim().toLowerCase() || 'sql';
          code = (lang === 'sql' || lang === 'postgresql' ? lines.slice(1) : lines).join('\n');
        }

        return (
          <div key={index} className="my-2.5 rounded-xl border border-emerald-500/30 dark:border-emerald-500/40 bg-neutral-900 text-neutral-100 overflow-hidden text-xs shadow-sm">
            {/* Code Block Header (Colab Style) */}
            <div className="flex items-center justify-between px-3 py-1.5 bg-neutral-950 border-b border-neutral-800 text-[11px]">
              <div className="flex items-center gap-1.5 font-mono text-emerald-400 font-semibold">
                <Code2 className="w-3.5 h-3.5" />
                <span>SQL Query</span>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => handleCopyCode(blockId, code)}
                  className="p-1 rounded hover:bg-neutral-800 text-neutral-400 hover:text-neutral-200 transition-colors"
                  title="Copy code"
                >
                  {copiedCodeId === blockId ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>

                {/* Primary 'Click to Use' Button (Colab style) */}
                <button
                  onClick={() => {
                    onInsertToEditor(code);
                    setStatusTemporarily(blockId, 'Inserted to Editor!');
                  }}
                  className="flex items-center gap-1 px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-medium transition-all shadow-xs"
                  title="Click to use in active editor tab"
                >
                  {status === 'Inserted to Editor!' ? (
                    <>
                      <Check className="w-3 h-3 text-white" />
                      <span>Added!</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3 h-3" />
                      <span>Click to Use</span>
                    </>
                  )}
                </button>

                {/* Generate New File Option */}
                <button
                  onClick={() => {
                    onCreateNewFile?.('Query ' + (Date.now() % 1000), code);
                    setStatusTemporarily(blockId, 'Created as New File!');
                  }}
                  className="flex items-center gap-1 px-2 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-300 transition-colors"
                  title="Generate a new file from this query in workspace"
                >
                  <FilePlus className="w-3 h-3 text-neutral-400" />
                  <span>New File</span>
                </button>

                {/* Run directly */}
                <button
                  onClick={() => onExecuteSql(code)}
                  className="flex items-center gap-1 px-2 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-emerald-400 transition-colors"
                  title="Run directly in database"
                >
                  <Play className="w-3 h-3 fill-current" />
                  <span>Run</span>
                </button>
              </div>
            </div>
            {/* Code Body */}
            <pre className="p-3 font-mono text-[11px] overflow-x-auto text-emerald-300 whitespace-pre">
              {code}
            </pre>
          </div>
        );
      }

      // Render regular text with bold and formatting
      return (
        <div key={index} className="whitespace-pre-wrap leading-relaxed text-xs">
          {part}
        </div>
      );
    });
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-neutral-900 border-l border-neutral-200 dark:border-neutral-800">
      {/* Top Header */}
      <div className="p-3 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-amber-500 text-white flex items-center justify-center">
            <Bot className="w-3.5 h-3.5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-xs text-neutral-900 dark:text-neutral-100">
                Groq AI Assistant
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-400">
                BYOK
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setIsConfigOpen(!isConfigOpen)}
            className={`p-1.5 rounded-lg border transition-colors ${
              isConfigOpen
                ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/40 text-amber-600'
                : 'border-neutral-200 dark:border-neutral-800 text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
            }`}
            title="Configure Groq API Key and Model"
          >
            <Settings2 className="w-3.5 h-3.5" />
          </button>

          {onClose && (
            <button
              onClick={onClose}
              className="flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium border border-neutral-300 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-colors ml-0.5"
              title="Minimise AI assistant panel"
            >
              <Minimize2 className="w-3 h-3 text-neutral-500" />
              <span>Minimise</span>
            </button>
          )}
        </div>
      </div>

      {/* Groq API Config Banner / Panel */}
      {isConfigOpen && (
        <div className="p-3.5 bg-amber-50/50 dark:bg-amber-950/20 border-b border-amber-200/60 dark:border-amber-900/40 space-y-3 text-xs animate-in fade-in duration-150">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h4 className="font-semibold text-neutral-900 dark:text-neutral-100 flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-amber-500" />
                <span>Bring Your Own Groq API Key</span>
              </h4>
              <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">
                Keys and chats stay 100% inside your browser. No server storage.
              </p>
            </div>
            {config.apiKey && (
              <button onClick={() => setIsConfigOpen(false)} className="text-neutral-400 hover:text-neutral-600">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <form onSubmit={handleSaveConfig} className="space-y-2.5">
            <div>
              <label className="block text-[11px] font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                Groq API Key (gsk_...)
              </label>
              <div className="relative">
                <input
                  type="password"
                  placeholder="gsk_..."
                  value={apiKeyInput}
                  onChange={(e) => setApiKeyInput(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-neutral-100 outline-none focus:border-amber-500 font-mono text-xs"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                Groq Model
              </label>
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-neutral-100 outline-none focus:border-amber-500 text-xs"
              >
                {DEFAULT_GROQ_MODELS.map(m => (
                  <option key={m.id} value={m.id}>
                    {m.name} — {m.desc}
                  </option>
                ))}
              </select>
            </div>

            {testResult && (
              <div className={`p-2 rounded-lg text-[11px] flex items-center gap-1.5 ${
                testResult.success
                  ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300'
                  : 'bg-red-100 dark:bg-red-950/60 text-red-800 dark:text-red-300'
              }`}>
                {testResult.success ? <Check className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
                <span>{testResult.message}</span>
              </div>
            )}

            <div className="flex items-center justify-between pt-1">
              <a
                href="https://console.groq.com/keys"
                target="_blank"
                rel="noreferrer"
                className="text-[11px] text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1"
              >
                <span>Get free API Key</span>
                <ExternalLink className="w-2.5 h-2.5" />
              </a>

              <div className="flex items-center gap-1.5">
                {config.apiKey && (
                  <button
                    type="button"
                    onClick={handleClearApiKey}
                    className="px-2.5 py-1 border border-neutral-300 dark:border-neutral-700 rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 text-[11px]"
                  >
                    Clear Key
                  </button>
                )}
                <button
                  type="submit"
                  disabled={isTestingKey}
                  className="px-3 py-1 bg-amber-500 hover:bg-amber-600 disabled:bg-neutral-400 text-white rounded-lg font-medium text-[11px] shadow-xs"
                >
                  {isTestingKey ? 'Verifying...' : 'Save & Connect'}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* Messages Thread */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-4">
        {messages.map(m => {
          const isUser = m.role === 'user';
          return (
            <div
              key={m.id}
              className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
            >
              {/* Attached Context Chips in User message */}
              {m.attachedContexts && m.attachedContexts.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-1 max-w-[85%]">
                  {m.attachedContexts.map(ctx => (
                    <span
                      key={ctx.id}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-950/70 border border-amber-300 dark:border-amber-800 text-amber-800 dark:text-amber-300 text-[10px] font-mono"
                    >
                      <Pin className="w-2.5 h-2.5" />
                      <span>{ctx.title}</span>
                    </span>
                  ))}
                </div>
              )}

              {/* Message Bubble */}
              <div
                className={`max-w-[88%] sm:max-w-[85%] rounded-2xl px-3.5 py-2.5 shadow-2xs ${
                  isUser
                    ? 'bg-neutral-900 dark:bg-neutral-800 text-white rounded-tr-xs'
                    : 'bg-neutral-100 dark:bg-neutral-850 text-neutral-800 dark:text-neutral-200 border border-neutral-200/80 dark:border-neutral-800 rounded-tl-xs'
                }`}
              >
                {renderMessageContent(m.content, m.id)}
              </div>
            </div>
          );
        })}

        {isLoading && (
          <div className="flex items-center gap-2 text-neutral-400 text-xs py-2">
            <Bot className="w-4 h-4 animate-bounce text-amber-500" />
            <span>Groq AI is thinking...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick Prompts Strip */}
      <div className="px-3 py-1.5 bg-neutral-50 dark:bg-neutral-950 border-t border-neutral-200 dark:border-neutral-800 flex items-center gap-1.5 overflow-x-auto scrollbar-none text-[11px]">
        {[
          'Suggest edits to my working file',
          'Create a new analytics query file',
          'Optimize current query for Postgres',
          'Create reports subfolder',
          'Explain query logic'
        ].map(qp => (
          <button
            key={qp}
            onClick={() => handleSendMessage(qp)}
            className="px-2 py-0.5 rounded-full border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 hover:border-amber-500 hover:text-amber-600 whitespace-nowrap shrink-0 transition-colors"
          >
            {qp}
          </button>
        ))}
      </div>

      {/* Input Box with Safety-Pin / Plus (+) Icon */}
      <div className="p-3 bg-white dark:bg-neutral-900 border-t border-neutral-200 dark:border-neutral-800 space-y-2">
        {/* Attached Contexts Tray */}
        {attachedContexts.length > 0 && (
          <div className="flex items-center gap-1.5 flex-wrap p-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-xs">
            <span className="text-[11px] font-medium text-amber-700 dark:text-amber-400 flex items-center gap-1">
              <Pin className="w-3 h-3" />
              <span>Prompt Context:</span>
            </span>
            {attachedContexts.map(ctx => (
              <span
                key={ctx.id}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-white dark:bg-neutral-900 border border-amber-300 dark:border-amber-800 text-[10px] text-neutral-800 dark:text-neutral-200"
              >
                <span>{ctx.title}</span>
                <button
                  onClick={() => onRemoveContext(ctx.id)}
                  className="hover:text-red-500 p-0.5"
                  title="Remove context"
                >
                  <X className="w-2.5 h-2.5" />
                </button>
              </span>
            ))}
            <button
              onClick={onClearContexts}
              className="text-[10px] text-neutral-400 hover:text-neutral-600 ml-auto"
            >
              Clear
            </button>
          </div>
        )}

        {/* Quick Pin Working File Pill if not yet attached */}
        {!isWorkingFilePinned && activeTabTitle && (
          <div className="flex items-center justify-between text-[11px] px-1">
            <span className="text-neutral-500 dark:text-neutral-400">
              Working file: <strong className="text-neutral-700 dark:text-neutral-200">{activeTabTitle}</strong>
            </span>
            <button
              type="button"
              onClick={onAttachActiveFile}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-800 text-amber-700 dark:text-amber-300 hover:bg-amber-100 transition-colors text-[10px] font-medium"
              title="Pin this working file so AI can suggest edits and changes"
            >
              <Pin className="w-2.5 h-2.5" />
              <span>Pin to Prompt for Edits</span>
            </button>
          </div>
        )}

        {/* Input Bar */}
        <div className="flex items-end gap-1.5">
          {/* Prominent Safety-Pin / Plus (+) Context Attachment Button */}
          <button
            onClick={onOpenPinModal}
            className="p-2 rounded-lg border border-amber-300 dark:border-amber-800/80 bg-amber-50 dark:bg-amber-950/50 hover:bg-amber-100 dark:hover:bg-amber-900/60 text-amber-700 dark:text-amber-400 transition-colors shrink-0 flex items-center gap-0.5 shadow-2xs"
            title="Attach working file, tables, schema, or query results as text context"
          >
            <Pin className="w-3.5 h-3.5" />
            <Plus className="w-3 h-3 -ml-1" />
          </button>

          {/* Textarea */}
          <textarea
            value={inputPrompt}
            onChange={(e) => setInputPrompt(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              config.apiKey
                ? 'Ask AI to edit working file, create files/folders, optimize SQL... (Enter to send)'
                : 'Click Settings above to add your Groq API key...'
            }
            rows={1}
            className="flex-1 max-h-32 min-h-[38px] p-2 bg-neutral-100 dark:bg-neutral-800 border border-transparent focus:border-amber-500 rounded-lg text-xs text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 outline-none resize-none leading-normal transition-all"
          />

          {/* Send Button */}
          <button
            onClick={() => handleSendMessage()}
            disabled={isLoading || (!inputPrompt.trim() && attachedContexts.length === 0)}
            className="p-2 bg-amber-500 hover:bg-amber-600 disabled:bg-neutral-300 dark:disabled:bg-neutral-800 text-white rounded-lg transition-colors shrink-0 shadow-xs"
            title="Send Message"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
