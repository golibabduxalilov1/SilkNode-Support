import { STATUS, PRIORITY, bytes } from '../lib/format.js';
import { downloadFile } from '../lib/api.js';

export function StatusBadge({ status }) {
  const s = STATUS[status] || { label: status, color: 'var(--slate)', bg: 'var(--slate-soft)' };
  return (
    <span className="badge" style={{ color: s.color, background: s.bg }}>
      <span className="dot" style={{ background: s.color }} /> {s.label}
    </span>
  );
}

export function PriorityBadge({ priority }) {
  const p = PRIORITY[priority] || { label: priority, color: 'var(--slate)' };
  return (
    <span className="row" style={{ gap: 6, fontSize: 13, color: p.color, fontWeight: 600 }}>
      <span className="dot" style={{ background: p.color }} /> {p.label}
    </span>
  );
}

export function Attachments({ items = [] }) {
  if (!items.length) return null;
  return (
    <div style={{ marginTop: 8 }}>
      {items.map((f) => (
        <button key={f.id} type="button" className="file-chip" onClick={() => downloadFile(f)} title="Yuklab olish">
          {f.original_name} <span className="faint">{bytes(f.size_bytes)}</span>
        </button>
      ))}
    </div>
  );
}

export function Empty({ title, text, action }) {
  return (
    <div className="empty">
      <h3>{title}</h3>
      <p className="muted" style={{ marginTop: 0 }}>{text}</p>
      {action}
    </div>
  );
}

export function Loading({ rows = 3 }) {
  return (
    <div className="stack" aria-busy="true" aria-label="Yuklanmoqda">
      {Array.from({ length: rows }).map((_, i) => <div key={i} className="skeleton" />)}
    </div>
  );
}

export function ErrorNote({ children }) {
  return children ? <div className="alert alert-error">{children}</div> : null;
}
