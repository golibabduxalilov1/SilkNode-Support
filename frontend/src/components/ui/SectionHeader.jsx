/** Small uppercase mono heading used inside panels/side-cards to introduce a sub-section. */
export default function SectionHeader({ title, actions, className = '' }) {
  return (
    <div className={`mb-3 flex items-center justify-between gap-3 ${className}`}>
      <h3 className="font-mono text-[11px] font-medium uppercase tracking-wider text-ink-soft">{title}</h3>
      {actions}
    </div>
  );
}
