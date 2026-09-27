import React, { useState } from 'react';
import { X, History, Trash2, Edit2, Check, ArrowRight, Copy } from 'lucide-react';
import { SavedMailbox } from '../types';

interface HistoryModalProps {
  history: SavedMailbox[];
  currentAddress?: string;
  onSelectMailbox: (mailbox: SavedMailbox) => void;
  onDeleteMailbox: (address: string) => void;
  onClearHistory: () => void;
  onUpdateLabel: (address: string, newLabel: string) => void;
  onClose: () => void;
  onCopyAddress: (address: string) => void;
}

export const HistoryModal: React.FC<HistoryModalProps> = ({
  history,
  currentAddress,
  onSelectMailbox,
  onDeleteMailbox,
  onClearHistory,
  onUpdateLabel,
  onClose,
  onCopyAddress,
}) => {
  const [editingAddress, setEditingAddress] = useState<string | null>(null);
  const [labelInput, setLabelInput] = useState('');

  const startEdit = (mb: SavedMailbox) => {
    setEditingAddress(mb.address);
    setLabelInput(mb.label || '');
  };

  const saveEdit = (address: string) => {
    onUpdateLabel(address, labelInput.trim());
    setEditingAddress(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-base">
            <History className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span>Mailbox History</span>
            <span className="text-xs font-normal text-slate-400">({history.length})</span>
          </div>

          <div className="flex items-center gap-2">
            {history.length > 0 && (
              <button
                onClick={onClearHistory}
                className="text-xs text-red-500 hover:text-red-700 hover:underline px-2 py-1"
              >
                Clear All
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content list */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
          {history.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-sm">
              <History className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p>No saved mailboxes yet.</p>
              <p className="text-xs text-slate-500 mt-1">
                Addresses you generate or customize will be saved here automatically.
              </p>
            </div>
          ) : (
            history.map((item) => {
              const isCurrent = item.address === currentAddress;
              const isEditing = editingAddress === item.address;

              return (
                <div
                  key={item.address}
                  className={`p-3.5 rounded-xl border transition-all ${
                    isCurrent
                      ? 'border-blue-500/50 bg-blue-50/50 dark:bg-blue-950/20'
                      : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900 hover:bg-slate-100/60 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      {/* Label row */}
                      {isEditing ? (
                        <div className="flex items-center gap-1.5 mb-1.5">
                          <input
                            type="text"
                            value={labelInput}
                            onChange={(e) => setLabelInput(e.target.value)}
                            placeholder="e.g. Netflix, Discord, Personal..."
                            className="text-xs px-2 py-1 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                            autoFocus
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') saveEdit(item.address);
                              if (e.key === 'Escape') setEditingAddress(null);
                            }}
                          />
                          <button
                            onClick={() => saveEdit(item.address)}
                            className="p-1 rounded bg-blue-600 text-white hover:bg-blue-700"
                          >
                            <Check className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 mb-1">
                          {item.label ? (
                            <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">
                              {item.label}
                            </span>
                          ) : (
                            <span className="text-[11px] text-slate-400 italic">No label</span>
                          )}
                          <button
                            onClick={() => startEdit(item)}
                            title="Edit label"
                            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                          >
                            <Edit2 className="w-2.5 h-2.5" />
                          </button>
                        </div>
                      )}

                      {/* Address */}
                      <div className="font-mono text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
                        {item.address}
                      </div>

                      {/* Created date */}
                      <div className="text-[11px] text-slate-400 mt-1">
                        Created {new Date(item.createdAt).toLocaleDateString()}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => onCopyAddress(item.address)}
                        title="Copy address"
                        className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>

                      {!isCurrent && (
                        <button
                          onClick={() => {
                            onSelectMailbox(item);
                            onClose();
                          }}
                          title="Switch to this mailbox"
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium transition-colors"
                        >
                          <span>Switch</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      )}

                      <button
                        onClick={() => onDeleteMailbox(item.address)}
                        title="Delete from history"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
