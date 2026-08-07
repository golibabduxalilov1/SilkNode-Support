/** Shimmering loading placeholder. Respects prefers-reduced-motion globally. */
export default function Skeleton({ className = 'h-16 w-full' }) {
  return <div aria-hidden="true" className={`skeleton ${className}`} />;
}

/** A stack of skeleton rows, for lists/tables while loading. */
export function SkeletonStack({ rows = 3, className = '' }) {
  return (
    <div className={`flex flex-col gap-3 ${className}`} aria-busy="true" aria-label="Yuklanmoqda">
      {Array.from({ length: rows }).map((_, i) => <Skeleton key={i} />)}
    </div>
  );
}
