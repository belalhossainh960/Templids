import React, { useState } from 'react';
import { RefreshCw, Search, Inbox, KeyRound, Copy, Check, Clock, ChevronRight, Trash2 } from 'lucide-react';
import { EmailMessage } from '../types';

interface InboxListProps {
  messages: EmailMessage[];
  isLoading: boolean;
  isRefreshing: boolean;
  onRefresh: () => void;
  onSelectMessage: (id: string) => void;
  onDeleteMessage: (id: string, e: React.MouseEvent) => void;
  autoRefreshEnabled: boolean;
  onToggleAutoRefresh: () => void;
  nextRefreshCountdown: number;
  onCopyOtp: (otp: string, e: React.MouseEvent) => void;
  copiedOtpId: string | null;
}

export const InboxList: React.FC<InboxListProps> = ({
  messages,
  isLoading,
  isRefreshing,
  onRefresh,
  onSelectMessage,
  onDeleteMessage,
  autoRefreshEnabled,
  onToggleAutoRefresh,
  nextRefreshCountdown,
  onCopyOtp,
  copiedOtpId,
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredMessages = messages.filter((m) => {
    const term = searchTerm.toLowerCase();
    return (
      m.subject.toLowerCase().includes(term) ||
      m.from.address.toLowerCase().includes(term) ||
      (m.from.name && m.from.name.toLowerCase().includes(term))
    );
  });

  return (
    <div className="w-full max-w-4xl mx-auto px-4 pb-16">
      {/* Inbox Control Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2.5">
          <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <span>Inbox</span>
            <span className="rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs px-2.5 py-0.5 font-semibold">
              {messages.length}
            </span>
          </h2>
          {isRefreshing && (
            <span className="text-xs text-blue-600 dark:text-blue-400 flex items-center gap-1">
              <RefreshCw className="w-3 h-3 animate-spin" />
              <span>Checking...</span>
            </span>
          )}
        </div>

        {/* Search & Refresh Actions */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Search Box */}
          <div className="relative flex-1 sm:w-48 min-w-[140px]">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search emails..."
              className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>

          {/* Auto Refresh Toggle */}
          <button
            onClick={onToggleAutoRefresh}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-colors ${
              autoRefreshEnabled
                ? 'border-emerald-200 dark:border-emerald-900/60 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300'
                : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-500'
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                autoRefreshEnabled ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'
              }`}
            ></span>
            <span>Auto: {autoRefreshEnabled ? `${nextRefreshCountdown}s` : 'Off'}</span>
          </button>

          {/* Manual Refresh Button */}
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Messages List Container */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
        {isLoading && messages.length === 0 ? (
          <div className="py-20 text-center flex flex-col items-center justify-center">
            <RefreshCw className="w-8 h-8 text-blue-600 animate-spin mb-3" />
            <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
              Checking for incoming emails...
            </p>
          </div>
        ) : filteredMessages.length === 0 ? (
          <div className="py-16 px-4 text-center flex flex-col items-center justify-center">
            <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-3">
              <Inbox className="w-7 h-7 stroke-[1.5]" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              {searchTerm ? 'No matching emails found' : 'Your inbox is waiting'}
            </h3>
            <p className="mt-1 text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-sm">
              {searchTerm
                ? 'Try a different search keyword.'
                : 'Send a message or verification code to your disposable address and it will appear here automatically.'}
            </p>
            <div className="mt-4 flex items-center gap-2 text-xs text-slate-400">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
              <span>Listening for incoming messages...</span>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {filteredMessages.map((msg) => {
              const formattedDate = new Date(msg.timestamp).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              });

              return (
                <div
                  key={msg.id}
                  onClick={() => onSelectMessage(msg.id)}
                  className="group relative flex flex-col sm:flex-row sm:items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-pointer transition-colors gap-3"
                >
                  {/* Left Column: Avatar & Details */}
                  <div className="flex items-start sm:items-center gap-3.5 min-w-0 flex-1">
                    {/* Brand or Initials Avatar */}
                    <div className="shrink-0 w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center overflow-hidden">
                      {msg.serviceLogoUrl ? (
                        <img
                          src={msg.serviceLogoUrl}
                          alt="Brand icon"
                          className="w-5 h-5 object-contain"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = 'none';
                          }}
                        />
                      ) : (
                        <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
                          {msg.from.address.substring(0, 2).toUpperCase()}
                        </span>
                      )}
                    </div>

                    {/* Sender & Subject */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                        <span className="font-semibold text-slate-900 dark:text-slate-100 truncate max-w-[200px]">
                          {msg.from.name || msg.from.address}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span className="font-mono truncate">{msg.from.address}</span>
                      </div>

                      <h4 className="mt-0.5 text-sm font-semibold text-slate-900 dark:text-white truncate">
                        {msg.subject || '(No Subject)'}
                      </h4>
                    </div>
                  </div>

                  {/* Right Column: OTP Code Pill / Date / Delete */}
                  <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pl-13 sm:pl-0">
                    {/* Quick OTP Code Copy Button */}
                    {msg.detectedOtp && (
                      <button
                        onClick={(e) => onCopyOtp(msg.detectedOtp!, e)}
                        title="Copy Verification Code"
                        className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-mono font-bold hover:bg-emerald-100 dark:hover:bg-emerald-900 transition-colors shadow-xs"
                      >
                        <KeyRound className="w-3.5 h-3.5" />
                        <span>{msg.detectedOtp}</span>
                        {copiedOtpId === msg.detectedOtp ? (
                          <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                        ) : (
                          <Copy className="w-3 h-3 opacity-60" />
                        )}
                      </button>
                    )}

                    {/* Time */}
                    <div className="flex items-center gap-1 text-xs text-slate-400 whitespace-nowrap">
                      <Clock className="w-3 h-3" />
                      <span>{formattedDate}</span>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-1">
                      <button
                        onClick={(e) => onDeleteMessage(msg.id, e)}
                        title="Delete email"
                        className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 transition-all"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                      <ChevronRight className="w-4 h-4 text-slate-300 dark:text-slate-600 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
