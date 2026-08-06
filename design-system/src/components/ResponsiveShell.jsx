import { cn } from '../lib/cn.js';

/**
 * ResponsiveShell — the system's content container: 1200px max width,
 * 20px/32px/40px horizontal padding at mobile/tablet/desktop.
 */
export function ResponsiveShell({ as: Component = 'div', className, children, ...props }) {
  return (
    <Component className={cn('mx-auto w-full max-w-[1200px] px-5 md:px-8 lg:px-10', className)} {...props}>
      {children}
    </Component>
  );
}

/** Grid — 12-column responsive grid; collapses to a single column below `md`. */
export function Grid({ className, children, ...props }) {
  return (
    <div className={cn('grid grid-cols-1 gap-4 md:grid-cols-12 md:gap-6', className)} {...props}>
      {children}
    </div>
  );
}

/** GridItem — span helper for use inside `Grid` (span is out of 12 at `md` and up). */
export function GridItem({ span = 12, className, children, ...props }) {
  return (
    <div className={cn('col-span-1', SPAN_CLASSES[span] ?? 'md:col-span-12', className)} {...props}>
      {children}
    </div>
  );
}

const SPAN_CLASSES = {
  1: 'md:col-span-1',
  2: 'md:col-span-2',
  3: 'md:col-span-3',
  4: 'md:col-span-4',
  5: 'md:col-span-5',
  6: 'md:col-span-6',
  7: 'md:col-span-7',
  8: 'md:col-span-8',
  9: 'md:col-span-9',
  10: 'md:col-span-10',
  11: 'md:col-span-11',
  12: 'md:col-span-12',
};
