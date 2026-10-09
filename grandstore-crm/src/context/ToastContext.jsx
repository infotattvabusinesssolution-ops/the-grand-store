import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((type, message, title = '') => {
    const id = Date.now().toString() + Math.random().toString(36).substring(2, 6);
    setToasts((prev) => [...prev, { id, type, message, title }]);

    // Auto dismiss after 4.5 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const success = useCallback((message, title = 'Success') => addToast('success', message, title), [addToast]);
  const error = useCallback((message, title = 'Attention Required') => addToast('error', message, title), [addToast]);
  const warning = useCallback((message, title = 'Warning') => addToast('warning', message, title), [addToast]);
  const info = useCallback((message, title = 'Notice') => addToast('info', message, title), [addToast]);

  return (
    <ToastContext.Provider value={{ success, error, warning, info }}>
      {children}

      {/* Toast Notification Container */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none">
        {toasts.map((toast) => {
          const config = {
            success: {
              border: 'border-emerald-300/80 bg-white/95 text-emerald-950',
              icon: <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />,
              badge: 'bg-emerald-100 text-emerald-800'
            },
            error: {
              border: 'border-rose-300/80 bg-white/95 text-rose-950',
              icon: <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />,
              badge: 'bg-rose-100 text-rose-800'
            },
            warning: {
              border: 'border-amber-300/80 bg-white/95 text-amber-950',
              icon: <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />,
              badge: 'bg-amber-100 text-amber-800'
            },
            info: {
              border: 'border-blue-300/80 bg-white/95 text-blue-950',
              icon: <Info className="w-5 h-5 text-blue-600 shrink-0" />,
              badge: 'bg-blue-100 text-blue-800'
            }
          }[toast.type] || {
            border: 'border-slate-300 bg-white text-slate-900',
            icon: <Info className="w-5 h-5 text-slate-600 shrink-0" />,
            badge: 'bg-slate-100 text-slate-800'
          };

          return (
            <div
              key={toast.id}
              className={`pointer-events-auto p-4 rounded-2xl shadow-xl shadow-slate-900/10 border ${config.border} backdrop-blur-md flex items-start gap-3 transition-all animate-in fade-in slide-in-from-bottom-2 duration-200`}
            >
              {config.icon}
              <div className="flex-1 min-w-0">
                {toast.title && (
                  <h4 className="text-xs font-bold tracking-tight mb-0.5">{toast.title}</h4>
                )}
                <p className="text-xs text-slate-600 leading-relaxed font-medium break-words">
                  {toast.message}
                </p>
              </div>
              <button
                onClick={() => removeToast(toast.id)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors shrink-0"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
