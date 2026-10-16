import React, { useState } from 'react';
import { 
  Upload, 
  X, 
  FileCode, 
  FileSpreadsheet, 
  FileJson, 
  CheckCircle2, 
  AlertCircle 
} from 'lucide-react';

interface ImportFileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportSql: (sql: string, fileName: string) => void;
  onImportCsv: (tableName: string, csvContent: string) => Promise<void>;
  onImportJson: (tableName: string, jsonContent: string) => Promise<void>;
}

export const ImportFileModal: React.FC<ImportFileModalProps> = ({
  isOpen,
  onClose,
  onImportSql,
  onImportCsv,
  onImportJson
}) => {
  const [selectedFileType, setSelectedFileType] = useState<'sql' | 'csv' | 'json'>('sql');
  const [fileContent, setFileContent] = useState<string>('');
  const [fileName, setFileName] = useState<string>('');
  const [tableName, setTableName] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [previewSnippet, setPreviewSnippet] = useState<string>('');

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMsg(null);
    setFileName(file.name);

    // Auto-detect type
    const lower = file.name.toLowerCase();
    if (lower.endsWith('.sql')) setSelectedFileType('sql');
    else if (lower.endsWith('.csv')) setSelectedFileType('csv');
    else if (lower.endsWith('.json')) setSelectedFileType('json');

    // Default table name from file name
    const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9_]/g, '_').toLowerCase();
    setTableName(cleanName);

    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target?.result;
      if (typeof text === 'string') {
        setFileContent(text);
        setPreviewSnippet(text.slice(0, 400));
      }
    };
    reader.onerror = () => {
      setErrorMsg('Failed to read the file.');
    };
    reader.readAsText(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fileContent.trim()) {
      setErrorMsg('Please select a file to import.');
      return;
    }

    setIsProcessing(true);
    setErrorMsg(null);

    try {
      if (selectedFileType === 'sql') {
        onImportSql(fileContent, fileName);
        onClose();
      } else if (selectedFileType === 'csv') {
        if (!tableName.trim()) throw new Error('Please enter a target table name.');
        await onImportCsv(tableName.trim(), fileContent);
        onClose();
      } else if (selectedFileType === 'json') {
        if (!tableName.trim()) throw new Error('Please enter a target table name.');
        await onImportJson(tableName.trim(), fileContent);
        onClose();
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Import failed.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
      <div className="w-full max-w-lg bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Upload className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base text-neutral-900 dark:text-neutral-100">
                Import Files into Database
              </h3>
              <p className="text-xs text-neutral-500">
                Load .sql query scripts, .csv spreadsheets, or .json records
              </p>
            </div>
          </div>

          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-4 text-xs">
          {/* File Picker Area */}
          <div className="border-2 border-dashed border-neutral-300 dark:border-neutral-700 hover:border-emerald-500 rounded-xl p-5 text-center cursor-pointer transition-colors bg-neutral-50/50 dark:bg-neutral-950/40">
            <input
              type="file"
              accept=".sql,.csv,.json"
              onChange={handleFileChange}
              id="file-import-input"
              className="hidden"
            />
            <label htmlFor="file-import-input" className="cursor-pointer space-y-2 block">
              <div className="w-10 h-10 rounded-full bg-neutral-100 dark:bg-neutral-800 mx-auto flex items-center justify-center text-neutral-500">
                <Upload className="w-5 h-5" />
              </div>
              <p className="font-medium text-neutral-800 dark:text-neutral-200">
                {fileName ? fileName : 'Click to select .sql, .csv, or .json file'}
              </p>
              <p className="text-[11px] text-neutral-400">
                Processes 100% locally in your browser - zero data leaves your phone
              </p>
            </label>
          </div>

          {/* Format selector */}
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'sql', label: 'SQL Script', icon: FileCode },
              { id: 'csv', label: 'CSV Table', icon: FileSpreadsheet },
              { id: 'json', label: 'JSON Records', icon: FileJson }
            ].map(fmt => {
              const Icon = fmt.icon;
              const isSelected = selectedFileType === fmt.id;
              return (
                <button
                  type="button"
                  key={fmt.id}
                  onClick={() => setSelectedFileType(fmt.id as any)}
                  className={`flex flex-col items-center justify-center gap-1.5 p-2.5 rounded-lg border text-center transition-all ${
                    isSelected
                      ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 font-semibold'
                      : 'border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{fmt.label}</span>
                </button>
              );
            })}
          </div>

          {/* Table Name (if CSV or JSON) */}
          {selectedFileType !== 'sql' && (
            <div>
              <label className="block font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                Target Table Name *
              </label>
              <input
                type="text"
                required
                value={tableName}
                onChange={(e) => setTableName(e.target.value)}
                placeholder="e.g. sales_records"
                className="w-full px-3 py-1.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-neutral-100 outline-none focus:border-emerald-500 font-mono"
              />
            </div>
          )}

          {/* Preview of file */}
          {previewSnippet && (
            <div>
              <span className="block text-[11px] font-medium text-neutral-500 mb-1">
                File Preview:
              </span>
              <pre className="font-mono text-[10px] bg-neutral-100 dark:bg-neutral-950 p-2 rounded border border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300 overflow-x-auto max-h-24">
                {previewSnippet}
              </pre>
            </div>
          )}

          {/* Error Message */}
          {errorMsg && (
            <div className="flex items-center gap-2 p-2 rounded-lg bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Submit Buttons */}
          <div className="pt-2 flex items-center justify-end gap-2 border-t border-neutral-200 dark:border-neutral-800">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 border border-neutral-300 dark:border-neutral-700 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isProcessing || !fileContent}
              className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-neutral-400 text-white rounded-lg font-medium shadow-xs flex items-center gap-1.5"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>{isProcessing ? 'Importing...' : 'Import Now'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
