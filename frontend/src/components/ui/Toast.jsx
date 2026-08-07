import { createContext, useCallback, useContext, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

const ToastContext = createContext(null);

const VARIANTS = {
  info:    { icon: Info,        classes: 'border-line bg-panel text-ink' },
  success: { icon: CheckCircle2, classes: 'border-success/30 bg-success-tint text-success' },
  error:   { icon: AlertCircle,  classes: 'border-error/30 bg-error-tint text-error' },
};

/** Wrap the app once; call `useToast()` anywhere below to push toasts. Auto-dismisses in 4s. */
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const idRef = useRef(0);

  const dismiss = useCallback((id) => {
    setToasts((list) => list.filter((t) => t.id !== id));
  }, []);

  const push = useCallback((message, variant = 'info') => {
    const id = ++idRef.current;
    setToasts((list) => [...list, { id, message, variant }]);
    setTimeout(() => dismiss(id), 4000);
    return id;
  }, [dismiss]);

  return (
    <ToastContext.Provider value={push}>
      {children}
      {createPortal(
        <div
          className="fixed inset-x-0 bottom-0 z-[1000] flex flex-col items-center gap-2 p-4 sm:items-end"
          aria-live="polite"
          role="status"
        >
          {toasts.map((t) => {
            const { icon: Icon, classes } = VARIANTS[t.variant] || VARIANTS.info;
            return (
              <div
                key={t.id}
                className={`animate-rise-in flex w-full max-w-sm items-start gap-3 rounded-sm border px-4 py-3 shadow-(--shadow-hover) ${classes}`}
              >
                <Icon className="size-4.5 flex-none" aria-hidden="true" />
                <p className="flex-1 text-sm">{t.message}</p>
                <button
                  type="button"
                  onClick={() => dismiss(t.id)}
                  aria-label="Yopish"
                  className="flex-none text-current opacity-60 transition-opacity duration-150 ease-swiss hover:opacity-100"
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

/** Returns a `push(message, variant)` function, variant: 'info' | 'success' | 'error'. */
export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within a ToastProvider');
  return ctx;
}
