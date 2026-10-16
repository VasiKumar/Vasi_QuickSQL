import React, { useState } from 'react';
import { 
  Bot, 
  Key, 
  X, 
  ExternalLink, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles, 
  Loader2, 
  Check 
} from 'lucide-react';
import { groqService, DEFAULT_GROQ_MODELS } from '../services/groqService';

interface GroqSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (apiKey: string, model: string) => void;
}

export const GroqSetupModal: React.FC<GroqSetupModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const [apiKey, setApiKey] = useState('');
  const [keyName, setKeyName] = useState('Personal Groq Key');
  const [step, setStep] = useState<'input' | 'models'>('input');
  const [isLoadingModels, setIsLoadingModels] = useState(false);
  const [availableModels, setAvailableModels] = useState<Array<{ id: string; name: string; desc?: string }>>(DEFAULT_GROQ_MODELS);
  const [selectedModel, setSelectedModel] = useState('llama-3.3-70b-versatile');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleFetchModels = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanKey = apiKey.trim();
    if (!cleanKey) {
      setErrorMessage('Please enter your Groq API key.');
      return;
    }

    setIsLoadingModels(true);
    setErrorMessage(null);

    try {
      const models = await groqService.fetchAvailableModels(cleanKey);
      setAvailableModels(models);
      if (models.length > 0) {
        setSelectedModel(models[0].id);
      }
      setStep('models');
    } catch (err: any) {
      setErrorMessage(err?.message || 'Something went wrong while connecting to Groq. Please check your API key.');
    } finally {
      setIsLoadingModels(false);
    }
  };

  const handleCompleteSetup = () => {
    // Save to groqService
    const cleanKey = apiKey.trim();
    const saved = groqService.addApiKey(keyName || 'Groq Key', cleanKey, true);
    const config = groqService.getConfig();
    groqService.saveConfig({
      ...config,
      apiKey: cleanKey,
      model: selectedModel
    });

    onSuccess(cleanKey, selectedModel);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
      <div className="w-full max-w-lg bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500 text-white flex items-center justify-center font-bold">
              <Bot className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base text-neutral-900 dark:text-neutral-100">
                Set Up Groq AI Assistant
              </h3>
              <p className="text-xs text-neutral-500">
                Bring your own Groq key — keys stay 100% inside your browser
              </p>
            </div>
          </div>

          <button onClick={onClose} className="p-1 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Step 1: Input API Key */}
        {step === 'input' && (
          <form onSubmit={handleFetchModels} className="p-4 sm:p-5 space-y-4 text-xs">
            <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 space-y-1.5">
              <div className="flex items-center gap-1.5 font-semibold text-amber-900 dark:text-amber-300">
                <Key className="w-3.5 h-3.5 text-amber-600" />
                <span>One-Time Groq Setup</span>
              </div>
              <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed text-[11px]">
                Enter your Groq API key to unlock the AI query assistant. We will check your account for active models so you can select the best one.
              </p>
            </div>

            <div>
              <label className="block font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                Groq API Key (starts with gsk_...) *
              </label>
              <input
                type="password"
                required
                placeholder="gsk_..."
                value={apiKey}
                onChange={(e) => {
                  setApiKey(e.target.value);
                  setErrorMessage(null);
                }}
                className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-neutral-100 font-mono text-xs outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                Key Nickname (optional)
              </label>
              <input
                type="text"
                placeholder="e.g. My Personal Groq Key"
                value={keyName}
                onChange={(e) => setKeyName(e.target.value)}
                className="w-full px-3 py-1.5 bg-neutral-50 dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-neutral-100 text-xs outline-none focus:border-amber-500"
              />
            </div>

            {errorMessage && (
              <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-red-700 dark:text-red-300 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <div className="text-[11px] leading-relaxed">
                  <strong>Something went wrong:</strong> {errorMessage}
                </div>
              </div>
            )}

            <div className="flex items-center justify-between pt-2 border-t border-neutral-200 dark:border-neutral-800">
              <a
                href="https://console.groq.com/keys"
                target="_blank"
                rel="noreferrer"
                className="text-[11px] text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1 font-medium"
              >
                <span>Get a free Groq key</span>
                <ExternalLink className="w-3 h-3" />
              </a>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-3 py-1.5 border border-neutral-300 dark:border-neutral-700 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoadingModels || !apiKey.trim()}
                  className="px-4 py-1.5 bg-amber-500 hover:bg-amber-600 disabled:bg-neutral-300 dark:disabled:bg-neutral-800 text-white rounded-lg font-medium shadow-xs flex items-center gap-1.5"
                >
                  {isLoadingModels ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Checking Models...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Verify & Fetch Models</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        )}

        {/* Step 2: Model Selection */}
        {step === 'models' && (
          <div className="p-4 sm:p-5 space-y-4 text-xs">
            <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 flex items-center gap-2 text-emerald-800 dark:text-emerald-300">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Key verified! Found {availableModels.length} models on your Groq account.</span>
            </div>

            <div>
              <label className="block font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
                Select your default Groq model:
              </label>
              <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                {availableModels.map(m => {
                  const isSelected = selectedModel === m.id;
                  return (
                    <div
                      key={m.id}
                      onClick={() => setSelectedModel(m.id)}
                      className={`p-2.5 rounded-lg border cursor-pointer flex items-center justify-between transition-colors ${
                        isSelected
                          ? 'border-amber-500 bg-amber-50/50 dark:bg-amber-950/30 text-neutral-900 dark:text-neutral-100'
                          : 'border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800/60 text-neutral-700 dark:text-neutral-300'
                      }`}
                    >
                      <div className="min-w-0 pr-2">
                        <div className="font-semibold text-xs flex items-center gap-1.5">
                          <span>{m.name}</span>
                          <span className="text-[10px] font-mono text-neutral-400">({m.id})</span>
                        </div>
                        {m.desc && (
                          <div className="text-[11px] text-neutral-500 mt-0.5 line-clamp-1">
                            {m.desc}
                          </div>
                        )}
                      </div>
                      {isSelected && <Check className="w-4 h-4 text-amber-600 shrink-0" />}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-neutral-200 dark:border-neutral-800">
              <button
                type="button"
                onClick={() => setStep('input')}
                className="text-neutral-500 hover:underline text-[11px]"
              >
                Change API Key
              </button>

              <button
                type="button"
                onClick={handleCompleteSetup}
                className="px-4 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg font-medium shadow-xs flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Start Using Groq AI</span>
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
