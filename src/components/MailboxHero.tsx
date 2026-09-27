import React, { useState } from 'react';
import { Copy, Check, Edit3, RefreshCw, QrCode, Share2, Globe, ShieldCheck } from 'lucide-react';
import { SavedMailbox } from '../types';

interface MailboxHeroProps {
  currentMailbox: SavedMailbox | null;
  isLoading: boolean;
  onGenerateNew: () => void;
  onOpenCustomModal: () => void;
  onOpenQrModal: () => void;
  onShareLink: () => void;
  availableDomains: string[];
  onChangeDomain: (domain: string) => void;
  onCopyAddress: (text?: string) => void;
  copied: boolean;
  provider: 'guerrilla' | '1sec';
  onChangeProvider: (provider: 'guerrilla' | '1sec') => void;
  selectedDomain: string;
}

export const MailboxHero: React.FC<MailboxHeroProps> = ({
  currentMailbox,
  isLoading,
  onGenerateNew,
  onOpenCustomModal,
  onOpenQrModal,
  onShareLink,
  availableDomains,
  onChangeDomain,
  onCopyAddress,
  copied,
  provider,
  onChangeProvider,
  selectedDomain,
}) => {
  const [domainDropdownOpen, setDomainDropdownOpen] = useState(false);

  const activeDomain = currentMailbox?.domain || selectedDomain || (provider === 'guerrilla' ? 'guerrillamailblock.com' : '1secmail.com');

  return (
    <div className="w-full pt-8 pb-6">
      {/* Title & Subtitle */}
      <div className="text-center max-w-2xl mx-auto mb-6 px-4">
        <div className="flex items-center justify-center gap-2 text-xs font-semibold text-blue-600 dark:text-blue-400 mb-2">
          <ShieldCheck className="w-4 h-4" />
          <span>Tamplid Mail Disposable Inbox</span>
          <span aria-hidden="true" className="text-slate-300 dark:text-slate-600">·</span>
          <span>Instant & Private</span>
          <span aria-hidden="true" className="text-slate-300 dark:text-slate-600">·</span>
          <span>No Signup</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight">
          Keep your real inbox clean and secure.
        </h1>
        <p className="mt-2 text-sm sm:text-base text-slate-600 dark:text-slate-400 leading-relaxed">
          Powered by {provider === 'guerrilla' ? 'Tamplid Mail' : '1SecMail'}. Receive verification emails, OTP codes, and password resets in real time.
        </p>

        {/* Provider Switcher Tabs */}
        <div className="mt-4 inline-flex items-center p-1 rounded-xl bg-slate-200/70 dark:bg-slate-800/70 border border-slate-300/50 dark:border-slate-700/50 text-xs">
          <button
            onClick={() => onChangeProvider('guerrilla')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
              provider === 'guerrilla'
                ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Tamplid Mail
          </button>
          <button
            onClick={() => onChangeProvider('1sec')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
              provider === '1sec'
                ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            1SecMail
          </button>
        </div>
      </div>

      {/* Main Mailbox Control Card */}
      <div className="max-w-2xl mx-auto px-4">
        <div className="relative rounded-2xl border border-slate-200 bg-white p-4 sm:p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 transition-all">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            {/* Email Address Display */}
            <div className="flex-1 min-w-0 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 flex items-center justify-between gap-2 group transition-colors">
              <span className="font-mono text-base sm:text-lg font-semibold tracking-tight text-slate-900 dark:text-slate-100 truncate select-all">
                {isLoading ? (
                  <span className="text-slate-400 dark:text-slate-500 animate-pulse">
                    Connecting to {provider === 'guerrilla' ? 'Tamplid Mail' : '1SecMail'}...
                  </span>
                ) : (
                  currentMailbox?.address || 'Click Change to generate'
                )}
              </span>

              <button
                onClick={() => onCopyAddress()}
                disabled={isLoading || !currentMailbox}
                title="Copy address"
                className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  copied
                    ? 'bg-emerald-600 text-white'
                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 shadow-xs'
                }`}
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={onGenerateNew}
                disabled={isLoading}
                title="Generate new random email address"
                className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm transition-all shadow-sm active:scale-95 disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                <span className="whitespace-nowrap">Random Email</span>
              </button>

              <button
                onClick={onOpenCustomModal}
                title="Choose custom username or domain"
                className="flex items-center justify-center p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/60 transition-colors"
              >
                <Edit3 className="w-4 h-4" />
              </button>

              <button
                onClick={onOpenQrModal}
                title="Scan QR Code on mobile"
                className="flex items-center justify-center p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/60 transition-colors"
              >
                <QrCode className="w-4 h-4" />
              </button>

              <button
                onClick={onShareLink}
                title="Share or bookmark this mailbox"
                className="flex items-center justify-center p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/60 transition-colors"
              >
                <Share2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Domain & Settings bar below input */}
          <div className="mt-3.5 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex flex-wrap items-center justify-between text-xs text-slate-500 dark:text-slate-400 gap-2">
            <div className="relative inline-block text-left">
              <button
                onClick={() => setDomainDropdownOpen(!domainDropdownOpen)}
                className="inline-flex items-center gap-1.5 hover:text-slate-900 dark:hover:text-slate-200 transition-colors py-1 cursor-pointer"
              >
                <Globe className="w-3.5 h-3.5 text-blue-500" />
                <span>Domain: <strong className="font-mono text-slate-800 dark:text-slate-200">@{activeDomain}</strong></span>
                <span className="text-[10px]">▼</span>
              </button>

              {domainDropdownOpen && (
                <div
                  className="absolute left-0 bottom-full mb-2 w-64 rounded-xl border border-slate-200 bg-white p-1.5 shadow-lg dark:border-slate-700 dark:bg-slate-800 z-30"
                  onMouseLeave={() => setDomainDropdownOpen(false)}
                >
                  <div className="px-2 py-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    Select Domain ({provider === 'guerrilla' ? 'Tamplid Mail' : '1SecMail'})
                  </div>
                  {availableDomains.map((d) => (
                    <button
                      key={d}
                      onClick={() => {
                        onChangeDomain(d);
                        setDomainDropdownOpen(false);
                      }}
                      className={`w-full text-left px-2.5 py-1.5 text-xs rounded-lg font-mono transition-colors flex items-center justify-between cursor-pointer ${
                        activeDomain === d
                          ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 font-semibold'
                          : 'text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700'
                      }`}
                    >
                      <span>@{d}</span>
                      {activeDomain === d && <Check className="w-3.5 h-3.5" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>Tamplid Mail</span>
              </span>
              <span aria-hidden="true" className="text-slate-300 dark:text-slate-700">·</span>
              <span>Auto 60m Retention</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
