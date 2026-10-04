import React from 'react';
import { useApp } from '../../context/AppContext';
import { RotateCcw, X } from 'lucide-react';

export const Toast: React.FC = () => {
  const { toast, dismissToast } = useApp();

  if (!toast) return null;

  return (
    <div className="fixed bottom-20 sm:bottom-6 inset-x-0 z-50 flex justify-center px-4 pointer-events-none animate-in fade-in slide-in-from-bottom-3 duration-200">
      <div className="pointer-events-auto max-w-sm w-full bg-slate-900/95 dark:bg-slate-800/95 text-white backdrop-blur-md px-4 py-3 rounded-2xl shadow-2xl border border-slate-700/80 dark:border-slate-700/90 flex items-center justify-between gap-3 text-xs sm:text-sm">
        <span className="font-semibold text-slate-100 dark:text-slate-100 truncate">
          {toast.message}
        </span>
        <div className="flex items-center gap-2 shrink-0">
          {toast.actionLabel && toast.onAction && (
            <button
              type="button"
              onClick={() => {
                toast.onAction?.();
                dismissToast();
              }}
              className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-95 text-white font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
            >
              <RotateCcw size={13} className="shrink-0" />
              <span>{toast.actionLabel}</span>
            </button>
          )}
          <button
            type="button"
            onClick={dismissToast}
            className="p-1 text-slate-400 hover:text-white dark:hover:text-slate-200 rounded-lg transition-colors cursor-pointer"
            aria-label="Dismiss"
          >
            <X size={15} />
          </button>
        </div>
      </div>
    </div>
  );
};
