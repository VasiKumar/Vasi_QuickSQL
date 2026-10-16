import React from 'react';
import { 
  FolderDown, 
  X, 
  Database, 
  Table, 
  Play, 
  Sparkles, 
  CheckCircle2,
  Layers
} from 'lucide-react';
import { SAMPLE_DATASETS } from '../services/sampleDatasets';
import { DatasetPreset } from '../types';

interface DatasetSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectDataset: (preset: DatasetPreset) => void;
  isLoading: boolean;
}

export const DatasetSelectorModal: React.FC<DatasetSelectorModalProps> = ({
  isOpen,
  onClose,
  onSelectDataset,
  isLoading
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
      <div className="w-full max-w-2xl bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-2xl overflow-hidden flex flex-col max-h-[88vh] animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <FolderDown className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base text-neutral-900 dark:text-neutral-100">
                Sample Datasets & Playground
              </h3>
              <p className="text-xs text-neutral-500">
                Pre-populated databases designed to test SQL and PostgreSQL queries
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* List of Datasets */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4">
          {SAMPLE_DATASETS.map(preset => (
            <div
              key={preset.id}
              className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 hover:border-emerald-500 dark:hover:border-emerald-500/80 bg-neutral-50/50 dark:bg-neutral-950/40 transition-all space-y-3"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold text-sm text-neutral-900 dark:text-neutral-100">
                      {preset.name}
                    </h4>
                    <span className="text-[10px] font-mono uppercase text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-1.5 py-0.5 rounded border border-emerald-200/50 dark:border-emerald-800/40">
                      {preset.category}
                    </span>
                  </div>
                  <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-1">
                    {preset.description}
                  </p>
                </div>

                <button
                  onClick={() => onSelectDataset(preset)}
                  disabled={isLoading}
                  className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-neutral-400 text-white rounded-lg text-xs font-medium shrink-0 flex items-center justify-center gap-1.5 shadow-xs transition-colors self-start sm:self-auto"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{isLoading ? 'Loading...' : 'Load Dataset'}</span>
                </button>
              </div>

              {/* Tables Pills */}
              <div className="flex items-center gap-1.5 flex-wrap pt-1 text-[11px] text-neutral-500 dark:text-neutral-400">
                <span className="font-medium text-neutral-400">Tables:</span>
                {preset.tables.map(tbl => (
                  <span
                    key={tbl}
                    className="font-mono bg-white dark:bg-neutral-900 px-2 py-0.5 rounded border border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300"
                  >
                    {tbl}
                  </span>
                ))}
              </div>

              {/* Sample Queries Included */}
              <div className="pt-2 border-t border-neutral-200/60 dark:border-neutral-800/60 space-y-1">
                <span className="text-[11px] font-medium text-neutral-500">Sample Queries Included:</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs">
                  {preset.sampleQueries.map((sq, i) => (
                    <div
                      key={i}
                      className="p-2 rounded bg-white dark:bg-neutral-900 border border-neutral-200/60 dark:border-neutral-800 flex items-start gap-1.5"
                    >
                      <Play className="w-3 h-3 text-emerald-600 shrink-0 mt-0.5" />
                      <div className="min-w-0">
                        <span className="font-medium text-neutral-800 dark:text-neutral-200 block truncate text-[11px]">
                          {sq.title}
                        </span>
                        <span className="text-[10px] text-neutral-400 line-clamp-1">
                          {sq.description}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="p-3 bg-neutral-50 dark:bg-neutral-950 border-t border-neutral-200 dark:border-neutral-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 border border-neutral-300 dark:border-neutral-700 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-xs font-medium text-neutral-700 dark:text-neutral-300"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
