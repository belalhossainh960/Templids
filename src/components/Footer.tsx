import React from 'react';
import { Shield } from 'lucide-react';

interface FooterProps {
  onOpenSettings: () => void;
  onOpenHistory: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onOpenSettings, onOpenHistory }) => {
  return (
    <footer className="w-full border-t border-slate-200/80 dark:border-slate-800/80 bg-white/50 dark:bg-slate-900/50 py-8 transition-colors mt-auto">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 dark:text-slate-400">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          <span>© {new Date().getFullYear()} Tamplid Mail. Anonymous disposable email protection.</span>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={onOpenHistory}
            className="hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            History
          </button>
          <button
            onClick={onOpenSettings}
            className="hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            FAQ & Preferences
          </button>
          <span className="text-slate-300 dark:text-slate-700">·</span>
          <span>No logs retained</span>
        </div>
      </div>
    </footer>
  );
};
