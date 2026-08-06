import { useRef } from 'react';
import { bytes } from '../lib/format.js';

export default function FilePicker({ files, onChange, max = 5 }) {
  const ref = useRef(null);

  const add = (list) => {
    const next = [...files, ...Array.from(list)].slice(0, max);
    onChange(next);
    if (ref.current) ref.current.value = '';
  };

  return (
    <div className="field">
      <label>Fayllarni biriktirish</label>
      <input
        ref={ref}
        type="file"
        multiple
        className="input"
        style={{ padding: 8 }}
        onChange={(e) => add(e.target.files)}
      />
      <span className="hint">Skrinshot, log yoki hujjat. Ko'pi bilan {max} ta fayl, har biri 15 MB gacha.</span>
      <div>
        {files.map((f, i) => (
          <span key={i} className="file-chip">
            {f.name} <span className="faint">{bytes(f.size)}</span>
            <button
              type="button"
              onClick={() => onChange(files.filter((_, idx) => idx !== i))}
              style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: 15, lineHeight: 1 }}
              aria-label={`${f.name} faylini olib tashlash`}
            >
              &times;
            </button>
          </span>
        ))}
      </div>
    </div>
  );
}
