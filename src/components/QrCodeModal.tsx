import React from 'react';
import { X, QrCode, Copy, Check } from 'lucide-react';

interface QrCodeModalProps {
  email: string;
  onClose: () => void;
  onCopyAddress: () => void;
  copied: boolean;
}

export const QrCodeModal: React.FC<QrCodeModalProps> = ({
  email,
  onClose,
  onCopyAddress,
  copied,
}) => {
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(
    email
  )}&margin=10`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="w-full max-w-sm rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden p-6 text-center"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white">
            <QrCode className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span>Scan to Mobile</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* QR Code Container */}
        <div className="mt-5 mb-4 p-4 rounded-xl bg-white border border-slate-100 inline-block shadow-inner mx-auto">
          <img
            src={qrUrl}
            alt={`QR code for ${email}`}
            className="w-48 h-48 mx-auto"
            loading="lazy"
          />
        </div>

        <div className="font-mono text-xs font-semibold text-slate-800 dark:text-slate-200 break-all select-all mb-4 px-2">
          {email}
        </div>

        <button
          onClick={onCopyAddress}
          className="w-full py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
          <span>{copied ? 'Copied Address' : 'Copy Address'}</span>
        </button>
      </div>
    </div>
  );
};
