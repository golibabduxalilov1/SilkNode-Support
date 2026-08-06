import { cn } from '../lib/cn.js';

/**
 * Panel — the system's card/surface primitive. Flat by default; on hover
 * (when `hoverable`) the border strengthens and a faint shadow appears.
 */
export function Panel({ hoverable = false, padding = true, className, children, ...props }) {
  return (
    <div
      className={cn(
        'rounded-md border border-border bg-panel',
        'transition-[border-color,box-shadow] duration-200 [transition-timing-function:var(--ease-swiss)]',
        padding && 'p-6',
        hoverable && 'hover:border-border-strong hover:shadow-[0_2px_12px_rgba(0,0,0,0.06)]',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

Panel.Header = function PanelHeader({ className, children, ...props }) {
  return (
    <div className={cn('mb-4 flex items-center justify-between gap-4 border-b border-border pb-4', className)} {...props}>
      {children}
    </div>
  );
};

Panel.Divider = function PanelDivider({ className, ...props }) {
  return <hr className={cn('my-4 border-border', className)} {...props} />;
};

Panel.Footer = function PanelFooter({ className, children, ...props }) {
  return (
    <div className={cn('mt-4 flex items-center justify-between gap-4 border-t border-border pt-4', className)} {...props}>
      {children}
    </div>
  );
};
