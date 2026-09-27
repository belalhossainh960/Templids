import React, { useState } from 'react';
import { X, HelpCircle, Bell, Clock, Sun, Moon, Volume2, ChevronDown } from 'lucide-react';
import { playNotificationSound } from '../services/tempMailService';

interface SettingsModalProps {
  onClose: () => void;
  autoRefreshInterval: number;
  onChangeInterval: (sec: number) => void;
  soundEnabled: boolean;
  onToggleSound: (enabled: boolean) => void;
  darkMode: boolean;
  onToggleDarkMode: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  onClose,
  autoRefreshInterval,
  onChangeInterval,
  soundEnabled,
  onToggleSound,
  darkMode,
  onToggleDarkMode,
}) => {
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  const faqs = [
    {
      q: 'Is Tamplid Mail completely free to use?',
      a: 'Yes, Tamplid Mail is 100% free with no registration, credit card, or hidden charges. You can generate unlimited temporary email addresses anytime.',
    },
    {
      q: 'How long do temporary emails stay active?',
      a: 'Mailboxes remain active as long as the server keeps the session. In addition, your address and credentials are saved in your browser history so you can re-access recent inboxes until you choose to clear history.',
    },
    {
      q: 'Can I use this for social media and game accounts?',
      a: 'Yes! Tamplid Mail uses trusted, high-reputation domains that easily bypass common disposable email blocks. It works great for Discord, Steam, Twitter/X, Epic Games, trials, and forum registrations.',
    },
    {
      q: 'How does the Smart OTP detection work?',
      a: 'Tamplid Mail automatically parses incoming email subjects and body text for standard 4-to-8 digit verification codes and prefixed OTP tokens (like FB-12345 or G-98214) and provides a prominent 1-click copy button.',
    },
    {
      q: 'Can I send outbound emails from this address?',
      a: 'No. Tamplid Mail is strictly a receive-only disposable email service engineered to protect your personal privacy from spam, tracking, and unsolicited promotions.',
    },
    {
      q: 'How do I recover an address I used earlier?',
      a: 'Open the "History" tab in the top navigation. Any mailbox generated or customized during your browsing sessions is cataloged with optional custom labels for easy one-click switching.',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="w-full max-w-2xl rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden max-h-[88vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2 text-base font-bold text-slate-900 dark:text-white">
            <HelpCircle className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <span>Settings & FAQ</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Preferences Section */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
              Preferences
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Auto Refresh Speed */}
              <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 flex flex-col justify-between">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                    Auto-check Frequency
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  {[5, 10, 15, 30].map((sec) => (
                    <button
                      key={sec}
                      onClick={() => onChangeInterval(sec)}
                      className={`flex-1 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                        autoRefreshInterval === sec
                          ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                          : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100'
                      }`}
                    >
                      {sec}s
                    </button>
                  ))}
                </div>
              </div>

              {/* Sound Notifications */}
              <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Bell className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <div>
                    <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                      Sound Chime
                    </div>
                    <div className="text-[11px] text-slate-400">
                      Alert on new email
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => playNotificationSound()}
                    title="Test chime"
                    className="p-1.5 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400"
                  >
                    <Volume2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onToggleSound(!soundEnabled)}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      soundEnabled ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-700'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                        soundEnabled ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* Theme Toggle */}
              <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 flex items-center justify-between sm:col-span-2">
                <div className="flex items-center gap-2.5">
                  {darkMode ? <Moon className="w-4 h-4 text-blue-400" /> : <Sun className="w-4 h-4 text-amber-500" />}
                  <div>
                    <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                      Color Theme
                    </div>
                    <div className="text-[11px] text-slate-400">
                      Currently using {darkMode ? 'Dark Mode' : 'Light Mode'}
                    </div>
                  </div>
                </div>

                <button
                  onClick={onToggleDarkMode}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  Switch to {darkMode ? 'Light' : 'Dark'}
                </button>
              </div>
            </div>
          </div>

          {/* FAQ Accordion Section */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
              Frequently Asked Questions
            </h3>
            <div className="space-y-2">
              {faqs.map((faq, idx) => {
                const isOpen = openFaqIndex === idx;
                return (
                  <div
                    key={idx}
                    className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden bg-slate-50/30 dark:bg-slate-950/30 transition-all"
                  >
                    <button
                      onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                      className="w-full px-4 py-3 text-left flex items-center justify-between gap-3 text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                    >
                      <span>{faq.q}</span>
                      <ChevronDown
                        className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200 ${
                          isOpen ? 'rotate-180 text-blue-600' : ''
                        }`}
                      />
                    </button>
                    {isOpen && (
                      <div className="px-4 pb-3.5 pt-1 text-xs sm:text-sm text-slate-600 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800/60 leading-relaxed">
                        {faq.a}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
