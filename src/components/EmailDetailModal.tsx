import React, { useState, useEffect, useRef } from 'react';
import { X, ArrowLeft, Copy, Check, Download, Printer, KeyRound, Code, Eye, RefreshCw } from 'lucide-react';
import { EmailMessage } from '../types';

interface EmailDetailModalProps {
  message: EmailMessage | null;
  isLoading: boolean;
  onClose: () => void;
  onCopyOtp: (otp: string) => void;
  copiedOtpId: string | null;
}

export const EmailDetailModal: React.FC<EmailDetailModalProps> = ({
  message,
  isLoading,
  onClose,
  onCopyOtp,
  copiedOtpId,
}) => {
  const [viewMode, setViewMode] = useState<'html' | 'text'>('html');
  const [copiedText, setCopiedText] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Auto-resize or fill iframe safely
  useEffect(() => {
    if (message && viewMode === 'html' && iframeRef.current) {
      const doc = iframeRef.current.contentDocument;
      if (doc) {
        doc.open();
        // Inject clean default font styling for unstyled html emails
        const content = `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <style>
                body {
                  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
                  color: #1e293b;
                  background-color: #ffffff;
                  margin: 0;
                  padding: 16px;
                  line-height: 1.6;
                  word-break: break-word;
                }
                a { color: #2563eb; }
                img { max-width: 100%; height: auto; }
              </style>
            </head>
            <body>
              ${message.htmlBody || `<pre style="font-family: inherit; white-space: pre-wrap;">${message.textBody || 'No message content'}</pre>`}
            </body>
          </html>
        `;
        doc.write(content);
        doc.close();
      }
    }
  }, [message, viewMode]);

  if (!message && !isLoading) return null;

  const handleDownload = () => {
    if (!message) return;
    const content = `From: ${message.from.address}\nSubject: ${message.subject}\nDate: ${message.date}\n\n${message.textBody || message.htmlBody || ''}`;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `email_${message.id}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopyRaw = () => {
    if (!message) return;
    const text = message.textBody || message.htmlBody?.replace(/<[^>]*>/g, '') || '';
    navigator.clipboard.writeText(text);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="w-full max-w-3xl max-h-[92vh] flex flex-col rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          <button
            onClick={onClose}
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-white dark:hover:bg-slate-800 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Inbox</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyRaw}
              title="Copy plain text content"
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              {copiedText ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">{copiedText ? 'Copied' : 'Copy Text'}</span>
            </button>

            <button
              onClick={handleDownload}
              title="Download email"
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Download</span>
            </button>

            <button
              onClick={() => window.print()}
              title="Print message"
              className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <Printer className="w-4 h-4" />
            </button>

            <button
              onClick={onClose}
              title="Close modal"
              className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        {isLoading ? (
          <div className="py-24 text-center flex flex-col items-center justify-center">
            <RefreshCw className="w-8 h-8 text-blue-600 animate-spin mb-3" />
            <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
              Loading message content...
            </p>
          </div>
        ) : message ? (
          <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
            {/* OTP Banner Highlight */}
            {message.detectedOtp && (
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/80">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                    <KeyRound className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider">
                      Detected Verification Code
                    </div>
                    <div className="font-mono text-xl sm:text-2xl font-extrabold text-emerald-900 dark:text-emerald-100 tracking-wider">
                      {message.detectedOtp}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => onCopyOtp(message.detectedOtp!)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition-all active:scale-95"
                >
                  {copiedOtpId === message.detectedOtp ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedOtpId === message.detectedOtp ? 'Code Copied!' : 'Copy Code'}</span>
                </button>
              </div>
            )}

            {/* Email Meta Info */}
            <div className="pb-4 border-b border-slate-100 dark:border-slate-800 space-y-2">
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white leading-snug">
                {message.subject || '(No Subject)'}
              </h2>

              <div className="flex flex-wrap items-center justify-between text-xs text-slate-500 dark:text-slate-400 gap-2">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-700 dark:text-slate-200">
                    {message.from.name || message.from.address}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span className="font-mono text-slate-500">{message.from.address}</span>
                </div>
                <div className="text-slate-400">
                  {new Date(message.timestamp).toLocaleString()}
                </div>
              </div>
            </div>

            {/* View Mode Toggle: HTML vs Plain Text */}
            <div className="flex items-center justify-between pt-1">
              <div className="inline-flex rounded-lg border border-slate-200 dark:border-slate-800 p-0.5 bg-slate-50 dark:bg-slate-950 text-xs">
                <button
                  onClick={() => setViewMode('html')}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-md font-medium transition-colors ${
                    viewMode === 'html'
                      ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Formatted HTML</span>
                </button>
                <button
                  onClick={() => setViewMode('text')}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-md font-medium transition-colors ${
                    viewMode === 'text'
                      ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  <Code className="w-3.5 h-3.5" />
                  <span>Plain Text</span>
                </button>
              </div>
            </div>

            {/* Email Rendered Container */}
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden bg-white dark:bg-slate-950 min-h-[300px]">
              {viewMode === 'html' ? (
                <iframe
                  ref={iframeRef}
                  title="Email Content"
                  sandbox="allow-same-origin allow-popups"
                  className="w-full h-[450px] border-none bg-white"
                />
              ) : (
                <div className="p-4 font-mono text-xs sm:text-sm text-slate-800 dark:text-slate-200 whitespace-pre-wrap overflow-x-auto leading-relaxed">
                  {message.textBody || message.htmlBody?.replace(/<[^>]*>/g, '') || 'Empty message content.'}
                </div>
              )}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};
