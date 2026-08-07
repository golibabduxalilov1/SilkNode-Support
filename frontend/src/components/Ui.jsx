import { useEffect, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { STATUS, PRIORITY, bytes } from '../lib/format.js';
import { downloadFile } from '../lib/api.js';
import StatusTag from './ui/StatusTag.jsx';
import { SkeletonStack } from './ui/Skeleton.jsx';
import EmptyState from './ui/EmptyState.jsx';

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
      <button type="button" className="select multiselect-trigger row-between" onClick={() => setOpen((o) => !o)}>
        <span>{summary}</span>
        <ChevronDown size={16} className="faint" aria-hidden />
      </button>
      {open && (
        <div className="multiselect-panel">
          {options.map((o) => (
            <label key={o.value} className="multiselect-option">
              <input type="checkbox" className="checkbox" checked={values.includes(o.value)} onChange={() => toggle(o.value)} />
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
    <th onClick={() => onSort(column)} style={{ cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap' }} aria-sort={active ? (sortDir === 'desc' ? 'descending' : 'ascending') : 'none'}>
      {label}{active && <span style={{ marginLeft: 4 }}>{sortDir === 'asc' ? '↑' : '↓'}</span>}
    </th>
  );
}

export function StatusBadge({ status }) {
  const s = STATUS[status] || { label: status, variant: 'neutral' };
  return <StatusTag variant={s.variant}>{s.label}</StatusTag>;
}

export function PriorityBadge({ priority }) {
  const p = PRIORITY[priority] || { label: priority, variant: 'neutral' };
  return <StatusTag variant={p.variant}>{p.label}</StatusTag>;
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
  return <EmptyState title={title} description={text} action={action} />;
}

export function Loading({ rows = 3 }) {
  return <SkeletonStack rows={rows} />;
}

export function ErrorNote({ children }) {
  return children ? <div className="alert alert-error">{children}</div> : null;
}
