import { useEffect, useRef, useState } from 'react';
import { STATUS, PRIORITY, bytes } from '../lib/format.js';
import { downloadFile } from '../lib/api.js';

/** Checkbox-panel ko'rinishidagi ko'p-tanlovli filtr (org/kategoriya/status/mas'ul kabi ustunlar uchun). */
export function MultiSelect({ label, options, values, onChange, width = 190 }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function onDocClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  const toggle = (v) => onChange(values.includes(v) ? values.filter((x) => x !== v) : [...values, v]);

  const summary =
    values.length === 0 ? label
      : values.length === 1 ? (options.find((o) => o.value === values[0])?.label || values[0])
      : `${label}: ${values.length} tanlandi`;

  return (
    <div className="multiselect" ref={ref} style={{ width }}>
      <button type="button" className="select multiselect-trigger" onClick={() => setOpen((o) => !o)}>
        {summary}
      </button>
      {open && (
        <div className="multiselect-panel">
          {options.map((o) => (
            <label key={o.value} className="multiselect-option">
              <input type="checkbox" checked={values.includes(o.value)} onChange={() => toggle(o.value)} />
              {o.label}
            </label>
          ))}
          {values.length > 0 && (
            <button type="button" className="multiselect-clear" onClick={() => onChange([])}>Tozalash</button>
          )}
        </div>
      )}
    </div>
  );
}

/** Bosilganda saralashni almashtiradigan jadval ustun sarlavhasi. */
export function SortHeader({ label, column, sortBy, sortDir, onSort }) {
  const active = sortBy === column;
  return (
    <th onClick={() => onSort(column)} style={{ cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap' }}>
      {label}{active && <span style={{ marginLeft: 4 }}>{sortDir === 'asc' ? '↑' : '↓'}</span>}
    </th>
  );
}

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
