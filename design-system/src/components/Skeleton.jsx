import { cn } from '../lib/cn.js';

/** Skeleton — shimmering placeholder block for loading states. */
export function Skeleton({ className, ...props }) {
  return (
    <div
      className={cn('shimmer rounded-sm bg-veil', className)}
      role="presentation"
      aria-hidden="true"
      {...props}
    />
  );
}
