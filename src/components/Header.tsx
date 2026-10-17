import React, { useState, useRef, useEffect } from 'react';
import { 
  Database, 
  Play, 
  Sun, 
  Moon, 
  FolderDown, 
  Upload, 
  History, 
  Bookmark, 
  Bot, 
  Code2, 
  RotateCcw,
  Menu,
  X,
  MoreVertical,
  EyeOff,
  Eye,
  User,
  Key,
  Keyboard,
  Smartphone
} from 'lucide-react';

interface HeaderProps {
  activeView: 'editor' | 'schema' | 'history' | 'saved' | 'ai';
  setActiveView: (view: 'editor' | 'schema' | 'history' | 'saved' | 'ai') => void;
  darkMode: boolean;
  setDarkMode: (val: boolean) => void;
  onExecute: () => void;
  isRunning: boolean;
  onOpenDatasets: () => void;
  onOpenImport: () => void;
  onResetDb: () => void;
  tablesCount: number;
  attributesCount?: number;
  historyCount: number;
  savedCount: number;
  hasGroqKey: boolean;
  onAiClick: () => void;
  onOpenProfile: () => void;
  isFocusMode: boolean;
  onToggleFocusMode: () => void;
  onOpenInstallModal?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeView,
  setActiveView,
  darkMode,
  setDarkMode,
  onExecute,
  isRunning,
  onOpenDatasets,
  onOpenImport,
  onResetDb,
  tablesCount,
  attributesCount,
  historyCount,
  savedCount,
  hasGroqKey,
  onAiClick,
  onOpenProfile,
  isFocusMode,
  onToggleFocusMode,
  onOpenInstallModal
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [dotsMenuOpen, setDotsMenuOpen] = useState(false);
  const dotsRef = useRef<HTMLDivElement>(null);

  // Close three-dots dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dotsRef.current && !dotsRef.current.contains(e.target as Node)) {
        setDotsMenuOpen(false);
      }
    };
    if (dotsMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [dotsMenuOpen]);

  const handleNavClick = (id: 'editor' | 'schema' | 'history' | 'saved' | 'ai') => {
    if (id === 'ai') {
      if (activeView === 'ai') {
        setActiveView('editor'); // Click active AI tab to minimise
      } else {
        onAiClick();
      }
    } else {
      if (activeView === id && id !== 'editor') {
        setActiveView('editor'); // Click active tab to minimise back to editor
      } else {
        setActiveView(id); // Expands the tab
      }
    }
    setMobileMenuOpen(false);
  };

  const navItems = [
    { id: 'editor', label: 'Query Editor', icon: Code2 },
    { id: 'schema', label: `Tables (${tablesCount})`, icon: Database },
    { id: 'history', label: `History (${historyCount})`, icon: History },
    { id: 'saved', label: `Saved (${savedCount})`, icon: Bookmark },
    { id: 'ai', label: 'Groq AI', icon: Bot, highlight: hasGroqKey }
  ] as const;

  return (
    <header className="sticky top-0 z-30 border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 h-14 flex items-center justify-between gap-3 md:gap-6">
        
        {/* Zone 1: Brand Wordmark & Logo */}
        <div className="flex items-center gap-3 shrink-0">
          <button 
            onClick={() => setActiveView('editor')} 
            className="flex items-center gap-2.5 text-left group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 rounded"
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-emerald-600 via-teal-600 to-cyan-500 text-white flex items-center justify-center shadow-xs group-hover:opacity-90 transition-opacity relative">
              <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <ellipse cx="12" cy="5" rx="9" ry="3"></ellipse>
                <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"></path>
                <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"></path>
                <polygon points="13 3 8 12 12 12 11 19 16 9 12 9 14 3" fill="#fbbf24" stroke="#fbbf24" strokeWidth="0.8" />
              </svg>
            </div>
            <div className="flex flex-col">
              <span className="text-base font-bold tracking-tight text-neutral-900 dark:text-neutral-100 whitespace-nowrap">
                QuickSQL
              </span>
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono -mt-1 hidden sm:inline">
                Light · Fast · Smooth
              </span>
            </div>
          </button>
        </div>

        {/* Zone 2: Navigation Links */}
        <nav className="hidden md:flex items-center gap-1">
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = activeView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                  isActive
                    ? 'bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white font-semibold'
                    : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-50 dark:hover:bg-neutral-900'
                }`}
                title={item.id !== 'editor' && isActive ? 'Click to minimise tab' : 'Click to expand tab'}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-emerald-600 dark:text-emerald-400' : ''}`} />
                <span>{item.label}</span>
                {item.id === 'schema' && attributesCount !== undefined && attributesCount > 0 && (
                  <span className="text-[10px] text-neutral-400 font-mono hidden xl:inline">
                    · {attributesCount} attrs
                  </span>
                )}
                {item.id === 'ai' && !hasGroqKey && (
                  <span className="text-[9px] px-1 py-0.2 bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-400 rounded">
                    BYOK
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: Actions & Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Quick dataset import button: ONLY shown if database has 0 tables */}
          {tablesCount === 0 && (
            <button
              onClick={onOpenDatasets}
              className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300 transition-colors whitespace-nowrap animate-in fade-in"
              title="Import a demo dataset (optional)"
            >
              <FolderDown className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Demo Data</span>
            </button>
          )}

          {/* Install / APK button */}
          {onOpenInstallModal && (
            <button
              onClick={onOpenInstallModal}
              className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-lg border border-emerald-500/40 bg-emerald-50/60 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-colors whitespace-nowrap"
              title="Install QuickSQL App or Package Android APK"
            >
              <Smartphone className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>App / APK</span>
            </button>
          )}

          {/* Hide / Focus Mode Toggle */}
          <button
            onClick={onToggleFocusMode}
            className={`p-1.5 rounded-lg border transition-colors ${
              isFocusMode
                ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300'
                : 'border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800'
            }`}
            title={isFocusMode ? 'Show all options (Unhide)' : 'Hide options (Zen full screen)'}
            aria-label="Toggle focus mode"
          >
            {isFocusMode ? <Eye className="w-4 h-4 text-emerald-600" /> : <EyeOff className="w-4 h-4" />}
          </button>

          {/* Dark Mode Toggle */}
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="p-1.5 rounded-lg border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-300 transition-colors"
            title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            aria-label="Toggle theme"
          >
            {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-neutral-600" />}
          </button>

          {/* Primary Execute Button */}
          <button
            onClick={onExecute}
            disabled={isRunning}
            className={`flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 text-xs font-semibold rounded-lg text-white shadow-sm transition-all whitespace-nowrap shrink-0 ${
              isRunning 
                ? 'bg-neutral-400 cursor-not-allowed' 
                : 'bg-emerald-600 hover:bg-emerald-700 active:scale-95'
            }`}
            title="Run Query (Ctrl + Enter)"
          >
            <Play className={`w-3.5 h-3.5 fill-current ${isRunning ? 'animate-spin' : ''}`} />
            <span>{isRunning ? 'Running...' : 'Execute'}</span>
          </button>

          {/* Three Dots Menu for Profile & API Key Management */}
          <div ref={dotsRef} className="relative">
            <button
              onClick={() => setDotsMenuOpen(!dotsMenuOpen)}
              className="p-1.5 rounded-lg border border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
              title="More Options & Profile"
              aria-label="More options"
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {dotsMenuOpen && (
              <div className="absolute right-0 mt-2 w-56 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-xl py-1.5 z-50 text-xs animate-in fade-in duration-100">
                <button
                  onClick={() => {
                    setDotsMenuOpen(false);
                    onOpenProfile();
                  }}
                  className="w-full px-3 py-2 text-left flex items-center gap-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-800 dark:text-neutral-200"
                >
                  <User className="w-4 h-4 text-amber-500" />
                  <div className="flex flex-col">
                    <span className="font-medium">Profile & API Keys</span>
                    <span className="text-[10px] text-neutral-400">View, edit or switch Groq keys</span>
                  </div>
                </button>

                <div className="h-px bg-neutral-100 dark:bg-neutral-800 my-1" />

                {onOpenInstallModal && (
                  <button
                    onClick={() => {
                      setDotsMenuOpen(false);
                      onOpenInstallModal();
                    }}
                    className="w-full px-3 py-2 text-left flex items-center gap-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-800 dark:text-neutral-200"
                  >
                    <Smartphone className="w-4 h-4 text-emerald-600" />
                    <div className="flex flex-col">
                      <span className="font-medium">Install App / APK</span>
                      <span className="text-[10px] text-neutral-400">Android WebAPK & PWABuilder package</span>
                    </div>
                  </button>
                )}

                <button
                  onClick={() => {
                    setDotsMenuOpen(false);
                    onOpenDatasets();
                  }}
                  className="w-full px-3 py-2 text-left flex items-center gap-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300"
                >
                  <FolderDown className="w-4 h-4 text-emerald-600" />
                  <span>Import Demo Dataset</span>
                </button>

                <button
                  onClick={() => {
                    setDotsMenuOpen(false);
                    onOpenImport();
                  }}
                  className="w-full px-3 py-2 text-left flex items-center gap-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300"
                >
                  <Upload className="w-4 h-4 text-indigo-500" />
                  <span>Import File (SQL, CSV, JSON)</span>
                </button>

                <div className="h-px bg-neutral-100 dark:bg-neutral-800 my-1" />

                <button
                  onClick={() => {
                    setDotsMenuOpen(false);
                    onResetDb();
                  }}
                  className="w-full px-3 py-2 text-left flex items-center gap-2 hover:bg-red-50 dark:hover:bg-red-950/30 text-red-600"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Reset Database</span>
                </button>
              </div>
            )}
          </div>

          {/* Mobile hamburger menu toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-1.5 rounded-lg border border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300"
            aria-label="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Navigation */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 px-4 py-3 space-y-2">
          <div className="grid grid-cols-2 gap-2 pb-2 border-b border-neutral-100 dark:border-neutral-900">
            {navItems.map(item => {
              const Icon = item.icon;
              const isActive = activeView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-left ${
                    isActive
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-semibold'
                      : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                  }`}
                  title={item.id !== 'editor' && isActive ? 'Click to minimise' : 'Click to expand'}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <div className="flex flex-col truncate">
                    <span className="truncate">{item.label}</span>
                    {item.id === 'schema' && attributesCount !== undefined && attributesCount > 0 && (
                      <span className="text-[10px] text-neutral-400 font-mono">
                        {attributesCount} attributes
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          <div className="flex flex-col gap-2 pt-1 text-xs">
            {onOpenInstallModal && (
              <button
                onClick={() => {
                  onOpenInstallModal();
                  setMobileMenuOpen(false);
                }}
                className="w-full flex items-center justify-center gap-1.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg shadow-xs"
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>Install Mobile App / APK</span>
              </button>
            )}

            <div className="flex items-center justify-between gap-2">
              <button
                onClick={() => {
                  onOpenProfile();
                  setMobileMenuOpen(false);
                }}
                className="flex-1 flex items-center justify-center gap-1.5 py-1.5 border border-neutral-300 dark:border-neutral-700 rounded-lg text-neutral-700 dark:text-neutral-300"
              >
                <User className="w-3.5 h-3.5 text-amber-500" />
                <span>Profile / Keys</span>
              </button>
              <button
                onClick={() => {
                  onOpenDatasets();
                  setMobileMenuOpen(false);
                }}
                className="flex-1 flex items-center justify-center gap-1.5 py-1.5 border border-neutral-300 dark:border-neutral-700 rounded-lg text-neutral-700 dark:text-neutral-300"
              >
                <FolderDown className="w-3.5 h-3.5 text-emerald-600" />
                <span>Demo Data</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
