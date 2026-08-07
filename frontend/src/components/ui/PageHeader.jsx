/** Top-of-page title + description, with optional trailing actions (filters, buttons). */
export default function PageHeader({ eyebrow, title, description, actions, className = '' }) {
  return (
    <div className={`mb-5 flex flex-wrap items-start justify-between gap-4 ${className}`}>
      <div>
        {eyebrow && (
          <div className="font-mono text-[11px] font-medium uppercase tracking-wider text-accent">{eyebrow}</div>
        )}
        <h1 className="font-display text-[22px] font-semibold tracking-tight text-ink">{title}</h1>
        {description && <p className="mt-1 text-sm text-ink-soft">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2.5">{actions}</div>}
    </div>
  );
}
