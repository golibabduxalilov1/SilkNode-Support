import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { CheckCircle2, AlertTriangle, XCircle, Info, X } from 'lucide-react';
import { cn } from '../lib/cn.js';

const ToastContext = createContext(null);

const ICONS = {
  neutral: Info,
  positive: CheckCircle2,
  caution: AlertTriangle,
  critical: XCircle,
  informative: Info,
};

const ICON_COLOR = {
  neutral: 'text-fg-secondary',
  positive: 'text-success',
  caution: 'text-warning',
  critical: 'text-error',
  informative: 'text-info',
};

/** ToastProvider — mount once near the app root; children get `useToast()`. */
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const timers = useRef(new Map());

  const dismiss = useCallback((id) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
    clearTimeout(timers.current.get(id));
    timers.current.delete(id);
  }, []);

  const push = useCallback(
    ({ variant = 'neutral', title, description, duration = 5000 } = {}) => {
      const id = crypto.randomUUID();
      setToasts((current) => [...current, { id, variant, title, description }]);
      if (duration > 0) {
        timers.current.set(
          id,
          setTimeout(() => dismiss(id), duration)
        );
      }
      return id;
    },
    [dismiss]
  );

  const value = useMemo(() => ({ push, dismiss }), [push, dismiss]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      {createPortal(
        <div className="pointer-events-none fixed bottom-5 right-5 z-[60] flex w-full max-w-sm flex-col gap-2.5">
          {toasts.map((toast) => {
            const Icon = ICONS[toast.variant];
            return (
              <div
                key={toast.id}
                role="status"
                className={cn(
                  'animate-fade-rise pointer-events-auto flex items-start gap-3 rounded-md border border-border bg-panel p-4 shadow-[0_8px_24px_rgba(0,0,0,0.12)]'
                )}
              >
                <Icon className={cn('mt-0.5 size-4.5 shrink-0', ICON_COLOR[toast.variant])} aria-hidden="true" />
                <div className="flex-1 min-w-0">
                  {toast.title && <p className="text-[14px] font-medium text-fg">{toast.title}</p>}
                  {toast.description && <p className="mt-0.5 text-[13px] text-fg-muted">{toast.description}</p>}
                </div>
                <button
                  type="button"
                  aria-label="Dismiss"
                  onClick={() => dismiss(toast.id)}
                  className="text-fg-muted transition-colors duration-150 hover:text-fg focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2"
                >
                  <X className="size-4" aria-hidden="true" />
                </button>
              </div>
            );
          })}
        </div>,
        document.body
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within a ToastProvider');
  return context;
}
