import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import IconButton from './IconButton.jsx';

/**
 * Centered dialog with backdrop. Closes on Escape and backdrop click.
 * Use for forms, details, and — combined with a danger Button in `footer` —
 * confirmation of destructive actions.
 */
export default function Modal({ open, onClose, title, children, footer, size = 'md' }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === 'Escape' && onClose?.();
    document.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

  if (!open) return null;

  const widths = { sm: 'max-w-sm', md: 'max-w-md', lg: 'max-w-2xl' };

  return createPortal(
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-5">
      <div
        className="animate-rise-in absolute inset-0 bg-ink/50"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? 'modal-title' : undefined}
        className={`animate-scale-in relative w-full ${widths[size]} rounded-md border border-line bg-panel shadow-(--shadow-hover)`}
      >
        <div className="flex items-center justify-between gap-4 border-b border-line px-5 py-4">
          <h2 id="modal-title" className="font-display text-lg font-semibold tracking-tight text-ink">{title}</h2>
          <IconButton icon={X} label="Yopish" onClick={onClose} />
        </div>
        <div className="px-5 py-5">{children}</div>
        {footer && <div className="flex items-center justify-end gap-3 border-t border-line px-5 py-4">{footer}</div>}
      </div>
    </div>,
    document.body
  );
}
