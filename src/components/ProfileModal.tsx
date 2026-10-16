import React, { useState } from 'react';
import { 
  User, 
  Key, 
  X, 
  Plus, 
  Trash2, 
  Check, 
  Edit2, 
  ExternalLink, 
  CheckCircle2, 
  Sparkles,
  Bot,
  AlertCircle
} from 'lucide-react';
import { StoredApiKey, GroqConfig } from '../types';
import { groqService, DEFAULT_GROQ_MODELS } from '../services/groqService';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfigUpdated: () => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({
  isOpen,
  onClose,
  onConfigUpdated
}) => {
  const [config, setConfig] = useState<GroqConfig>(() => groqService.getConfig());
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [newKeyValue, setNewKeyValue] = useState('');
  const [editingKeyId, setEditingKeyId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editValue, setEditValue] = useState('');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  if (!isOpen) return null;

  const refreshLocalState = () => {
    const updated = groqService.getConfig();
    setConfig(updated);
    onConfigUpdated();
  };

  const handleSetDefault = (id: string) => {
    groqService.setDefaultKey(id);
    refreshLocalState();
    setFeedback({ type: 'success', message: 'Default key updated.' });
    setTimeout(() => setFeedback(null), 2500);
  };

  const handleDeleteKey = (id: string) => {
    groqService.deleteKey(id);
    refreshLocalState();
    setFeedback({ type: 'success', message: 'API key removed.' });
    setTimeout(() => setFeedback(null), 2500);
  };

  const handleSaveNewKey = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyValue.trim()) return;
    groqService.addApiKey(newKeyName.trim() || 'Groq Key', newKeyValue.trim(), false);
    setIsAddingNew(false);
    setNewKeyName('');
    setNewKeyValue('');
    refreshLocalState();
    setFeedback({ type: 'success', message: 'New API key saved.' });
    setTimeout(() => setFeedback(null), 2500);
  };

  const handleStartEdit = (item: StoredApiKey) => {
    setEditingKeyId(item.id);
    setEditName(item.name);
    setEditValue(item.key);
  };

  const handleSaveEdit = (id: string) => {
    if (!editValue.trim()) return;
    groqService.updateKey(id, editName.trim(), editValue.trim());
    setEditingKeyId(null);
    refreshLocalState();
    setFeedback({ type: 'success', message: 'Key updated.' });
    setTimeout(() => setFeedback(null), 2500);
  };

  const handleModelChange = (modelId: string) => {
    groqService.saveConfig({
      ...config,
      model: modelId
    });
    refreshLocalState();
  };

  const maskKey = (k: string) => {
    if (!k || k.length < 10) return '••••••••';
    return k.slice(0, 6) + '••••••••' + k.slice(-4);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
      <div className="w-full max-w-lg bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-2xl overflow-hidden flex flex-col max-h-[88vh] animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 flex items-center justify-center">
              <User className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base text-neutral-900 dark:text-neutral-100">
                User Profile & API Keys
              </h3>
              <p className="text-xs text-neutral-500">
                Manage your Groq API credentials and choose your default active model
              </p>
            </div>
          </div>

          <button onClick={onClose} className="p-1 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 text-xs">
          {/* Feedback banner */}
          {feedback && (
            <div className={`p-2.5 rounded-lg flex items-center gap-2 text-xs ${
              feedback.type === 'success' 
                ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900/50'
                : 'bg-red-50 dark:bg-red-950/40 text-red-800 dark:text-red-300 border border-red-200 dark:border-red-900/50'
            }`}>
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
              <span>{feedback.message}</span>
            </div>
          )}

          {/* Active Model Selector */}
          <div className="p-3.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 space-y-2">
            <div className="flex items-center justify-between">
              <label className="font-semibold text-neutral-900 dark:text-neutral-100 flex items-center gap-1.5">
                <Bot className="w-3.5 h-3.5 text-amber-500" />
                <span>Active Groq Model</span>
              </label>
              <span className="text-[10px] text-neutral-400 font-mono">
                {config.model}
              </span>
            </div>
            <select
              value={config.model}
              onChange={(e) => handleModelChange(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-neutral-100 text-xs outline-none focus:border-amber-500"
            >
              {DEFAULT_GROQ_MODELS.map(m => (
                <option key={m.id} value={m.id}>
                  {m.name} — {m.desc}
                </option>
              ))}
            </select>
          </div>

          {/* API Keys List */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="font-semibold text-neutral-900 dark:text-neutral-100 flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-amber-500" />
                <span>Saved API Keys ({config.keysList?.length || 0})</span>
              </label>
              {!isAddingNew && (
                <button
                  onClick={() => setIsAddingNew(true)}
                  className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 hover:underline font-medium text-[11px]"
                >
                  <Plus className="w-3 h-3" />
                  <span>Add Key</span>
                </button>
              )}
            </div>

            {/* Add New Key Form */}
            {isAddingNew && (
              <form onSubmit={handleSaveNewKey} className="p-3 rounded-xl border border-emerald-300 dark:border-emerald-800 bg-emerald-50/40 dark:bg-emerald-950/20 space-y-2.5">
                <div className="font-semibold text-emerald-800 dark:text-emerald-300 text-xs">
                  Add Groq API Key
                </div>
                <div>
                  <input
                    type="text"
                    placeholder="Nickname (e.g. Work Key)"
                    value={newKeyName}
                    onChange={(e) => setNewKeyName(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-neutral-100 text-xs outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <input
                    type="password"
                    required
                    placeholder="gsk_..."
                    value={newKeyValue}
                    onChange={(e) => setNewKeyValue(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-lg font-mono text-neutral-900 dark:text-neutral-100 text-xs outline-none focus:border-emerald-500"
                  />
                </div>
                <div className="flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsAddingNew(false)}
                    className="px-2.5 py-1 rounded text-neutral-500 hover:bg-neutral-200 dark:hover:bg-neutral-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-medium shadow-xs"
                  >
                    Save Key
                  </button>
                </div>
              </form>
            )}

            {/* List */}
            {(!config.keysList || config.keysList.length === 0) ? (
              <div className="p-4 rounded-xl border border-dashed border-neutral-300 dark:border-neutral-700 text-center text-neutral-400">
                <p className="text-xs">No Groq API keys added yet.</p>
                <button
                  onClick={() => setIsAddingNew(true)}
                  className="mt-2 px-3 py-1 bg-amber-500 text-white rounded text-xs font-medium inline-flex items-center gap-1 shadow-xs"
                >
                  <Plus className="w-3 h-3" />
                  <span>Add First Key</span>
                </button>
              </div>
            ) : (
              config.keysList.map(item => {
                const isDefault = item.isDefault || item.key === config.apiKey;
                const isEditing = editingKeyId === item.id;

                if (isEditing) {
                  return (
                    <div key={item.id} className="p-3 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-950 space-y-2">
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="w-full px-2.5 py-1 bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded text-xs"
                      />
                      <input
                        type="password"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        className="w-full px-2.5 py-1 bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded font-mono text-xs"
                      />
                      <div className="flex justify-end gap-1.5">
                        <button
                          onClick={() => setEditingKeyId(null)}
                          className="px-2 py-0.5 text-neutral-500 hover:bg-neutral-200"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleSaveEdit(item.id)}
                          className="px-2.5 py-0.5 bg-emerald-600 text-white rounded font-medium"
                        >
                          Save
                        </button>
                      </div>
                    </div>
                  );
                }

                return (
                  <div
                    key={item.id}
                    className={`p-3 rounded-xl border flex items-center justify-between gap-2 transition-colors ${
                      isDefault
                        ? 'border-emerald-500/80 bg-emerald-50/20 dark:bg-emerald-950/20'
                        : 'border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950'
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-neutral-900 dark:text-neutral-100 truncate">
                          {item.name}
                        </span>
                        {isDefault && (
                          <span className="px-1.5 py-0.2 rounded bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 font-medium text-[10px]">
                            Default Active
                          </span>
                        )}
                      </div>
                      <div className="font-mono text-neutral-400 text-[11px] mt-0.5">
                        {maskKey(item.key)}
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      {!isDefault && (
                        <button
                          onClick={() => handleSetDefault(item.id)}
                          className="px-2 py-1 rounded border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300 text-[11px]"
                          title="Set this key as default"
                        >
                          Use as Default
                        </button>
                      )}
                      <button
                        onClick={() => handleStartEdit(item)}
                        className="p-1 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-500"
                        title="Edit key"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteKey(item.id)}
                        className="p-1 rounded hover:bg-red-50 dark:hover:bg-red-950/30 text-neutral-400 hover:text-red-600"
                        title="Delete key"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="pt-2 border-t border-neutral-200 dark:border-neutral-800">
            <a
              href="https://console.groq.com/keys"
              target="_blank"
              rel="noreferrer"
              className="text-[11px] text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1 font-medium"
            >
              <span>Manage keys in Groq Console</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 bg-neutral-50 dark:bg-neutral-950 border-t border-neutral-200 dark:border-neutral-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-neutral-800 dark:bg-neutral-200 text-white dark:text-neutral-900 rounded-lg text-xs font-semibold"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
