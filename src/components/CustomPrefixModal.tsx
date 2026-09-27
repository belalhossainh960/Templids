import React, { useState } from 'react';
import { X, Sparkles, AtSign } from 'lucide-react';

interface CustomPrefixModalProps {
  currentUsername: string;
  currentDomain: string;
  availableDomains: string[];
  onSubmit: (username: string, domain: string) => void;
  onClose: () => void;
  provider: 'guerrilla' | '1sec';
}

export const CustomPrefixModal: React.FC<CustomPrefixModalProps> = ({
  currentUsername,
  currentDomain,
  availableDomains,
  onSubmit,
  onClose,
  provider,
}) => {
  const [username, setUsername] = useState(currentUsername || '');
  const [domain, setDomain] = useState(currentDomain || availableDomains[0] || 'guerrillamailblock.com');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = username.trim().toLowerCase().replace(/[^a-z0-9._-]/g, '');
    if (clean.length < 2) {
      setError('Username must be at least 2 characters.');
      return;
    }
    if (clean.length > 32) {
      setError('Username must be under 32 characters.');
      return;
    }
    onSubmit(clean, domain);
    onClose();
  };

  const previewAddress = `${username.trim().toLowerCase().replace(/[^a-z0-9._-]/g, '') || 'username'}@${domain}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2 text-base font-bold text-slate-900 dark:text-white">
            <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span>Customize {provider === 'guerrilla' ? 'Tamplid Mail' : 'Temporary'} Address</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
              Username Handle
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <AtSign className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  setError(null);
                }}
                placeholder="e.g. alex.developer"
                className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-mono text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 focus:bg-white dark:focus:bg-slate-900 transition-colors"
                autoFocus
              />
            </div>
            {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
              Domain ({provider === 'guerrilla' ? 'Tamplid Mail Domains' : '1SecMail Domains'})
            </label>
            <select
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-mono text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 transition-colors"
            >
              {availableDomains.map((d) => (
                <option key={d} value={d}>
                  @{d}
                </option>
              ))}
            </select>
          </div>

          {/* Live Preview */}
          <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/40 text-center">
            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block mb-0.5">
              Live Preview
            </span>
            <span className="font-mono text-sm font-bold text-blue-700 dark:text-blue-300 break-all select-all">
              {previewAddress}
            </span>
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold shadow-sm transition-all active:scale-95"
            >
              Save Mailbox
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
