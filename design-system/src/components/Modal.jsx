import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { cn } from '../lib/cn.js';
import { IconButton } from './IconButton.jsx';
import { Button } from './Button.jsx';

/**
 * Modal — overlay dialog. Closes on ESC and overlay click, scales in from
 * 0.97. For destructive confirmations pass `variant="destructive"` to the
 * confirm action rendered via the `footer` prop.
 */
export function Modal({ open, onClose, title, description, children, footer, size = 'default' }) {
  const dialogRef = useRef(null);

  useEffect(() => {
    if (!open) return;

    const previouslyFocused = document.activeElement;
    dialogRef.current?.focus();
    document.body.style.overflow = 'hidden';

    function handleKeyDown(event) {
      if (event.key === 'Escape') onClose?.();
    }
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
      previouslyFocused instanceof HTMLElement && previouslyFocused.focus();
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-5">
      <div className="absolute inset-0 bg-dark/40" onClick={onClose} aria-hidden="true" />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? 'modal-title' : undefined}
        tabIndex={-1}
        className={cn(
          'relative z-10 flex max-h-[85vh] w-full flex-col rounded-md border border-border bg-panel shadow-[0_8px_32px_rgba(0,0,0,0.16)]',
          'animate-modal-in outline-none',
          size === 'lg' ? 'max-w-2xl' : 'max-w-md'
        )}
      >
        <div className="flex items-start justify-between gap-4 border-b border-border px-6 py-5">
          <div className="flex flex-col gap-1">
            {title && (
              <h2 id="modal-title" className="font-display text-lg font-semibold tracking-tight text-fg">
                {title}
              </h2>
            )}
            {description && <p className="text-[13px] text-fg-muted">{description}</p>}
          </div>
          <IconButton label="Close" variant="quiet" onClick={onClose} className="-mr-2 -mt-2">
            <X className="size-5" aria-hidden="true" />
          </IconButton>
        </div>

        <div className="overflow-y-auto px-6 py-5">{children}</div>

        {footer && <div className="flex items-center justify-end gap-3 border-t border-border px-6 py-4">{footer}</div>}
      </div>
    </div>,
    document.body
  );
}

/** ConfirmDialog — Modal preset for destructive/confirmation actions. */
export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title = 'Are you sure?',
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  destructive = false,
  loading = false,
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      description={description}
      footer={
        <>
          <Button variant="quiet" onClick={onClose} disabled={loading}>
            {cancelLabel}
          </Button>
          <Button variant={destructive ? 'destructive' : 'accent'} onClick={onConfirm} loading={loading}>
            {confirmLabel}
          </Button>
        </>
      }
    />
  );
}
