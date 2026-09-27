import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Header } from './components/Header';
import { MailboxHero } from './components/MailboxHero';
import { InboxList } from './components/InboxList';
import { EmailDetailModal } from './components/EmailDetailModal';
import { HistoryModal } from './components/HistoryModal';
import { CustomPrefixModal } from './components/CustomPrefixModal';
import { QrCodeModal } from './components/QrCodeModal';
import { SettingsModal } from './components/SettingsModal';
import { ToastContainer, ToastData } from './components/Toast';
import { Footer } from './components/Footer';
import { EmailMessage, SavedMailbox } from './types';
import {
  generateNewMailbox,
  fetchInboxMessages,
  fetchFullMessage,
  deleteEmailMessage,
  fetchAvailableDomains,
  playNotificationSound,
  GUERRILLA_DOMAINS,
  ONESEC_DOMAINS,
} from './services/tempMailService';

export default function App() {
  // Theme state
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('templi_theme');
    if (saved) return saved === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  // Provider state: default to Guerrilla Mail as requested
  const [provider, setProvider] = useState<'guerrilla' | '1sec'>('guerrilla');

  // Sticky selected domain state
  const [selectedDomain, setSelectedDomain] = useState<string>(() => {
    const saved = localStorage.getItem('templi_selected_domain');
    if (saved) return saved;
    return 'guerrillamailblock.com';
  });

  // Mailbox & Message state
  const [currentMailbox, setCurrentMailbox] = useState<SavedMailbox | null>(null);
  const [availableDomains, setAvailableDomains] = useState<string[]>(GUERRILLA_DOMAINS);
  const [messages, setMessages] = useState<EmailMessage[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [copiedAddress, setCopiedAddress] = useState(false);

  // Keep selectedDomain auto-synchronized with active mailbox domain
  useEffect(() => {
    if (currentMailbox?.domain) {
      setSelectedDomain(currentMailbox.domain);
      localStorage.setItem('templi_selected_domain', currentMailbox.domain);
    }
  }, [currentMailbox?.domain]);

  // Detail Modal state
  const [selectedMessage, setSelectedMessage] = useState<EmailMessage | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [copiedOtpId, setCopiedOtpId] = useState<string | null>(null);

  // Settings & Navigation state
  const [activeTab, setActiveTab] = useState<'inbox' | 'history' | 'settings'>('inbox');
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(true);
  const [autoRefreshInterval, setAutoRefreshInterval] = useState(10);
  const [nextRefreshCountdown, setNextRefreshCountdown] = useState(10);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Modal dialogs
  const [customModalOpen, setCustomModalOpen] = useState(false);
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);

  // History state
  const [history, setHistory] = useState<SavedMailbox[]>(() => {
    try {
      const saved = localStorage.getItem('templi_history');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Toasts
  const [toasts, setToasts] = useState<ToastData[]>([]);
  const seenMessageIds = useRef<Set<string>>(new Set());

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  }, []);

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Sync dark mode class
  useEffect(() => {
    const root = document.documentElement;
    if (darkMode) {
      root.classList.add('dark');
      document.body.classList.add('dark');
      root.style.colorScheme = 'dark';
      localStorage.setItem('templi_theme', 'dark');
    } else {
      root.classList.remove('dark');
      document.body.classList.remove('dark');
      root.style.colorScheme = 'light';
      localStorage.setItem('templi_theme', 'light');
    }
  }, [darkMode]);

  const toggleDarkMode = () => setDarkMode((prev) => !prev);

  // Sync domains on provider change
  useEffect(() => {
    fetchAvailableDomains(provider).then((domains) => {
      if (domains.length > 0) setAvailableDomains(domains);
    });
  }, [provider]);

  // Save history to localStorage
  const saveMailboxToHistory = useCallback((mailbox: SavedMailbox) => {
    setHistory((prev) => {
      const filtered = prev.filter((m) => m.address !== mailbox.address);
      const updated = [mailbox, ...filtered].slice(0, 25);
      localStorage.setItem('templi_history', JSON.stringify(updated));
      return updated;
    });
  }, []);

  // Check inbox messages
  const checkMessages = useCallback(
    async (isManual = false) => {
      if (!currentMailbox) return;
      if (isManual) setIsRefreshing(true);

      try {
        const fetched = await fetchInboxMessages(currentMailbox);
        let hasNew = false;

        fetched.forEach((msg) => {
          if (!seenMessageIds.current.has(msg.id)) {
            seenMessageIds.current.add(msg.id);
            hasNew = true;
          }
        });

        setMessages(fetched);

        if (hasNew && seenMessageIds.current.size > 0 && !isManual) {
          if (soundEnabled) playNotificationSound();
          showToast(`New email received!`, 'success');
        } else if (isManual) {
          showToast(fetched.length > 0 ? `Updated: ${fetched.length} email(s)` : 'No new messages found.', 'info');
        }
      } catch (err: any) {
        console.warn('Error checking messages:', err);
        if (isManual) showToast('Failed to connect to inbox service', 'error');
      } finally {
        if (isManual) setIsRefreshing(false);
      }
    },
    [currentMailbox, showToast, soundEnabled]
  );

  // Initialize mailbox
  useEffect(() => {
    const hash = window.location.hash;
    if (hash.startsWith('#mail=')) {
      try {
        const address = decodeURIComponent(hash.replace('#mail=', ''));
        const [login, domain] = address.split('@');
        if (login && domain) {
          const mailbox: SavedMailbox = {
            address,
            login,
            domain,
            provider: 'guerrilla',
            createdAt: Date.now(),
            lastUsedAt: Date.now(),
          };
          setCurrentMailbox(mailbox);
          saveMailboxToHistory(mailbox);
          showToast(`Connected to shared mailbox: ${address}`, 'success');
          return;
        }
      } catch {
        // fallback
      }
    }

    const savedLast = localStorage.getItem('templi_active_mailbox');
    if (savedLast) {
      try {
        const parsed = JSON.parse(savedLast);
        if (parsed.address && parsed.login && parsed.domain) {
          setCurrentMailbox(parsed);
          setProvider(parsed.provider || 'guerrilla');
          setSelectedDomain(parsed.domain);
          return;
        }
      } catch {
        // fallback
      }
    }

    // Default: generate initial Guerrilla Mail mailbox with selected domain
    handleGenerateNew('guerrilla', undefined, selectedDomain);
  }, [saveMailboxToHistory, showToast]);

  // Save current active mailbox
  useEffect(() => {
    if (currentMailbox) {
      localStorage.setItem('templi_active_mailbox', JSON.stringify(currentMailbox));
      seenMessageIds.current.clear();
      setMessages([]);
      checkMessages(false);
    }
  }, [currentMailbox]);

  // Auto-refresh countdown loop
  useEffect(() => {
    if (!autoRefreshEnabled || !currentMailbox) return;

    setNextRefreshCountdown(autoRefreshInterval);
    const interval = setInterval(() => {
      setNextRefreshCountdown((prev) => {
        if (prev <= 1) {
          checkMessages(false);
          return autoRefreshInterval;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [autoRefreshEnabled, autoRefreshInterval, currentMailbox, checkMessages]);

  // Actions
  const handleGenerateNew = async (
    targetProvider: 'guerrilla' | '1sec' = provider,
    customUser?: string,
    customDom?: string
  ) => {
    setIsGenerating(true);
    // Auto-detect domain: prefer customDom -> active mailbox domain -> selectedDomain -> default
    const domainToUse = customDom || currentMailbox?.domain || selectedDomain || (targetProvider === 'guerrilla' ? 'guerrillamailblock.com' : '1secmail.com');
    try {
      const mb = await generateNewMailbox(
        targetProvider,
        customUser,
        domainToUse,
        customUser && targetProvider === currentMailbox?.provider ? currentMailbox?.sidToken : undefined
      );
      setProvider(targetProvider);
      setSelectedDomain(domainToUse);
      localStorage.setItem('templi_selected_domain', domainToUse);
      setCurrentMailbox(mb);
      saveMailboxToHistory(mb);
      showToast(
        customUser
          ? `Custom address ${mb.address} set!`
          : targetProvider === 'guerrilla'
          ? `New random Tamplid Mail address: ${mb.address}`
          : `New random 1SecMail address: ${mb.address}`,
        'success'
      );
    } catch {
      showToast('Could not create mailbox. Please retry.', 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyAddress = (addressToCopy?: string) => {
    const target = addressToCopy || currentMailbox?.address;
    if (!target) return;
    navigator.clipboard.writeText(target);
    setCopiedAddress(true);
    showToast('Email address copied to clipboard!', 'success');
    setTimeout(() => setCopiedAddress(false), 2000);
  };

  const handleCopyOtp = (otp: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    navigator.clipboard.writeText(otp);
    setCopiedOtpId(otp);
    showToast(`Verification code ${otp} copied!`, 'success');
    setTimeout(() => setCopiedOtpId(null), 2500);
  };

  const handleSelectMessage = async (id: string) => {
    if (!currentMailbox) return;
    const existing = messages.find((m) => m.id === id);
    setSelectedMessage(existing || null);
    setIsLoadingDetail(true);

    try {
      const full = await fetchFullMessage(currentMailbox, id);
      setSelectedMessage(full);
      setMessages((prev) =>
        prev.map((m) => (m.id === id ? { ...m, isRead: true } : m))
      );
    } catch {
      showToast('Could not load full email content.', 'error');
    } finally {
      setIsLoadingDetail(false);
    }
  };

  const handleDeleteMessage = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentMailbox) return;
    setMessages((prev) => prev.filter((m) => m.id !== id));
    showToast('Deleting message...', 'info');
    await deleteEmailMessage(currentMailbox, id);
    showToast('Message deleted', 'success');
  };

  const handleShareLink = () => {
    if (!currentMailbox) return;
    const url = `${window.location.origin}${window.location.pathname}#mail=${encodeURIComponent(
      currentMailbox.address
    )}`;
    navigator.clipboard.writeText(url);
    showToast('Shareable mailbox URL copied!', 'success');
  };

  const handleChangeDomain = (newDomain: string) => {
    setSelectedDomain(newDomain);
    localStorage.setItem('templi_selected_domain', newDomain);

    if (currentMailbox) {
      // Instantly switch domain on the current mailbox!
      const updated: SavedMailbox = {
        ...currentMailbox,
        domain: newDomain,
        address: `${currentMailbox.login}@${newDomain}`,
      };
      setCurrentMailbox(updated);
      saveMailboxToHistory(updated);
      showToast(`Domain switched to @${newDomain}`, 'success');
    } else {
      handleGenerateNew(provider, undefined, newDomain);
    }
  };

  const handleChangeProvider = (newProv: 'guerrilla' | '1sec') => {
    if (newProv === provider) return;
    const defaultDom = newProv === 'guerrilla' ? 'guerrillamailblock.com' : '1secmail.com';
    setProvider(newProv);
    setSelectedDomain(defaultDom);
    localStorage.setItem('templi_selected_domain', defaultDom);
    handleGenerateNew(newProv, undefined, defaultDom);
  };

  const handleDeleteHistoryItem = (address: string) => {
    setHistory((prev) => {
      const updated = prev.filter((m) => m.address !== address);
      localStorage.setItem('templi_history', JSON.stringify(updated));
      return updated;
    });
    showToast('Removed from history', 'info');
  };

  const handleClearHistory = () => {
    setHistory([]);
    localStorage.removeItem('templi_history');
    showToast('History cleared', 'info');
  };

  const handleUpdateHistoryLabel = (address: string, newLabel: string) => {
    setHistory((prev) => {
      const updated = prev.map((m) => (m.address === address ? { ...m, label: newLabel } : m));
      localStorage.setItem('templi_history', JSON.stringify(updated));
      return updated;
    });
    if (currentMailbox?.address === address) {
      setCurrentMailbox((prev) => (prev ? { ...prev, label: newLabel } : null));
    }
    showToast('Label updated', 'success');
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100 transition-colors">
      {/* Top Header */}
      <Header
        darkMode={darkMode}
        onToggleDarkMode={toggleDarkMode}
        onOpenHistory={() => setHistoryModalOpen(true)}
        onOpenSettings={() => setSettingsModalOpen(true)}
        onNewEmail={() => handleGenerateNew(provider, undefined, currentMailbox?.domain || selectedDomain)}
        historyCount={history.length}
        activeTab={activeTab}
        setActiveTab={(tab) => {
          setActiveTab(tab);
          if (tab === 'history') setHistoryModalOpen(true);
          if (tab === 'settings') setSettingsModalOpen(true);
        }}
      />

      {/* Main Container */}
      <main className="flex-1 w-full max-w-6xl mx-auto flex flex-col">
        {/* Hero Section & Email Address Controls */}
        <MailboxHero
          currentMailbox={currentMailbox}
          isLoading={isGenerating}
          onGenerateNew={() => handleGenerateNew(provider, undefined, currentMailbox?.domain || selectedDomain)}
          onOpenCustomModal={() => setCustomModalOpen(true)}
          onOpenQrModal={() => setQrModalOpen(true)}
          onShareLink={handleShareLink}
          availableDomains={availableDomains}
          onChangeDomain={handleChangeDomain}
          onCopyAddress={handleCopyAddress}
          copied={copiedAddress}
          provider={provider}
          onChangeProvider={handleChangeProvider}
          selectedDomain={selectedDomain}
        />

        {/* Real-Time Inbox Section */}
        <InboxList
          messages={messages}
          isLoading={isGenerating}
          isRefreshing={isRefreshing}
          onRefresh={() => checkMessages(true)}
          onSelectMessage={handleSelectMessage}
          onDeleteMessage={handleDeleteMessage}
          autoRefreshEnabled={autoRefreshEnabled}
          onToggleAutoRefresh={() => setAutoRefreshEnabled(!autoRefreshEnabled)}
          nextRefreshCountdown={nextRefreshCountdown}
          onCopyOtp={handleCopyOtp}
          copiedOtpId={copiedOtpId}
        />
      </main>

      {/* Footer */}
      <Footer
        onOpenSettings={() => setSettingsModalOpen(true)}
        onOpenHistory={() => setHistoryModalOpen(true)}
      />

      {/* Email Reader Modal */}
      {selectedMessage && (
        <EmailDetailModal
          message={selectedMessage}
          isLoading={isLoadingDetail}
          onClose={() => setSelectedMessage(null)}
          onCopyOtp={(otp) => handleCopyOtp(otp)}
          copiedOtpId={copiedOtpId}
        />
      )}

      {/* Custom Username & Domain Modal */}
      {customModalOpen && (
        <CustomPrefixModal
          currentUsername={currentMailbox?.login || ''}
          currentDomain={currentMailbox?.domain || availableDomains[0]}
          availableDomains={availableDomains}
          onSubmit={(user, dom) => handleGenerateNew(provider, user, dom)}
          onClose={() => setCustomModalOpen(false)}
          provider={provider}
        />
      )}

      {/* QR Code Modal */}
      {qrModalOpen && currentMailbox && (
        <QrCodeModal
          email={currentMailbox.address}
          onClose={() => setQrModalOpen(false)}
          onCopyAddress={() => handleCopyAddress()}
          copied={copiedAddress}
        />
      )}

      {/* History Modal */}
      {historyModalOpen && (
        <HistoryModal
          history={history}
          currentAddress={currentMailbox?.address}
          onSelectMailbox={(mb) => {
            setCurrentMailbox(mb);
            setProvider(mb.provider || 'guerrilla');
            if (mb.domain) {
              setSelectedDomain(mb.domain);
              localStorage.setItem('templi_selected_domain', mb.domain);
            }
            showToast(`Switched to ${mb.address}`, 'success');
          }}
          onDeleteMailbox={handleDeleteHistoryItem}
          onClearHistory={handleClearHistory}
          onUpdateLabel={handleUpdateHistoryLabel}
          onClose={() => setHistoryModalOpen(false)}
          onCopyAddress={handleCopyAddress}
        />
      )}

      {/* Settings & FAQ Modal */}
      {settingsModalOpen && (
        <SettingsModal
          onClose={() => setSettingsModalOpen(false)}
          autoRefreshInterval={autoRefreshInterval}
          onChangeInterval={(sec) => setAutoRefreshInterval(sec)}
          soundEnabled={soundEnabled}
          onToggleSound={(en) => setSoundEnabled(en)}
          darkMode={darkMode}
          onToggleDarkMode={toggleDarkMode}
        />
      )}

      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
