import React, { useState, useEffect } from 'react';
import { 
  Smartphone, 
  Download, 
  X, 
  ExternalLink, 
  CheckCircle2, 
  Sparkles, 
  Layers, 
  ShieldCheck, 
  Cpu, 
  Copy, 
  Check 
} from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

interface InstallApkModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const InstallApkModal: React.FC<InstallApkModalProps> = ({ isOpen, onClose }) => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);

  useEffect(() => {
    // Check if already in standalone / installed mode
    if (window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone) {
      setIsInstalled(true);
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  if (!isOpen) return null;

  const handleInstallPwa = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        setIsInstalled(true);
      }
      setDeferredPrompt(null);
    } else {
      // Browser doesn't support or already prompted
      alert("To install QuickSQL as an app on your Android device:\n\n1. Open your browser menu (⋮ in Chrome or Edge)\n2. Tap 'Install app' or 'Add to Home screen'\n3. Android will automatically create and install the WebAPK on your device!");
    }
  };

  const currentUrl = typeof window !== 'undefined' ? window.location.href : 'https://quicksql.app';
  const pwaBuilderUrl = `https://www.pwabuilder.com/reportcard?site=${encodeURIComponent(currentUrl)}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(currentUrl);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div 
        className="w-full max-w-lg bg-white dark:bg-neutral-900 rounded-xl shadow-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shadow-xs">
              <Smartphone className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                <span>QuickSQL Android App / APK</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-mono">
                  v1.0
                </span>
              </h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                Install as a native WebAPK or package into an Android APK
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 overflow-y-auto space-y-4 text-xs text-neutral-600 dark:text-neutral-300">
          
          {/* Status banner */}
          {isInstalled && (
            <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 flex items-center gap-2.5 text-emerald-800 dark:text-emerald-300">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <div>
                <p className="font-semibold text-xs">QuickSQL is already installed!</p>
                <p className="text-[11px] text-emerald-700 dark:text-emerald-400">
                  You are running the standalone application with full local SQL capability.
                </p>
              </div>
            </div>
          )}

          {/* React Native Application in Repository */}
          <div className="p-3.5 rounded-xl bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-transparent border border-emerald-500/30 space-y-2.5">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h4 className="font-bold text-neutral-900 dark:text-neutral-100 text-xs flex items-center gap-1.5">
                  <Smartphone className="w-4 h-4 text-emerald-600" />
                  <span>React Native Android App (In Repository)</span>
                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-mono font-bold">
                    NEW
                  </span>
                </h4>
                <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">
                  Full native React Native codebase is now ready in <code className="bg-neutral-200 dark:bg-neutral-800 px-1 rounded font-mono">/react-native-quicksql</code> with pure React Native components, SQLite engine, tables inspector, and EAS APK configuration.
                </p>
              </div>
            </div>

            <div className="bg-neutral-900 text-neutral-100 p-2.5 rounded-lg text-[11px] font-mono space-y-1">
              <p className="text-neutral-400 text-[10px]"># 1-command APK compilation with EAS:</p>
              <p className="text-emerald-400 select-all font-semibold">cd react-native-quicksql && npx eas build -p android --profile preview</p>
              <p className="text-neutral-400 text-[10px] pt-1"># Or automated GitHub Actions:</p>
              <p className="text-neutral-300">Push to GitHub to trigger <span className="text-amber-400">.github/workflows/build-apk.yml</span></p>
            </div>
          </div>

          {/* Option 2: PWABuilder / Standalone APK */}
          <div className="p-3.5 rounded-xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-800 space-y-2.5">
            <div>
              <h4 className="font-bold text-neutral-900 dark:text-neutral-100 text-xs flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-blue-500" />
                <span>Instant Cloud APK Generator (PWABuilder)</span>
              </h4>
              <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">
                Generate an Android <code>.apk</code> / <code>.aab</code> package online in seconds via Microsoft's official PWABuilder cloud compiler.
              </p>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <a
                href={pwaBuilderUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-100 text-white dark:text-neutral-900 font-medium text-xs transition-colors"
              >
                <span>Generate APK via PWABuilder</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
              <button
                onClick={handleCopyLink}
                className="flex items-center gap-1 py-2 px-3 rounded-lg border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-200 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300 text-xs transition-colors"
                title="Copy live App URL"
              >
                {copiedUrl ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedUrl ? 'Copied' : 'Copy URL'}</span>
              </button>
            </div>
          </div>

          {/* Direct Android WebAPK Installation */}
          <div className="p-3 rounded-lg bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 space-y-2">
            <h5 className="font-semibold text-neutral-900 dark:text-neutral-100 text-xs flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Instant Phone Install (No compilation required):</span>
            </h5>
            <ol className="space-y-1.5 list-decimal list-inside text-[11px] text-neutral-500 dark:text-neutral-400">
              <li>Open this app on Android (Chrome, Edge, or Samsung Internet).</li>
              <li>Tap the browser menu (<strong>⋮</strong>).</li>
              <li>Select <strong>"Install app"</strong> or <strong>"Add to Home screen"</strong>.</li>
              <li>Android will install <strong>QuickSQL</strong> as a standalone application on your device!</li>
            </ol>
            <button
              onClick={handleInstallPwa}
              className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white font-semibold text-xs shadow-xs transition-all mt-1"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{deferredPrompt ? 'Install QuickSQL on Android Now' : 'Trigger Android App Installation'}</span>
            </button>
          </div>

          {/* Highlights */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            <div className="p-2.5 rounded-lg bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 flex items-start gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-neutral-900 dark:text-neutral-100 text-[11px]">100% Offline & Private</p>
                <p className="text-[10px] text-neutral-400">All queries & tables run locally in your phone</p>
              </div>
            </div>
            <div className="p-2.5 rounded-lg bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 flex items-start gap-2">
              <Cpu className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-neutral-900 dark:text-neutral-100 text-[11px]">Ultra Fast & Smooth</p>
                <p className="text-[10px] text-neutral-400">Pure web performance with instant launch</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-neutral-200 hover:bg-neutral-300 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 font-medium text-xs transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
